'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addPayment, addDebt, addOrderPayment, updateOrderNextStatus } from '@/app/actions';

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

interface ClientDetailsProps {
  client: Client;
  orders: Order[];
  payments: Payment[];
}

export default function ClientDetails({ client, orders, payments }: ClientDetailsProps) {
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOrderId, setModalOrderId] = useState<number | null>(null);
  const [modalRemainingDebt, setModalRemainingDebt] = useState<number>(0);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');

  // Form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Loading states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleNextStatus = async (orderId: number) => {
    setLoadingAction(`status-${orderId}`);
    const res = await updateOrderNextStatus(orderId);
    if (res && !res.success) {
      if ((window as any).showToast) {
        (window as any).showToast(res.error || 'حدث خطأ ما', 'error');
      } else {
        alert(res.error || 'حدث خطأ ما');
      }
    } else {
      if ((window as any).showToast) {
        (window as any).showToast('تم تحديث حالة الطلب بنجاح', 'success');
      }
    }
    setLoadingAction(null);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;

    setLoadingAction('payment');
    const res = await addPayment(client.id, amt, paymentNotes || null);
    if (res && !res.success) {
      alert(res.error || 'حدث خطأ ما');
    } else {
      setPaymentAmount('');
      setPaymentNotes('');
      if ((window as any).showToast) {
        (window as any).showToast('تم تسجيل الدفعة بنجاح', 'success');
      }
    }
    setLoadingAction(null);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(debtAmount);
    if (isNaN(amt) || amt <= 0) return;

    setLoadingAction('debt');
    const res = await addDebt(client.id, amt, debtNotes || null);
    if (res && !res.success) {
      alert(res.error || 'حدث خطأ ما');
    } else {
      setDebtAmount('');
      setDebtNotes('');
      if ((window as any).showToast) {
        (window as any).showToast('تم تسجيل الدين بنجاح', 'success');
      }
    }
    setLoadingAction(null);
  };

  const openOrderPaymentModal = (orderId: number, remainingDebt: number) => {
    setModalOrderId(orderId);
    setModalRemainingDebt(remainingDebt);
    setModalAmount(remainingDebt.toString());
    setModalNotes('');
    setModalOpen(true);
  };

  const closeOrderPaymentModal = () => {
    setModalOpen(false);
    setModalOrderId(null);
  };

  const handleOrderPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(modalAmount);
    if (isNaN(amt) || amt <= 0 || !modalOrderId) return;

    setLoadingAction('order-payment');
    const res = await addOrderPayment(client.id, modalOrderId, amt, modalNotes || null);
    if (res && !res.success) {
      alert(res.error || 'حدث خطأ ما');
    } else {
      closeOrderPaymentModal();
      if ((window as any).showToast) {
        (window as any).showToast('تم تسجيل الدفعة بنجاح', 'success');
      }
    }
    setLoadingAction(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-brand">
        <div>
          <h3 className="text-xl font-bold mb-1">{client.name}</h3>
          <div className="flex gap-4 text-sm text-light">
            <span><strong>الهاتف:</strong> {client.phone || '-'}</span>
            <span><strong>العنوان:</strong> {client.address || '-'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-light mb-1">إجمالي الدين</p>
          <p className={`text-3xl font-bold ${client.total_debt > 0 ? 'text-brand' : 'text-accent'}`}>{client.total_debt} درهم</p>
        </div>
      </div>

      <details className="card group cursor-pointer border-t-4 border-info" open>
        <summary className="h3 list-none flex justify-between items-center mb-0 select-none">
          تاريخ الطلبات
          <span className="transform transition-transform group-open:rotate-180">▼</span>
        </summary>
        
        <div className="mt-4 pt-4 border-t border-border cursor-auto" onClick={(e) => e.stopPropagation()}>
          {orders.length > 0 ? (
            <div className="table-container shadow-none border border-border">
              <table>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
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
                            order.status === 'delivered' ? 'badge-info' : 
                            order.status === 'processing' ? 'badge-warning' : 
                            order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {order.status === 'completed' ? 'مكتمل' : 
                             order.status === 'delivered' ? 'مُسَلَّم' : 
                             order.status === 'processing' ? 'قيد التجهيز' : 
                             order.status === 'cancelled' ? 'ملغى' : 'قيد الانتظار'}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString('ar-MA')}</td>
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
                                disabled={loadingAction === `status-${order.id}`}
                              >
                                {loadingAction === `status-${order.id}` ? '...' : 
                                 order.status === 'pending' ? 'بدأ التجهيز' : 
                                 order.status === 'processing' ? 'إكمال' : 'تسليم'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-light">لا يوجد طلبات.</p>
          )}
        </div>
      </details>

      <details className="card group cursor-pointer border-t-4 border-brand" open>
        <summary className="h3 list-none flex justify-between items-center mb-0 select-none">
          سجل المدفوعات والديون
          <span className="transform transition-transform group-open:rotate-180">▼</span>
        </summary>
        
        <div className="mt-4 pt-4 border-t border-border cursor-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col xl-flex-row gap-6 mb-6 w-full">
            <form onSubmit={handleAddPayment} className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-border flex-1">
              <label className="text-sm font-semibold text-brand">تسجيل دفعة (Payment)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  className="input flex-1" 
                  placeholder="المبلغ..." 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <input 
                  type="text" 
                  className="input flex-1" 
                  placeholder="تعليق (اختياري)..." 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={loadingAction === 'payment'}>دفع</button>
              </div>
            </form>

            <form onSubmit={handleAddDebt} className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-border flex-1">
              <label className="text-sm font-semibold text-danger">إضافة دين جديد (Debt)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  className="input flex-1" 
                  placeholder="المبلغ..." 
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                />
                <input 
                  type="text" 
                  className="input flex-1" 
                  placeholder="تعليق (اختياري)..." 
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                />
                <button type="submit" className="btn btn-outline" disabled={loadingAction === 'debt'}>إضافة</button>
              </div>
            </form>
          </div>

          {payments.length > 0 ? (
            <div className="table-container shadow-none border border-border">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>نوع الحركة</th>
                    <th>المبلغ</th>
                    <th>التعليق</th>
                    <th>الطلب المرتبط</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => {
                    let remainingOrderDebt = 0;
                    if (payment.order_id && payment.amount < 0) {
                      const allOrderPayments = payments.filter(p => p.order_id === payment.order_id);
                      const sumOrderPayments = allOrderPayments.reduce((sum, p) => sum + p.amount, 0);
                      remainingOrderDebt = Math.abs(sumOrderPayments);
                    }
                    
                    return (
                      <tr key={payment.id}>
                        <td>{new Date(payment.payment_date).toLocaleString('ar-MA')}</td>
                        <td>
                          <span className={`badge ${payment.amount >= 0 ? 'badge-success' : 'badge-danger'}`}>
                            {payment.amount >= 0 ? 'دفعة' : 'دين'}
                          </span>
                        </td>
                        <td className={`font-bold ${payment.amount >= 0 ? 'text-brand' : 'text-danger'}`}>
                          {payment.amount >= 0 ? '+' : ''}{payment.amount} درهم
                        </td>
                        <td className="text-sm text-light">{payment.notes || '-'}</td>
                        <td>
                          {payment.order_id ? (
                            <Link href={`/orders/${payment.order_id}`} className="text-brand hover:underline font-bold">
                              CMD-{payment.order_id}
                            </Link>
                          ) : '-'}
                        </td>
                        <td>
                          {payment.order_id && payment.amount < 0 && remainingOrderDebt > 0 && (
                            <button 
                              type="button" 
                              className="btn btn-primary text-xs px-2 py-1"
                              onClick={() => openOrderPaymentModal(payment.order_id!, remainingOrderDebt)}
                            >
                              دفع
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-light">لم يتم تسجيل أي عمليات.</p>
          )}
        </div>
      </details>

      {/* Order Payment Modal */}
      {modalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black-50 z-50 p-4" onClick={closeOrderPaymentModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden card p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg mb-0">دفع دين طلب <span className="text-brand">CMD-{modalOrderId}</span></h3>
              <button type="button" onClick={closeOrderPaymentModal} className="text-light hover:text-danger text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-light mb-4">الدين المتبقي: <span className="font-bold text-danger">{modalRemainingDebt}</span> درهم</p>
              <form onSubmit={handleOrderPaymentSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">المبلغ المراد دفعه</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="input" 
                    placeholder="0.00" 
                    max={modalRemainingDebt}
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">تعليق (اختياري)</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="مثال: دفعة نقداً..." 
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 justify-end mt-2">
                  <button type="button" className="btn btn-outline" onClick={closeOrderPaymentModal}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={loadingAction === 'order-payment'}>حفظ الدفعة</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
