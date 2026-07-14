'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { createOrder } from '@/app/actions';

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

interface OrderItem {
  product_id: number | null;
  description: string;
  unit_price: number;
  quantity: number;
}

interface NewOrderFormProps {
  clients: Client[];
  products: Product[];
}

export default function NewOrderForm({ clients, products }: NewOrderFormProps) {
  // Client selection mode
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // Order items state
  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Catalog product selection
  const [catalogProductId, setCatalogProductId] = useState('');
  const [catalogProductQty, setCatalogProductQty] = useState('1');

  // Manual line inputs
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; type: string }[]>([]);

  // Form submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute total
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  // Add catalog product
  const handleAddCatalogProduct = () => {
    if (!catalogProductId) return alert('يرجى اختيار منتج');
    
    const product = products.find(p => p.id.toString() === catalogProductId);
    if (!product) return;

    const qty = parseInt(catalogProductQty) || 1;
    
    setItems(prev => [
      ...prev,
      {
        product_id: product.id,
        description: product.name,
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
        product_id: null,
        description: manualDesc.trim(),
        unit_price: price,
        quantity: qty
      }
    ]);

    setManualDesc('');
    setManualPrice('');
    setManualQty('1');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle files
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newPreviews: { name: string; url: string; type: string }[] = [];
    
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviews.push({
        name: file.name,
        url,
        type: file.type
      });
    });

    setFilePreviews(newPreviews);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      alert('يجب إضافة عنصر واحد على الأقل للطلب.');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('items', JSON.stringify(items));

    // Execute Server Action
    const res = await createOrder(formData);
    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[75vh]">
      {/* Saisie Commande (Droite) */}
      <div className="card flex flex-col h-full overflow-y-auto">
        <h3 className="h3 mb-4">تفاصيل الطلب</h3>
        {error && <div className="badge badge-danger p-4 w-full mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} id="orderForm" className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-semibold">الزبون *</label>
            </div>
            
            {!showNewClientForm ? (
              <div id="existingClientDiv" className="flex gap-2">
                <select 
                  name="client_id" 
                  required 
                  className="input flex-1"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">اختر زبوناً</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button 
                  type="button" 
                  className="text-xs text-brand hover:underline font-semibold w-fit no-wrap"
                  onClick={() => setShowNewClientForm(true)}
                >
                  + زبون جديد
                </button>
              </div>
            ) : (
              <div id="newClientDiv" className="bg-gray-50 p-3 rounded border border-border mt-2 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">إضافة زبون جديد</h4>
                  <button 
                    type="button" 
                    className="text-xs text-danger hover:underline"
                    onClick={() => setShowNewClientForm(false)}
                  >
                    إلغاء
                  </button>
                </div>
                <input type="text" name="new_client_name" required className="input text-sm" placeholder="اسم الزبون *" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" name="new_client_phone" className="input text-sm" placeholder="رقم الهاتف" />
                  <input type="text" name="new_client_address" className="input text-sm" placeholder="العنوان" />
                </div>
              </div>
            )}
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
              {items.map((item, index) => {
                const itemTotal = item.quantity * item.unit_price;
                return (
                  <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-border mb-2 text-sm">
                    <div className="flex-1">
                      <div className="font-semibold">{item.description}</div>
                      <div className="text-light">{item.quantity} x {item.unit_price} درهم</div>
                    </div>
                    <div className="font-bold ml-4">{itemTotal.toFixed(2)} درهم</div>
                    <button type="button" className="btn btn-danger text-xs py-1 px-2" onClick={() => handleRemoveItem(index)}>X</button>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-light text-center py-4 text-sm">لم تتم إضافة أي عناصر.</p>
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
                <select name="status" className="input">
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد التجهيز</option>
                  <option value="completed">مكتمل</option>
                  <option value="delivered">مُسَلَّم</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المبلغ المدفوع (درهم)</label>
                <input type="number" step="0.01" name="paid_amount" className="input text-lg font-bold" placeholder="0.00" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1">ملاحظات</label>
              <textarea name="notes" className="input" rows={2} placeholder="أي ملاحظات إضافية حول الطلب..."></textarea>
            </div>
            <input type="hidden" name="items" value={JSON.stringify(items)} />
            <button type="submit" className="btn btn-primary w-full mt-4 py-3 text-lg" disabled={loading}>
              {loading ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}
            </button>
          </div>
        </form>
      </div>

      {/* Vue Fichier (Gauche) */}
      <div 
        id="previewContainer" 
        className={`card flex flex-col h-full overflow-y-scroll border-2 border-dashed transition-all duration-200 relative ${
          dragActive ? 'border-brand bg-brand-light' : 'border-transparent'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <h3 className="h3 mb-4">المستند المرفق (PDF/صورة)</h3>
        
        <input 
          type="file" 
          id="fileInput" 
          accept="image/*,application/pdf" 
          className="input" 
          form="orderForm" 
          name="file" 
          multiple 
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        <div id="placeholderText" className="text-light text-center px-4 mb-4 pointer-events-none">
          {filePreviews.length > 0 ? (
            <p className="font-bold text-brand text-lg mb-2">تم تحديد {filePreviews.length} ملفات</p>
          ) : (
            <>
              <p>اختر ملفًا أو اسحبه وأفلته هنا لتسهيل عملية الإدخال.</p>
              <p className="text-xs mt-1">PDF أو صور</p>
            </>
          )}
        </div>
        
        <div id="mediaContainer" className="flex-1 rounded-md flex flex-col items-center justify-start mb-4 gap-4">
          {filePreviews.length > 0 ? (
            filePreviews.map((file, i) => (
              <div key={i} className="w-full min-h-[600px] border-2 border-border rounded-md overflow-hidden bg-gray-50 relative flex flex-col">
                <div className="bg-white p-2 border-b border-border text-sm font-semibold truncate">
                  {file.name}
                </div>
                <div className="flex-1 w-full min-h-[550px] relative">
                  {file.type.includes('pdf') ? (
                    <iframe src={file.url} className="absolute inset-0 w-full h-full border-0"></iframe>
                  ) : file.type.startsWith('image/') ? (
                    <img src={file.url} className="absolute inset-0 w-full h-full object-contain p-2" alt={file.name} />
                  ) : (
                    <p className="text-center p-10 text-light w-full">لا يمكن معاينة هذا الملف</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full bg-gray-50 min-h-[600px] flex items-center justify-center rounded-md text-light">لا يوجد ملفات للعرض</div>
          )}
        </div>
      </div>
    </div>
  );
}
