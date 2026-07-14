import db from '@/lib/db';
import PageTitle from '@/components/PageTitle';
import ProductForm from '@/components/ProductForm';
import TypeManager from '@/components/TypeManager';

export const dynamic = 'force-dynamic';

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

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const categories = db.prepare("SELECT * FROM categories ORDER BY name ASC").all() as Category[];
  const types = db.prepare("SELECT * FROM types ORDER BY name ASC").all() as ProductType[];
  
  const { type } = await searchParams;
  const preselectedType = type || '';

  return (
    <>
      <PageTitle title="منتج جديد" />
      <ProductForm 
        categories={categories} 
        types={types} 
        preselectedType={preselectedType} 
      />
      <TypeManager />
    </>
  );
}
