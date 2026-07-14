import db from '@/lib/db';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import ClientDetails from '@/components/ClientDetails';
import BackButton from '@/components/BackButton';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  total_debt: number;
}

interface Order {
  id: number;
  client_id: number | null;
  school_id: number | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  source: string | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: number;
  client_id: number;
  order_id: number | null;
  amount: number;
  notes: string | null;
  payment_date: string;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined;
  
  if (!client) {
    redirect('/clients');
  }

  const orders = await db.prepare('SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC').all(id) as Order[];
  const payments = await db.prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC').all(id) as Payment[];

  return (
    <>
      <PageTitle title={`الزبون : ${client.name}`} />
      
      <div className="flex items-center gap-4 mb-6 justify-between">
        <h2 className="h2 mb-0">تفاصيل الزبون</h2>
        <BackButton fallbackHref="/clients" />
      </div>

      <ClientDetails client={client} orders={orders} payments={payments} />
    </>
  );
}
