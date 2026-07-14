import { NextResponse } from 'next/server';
import { createStockMovement, getProductStockHistory, updateLatestStockMovement } from '@/lib/stock';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'معرف المنتج غير صالح' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    const history = await getProductStockHistory(productId, page, limit);

    return NextResponse.json(history);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'معرف المنتج غير صالح' }, { status: 400 });
    }

    const body = await request.json() as any;
    const { type_mouvement, quantite_unitaire, nombre_colis, date_mouvement } = body;

    const result = await createStockMovement(productId, {
      type_mouvement,
      quantite_unitaire,
      nombre_colis,
      date_mouvement
    });

    return NextResponse.json(result);
  } catch (err: any) {
    const isValidationError = err.message.includes('المخزون') || 
                             err.message.includes('الكمية') || 
                             err.message.includes('نوع الحركة') ||
                             err.message.includes('عدد الطرود');
    const status = isValidationError ? 400 : 500;
    
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'معرف المنتج غير صالح' }, { status: 400 });
    }

    const body = await request.json() as any;
    const { movementId, type_mouvement, quantite_unitaire, nombre_colis, date_mouvement } = body;

    if (!movementId) {
      return NextResponse.json({ error: 'معرف الحركة مطلوب' }, { status: 400 });
    }

    const result = await updateLatestStockMovement(productId, Number(movementId), {
      type_mouvement,
      quantite_unitaire,
      nombre_colis,
      date_mouvement
    });

    return NextResponse.json(result);
  } catch (err: any) {
    const isValidationError = err.message.includes('المخزون') || 
                             err.message.includes('الكمية') || 
                             err.message.includes('نوع الحركة') ||
                             err.message.includes('عدد الطرود') ||
                             err.message.includes('تعديل');
    const status = isValidationError ? 400 : 500;
    
    return NextResponse.json({ error: err.message }, { status });
  }
}
