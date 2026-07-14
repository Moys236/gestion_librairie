import db from '@/lib/db';
import { getProductStockHistory } from '@/lib/stock';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import ProductDetailsForm from '@/components/ProductDetailsForm';

export const dynamic = 'force-dynamic';

interface Product {
  id: number;
  type_id: number | null;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string;
  category_id: number | null;
  category_name: string | null;
  type_name: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface ProductType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (isNaN(productId)) {
    redirect('/products');
  }

  // Fetch product joined
  const product = db.prepare(`
    SELECT p.*, t.name as type_name, t.category_id as category_id, c.name as category_name
    FROM products p 
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE p.id = ?
  `).get(productId) as Product | undefined;

  if (!product) {
    redirect('/products');
  }

  // Fetch categories and types
  const categories = db.prepare("SELECT * FROM categories ORDER BY name ASC").all() as Category[];
  const types = db.prepare("SELECT * FROM types ORDER BY name ASC").all() as ProductType[];

  // Fetch page 1 initial history
  const initialHistory = getProductStockHistory(productId, 1, 10);

  return (
    <>
      <PageTitle title={`المنتج: ${product.name}`} />
      
      <div className="flex items-center gap-4 mb-6 justify-between">
        <h2 className="h2 mb-0">تفاصيل المنتج</h2>
        <BackButton fallbackHref="/products" />
      </div>

      <ProductDetailsForm 
        product={product} 
        categories={categories} 
        types={types} 
        initialHistory={initialHistory} 
      />
    </>
  );
}

import BackButton from '@/components/BackButton';
