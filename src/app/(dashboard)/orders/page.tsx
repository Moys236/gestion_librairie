import db from '@/lib/db';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';
import OrdersList from '@/components/OrdersList';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface RawOrder {
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
  client_name: string | null;
}

export default async function OrdersPage() {
  const orders = await db.prepare(`
    SELECT o.*, c.name as client_name 
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    ORDER BY o.created_at DESC
  `).all() as RawOrder[];

  return (
    <>
      <PageTitle title="الطلبات" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="h2">تاريخ الطلبات</h2>
        <Link href="/orders/new" className="btn btn-primary">+ طلب جديد</Link>
      </div>

      <OrdersList initialOrders={orders} />
    </>
  );
}
