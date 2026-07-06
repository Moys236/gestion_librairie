import db from './db';

/**
 * Formats a JS Date to SQLite compatible local DATETIME string (YYYY-MM-DD HH:MM:SS)
 */
function formatLocalDate(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

interface StockMovementOptions {
  type_mouvement: 'entree' | 'sortie';
  quantite_unitaire: number | string;
  nombre_colis?: number | string | null;
  date_mouvement?: string | null;
}

/**
 * Creates a stock movement (entree or sortie) for a product.
 * Updates the product stock level transactionally.
 */
export function createStockMovement(productId: number, { type_mouvement, quantite_unitaire, nombre_colis = null, date_mouvement = null }: StockMovementOptions) {
  const qty = Number(quantite_unitaire);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('الكمية يجب أن تكون أكبر من الصفر');
  }
  
  if (!['entree', 'sortie'].includes(type_mouvement)) {
    throw new Error('نوع الحركة غير صالح (يجب أن يكون entree أو sortie)');
  }
  
  const parsedColis = (nombre_colis === null || nombre_colis === undefined || nombre_colis === '') ? null : Number(nombre_colis);
  if (parsedColis !== null && (isNaN(parsedColis) || parsedColis < 0)) {
    throw new Error('عدد الطرود يجب أن يكون رقماً موجباً أو فارغاً');
  }

  // Handle date formatting
  let dateStr = date_mouvement;
  if (!dateStr) {
    dateStr = formatLocalDate(new Date());
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    dateStr = `${dateStr} ${timeStr}`;
  }

  return db.transaction(() => {
    // 1. Get current product stock
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId) as { stock: number } | undefined;
    if (!product) {
      throw new Error('المنتج غير موجود');
    }

    let newStock = product.stock;
    if (type_mouvement === 'entree') {
      newStock += qty;
    } else {
      if (product.stock < qty) {
        throw new Error(`المخزون غير كافٍ. المتوفر حالياً: ${product.stock}`);
      }
      newStock -= qty;
    }

    // 2. Insert stock history record
    const insertHistory = db.prepare(`
      INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const historyResult = insertHistory.run(
      productId,
      type_mouvement,
      qty,
      parsedColis,
      dateStr,
      newStock
    );

    // 3. Update products table
    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(newStock, productId);

    return {
      success: true,
      movementId: historyResult.lastInsertRowid,
      newStock,
      date_mouvement: dateStr
    };
  })();
}

/**
 * Fetches the paginated stock movement history of a given product.
 */
export function getProductStockHistory(productId: number, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const movements = db.prepare(`
    SELECT * FROM stock_histories
    WHERE produit_id = ?
    ORDER BY date_mouvement DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(productId, limit, offset);
  
  const countRes = db.prepare(`
    SELECT COUNT(*) as count FROM stock_histories WHERE produit_id = ?
  `).get(productId) as { count: number } | undefined;
  
  const total = countRes ? countRes.count : 0;
  
  return {
    movements,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

interface ProductData {
  type_id?: number | string | null;
  name: string;
  reference?: string | null;
  purchase_price?: number | string;
  selling_price: number | string;
  stock?: number | string;
}

/**
 * Creates a product and registers its initial stock movement if > 0.
 * Works seamlessly within existing outer transactions.
 */
export function createProductWithInitialStock(productData: ProductData, specifications = {}) {
  const { type_id, name, reference, purchase_price, selling_price, stock = 0 } = productData;
  const initialStock = Number(stock) || 0;
  
  const insertProduct = db.prepare(`
    INSERT INTO products (type_id, name, reference, purchase_price, selling_price, stock, specifications)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertProduct.run(
    type_id ? Number(type_id) : null,
    name,
    reference || null,
    Number(purchase_price) || 0,
    Number(selling_price) || 0,
    initialStock,
    JSON.stringify(specifications)
  );
  
  const productId = result.lastInsertRowid as number;
  
  if (initialStock > 0) {
    const dateStr = formatLocalDate(new Date());
    db.prepare(`
      INSERT INTO stock_histories (produit_id, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement, stock_resultat)
      VALUES (?, 'entree', ?, NULL, ?, ?)
    `).run(productId, initialStock, dateStr, initialStock);
  }
  
  return productId;
}
