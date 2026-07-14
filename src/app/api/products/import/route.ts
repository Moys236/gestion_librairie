import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { products, default_type_id } = await request.json() as any;
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid payload: products must be an array' }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Helper to get value by case-insensitive key alias
    function getValue(row: any, aliases: string[]) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim();
        if (aliases.includes(cleanKey)) {
          return row[key];
        }
      }
      return undefined;
    }

    const nameAliases = ['name', 'اسم المنتج', 'nom du produit', 'nom'];
    const referenceAliases = ['reference', 'المرجع', 'référence', 'slug'];
    const sellingPriceAliases = ['selling_price', 'سعر البيع', 'prix de vente', 'prix', 'price'];
    const purchasePriceAliases = ['purchase_price', 'سعر الشراء', 'prix d\'achat', 'prix achat'];
    const stockAliases = ['stock', 'المخزون', 'quantité', 'qty'];
    const categoryAliases = ['category', 'الفئة', 'catégorie'];
    const typeAliases = ['type', 'النوع'];

    const standardAliases = [
      ...nameAliases,
      ...referenceAliases,
      ...sellingPriceAliases,
      ...purchasePriceAliases,
      ...stockAliases,
      ...categoryAliases,
      ...typeAliases
    ];

    // Fetch existing categories, types, and products to minimize DB roundtrips
    const categoriesList = await db.prepare("SELECT * FROM categories").all() as { id: number, name: string }[];
    const typesList = await db.prepare("SELECT * FROM types").all() as { id: number, category_id: number, name: string, default_specs: string }[];
    const productsList = await db.prepare("SELECT id, reference, specifications, stock FROM products").all() as { id: number, reference: string, specifications: string, stock: number }[];

    async function getOrCreateCategory(name: string): Promise<number> {
      const cleanName = name.toLowerCase().trim();
      const existing = categoriesList.find(c => c.name.toLowerCase().trim() === cleanName);
      if (existing) return existing.id;

      const info = await db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      const catId = info.lastRowId || (info as any).lastInsertRowid as number;
      categoriesList.push({ id: catId, name });
      return catId;
    }

    async function getOrCreateType(catId: number, name: string): Promise<{ id: number, default_specs: string }> {
      const cleanName = name.toLowerCase().trim();
      const existing = typesList.find(t => t.category_id === catId && t.name.toLowerCase().trim() === cleanName);
      if (existing) return { id: existing.id, default_specs: existing.default_specs };

      const info = await db.prepare("INSERT INTO types (category_id, name) VALUES (?, ?)").run(catId, name);
      const typeId = info.lastRowId || (info as any).lastInsertRowid as number;
      const defaultSpecsStr = '[]';
      typesList.push({ id: typeId, category_id: catId, name, default_specs: defaultSpecsStr });
      return { id: typeId, default_specs: defaultSpecsStr };
    }

    for (let index = 0; index < products.length; index++) {
      const row = products[index];
      const nameVal = getValue(row, nameAliases);
      
      if (!nameVal || nameVal.toString().trim() === '') {
        skippedCount++;
        errors.push(`السطر ${index + 2}: اسم المنتج مفقود أو فارغ.`);
        continue;
      }
      
      const name = nameVal.toString().trim();
      const referenceVal = getValue(row, referenceAliases);
      const reference = referenceVal ? referenceVal.toString().trim() : null;
      
      const sellingPriceVal = getValue(row, sellingPriceAliases);
      const selling_price = parseFloat(sellingPriceVal) || 0;
      
      const purchasePriceVal = getValue(row, purchasePriceAliases);
      const purchase_price = parseFloat(purchasePriceVal) || 0;
      
      const stockVal = getValue(row, stockAliases);
      const stock = parseInt(stockVal) || 0;
      
      const categoryNameVal = getValue(row, categoryAliases);
      const categoryName = categoryNameVal ? categoryNameVal.toString().trim() : '';
      
      const typeNameVal = getValue(row, typeAliases);
      const typeName = typeNameVal ? typeNameVal.toString().trim() : '';
      
      let typeId: number | null = null;
      let defaultSpecs: any[] = [];

      // Determine category and type
      if (categoryName && typeName) {
        const catId = await getOrCreateCategory(categoryName);
        const typInfo = await getOrCreateType(catId, typeName);
        typeId = typInfo.id;
        try {
          defaultSpecs = JSON.parse(typInfo.default_specs || '[]');
        } catch (e) {}
      } else if (default_type_id) {
        typeId = Number(default_type_id);
        const typ = typesList.find(t => t.id === typeId);
        if (typ) {
          try {
            defaultSpecs = JSON.parse(typ.default_specs || '[]');
          } catch (e) {}
        }
      }

      // Gather specifications
      const defaultSpecNames = defaultSpecs.map(s => {
        const sName = typeof s === 'object' ? s.name : s;
        return sName.toLowerCase().trim();
      });

      const specifications: Record<string, string> = {};

      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim();
        if (standardAliases.includes(cleanKey)) continue;

        const val = row[key];
        const isValEmpty = val === undefined || val === null || val.toString().trim() === '';
        const isPrincipal = defaultSpecNames.includes(cleanKey);

        if (isValEmpty) {
          if (isPrincipal) {
            const origSpec = defaultSpecs.find(s => {
              const sName = typeof s === 'object' ? s.name : s;
              return sName.toLowerCase().trim() === cleanKey;
            });
            const origSpecName = typeof origSpec === 'object' ? origSpec.name : origSpec;
            specifications[origSpecName] = '';
          }
        } else {
          const origSpec = defaultSpecs.find(s => {
            const sName = typeof s === 'object' ? s.name : s;
            return sName.toLowerCase().trim() === cleanKey;
          });
          const specName = origSpec ? (typeof origSpec === 'object' ? origSpec.name : origSpec) : key.trim();
          specifications[specName] = val.toString().trim();
        }
      }

      // Check if product reference already exists
      let existingProduct: { id: number, specifications: string, stock: number } | undefined = undefined;
      if (reference) {
        existingProduct = productsList.find(p => p.reference === reference);
      }

      if (existingProduct) {
        // Merge specifications
        let mergedSpecs: Record<string, string> = {};
        try {
          mergedSpecs = JSON.parse(existingProduct.specifications || '{}');
        } catch (e) {}

        for (const key of Object.keys(row)) {
          const cleanKey = key.toLowerCase().trim();
          if (standardAliases.includes(cleanKey)) continue;

          const val = row[key];
          const isValEmpty = val === undefined || val === null || val.toString().trim() === '';
          const isPrincipal = defaultSpecNames.includes(cleanKey);

          if (isValEmpty && !isPrincipal) {
            const matchedKey = Object.keys(mergedSpecs).find(k => k.toLowerCase().trim() === cleanKey);
            if (matchedKey) {
              delete mergedSpecs[matchedKey];
            }
          } else {
            const origSpec = defaultSpecs.find(s => {
              const sName = typeof s === 'object' ? s.name : s;
              return sName.toLowerCase().trim() === cleanKey;
            });
            const specName = origSpec ? (typeof origSpec === 'object' ? origSpec.name : origSpec) : key.trim();
            mergedSpecs[specName] = isValEmpty ? '' : val.toString().trim();
          }
        }

        const diff = stock - existingProduct.stock;
        const statements: any[] = [];
        let finalStock = existingProduct.stock;

        if (diff !== 0) {
          const pad = (num: number) => String(num).padStart(2, '0');
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          const type_mouvement = diff > 0 ? 'entree' : 'sortie';
          const qty = Math.abs(diff);
          finalStock = stock; // set directly to desired stock

          statements.push(
            db.prepare(`
              INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
              VALUES (?, ?, ?, NULL, ?, ?)
            `).bind(existingProduct.id, type_mouvement, qty, dateStr, stock)
          );
        }

        statements.push(
          db.prepare(`
            UPDATE products
            SET type_id = ?, name = ?, purchase_price = ?, selling_price = ?, stock = ?, specifications = ?
            WHERE id = ?
          `).bind(
            typeId,
            name,
            purchase_price,
            selling_price,
            finalStock,
            JSON.stringify(mergedSpecs),
            existingProduct.id
          )
        );

        await db.batch(statements);
        
        // Update in cache
        existingProduct.stock = finalStock;
        existingProduct.specifications = JSON.stringify(mergedSpecs);

      } else {
        const result = await db.prepare(`
          INSERT INTO products (type_id, name, reference, purchase_price, selling_price, stock, specifications)
          VALUES (?, ?, ?, ?, ?, 0, ?)
        `).run(
          typeId,
          name,
          reference,
          purchase_price,
          selling_price,
          JSON.stringify(specifications)
        );

        const newProductId = result.lastRowId || (result as any).lastInsertRowid as number;
        let finalStock = 0;
        const statements: any[] = [];

        if (stock > 0) {
          const pad = (num: number) => String(num).padStart(2, '0');
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          finalStock = stock;

          statements.push(
            db.prepare(`
              INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
              VALUES (?, 'entree', ?, NULL, ?, ?)
            `).bind(newProductId, stock, dateStr, stock)
          );
        }

        statements.push(
          db.prepare('UPDATE products SET stock = ? WHERE id = ?').bind(finalStock, newProductId)
        );

        if (statements.length > 0) {
          await db.batch(statements);
        }

        // Add to our productsList cache
        productsList.push({
          id: newProductId,
          reference: reference || '',
          specifications: JSON.stringify(specifications),
          stock: finalStock
        });
      }
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
