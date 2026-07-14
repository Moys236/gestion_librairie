const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/ibnrochd.sqlite');
const db = new Database(dbPath);

const tables = [
  'categories',
  'types',
  'products',
  'clients',
  'schools',
  'school_lists',
  'orders',
  'order_items',
  'payments',
  'stock_histories',
  'supplier_lists',
  'supplier_list_items'
];

let sqlOutput = '';

// Désactiver temporairement les clés étrangères pour éviter les conflits d'ordre d'insertion
sqlOutput += 'PRAGMA foreign_keys = OFF;\n\n';

for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;
    
    const keys = Object.keys(rows[0]);
    const columns = keys.map(k => `\`${k}\``).join(', ');
    
    for (const row of rows) {
      const values = keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) {
          return 'NULL';
        }
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`;
        }
        return val;
      }).join(', ');
      
      sqlOutput += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
    }
    sqlOutput += '\n';
  } catch (e) {
    console.warn(`Table ${table} non trouvée ou vide : ${e.message}`);
  }
}

sqlOutput += 'PRAGMA foreign_keys = ON;\n';

fs.writeFileSync(path.join(__dirname, '../db/data_dump.sql'), sqlOutput, 'utf-8');
console.log('Database dump completed successfully at db/data_dump.sql');
