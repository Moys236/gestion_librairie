import db from '@/lib/db';
import PageTitle from '@/components/PageTitle';
import SupplierRequests from '@/components/SupplierRequests';

export const dynamic = 'force-dynamic';

interface Product {
  id: number;
  name: string;
  reference: string | null;
  selling_price: number;
  stock: number;
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

interface SupplierList {
  id: number;
  name: string;
  created_at: string;
}

interface SupplierListItem {
  id: number;
  list_id: number;
  product_id: number;
  quantity: number;
  note: string | null;
  product_name: string;
  product_reference: string | null;
  type_name: string | null;
  category_name: string | null;
}

export default async function SupplierRequestsPage() {
  // 1. Fetch products catalog
  const products = db.prepare(`
    SELECT p.*, t.name as type_name, c.name as category_name
    FROM products p 
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY p.name ASC
  `).all() as Product[];

  // 2. Fetch categories and types for select filter dropdowns
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

  // 3. Fetch all supplier request lists
  const lists = db.prepare(`
    SELECT * FROM supplier_lists 
    ORDER BY created_at DESC
  `).all() as SupplierList[];

  // 4. Fetch all list items
  const items = db.prepare(`
    SELECT sli.*, p.name as product_name, p.reference as product_reference,
           t.name as type_name, c.name as category_name
    FROM supplier_list_items sli
    JOIN products p ON sli.product_id = p.id
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY sli.created_at DESC
  `).all() as SupplierListItem[];

  return (
    <>
      <PageTitle title="طلبات الموردين" />
      
      <div className="flex items-center gap-4 mb-6 justify-between">
        <h2 className="h2 mb-0">قوائم طلبات المنتجات (تصدير للموردين)</h2>
      </div>

      <SupplierRequests 
        products={products}
        categoriesWithTypes={categoriesWithTypes}
        initialLists={lists}
        initialItems={items}
      />
    </>
  );
}
