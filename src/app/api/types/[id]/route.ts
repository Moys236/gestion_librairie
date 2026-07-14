import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { category_id, name, default_specs } = data;

    if (!category_id || !name) {
      return NextResponse.json({ error: 'Category and Name are required' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE types SET category_id = ?, name = ?, default_specs = ? WHERE id = ?');
    stmt.run(Number(category_id), name.trim(), JSON.stringify(default_specs || []), id);

    const updatedType = db.prepare('SELECT * FROM types WHERE id = ?').get(id);

    return NextResponse.json(updatedType);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if type is used in products
    const productsCount = (db.prepare('SELECT count(*) as count FROM products WHERE type_id = ?').get(id) as { count: number }).count;
    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف هذا النوع لأنه مرتبط بمنتجات' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM types WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
