import db from '@/lib/db';
import PageTitle from '@/components/PageTitle';
import ProductsList from '@/components/ProductsList';
import TypeManager from '@/components/TypeManager';

export const dynamic = 'force-dynamic';

interface RawProduct {
  id: number;
  type_id: number | null;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string;
  type_name: string | null;
  category_name: string | null;
}

interface RawType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string;
  category_name: string;
}

export default async function ProductsPage() {
  // Fetch products
  const products = db.prepare(`
    SELECT p.*, t.name as type_name, c.name as category_name
    FROM products p 
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY p.name ASC
  `).all() as RawProduct[];

  // Fetch categories and types for construct optgroups
  const types = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM types t
    JOIN categories c ON t.category_id = c.id
    ORDER BY c.name ASC, t.name ASC
  `).all() as RawType[];

  const categoriesMap: Record<number, { id: number; name: string; types: { id: number; name: string }[] }> = {};
  
  types.forEach(t => {
    const catKey = t.category_id;
    if (!categoriesMap[catKey]) {
      categoriesMap[catKey] = {
        id: catKey,
        name: t.category_name,
        types: []
      };
    }
    categoriesMap[catKey].types.push({
      id: t.id,
      name: t.name
    });
  });

  const categoriesWithTypes = Object.values(categoriesMap);

  return (
    <>
      <PageTitle title="المنتجات" />
      <ProductsList initialProducts={products} categoriesWithTypes={categoriesWithTypes} />
      <TypeManager />
    </>
  );
}
