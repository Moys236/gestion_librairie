import { getRequestContext } from '@cloudflare/next-on-pages';

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
    const ctx = getRequestContext();
    const d1Db = (ctx.env as any).DB;
    if (!d1Db) {
      throw new Error("Liaison Cloudflare D1 'DB' introuvable dans le contexte.");
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
        const res = await (stmt as any).first();
        return res || undefined;
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

// On Cloudflare (production), always use D1
// For local dev, the dev server uses setupDevPlatform which provides
// getRequestContext() as well, so D1DatabaseAdapter works in both cases.
const db: AsyncDatabase = new D1DatabaseAdapter();

export default db;
