const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/ibnrochd.sqlite');
const db = new Database(dbPath);

console.log('--- Database Stock Reconciliation ---');

db.transaction(() => {
  const products = db.prepare('SELECT id, name, stock FROM products').all();
  let updatedCount = 0;
  
  for (const product of products) {
    const historySum = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type_mouvement = 'entree' THEN quantite_unitaire ELSE -quantite_unitaire END), 0) as total_stock
      FROM stock_histories
      WHERE produit_id = ?
    `).get(product.id).total_stock;
    
    if (product.stock !== historySum) {
      console.log(`Reconciling product ID ${product.id} ("${product.name}"): current stock ${product.stock} -> corrected to ${historySum}`);
      db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(historySum, product.id);
      updatedCount++;
    }
  }
  
  console.log(`\nReconciliation finished. Updated ${updatedCount} product(s) to match their stock history.`);
})();

db.close();
