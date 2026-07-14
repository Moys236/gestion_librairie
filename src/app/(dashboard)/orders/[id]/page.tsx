import db from '@/lib/db';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import EditOrderForm from '@/components/EditOrderForm';

export const dynamic = 'force-dynamic';

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
  client_name: string | null;
  client_phone: string | null;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string | null;
}

interface Product {
  id: number;
  name: string;
  selling_price: number;
  stock: number;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    redirect('/orders');
  }

  // Fetch order joined
  const order = db.prepare(`
    SELECT o.*, c.name as client_name, c.phone as client_phone 
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    WHERE o.id = ?
  `).get(orderId) as Order | undefined;

  if (!order) {
    redirect('/orders');
  }

  // Fetch order items
  const orderItems = db.prepare(`
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId) as OrderItem[];

  // Fetch products
  const products = db.prepare('SELECT id, name, selling_price, stock FROM products ORDER BY name ASC').all() as Product[];

  return (
    <>
      <PageTitle title={`طلب CMD-${order.id}`} />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/orders" />
          <h2 className="h2 mb-0">تفاصيل وتعديل الطلب CMD-{order.id}</h2>
        </div>
        <div className="text-light">
          تاريخ الطلب: {new Date(order.created_at).toLocaleDateString('ar-MA')}
        </div>
      </div>

      <EditOrderForm 
        order={order} 
        orderItems={orderItems} 
        products={products} 
      />
    </>
  );
}

import BackButton from '@/components/BackButton';
