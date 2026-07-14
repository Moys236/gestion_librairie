import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message.includes('FOREIGN KEY') || err.message.includes('foreign key')) {
      return NextResponse.json(
        { error: 'لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات مسجلة في النظام' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
