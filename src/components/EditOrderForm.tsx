'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { editOrder } from '@/app/actions';

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

interface EditOrderFormProps {
  order: Order;
  orderItems: OrderItem[];
  products: Product[];
}

export default function EditOrderForm({ order, orderItems, products }: EditOrderFormProps) {
  const router = useRouter();

  // State for order items
  const [items, setItems] = useState<any[]>(() => 
    orderItems.map(item => ({
      id: Date.now() + Math.random(), // transient unique id for React rendering keys
      product_id: item.product_id,
      product_name: item.product_name || '',
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))
  );

  // Edit fields
  const [status, setStatus] = useState(order.status);
  const [paidAmount, setPaidAmount] = useState(order.paid_amount.toString());
  const [notes, setNotes] = useState(order.notes || '');

  // Catalog product selection
  const [catalogProductId, setCatalogProductId] = useState('');
  const [catalogProductQty, setCatalogProductQty] = useState('1');

  // Manual line inputs
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');

  // Form submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compute total
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  // Parse attached documents urls
  let urls: string[] = [];
  if (order.file_url) {
    try {
      urls = JSON.parse(order.file_url);
    } catch (e) {
      urls = [order.file_url];
    }
  }

  // Add catalog product
  const handleAddCatalogProduct = () => {
    if (!catalogProductId) return alert('يرجى اختيار منتج');
    
    const product = products.find(p => p.id.toString() === catalogProductId);
    if (!product) return;

    const qty = parseInt(catalogProductQty) || 1;
    
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        product_id: product.id,
        product_name: product.name,
        description: null,
        unit_price: product.selling_price,
        quantity: qty
      }
    ]);

    setCatalogProductId('');
    setCatalogProductQty('1');
  };

  // Add manual item
  const handleAddManualItem = () => {
    if (!manualDesc.trim()) return alert('يرجى إدخال الوصف');
    if (!manualPrice) return alert('يرجى إدخال السعر');

    const price = parseFloat(manualPrice);
    const qty = parseInt(manualQty) || 1;

    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        product_id: null,
        product_name: '',
        description: manualDesc.trim(),
        unit_price: price,
        quantity: qty
      }
    ]);

    setManualDesc('');
    setManualPrice('');
    setManualQty('1');
  };

  const handleRemoveItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (items.length === 0) {
      alert('يجب إضافة عنصر واحد على الأقل للطلب.');
      return;
    }

    setLoading(true);

    const res = await editOrder(order.id, {
      status,
      paid_amount: Number(paidAmount) || 0,
      notes,
      items
    });

    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
    } else {
      setSuccess('تم تحديث الطلب بنجاح');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[80vh]">
      {/* Vue Fichier (Gauche) */}
      <div className="card flex flex-col h-full overflow-y-scroll relative">
        <h3 className="h3 mb-4">المستندات المرفقة</h3>
        {urls.length === 0 ? (
          <div className="flex-1 bg-gray-50 rounded-md flex items-center justify-center text-light">
            لا يوجد مستندات مرفقة
          </div>
        ) : (
          <div className="flex-1 rounded-md flex flex-col items-center justify-start mb-4 gap-4">
            {urls.map((url, i) => (
              <div key={i} className="w-full min-h-[600px] border-2 border-border rounded-md overflow-hidden bg-gray-50 relative flex flex-col">
                <div className="bg-white p-2 border-b border-border text-sm font-semibold truncate">
                  الملف {i + 1}
                </div>
                <div className="flex-1 w-full min-h-[550px] relative">
                  {url.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={url} className="absolute inset-0 w-full h-full border-0"></iframe>
                  ) : (
                    <img src={url} className="absolute inset-0 w-full h-full object-contain p-2" alt={`الملف ${i + 1}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saisie Commande (Droite) */}
      <div className="card flex flex-col h-full overflow-y-auto">
        <h3 className="h3 mb-4">معلومات وتفاصيل الطلب</h3>
        {error && <div className="badge badge-danger p-4 w-full mb-4">{error}</div>}
        {success && <div className="badge badge-success p-4 w-full mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-gray-50 p-4 rounded-md border border-border">
            <h4 className="font-bold text-lg mb-2">الزبون</h4>
            <p className="font-semibold">{order.client_name || 'بدون زبون'}</p>
            {order.client_phone && <p className="text-sm text-light">{order.client_phone}</p>}
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold mb-2">إضافة منتج من الكتالوج</h4>
            <div className="flex gap-2">
              <select 
                className="input flex-1"
                value={catalogProductId}
                onChange={(e) => setCatalogProductId(e.target.value)}
              >
                <option value="">اختر منتجًا...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} data-price={p.selling_price}>
                    {p.name} ({p.selling_price} درهم)
                  </option>
                ))}
              </select>
              <input 
                type="number" 
                min="1" 
                className="input w-20" 
                placeholder="الكمية" 
                value={catalogProductQty}
                onChange={(e) => setCatalogProductQty(e.target.value)}
              />
              <button type="button" className="btn btn-outline" onClick={handleAddCatalogProduct}>إضافة</button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold mb-2">إضافة سطر يدوي</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input flex-1" 
                placeholder="وصف العنصر" 
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
              />
              <input 
                type="number" 
                step="0.01" 
                className="input w-24" 
                placeholder="سعر الوحدة" 
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
              />
              <input 
                type="number" 
                min="1" 
                className="input w-20" 
                placeholder="الكمية" 
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
              />
              <button type="button" className="btn btn-outline" onClick={handleAddManualItem}>إضافة</button>
            </div>
          </div>

          {/* Lignes de commande */}
          <div className="border-t border-border pt-4 flex-1">
            <h4 className="font-semibold mb-2">عناصر الطلب</h4>
            <div className="bg-gray-50 p-2 rounded-md min-h-[150px]" id="orderLines">
              {items.map(item => {
                const itemTotal = item.quantity * item.unit_price;
                const title = item.product_id ? item.product_name : item.description;
                return (
                  <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-border mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-light">{item.quantity} × {item.unit_price.toFixed(2)} درهم</p>
                    </div>
                    <div className="font-bold text-sm mr-4">{itemTotal.toFixed(2)} درهم</div>
                    <button type="button" className="text-danger hover:bg-danger hover:text-white w-6 h-6 rounded flex items-center justify-center border-0 bg-transparent text-lg font-bold" onClick={() => handleRemoveItem(item.id)}>×</button>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-center text-light mt-4">لا توجد عناصر مضافة بعد.</p>
              )}
            </div>
          </div>

          {/* Total et Validation */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">الإجمالي:</span>
              <span className="text-2xl font-bold text-brand">{totalAmount.toFixed(2)} درهم</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">حالة الطلب</label>
                <select name="status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد التجهيز</option>
                  <option value="completed">مكتمل</option>
                  <option value="delivered">مُسَلَّم</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المبلغ المدفوع (درهم)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input text-lg font-bold" 
                  placeholder="0.00" 
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1">ملاحظات</label>
              <textarea name="notes" className="input" rows={2} placeholder="أي ملاحظات إضافية حول الطلب..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4 py-3 text-lg" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
