import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createProductWithInitialStock } from '@/lib/stock';

export const runtime = 'edge';

export async function GET() {
  try {
    const products = await db.prepare(`
      SELECT p.*, t.name as type_name, c.name as category_name
      FROM products p 
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY p.name ASC
    `).all();
    
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as any;
    const { type_id, name, reference, purchase_price, selling_price, stock, specifications } = data;
    
    const productId = await createProductWithInitialStock({
      type_id: type_id ? Number(type_id) : null,
      name,
      reference,
      purchase_price: purchase_price ? Number(purchase_price) : 0,
      selling_price: selling_price ? Number(selling_price) : 0,
      stock: stock ? Number(stock) : 0
    }, specifications || {});
    
    const newProduct = await db.prepare(`
      SELECT p.*, t.name as type_name 
      FROM products p 
      LEFT JOIN types t ON p.type_id = t.id 
      WHERE p.id = ?
    `).get(productId);

    return NextResponse.json({ id: productId, success: true, product: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
