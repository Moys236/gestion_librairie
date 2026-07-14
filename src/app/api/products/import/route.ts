import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { recalculateProductStock } from '@/lib/stock';

export async function POST(request: Request) {
  try {
    const { products, default_type_id } = await request.json();
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

    // Begin transaction for safety and performance
    const importTransaction = db.transaction((rows: any[]) => {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
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
          // Find or create category
          let cat = db.prepare("SELECT id FROM categories WHERE LOWER(name) = ?").get(categoryName.toLowerCase()) as { id: number } | undefined;
          let catId: number;
          if (cat) {
            catId = cat.id;
          } else {
            const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(categoryName);
            catId = info.lastInsertRowid as number;
          }

          // Find or create type
          let typ = db.prepare("SELECT id, default_specs FROM types WHERE category_id = ? AND LOWER(name) = ?").get(catId, typeName.toLowerCase()) as { id: number, default_specs: string } | undefined;
          if (typ) {
            typeId = typ.id;
            try {
              defaultSpecs = JSON.parse(typ.default_specs || '[]');
            } catch (e) {}
          } else {
            const info = db.prepare("INSERT INTO types (category_id, name) VALUES (?, ?)").run(catId, typeName);
            typeId = info.lastInsertRowid as number;
          }
        } else if (default_type_id) {
          typeId = Number(default_type_id);
          const typ = db.prepare("SELECT default_specs FROM types WHERE id = ?").get(typeId) as { default_specs: string } | undefined;
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

        // Parse row keys
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
          existingProduct = db.prepare("SELECT id, specifications, stock FROM products WHERE reference = ?").get(reference) as { id: number, specifications: string, stock: number } | undefined;
        }

        if (existingProduct) {
          // Merge specifications: load old ones, replace with new ones
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

          // Compute stock difference for existing product
          const diff = stock - existingProduct.stock;
          if (diff !== 0) {
            const pad = (num: number) => String(num).padStart(2, '0');
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            const type_mouvement = diff > 0 ? 'entree' : 'sortie';
            const qty = Math.abs(diff);

            db.prepare(`
              INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
              VALUES (?, ?, ?, NULL, ?, ?)
            `).run(existingProduct.id, type_mouvement, qty, dateStr, stock);
          }

          db.prepare(`
            UPDATE products
            SET type_id = ?, name = ?, purchase_price = ?, selling_price = ?, stock = ?, specifications = ?
            WHERE id = ?
          `).run(
            typeId,
            name,
            purchase_price,
            selling_price,
            recalculateProductStock(existingProduct.id),
            JSON.stringify(mergedSpecs),
            existingProduct.id
          );
        } else {
          const result = db.prepare(`
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

          const newProductId = result.lastInsertRowid as number;

          if (stock > 0) {
            const pad = (num: number) => String(num).padStart(2, '0');
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            
            db.prepare(`
              INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
              VALUES (?, 'entree', ?, NULL, ?, ?)
            `).run(newProductId, stock, dateStr, stock);
          }

          // Update stock from history
          db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(
            recalculateProductStock(newProductId),
            newProductId
          );
        }
        importedCount++;
      }
    });

    importTransaction(products);

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
