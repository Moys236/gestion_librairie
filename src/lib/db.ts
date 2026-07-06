import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'db');
const dbPath = path.join(dbDir, 'ibnrochd.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global declaration to avoid multiple connections in development hot reload
const globalForDb = global as unknown as { db: Database.Database };

export const db = globalForDb.db || (() => {
  const newDb = new Database(dbPath);
  newDb.pragma('journal_mode = WAL');
  newDb.pragma('foreign_keys = ON');

  // Run migrations if needed (like the original db.js)
  try {
    const tableCategories = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
    if (tableCategories) {
      const columnsInfo = newDb.pragma("table_info(categories)") as any[];
      const hasDefaultSpecs = columnsInfo.some(col => col.name === 'default_specs');
      const hasNameAr = columnsInfo.some(col => col.name === 'name_ar');
      
      if (hasDefaultSpecs || hasNameAr) {
        console.log('Migrating database: Restructuring categories and types with a single name field...');
        
        // Disable foreign keys outside the transaction
        newDb.pragma('foreign_keys = OFF');
        try {
          newDb.transaction(() => {
            newDb.exec(`DROP TABLE IF EXISTS temp_categories;`);
            newDb.exec(`DROP TABLE IF EXISTS temp_types;`);
            newDb.exec(`DROP TABLE IF EXISTS temp_products;`);
            
            if (hasNameAr) {
              newDb.exec(`
                CREATE TABLE temp_categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE
                );
              `);
              newDb.exec(`
                INSERT INTO temp_categories (id, name)
                SELECT id, name_ar FROM categories;
              `);
              
              newDb.exec(`
                CREATE TABLE temp_types (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  category_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  default_specs TEXT DEFAULT '[]',
                  FOREIGN KEY (category_id) REFERENCES temp_categories(id)
                );
              `);
              newDb.exec(`
                INSERT INTO temp_types (id, category_id, name, default_specs)
                SELECT id, category_id, name_ar, default_specs FROM types;
              `);
              
              newDb.exec(`
                CREATE TABLE temp_products (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  type_id INTEGER,
                  name TEXT NOT NULL,
                  reference TEXT UNIQUE,
                  purchase_price REAL DEFAULT 0,
                  selling_price REAL NOT NULL,
                  stock INTEGER DEFAULT 0,
                  is_available BOOLEAN DEFAULT 1,
                  specifications TEXT DEFAULT '{}',
                  FOREIGN KEY (type_id) REFERENCES temp_types(id)
                );
              `);
              newDb.exec(`
                INSERT INTO temp_products (id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications)
                SELECT id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications FROM products;
              `);
              
            } else {
              newDb.exec(`
                CREATE TABLE temp_categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE
                );
              `);
              newDb.prepare(`
                INSERT INTO temp_categories (id, name) VALUES (1, 'فئة عامة');
              `).run();
              
              newDb.exec(`
                CREATE TABLE temp_types (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  category_id INTEGER NOT NULL,
                  name TEXT NOT NULL,
                  default_specs TEXT DEFAULT '[]',
                  FOREIGN KEY (category_id) REFERENCES temp_categories(id)
                );
              `);
              newDb.exec(`
                INSERT INTO temp_types (id, category_id, name, default_specs)
                SELECT id, 1, name, default_specs FROM types;
              `);
              
              newDb.exec(`
                CREATE TABLE temp_products (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  type_id INTEGER,
                  name TEXT NOT NULL,
                  reference TEXT UNIQUE,
                  purchase_price REAL DEFAULT 0,
                  selling_price REAL NOT NULL,
                  stock INTEGER DEFAULT 0,
                  is_available BOOLEAN DEFAULT 1,
                  specifications TEXT DEFAULT '{}',
                  FOREIGN KEY (type_id) REFERENCES temp_types(id)
                );
              `);
              newDb.exec(`
                INSERT INTO temp_products (id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications)
                SELECT id, category_id, name, reference, purchase_price, selling_price, stock, is_available, specifications FROM products;
              `);
            }
            
            newDb.exec(`DROP TABLE IF EXISTS types;`);
            newDb.exec(`DROP TABLE products;`);
            newDb.exec(`DROP TABLE categories;`);
            
            newDb.exec(`ALTER TABLE temp_categories RENAME TO categories;`);
            newDb.exec(`ALTER TABLE temp_types RENAME TO types;`);
            newDb.exec(`ALTER TABLE temp_products RENAME TO products;`);
          })();
        } finally {
          newDb.pragma('foreign_keys = ON');
        }
        console.log('Migration completed successfully.');
      }
    }
  } catch (migrationError) {
    console.error('Error during database migration:', migrationError);
  }

  // Ensure schema is applied
  const schemaPath = path.join(dbDir, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    newDb.exec(schema);
  }

  return newDb;
})();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export default db;
