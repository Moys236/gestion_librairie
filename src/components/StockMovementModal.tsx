'use client';

import { useState, useEffect } from 'react';

interface StockMovementModalProps {
  id: string;
  type: 'entree' | 'sortie';
  productId: number;
}

export default function StockMovementModal({ id, type, productId }: StockMovementModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const title = type === 'entree' ? 'إدخل كمية للمخزون (وارد)' : 'سحب كمية من المخزون (صادر)';
  const btnText = type === 'entree' ? 'تأكيد الإدخال' : 'تأكيد السحب';
  const btnClass = type === 'entree' ? 'btn-primary bg-brand hover:bg-brand-hover' : 'btn-danger bg-red-600 hover:bg-red-700';

  const [quantite, setQuantite] = useState('');
  const [colis, setColis] = useState('');
  const [dateMouvement, setDateMouvement] = useState(todayStr);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    document.getElementById(id)?.classList.add('hidden');
    setError('');
    setQuantite('');
    setColis('');
    setDateMouvement(todayStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantite);
    if (isNaN(qty) || qty <= 0) {
      setError('الكمية يجب أن تكون أكبر من الصفر');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type_mouvement: type,
          quantite_unitaire: qty,
          nombre_colis: colis === '' ? null : Number(colis),
          date_mouvement: dateMouvement
        })
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ غير متوقع أثناء المعاملة.');
      }

      // Trigger global custom event with new stock level
      document.dispatchEvent(new CustomEvent('stock-updated', {
        detail: { newStock: result.newStock }
      }));

      // Success Toast
      const successMessage = type === 'entree' ? 'تمت إضافة المخزون بنجاح' : 'تم سحب الكمية من المخزون بنجاح';
      if ((window as any).showToast) {
        (window as any).showToast(successMessage, 'success');
      }

      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      if ((window as any).showToast) {
        (window as any).showToast(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id={id} 
      className="modal-backdrop hidden fixed inset-0 bg-black-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="card max-w-md w-full bg-white rounded-lg shadow-lg" style={{ direction: 'rtl' }}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
          <h3 className="h3 mb-0 text-navy text-base font-bold">{title}</h3>
          <button type="button" className="text-light hover:text-text text-xl font-bold cursor-pointer border-0 bg-transparent px-2" onClick={handleClose}>&times;</button>
        </div>

        {/* Error Alert Container */}
        {error && (
          <div className="badge badge-danger p-3 w-full mb-4 text-right leading-relaxed flex items-center gap-2" style={{ fontSize: '13px', backgroundColor: '#fde8e8', border: '1px solid #f8b4b4' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="error-message">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="stock-form flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-text">الكمية المطلوبة *</label>
            <input 
              type="number" 
              required 
              min="1" 
              className="input font-semibold" 
              placeholder="أدخل عدد الوحدات..."
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-text">عدد الطرود / الكرتونات (اختياري)</label>
            <input 
              type="number" 
              min="0" 
              className="input text-light" 
              placeholder="مثال: 3 علب (للمعلومة فقط)..."
              value={colis}
              onChange={(e) => setColis(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-text">تاريخ حركة المخزون *</label>
            <input 
              type="date" 
              required 
              className="input"
              value={dateMouvement}
              onChange={(e) => setDateMouvement(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button type="button" className="btn btn-outline" onClick={handleClose}>إلغاء</button>
            <button type="submit" className={`btn submit-btn flex items-center gap-2 ${btnClass}`} disabled={loading}>
              <span className="btn-text">{btnText}</span>
              {loading && (
                <div className="spinner animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white"></div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
