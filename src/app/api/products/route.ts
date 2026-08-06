import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createProductWithInitialStock } from '@/lib/stock';

export async function GET() {
  try {
    const products = db.prepare(`
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
    const data = await request.json();
    const { type_id, name, reference, purchase_price, selling_price, stock, nombre_colis, specifications } = data;
    
    const productId = createProductWithInitialStock({
      type_id: type_id ? Number(type_id) : null,
      name,
      reference,
      purchase_price: purchase_price ? Number(purchase_price) : 0,
      selling_price: selling_price ? Number(selling_price) : 0,
      stock: stock ? Number(stock) : 0,
      nombre_colis: (nombre_colis === null || nombre_colis === undefined || nombre_colis === '') ? null : Number(nombre_colis)
    }, specifications || {});
    
    const newProduct = db.prepare(`
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
