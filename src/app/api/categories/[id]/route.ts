import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'edge';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json() as any;
    const { name } = data;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    await stmt.run(name.trim(), id);

    const updatedCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    return NextResponse.json(updatedCategory);
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
    
    // Check if category is used in types
    const typesCountRes = await db.prepare('SELECT count(*) as count FROM types WHERE category_id = ?').get(id) as { count: number } | undefined;
    const typesCount = typesCountRes ? typesCountRes.count : 0;
    if (typesCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف هذه الفئة لأنها تحتوي على أنواع منتجات تابعة لها' },
        { status: 400 }
      );
    }

    await db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
