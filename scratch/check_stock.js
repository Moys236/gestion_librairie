const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../db/ibnrochd.sqlite');
const db = new Database(dbPath);

console.log('--- Checking for products with negative stock ---');
const negativeProducts = db.prepare('SELECT id, name, reference, stock FROM products WHERE stock < 0').all();

if (negativeProducts.length === 0) {
  console.log('No products found with stock < 0.');
} else {
  console.log(`Found ${negativeProducts.length} product(s) with negative stock:`);
  console.table(negativeProducts);
}

console.log('\n--- Checking for stock history records with negative resulting stock ---');
const negativeHistories = db.prepare(`
  SELECT sh.id, sh.produit_id, p.name, sh.type_mouvement, sh.quantite_unitaire, sh.stock_resultat, sh.date_mouvement
  FROM stock_histories sh
  JOIN products p ON sh.produit_id = p.id
  WHERE sh.stock_resultat < 0
`).all();

if (negativeHistories.length === 0) {
  console.log('No stock history records found with resulting stock < 0.');
} else {
  console.log(`Found ${negativeHistories.length} stock history record(s) with negative resulting stock:`);
  console.table(negativeHistories);
}

db.close();
