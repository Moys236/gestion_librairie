import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  try {
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as any;
    const { name } = data;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const info = await stmt.run(name.trim());
    const lastId = info.lastRowId || (info as any).lastInsertRowid;

    const newCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(lastId);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
