export interface AsyncStatement {
  bind(...params: any[]): AsyncStatement;
  all<T = any>(...params: any[]): Promise<T[]>;
  get<T = any>(...params: any[]): Promise<T | undefined>;
  run(...params: any[]): Promise<{ success: boolean; changes?: number; lastRowId?: number }>;
  readonly sql: string;
  readonly params: any[];
}

export interface AsyncDatabase {
  prepare(sql: string): AsyncStatement;
  batch(statements: AsyncStatement[]): Promise<any[]>;
}

class D1DatabaseAdapter implements AsyncDatabase {
  private get d1() {
    const d1Db = (process.env as any).DB || (globalThis as any).DB;
    if (!d1Db) {
      throw new Error("Liaison Cloudflare D1 'DB' introuvable dans process.env ou globalThis.");
    }
    return d1Db;
  }

  prepare(sql: string): AsyncStatement {
    const self = this;
    
    class D1StatementImpl implements AsyncStatement {
      constructor(public sql: string, public params: any[] = []) {}

      bind(...params: any[]): AsyncStatement {
        return new D1StatementImpl(this.sql, [...this.params, ...params]);
      }

      async all<T = any>(...params: any[]): Promise<T[]> {
        const combined = [...this.params, ...params];
        const stmt = self.d1.prepare(this.sql).bind(...combined);
        const res = await (stmt as any).all();
        return res.results;
      }

      async get<T = any>(...params: any[]): Promise<T | undefined> {
        const combined = [...this.params, ...params];
        const stmt = self.d1.prepare(this.sql).bind(...combined);
        return await (stmt as any).first() || undefined;
      }

      async run(...params: any[]): Promise<{ success: boolean; changes?: number; lastRowId?: number }> {
        const combined = [...this.params, ...params];
        const stmt = self.d1.prepare(this.sql).bind(...combined);
        const res = await (stmt as any).run();
        return {
          success: res.success,
          changes: res.meta.changes,
          lastRowId: res.meta.last_row_id
        };
      }
    }

    return new D1StatementImpl(sql);
  }

  async batch(statements: AsyncStatement[]): Promise<any[]> {
    const d1Stmts = statements.map(s => this.d1.prepare(s.sql).bind(...s.params));
    return await this.d1.batch(d1Stmts);
  }
}

class LocalSqliteAdapter implements AsyncDatabase {
  private localDb: any;

