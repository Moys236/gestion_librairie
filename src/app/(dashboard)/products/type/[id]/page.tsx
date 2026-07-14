import db from '@/lib/db';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import ProductsByType from '@/components/ProductsByType';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface RawProduct {
  id: number;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string;
}

interface ProductType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string;
  category_name: string;
}

interface Spec {
  name: string;
  options: string[];
}

export default async function ProductsByTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const typeId = Number(id);

  if (isNaN(typeId)) {
    redirect('/products');
  }

  // Fetch type details
  const type = await db.prepare(`
    SELECT t.*, c.name as category_name
    FROM types t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(typeId) as ProductType | undefined;

  if (!type) {
    redirect('/products');
  }

  // Parse default specifications list
  let specsList: Spec[] = [];
  try {
    specsList = JSON.parse(type.default_specs || '[]');
  } catch (e) {}

  // Fetch products under this type
  const products = await db.prepare(`
    SELECT * FROM products 
    WHERE type_id = ? 
    ORDER BY name ASC
  `).all(typeId) as RawProduct[];

  // Parse specs for each product
  const parsedProducts = products.map(p => {
    let pSpecs: Record<string, string> = {};
    try {
      pSpecs = JSON.parse(p.specifications || '{}');
    } catch (e) {}
    return { 
      ...p, 
      pSpecs 
    };
  });

  return (
    <>
      <PageTitle title={`منتجات النوع: ${type.name}`} />
      <ProductsByType 
        type={type} 
        initialProducts={parsedProducts} 
        specsList={specsList} 
      />
    </>
  );
}
