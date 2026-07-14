'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateOrderNextStatus } from '@/app/actions';

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
}

interface OrdersListProps {
  initialOrders: Order[];
}

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const handleNextStatus = async (orderId: number) => {
    setLoadingOrderId(orderId);
    const res = await updateOrderNextStatus(orderId);
    if (res && !res.success) {
      alert(res.error || 'حدث خطأ ما');
    } else if (res && res.success) {
      // Update local state status
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return { ...o, status: res.nextStatus || o.status };
        }
        return o;
      }));
      if ((window as any).showToast) {
        (window as any).showToast('تم تحديث حالة الطلب بنجاح', 'success');
      }
    }
    setLoadingOrderId(null);
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>الحالة</th>
            <th>التاريخ</th>
            <th>الزبون</th>
            <th>المبلغ الإجمالي</th>
            <th>المدفوع</th>
            <th>الباقي</th>
            <th>الملفات المرفقة</th>
            <th className="w-32">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const reste = order.total_amount - order.paid_amount;
            let urls = [];
            if (order.file_url) {
              try {
                urls = JSON.parse(order.file_url);
              } catch (e) {
                urls = [order.file_url];
              }
            }
            return (
              <tr key={order.id}>
                <td className="font-bold">CMD-{order.id}</td>
                <td>
                  <span className={`badge ${
                    order.status === 'completed' ? 'badge-success' : 
                    order.status === 'delivered' ? 'badge-primary' : 
                    order.status === 'processing' ? 'badge-info' : 
                    order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {order.status === 'completed' ? 'مكتمل' : 
                     order.status === 'delivered' ? 'مُسَلَّم' : 
                     order.status === 'processing' ? 'قيد التجهيز' : 
                     order.status === 'cancelled' ? 'ملغى' : 'قيد الانتظار'}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('ar-MA')}</td>
                <td>{order.client_name || '-'}</td>
                <td className="font-bold">{order.total_amount} درهم</td>
                <td className="text-brand">{order.paid_amount} درهم</td>
                <td className={reste > 0 ? 'text-accent font-bold' : 'text-light'}>
                  {reste > 0 ? `${reste} درهم` : 'خالص'}
                </td>
                <td>
                  {urls.length > 0 ? (
                    <span className="badge badge-info">{urls.length} ملفات</span>
                  ) : (
                    <span className="text-light">بدون ملفات</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-2 items-center">
                    <Link href={`/orders/${order.id}`} className="btn btn-outline text-xs px-2 py-1 flex-1 text-center">
                      تفاصيل
                    </Link>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button 
                        type="button" 
                        className="btn btn-primary text-xs px-2 py-1"
                        onClick={() => handleNextStatus(order.id)}
                        disabled={loadingOrderId === order.id}
                      >
                        {loadingOrderId === order.id ? '...' : 
                         order.status === 'pending' ? 'بدأ التجهيز' : 
                         order.status === 'processing' ? 'إكمال' : 'تسليم'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center p-6 text-light">لا يوجد طلبات.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
