'use client';

import { useState } from 'react';

interface Movement {
  id: number;
  produit_id: number;
  type_mouvement: 'entree' | 'sortie';
  quantite_unitaire: number;
  nombre_colis: number | null;
  date_mouvement: string;
  stock_resultat: number;
}

interface EditStockMovementModalProps {
  id: string;
  productId: number;
  movement: Movement;
  onClose: () => void;
}

export default function EditStockMovementModal({ id, productId, movement, onClose }: EditStockMovementModalProps) {
  const initialDate = movement.date_mouvement ? movement.date_mouvement.split(' ')[0] : '';
  
  const [quantite, setQuantite] = useState(String(movement.quantite_unitaire));
  const [colis, setColis] = useState(movement.nombre_colis !== null ? String(movement.nombre_colis) : '');
  const [dateMouvement, setDateMouvement] = useState(initialDate);
  const [typeMouvement, setTypeMouvement] = useState<'entree' | 'sortie'>(movement.type_mouvement);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movementId: movement.id,
          type_mouvement: typeMouvement,
          quantite_unitaire: qty,
          nombre_colis: colis === '' ? null : Number(colis),
          date_mouvement: dateMouvement
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ غير متوقع أثناء تعديل الحركة.');
      }

      // Trigger global custom event with new stock level
      document.dispatchEvent(new CustomEvent('stock-updated', {
        detail: { newStock: result.newStock }
      }));

      // Success Toast
      if ((window as any).showToast) {
        (window as any).showToast('تم تعديل حركة المخزون بنجاح', 'success');
      }

      onClose();
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
      className="modal-backdrop fixed inset-0 bg-black-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card max-w-md w-full bg-white rounded-lg shadow-lg p-6" style={{ direction: 'rtl' }}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
          <h3 className="h3 mb-0 text-navy text-base font-bold text-right">تعديل الحركة الأخيرة للمخزون</h3>
          <button type="button" className="text-light hover:text-text text-xl font-bold cursor-pointer border-0 bg-transparent px-2" onClick={onClose}>&times;</button>
        </div>

        {/* Error Alert Container */}
        {error && (
          <div className="badge badge-danger p-3 w-full mb-4 text-right leading-relaxed flex items-center gap-2" style={{ fontSize: '13px', backgroundColor: '#fde8e8', border: '1px solid #f8b4b4', color: '#e53e3e' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="error-message">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="stock-form flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-text text-right">نوع الحركة *</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-text">
                <input 
                  type="radio" 
                  name="type_mouvement" 
                  value="entree"
                  checked={typeMouvement === 'entree'}
                  onChange={() => setTypeMouvement('entree')}
                  className="w-4 h-4 text-brand focus:ring-brand"
                />
                إدخال (وارد)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-text">
                <input 
                  type="radio" 
                  name="type_mouvement" 
                  value="sortie"
                  checked={typeMouvement === 'sortie'}
                  onChange={() => setTypeMouvement('sortie')}
                  className="w-4 h-4 text-danger focus:ring-danger"
                />
                سحب (صادر)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-text text-right">الكمية المطلوبة *</label>
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
            <label className="block text-sm font-semibold mb-1 text-text text-right">عدد الطرود / الكرتونات (اختياري)</label>
            <input 
              type="number" 
              min="0" 
              className="input text-light" 
              placeholder="مثال: 3 علب..."
              value={colis}
              onChange={(e) => setColis(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-text text-right">تاريخ حركة المخزون *</label>
            <input 
              type="date" 
              required 
              className="input"
              value={dateMouvement}
              onChange={(e) => setDateMouvement(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button type="button" className="btn btn-outline animate-colors" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn btn-primary bg-brand hover:bg-brand-hover flex items-center gap-2 text-white px-4 py-2 rounded" disabled={loading}>
              <span className="btn-text">حفظ التعديلات</span>
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