  constructor() {
    const requireFunc = typeof require !== 'undefined' ? require : undefined;
    if (!requireFunc) {
      throw new Error("Node.js require function is not available.");
    }
    const sqliteModule = 'better-sqlite3';
    const pathModule = 'path';
    const fsModule = 'fs';

    const Database = requireFunc(sqliteModule);
    const path = requireFunc(pathModule);
    const fs = requireFunc(fsModule);

    const cwdFunc = typeof process !== 'undefined' ? process.cwd : undefined;
    const dbDir = path.join(cwdFunc ? cwdFunc() : '', 'db');
    const dbPath = path.join(dbDir, 'ibnrochd.sqlite');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.localDb = new Database(dbPath);
    this.localDb.pragma('journal_mode = WAL');
    this.localDb.pragma('foreign_keys = ON');

    // Run migrations/schema if needed (like the original db.js)
    try {
      const tableCategories = this.localDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
      if (tableCategories) {
        const columnsInfo = this.localDb.pragma("table_info(categories)") as any[];
        const hasDefaultSpecs = columnsInfo.some(col => col.name === 'default_specs');
        const hasNameAr = columnsInfo.some(col => col.name === 'name_ar');
        
        if (hasDefaultSpecs || hasNameAr) {
          console.log('Migrating database: Restructuring categories and types with a single name field...');
          
          this.localDb.pragma('foreign_keys = OFF');
          try {
            this.localDb.transaction(() => {
              this.localDb.exec(`DROP TABLE IF EXISTS temp_categories;`);
              this.localDb.exec(`DROP TABLE IF EXISTS temp_types;`);
              this.localDb.exec(`DROP TABLE IF EXISTS temp_products;`);
              
              if (hasNameAr) {
                this.localDb.exec(`
                  CREATE TABLE temp_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                  );
                `);
                this.localDb.exec(`
                  INSERT INTO temp_categories (id, name)
                  SELECT id, name_ar FROM categories;
                `);
                
                this.localDb.exec(`
                  CREATE TABLE temp_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    default_specs TEXT DEFAULT '[]',
                    FOREIGN KEY (category_id) REFERENCES temp_categories(id)
                  );
                `);
                this.localDb.exec(`
                  INSERT INTO temp_types (id, category_id, name, default_specs)
                  SELECT id, category_id, name_ar, default_specs FROM types;
                `);
                
                this.localDb.exec(`
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
                this.localDb.exec(`
                  INSERT INTO temp_products (id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications)
                  SELECT id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications FROM products;
                `);
              } else {
                this.localDb.exec(`
                  CREATE TABLE temp_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                  );
                `);
                this.localDb.prepare(`
                  INSERT INTO temp_categories (id, name) VALUES (1, 'فئة عامة');
                `).run();
                
                this.localDb.exec(`
                  CREATE TABLE temp_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    default_specs TEXT DEFAULT '[]',
                    FOREIGN KEY (category_id) REFERENCES temp_categories(id)
                  );
                `);
                this.localDb.exec(`
                  INSERT INTO temp_types (id, category_id, name, default_specs)
                  SELECT id, 1, name, default_specs FROM types;
                `);
                
                this.localDb.exec(`
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
                this.localDb.exec(`
                  INSERT INTO temp_products (id, type_id, name, reference, purchase_price, selling_price, stock, is_available, specifications)
                  SELECT id, category_id, name, reference, purchase_price, selling_price, stock, is_available, specifications FROM products;
                `);
              }
              
              this.localDb.exec(`DROP TABLE IF EXISTS types;`);
              this.localDb.exec(`DROP TABLE products;`);
              this.localDb.exec(`DROP TABLE categories;`);
              
              this.localDb.exec(`ALTER TABLE temp_categories RENAME TO categories;`);
              this.localDb.exec(`ALTER TABLE temp_types RENAME TO types;`);
              this.localDb.exec(`ALTER TABLE temp_products RENAME TO products;`);
            })();
          } finally {
            this.localDb.pragma('foreign_keys = ON');
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
      this.localDb.exec(schema);
    }
  }

  prepare(sql: string): AsyncStatement {
    const self = this;

    class LocalStatementImpl implements AsyncStatement {
      constructor(public sql: string, public params: any[] = []) {}

      bind(...params: any[]): AsyncStatement {
        return new LocalStatementImpl(this.sql, [...this.params, ...params]);
      }

      async all<T = any>(...params: any[]): Promise<T[]> {
        const combined = [...this.params, ...params];
        const stmt = self.localDb.prepare(this.sql);
        return stmt.all(...combined) as T[];
      }

      async get<T = any>(...params: any[]): Promise<T | undefined> {
        const combined = [...this.params, ...params];
        const stmt = self.localDb.prepare(this.sql);
        return stmt.get(...combined) as T | undefined;
      }

      async run(...params: any[]): Promise<{ success: boolean; changes?: number; lastRowId?: number }> {
        const combined = [...this.params, ...params];
        const stmt = self.localDb.prepare(this.sql);
        const res = stmt.run(...combined);
        return {
          success: true,
          changes: res.changes,
          lastRowId: Number(res.lastInsertRowid)
        };
      }
    }

    return new LocalStatementImpl(sql);
  }

  async batch(statements: AsyncStatement[]): Promise<any[]> {
    const results: any[] = [];
    const transaction = this.localDb.transaction(() => {
      for (const s of statements) {
        const stmt = this.localDb.prepare(s.sql);
        results.push(stmt.run(...s.params));
      }
    });
    transaction();
    return results;
  }
}

const isCloudflare = typeof process.env.DB !== 'undefined' || typeof (globalThis as any).WRANGLER_SYSTEM === 'object' || process.env.NODE_ENV === 'production';

let db: AsyncDatabase;

if (isCloudflare) {
  db = new D1DatabaseAdapter();
} else {
  const globalForDb = global as unknown as { db: AsyncDatabase };
  if (!globalForDb.db) {
    globalForDb.db = new LocalSqliteAdapter();
  }
  db = globalForDb.db;
}

export default db;
