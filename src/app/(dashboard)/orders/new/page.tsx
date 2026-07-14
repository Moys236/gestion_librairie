import db from '@/lib/db';
import PageTitle from '@/components/PageTitle';
import NewOrderForm from '@/components/NewOrderForm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface Client {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  selling_price: number;
  stock: number;
}

export default async function NewOrderPage() {
  const clients = await db.prepare('SELECT id, name FROM clients ORDER BY name ASC').all() as Client[];
  const products = await db.prepare('SELECT id, name, selling_price, stock FROM products ORDER BY name ASC').all() as Product[];

  return (
    <>
      <PageTitle title="طلب جديد" />
      <NewOrderForm clients={clients} products={products} />
    </>
  );
}
