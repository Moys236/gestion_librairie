import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const types = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM types t
      JOIN categories c ON t.category_id = c.id
      ORDER BY t.name ASC
    `).all();
    return NextResponse.json(types);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { category_id, name, default_specs } = data;

    if (!category_id || !name) {
      return NextResponse.json({ error: 'Category and Name are required' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO types (category_id, name, default_specs) VALUES (?, ?, ?)');
    const info = stmt.run(Number(category_id), name.trim(), JSON.stringify(default_specs || []));

    const newType = db.prepare('SELECT * FROM types WHERE id = ?').get(info.lastInsertRowid);

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
