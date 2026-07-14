'use client';

import { useState, useEffect, useCallback } from 'react';
import EditStockMovementModal from '@/components/EditStockMovementModal';

interface Movement {
  id: number;
  produit_id: number;
  type_mouvement: 'entree' | 'sortie';
  quantite_unitaire: number;
  nombre_colis: number | null;
  date_mouvement: string;
  stock_resultat: number;
}

interface StockHistoryTableProps {
  productId: number;
  initialHistory: {
    movements: Movement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialStock: number;
}

export default function StockHistoryTable({ productId, initialHistory, initialStock }: StockHistoryTableProps) {
  const [stock, setStock] = useState(initialStock);
  const [movements, setMovements] = useState<Movement[]>(initialHistory.movements);
  const [total, setTotal] = useState(initialHistory.total);
  const [page, setPage] = useState(initialHistory.page);
  const [totalPages, setTotalPages] = useState(initialHistory.totalPages);
  
  const [loading, setLoading] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  // Format SQLite date string: YYYY-MM-DD HH:MM:SS -> DD/MM/YYYY HH:MM
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const cleanStr = dateStr.replace(' ', 'T');
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return dateStr;
    }
  };

  const fetchHistory = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock?page=${targetPage}&limit=10`);
      if (!res.ok) throw new Error('فشل تحميل سجل حركة المخزون');
      const data = await res.json();
      
      setMovements(data.movements);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error(err);
      if ((window as any).showToast) {
        (window as any).showToast(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newStock: number }>;
      if (customEvent.detail && customEvent.detail.newStock !== undefined) {
        setStock(customEvent.detail.newStock);
      }
      // Reload page 1 to show the latest stock movement
      fetchHistory(1);
    };

    document.addEventListener('stock-updated', handleStockUpdate);
    return () => {
      document.removeEventListener('stock-updated', handleStockUpdate);
    };
  }, [fetchHistory]);

  const openStockModal = (modalId: string) => {
    if ((window as any).openModal) {
      (window as any).openModal(modalId);
    } else {
      document.getElementById(modalId)?.classList.remove('hidden');
    }
  };

  return (
    <div className="card mt-6" id="stockHistoryCard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h3 className="h3 mb-1 text-navy flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="22" height="22" className="text-brand">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            سجل حركة المخزون
          </h3>
          <p className="text-light text-xs">تتبع كامل لعمليات الإدخال والسحب من المخزون لهذا المنتج</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-brand-light border border-brand-ring rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-text">المخزون الحالي:</span>
            <span className="text-lg font-bold text-brand" id="stockDisplay">{stock}</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button" 
              className="btn btn-outline text-brand py-2 px-3 flex items-center gap-1 hover:bg-brand-light" 
              onClick={() => openStockModal('addStockModal')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              إدخال مخزون
            </button>
            <button 
              type="button" 
              className="btn btn-outline text-danger border-danger hover:bg-red-50 py-2 px-3 flex items-center gap-1" 
              onClick={() => openStockModal('removeStockModal')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
              سحب مخزون
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay wrapper */}
      <div className="relative">
        {/* Table */}
        <div className="table-container border border-border">
          <table className="w-full text-right" style={{ direction: 'rtl' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-right py-3 px-4 font-semibold text-xs text-light">تاريخ الحركة</th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-light">نوع الحركة</th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-light">الكمية</th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-light">عدد الطرود</th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-light">المخزون الناتج</th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-light w-24">العمليات</th>
              </tr>
            </thead>
            <tbody id="stockHistoryTableBody" className="divide-y divide-border">
              {movements.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-text font-medium text-right">
                    {formatDate(item.date_mouvement)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.type_mouvement === 'entree' ? (
                      <span className="badge badge-success px-2.5 py-0.5 rounded-full text-xs font-semibold">إدخال (وارد)</span>
                    ) : (
                      <span className="badge badge-danger px-2.5 py-0.5 rounded-full text-xs font-semibold">سحب (صادر)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-sm text-right">
                    {item.type_mouvement === 'entree' ? '+' : '-'}{item.quantite_unitaire}
                  </td>
                  <td className="py-3 px-4 text-sm text-light font-medium text-right">
                    {item.nombre_colis !== null ? item.nombre_colis : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-navy text-right">
                    {item.stock_resultat}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium">
                    {page === 1 && index === 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedMovement(item)}
                        className="text-brand hover:text-brand-hover flex items-center gap-1 text-xs cursor-pointer bg-transparent border-0 font-semibold"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="14" height="14">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        تعديل
                      </button>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr id="noMovementsRow">
                  <td colSpan={6} className="text-center py-8 px-4 text-light text-sm">
                    لا توجد حركات مخزون مسجلة لهذا المنتج حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Client-side Loading Spinner */}
        {loading && (
          <div id="tableLoadingOverlay" className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 transition-opacity duration-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border" id="stockHistoryPagination">
        <div className="text-xs text-light font-medium">
          عرض الصفحة <span id="currentPageNum" className="font-semibold text-text">{page}</span> من <span id="totalPagesNum" className="font-semibold text-text">{totalPages || 1}</span>
          (<span id="totalRecordsNum" className="font-semibold text-text">{total}</span> حركة إجمالاً)
        </div>
        
        <div className="flex gap-2">
          <button 
            type="button" 
            className="btn btn-outline text-xs py-1.5 px-3 border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={page <= 1 || loading}
            onClick={() => fetchHistory(page - 1)}
          >
            السابق
          </button>
          <button 
            type="button" 
            className="btn btn-outline text-xs py-1.5 px-3 border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page >= totalPages || loading}
            onClick={() => fetchHistory(page + 1)}
          >
            التالي
          </button>
        </div>
      </div>
      {selectedMovement && (
        <EditStockMovementModal
          id="editStockMovementModal"
          productId={productId}
          movement={selectedMovement}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </div>
  );
}
