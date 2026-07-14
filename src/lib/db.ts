import { getCloudflareContext } from '@opennextjs/cloudflare';

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
  private async getD1() {
    try {
      const { env } = await getCloudflareContext({ async: true });
      if (env && (env as any).DB) {
        return (env as any).DB;
      }
    } catch (e) {
      console.warn("Accès asynchrone au contexte Cloudflare échoué :", e);
    }

    // Fallback pour les environnements de build ou si le contexte asynchrone n'est pas encore résolu
    const d1Db = (process.env as any).DB || (globalThis as any).DB;
    if (!d1Db) {
      throw new Error("Liaison Cloudflare D1 'DB' introuvable.");
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
        const d1 = await self.getD1();
        const stmt = d1.prepare(this.sql).bind(...combined);
        const res = await (stmt as any).all();
        return res.results;
      }

      async get<T = any>(...params: any[]): Promise<T | undefined> {
        const combined = [...this.params, ...params];
        const d1 = await self.getD1();
        const stmt = d1.prepare(this.sql).bind(...combined);
        const res = await (stmt as any).first();
        return res || undefined;
      }

      async run(...params: any[]): Promise<{ success: boolean; changes?: number; lastRowId?: number }> {
        const combined = [...this.params, ...params];
        const d1 = await self.getD1();
        const stmt = d1.prepare(this.sql).bind(...combined);
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
    const d1 = await this.getD1();
    const d1Stmts = statements.map(s => d1.prepare(s.sql).bind(...s.params));
    return await d1.batch(d1Stmts);
  }
}

const db: AsyncDatabase = new D1DatabaseAdapter();

export default db;
