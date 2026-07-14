'use client';

import { useState, useMemo, useRef } from 'react';
import Script from 'next/script';
import { 
  createSupplierList, 
  renameSupplierList, 
  deleteSupplierList, 
  addProductToSupplierList,
  updateProductInSupplierList,
  removeProductFromSupplierList
} from '@/app/actions';

declare let XLSX: any;

interface Product {
  id: number;
  name: string;
  reference: string | null;
  selling_price: number;
  stock: number;
  type_name: string | null;
  category_name: string | null;
}

interface SupplierList {
  id: number;
  name: string;
  created_at: string;
}

interface SupplierListItem {
  id: number;
  list_id: number;
  product_id: number;
  quantity: number;
  note: string | null;
  product_name: string;
  product_reference: string | null;
  type_name: string | null;
  category_name: string | null;
}

interface CategoryGroup {
  id: number;
  name: string;
  types: { id: number; name: string }[];
}

interface SupplierRequestsProps {
  products: Product[];
  categoriesWithTypes: CategoryGroup[];
  initialLists: SupplierList[];
  initialItems: SupplierListItem[];
}

export default function SupplierRequests({
  products,
  categoriesWithTypes,
  initialLists,
  initialItems
}: SupplierRequestsProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'lists'>('catalog');

  // Database states
  const [lists, setLists] = useState<SupplierList[]>(initialLists);
  const [items, setItems] = useState<SupplierListItem[]>(initialItems);

  // Selected list state
  const [selectedListId, setSelectedListId] = useState<string>(
    initialLists.length > 0 ? initialLists[0].id.toString() : ''
  );

  // List management inputs
  const [newListName, setNewListName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [showRenameInput, setShowRenameInput] = useState(false);

  // Catalog search/filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state for "Add to List"
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalProduct, setAddModalProduct] = useState<Product | null>(null);
  const [addModalListId, setAddModalListId] = useState(selectedListId);
  const [addModalQty, setAddModalQty] = useState('10');
  const [addModalNote, setAddModalNote] = useState('');

  // Modals state for "Edit item in list"
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState<SupplierListItem | null>(null);
  const [editModalQty, setEditModalQty] = useState('');
  const [editModalNote, setEditModalNote] = useState('');

  // Actions loading
  const [loading, setLoading] = useState(false);

  // Filter products catalog
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim() !== '') {
      const clean = searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(clean) || 
        (p.reference && p.reference.toLowerCase().includes(clean))
      );
    }

    if (typeFilter !== '') {
      result = result.filter(p => p.id !== null); // safety
      if (typeFilter === 'none') {
        // Not associated to a type
        result = result.filter(p => !p.type_name);
      } else {
        result = result.filter(p => p.type_name === categoriesWithTypes.flatMap(c => c.types).find(t => t.id.toString() === typeFilter)?.name);
      }
    }

    return result;
  }, [products, searchTerm, typeFilter, categoriesWithTypes]);

  // Items belonging to selected list
  const currentListItems = useMemo(() => {
    if (!selectedListId) return [];
    return items.filter(item => item.list_id.toString() === selectedListId);
  }, [items, selectedListId]);

  // Selected list metadata
  const currentList = useMemo(() => {
    return lists.find(l => l.id.toString() === selectedListId);
  }, [lists, selectedListId]);

  // Create list
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    setLoading(true);
    const res = await createSupplierList(name);
    if (res && res.success && res.listId) {
      const newList = {
        id: Number(res.listId),
        name,
        created_at: new Date().toISOString()
      };
      setLists(prev => [...prev, newList]);
      setSelectedListId(newList.id.toString());
      setAddModalListId(newList.id.toString());
      setNewListName('');
      if ((window as any).showToast) (window as any).showToast('تم إنشاء القائمة بنجاح', 'success');
    } else {
      alert(res?.error || 'فشل إنشاء القائمة');
    }
    setLoading(false);
  };

  // Rename list
  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name || !selectedListId) return;

    setLoading(true);
    const res = await renameSupplierList(Number(selectedListId), name);
    if (res && res.success) {
      setLists(prev => prev.map(l => l.id.toString() === selectedListId ? { ...l, name } : l));
      setShowRenameInput(false);
      if ((window as any).showToast) (window as any).showToast('تم تغيير اسم القائمة', 'success');
    } else {
      alert(res?.error || 'فشل التعديل');
    }
    setLoading(false);
  };

  // Delete list
  const handleDeleteList = async () => {
    if (!selectedListId) return;
    if (confirm('هل أنت متأكد من حذف هذه القائمة نهائياً؟')) {
      setLoading(true);
      const res = await deleteSupplierList(Number(selectedListId));
      if (res && res.success) {
        const remaining = lists.filter(l => l.id.toString() !== selectedListId);
        setLists(remaining);
        setItems(prev => prev.filter(item => item.list_id.toString() !== selectedListId));
        
        const nextId = remaining.length > 0 ? remaining[0].id.toString() : '';
        setSelectedListId(nextId);
        setAddModalListId(nextId);
        setShowRenameInput(false);
        if ((window as any).showToast) (window as any).showToast('تم حذف القائمة بنجاح', 'success');
      } else {
        alert(res?.error || 'فشل حذف القائمة');
      }
      setLoading(false);
    }
  };

  // Open "Add to List" Modal
  const openAddModal = (p: Product) => {
    if (lists.length === 0) {
      alert('الرجاء إنشاء قائمة طلبات أولاً في تبويب "إدارة القوائم"');
      setActiveTab('lists');
      return;
    }
    setAddModalProduct(p);
    setAddModalQty('10');
    setAddModalNote('');
    setAddModalOpen(true);
  };

  // Add item submit
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addModalProduct || !addModalListId) return;

    const qty = Number(addModalQty);
    if (isNaN(qty) || qty <= 0) return alert('الكمية يجب أن تكون أكبر من الصفر');

    setLoading(true);
    const res = await addProductToSupplierList(Number(addModalListId), addModalProduct.id, qty, addModalNote);
    if (res && res.success) {
      // Re-fetch or locally insert item
      // For local insert, we check if it already exists to update
      const existingIdx = items.findIndex(item => item.list_id.toString() === addModalListId && item.product_id === addModalProduct.id);
      
      const targetList = lists.find(l => l.id.toString() === addModalListId);
      
      const newItem: SupplierListItem = {
        id: Date.now(), // temporary local id
        list_id: Number(addModalListId),
        product_id: addModalProduct.id,
        quantity: existingIdx >= 0 ? items[existingIdx].quantity + qty : qty,
        note: addModalNote || (existingIdx >= 0 ? items[existingIdx].note : ''),
        product_name: addModalProduct.name,
        product_reference: addModalProduct.reference,
        type_name: addModalProduct.type_name,
        category_name: addModalProduct.category_name
      };

      if (existingIdx >= 0) {
        setItems(prev => prev.map((item, idx) => idx === existingIdx ? newItem : item));
      } else {
        setItems(prev => [...prev, newItem]);
      }

      setAddModalOpen(false);
      if ((window as any).showToast) (window as any).showToast('تمت إضافة المنتج للقائمة بنجاح', 'success');
    } else {
      alert(res?.error || 'فشل الإضافة');
    }
    setLoading(false);
  };

  // Open Edit Item Modal
  const openEditModal = (item: SupplierListItem) => {
    setEditModalItem(item);
    setEditModalQty(item.quantity.toString());
    setEditModalNote(item.note || '');
    setEditModalOpen(true);
  };

  // Edit item submit
  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem) return;

    const qty = Number(editModalQty);
    if (isNaN(qty) || qty <= 0) return alert('الكمية يجب أن تكون أكبر من الصفر');

    setLoading(true);
    const res = await updateProductInSupplierList(editModalItem.list_id, editModalItem.product_id, qty, editModalNote);
    if (res && res.success) {
      setItems(prev => prev.map(item => 
        item.list_id === editModalItem.list_id && item.product_id === editModalItem.product_id
          ? { ...item, quantity: qty, note: editModalNote || null }
          : item
      ));
      setEditModalOpen(false);
      if ((window as any).showToast) (window as any).showToast('تم تعديل بند الطلب', 'success');
    } else {
      alert(res?.error || 'فشل التعديل');
    }
    setLoading(false);
  };

  // Remove item
  const handleRemoveItem = async (item: SupplierListItem) => {
    if (confirm(`هل تريد إزالة "${item.product_name}" من هذه القائمة؟`)) {
      setLoading(true);
      const res = await removeProductFromSupplierList(item.list_id, item.product_id);
      if (res && res.success) {
        setItems(prev => prev.filter(i => !(i.list_id === item.list_id && i.product_id === item.product_id)));
        if ((window as any).showToast) (window as any).showToast('تمت إزالة المنتج من القائمة', 'success');
      } else {
        alert(res?.error || 'فشل إزالة المنتج');
      }
      setLoading(false);
    }
  };

  // SheetJS Excel Exporter
  const handleExportList = () => {
    if (currentListItems.length === 0 || !currentList) return;

    const data: string[][] = [
      ['المرجع', 'اسم المنتج', 'الفئة', 'النوع', 'الكمية المطلوبة', 'الملاحظات والتعليمات']
    ];

    currentListItems.forEach(item => {
      data.push([
        item.product_reference || '',
        item.product_name,
        item.category_name || '',
        item.type_name || '',
        item.quantity.toString(),
        item.note || ''
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, currentList.name);
      
      const pad = (num: number) => String(num).padStart(2, '0');
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      
      XLSX.writeFile(wb, `commande_${currentList.name}_${dateStr}.xlsx`);
    } else {
      alert('تحذير: مكتبة تصدير Excel غير جاهزة. جاري المحاولة بنمط تصدير CSV بديل...');
      // Fallback CSV
      const csvContent: string[] = ['sep=;'];
      data.forEach(row => {
        const rowStr = row.map(val => `"${val.replace(/"/g, '""')}"`).join(';');
        csvContent.push(rowStr);
      });
      const csvString = '\uFEFF' + csvContent.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const pad = (num: number) => String(num).padStart(2, '0');
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      
      link.setAttribute('download', `commande_${currentList.name}_${dateStr}.csv`);
      link.click();
    }
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="lazyOnload" />

      {/* Tab Headers */}
      <div className="flex gap-2 border-b border-border mb-6">
        <button 
          className={`px-4 py-2 font-bold border-b-2 text-sm ${activeTab === 'catalog' ? 'border-brand text-brand' : 'border-transparent text-light hover:text-text'}`}
          onClick={() => setActiveTab('catalog')}
        >
          كتالوج المنتجات
        </button>
        <button 
          className={`px-4 py-2 font-bold border-b-2 text-sm ${activeTab === 'lists' ? 'border-brand text-brand' : 'border-transparent text-light hover:text-text'}`}
          onClick={() => {
            setActiveTab('lists');
            setShowRenameInput(false);
          }}
        >
          إدارة قوائم الطلبات ({lists.length})
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="بحث بالاسم أو المرجع للطلب..." 
              className="input flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="input w-48"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">جميع الأنواع</option>
              <option value="none">بدون نوع</option>
              {categoriesWithTypes.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المرجع</th>
                  <th>اسم المنتج</th>
                  <th>الفئة والنوع</th>
                  <th>المخزون الحالي</th>
                  <th>سعر البيع</th>
                  <th className="w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.reference || '-'}</td>
                    <td>{p.name}</td>
                    <td>{p.type_name ? `${p.category_name} ← ${p.type_name}` : '-'}</td>
                    <td>
                      <span className={`badge ${p.stock > 10 ? 'badge-success' : 'badge-danger'}`}>
                        {p.stock} قطعة
                      </span>
                    </td>
                    <td>{p.selling_price} درهم</td>
                    <td>
                      <button 
                        type="button" 
                        className="btn btn-primary text-xs py-1 px-3"
                        onClick={() => openAddModal(p)}
                      >
                        + إضافة للطلب
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-light">لا توجد منتجات تطابق الفلاتر.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Lists */}
      {activeTab === 'lists' && (
        <div className="grid grid-cols-3 gap-6">
          
          {/* Right sidebar: List selector & creation */}
          <div className="flex flex-col gap-4">
            <div className="card border border-border p-4 bg-gray-50">
              <h4 className="font-bold text-sm mb-3 text-navy">إنشاء قائمة طلب جديدة</h4>
              <form onSubmit={handleCreateList} className="flex flex-col gap-2">
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="مثال: طلبية كراس خريف 2026..." 
                  required 
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary w-full text-sm" disabled={loading}>
                  + إنشاء قائمة
                </button>
              </form>
            </div>

            <div className="card p-4">
              <h4 className="font-bold text-sm mb-3 text-navy">اختر قائمة لعرض تفاصيلها</h4>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {lists.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    className={`btn text-right justify-start px-3 py-2 text-sm w-full font-medium ${selectedListId === l.id.toString() ? 'btn-primary' : 'btn-outline border-border text-text'}`}
                    onClick={() => {
                      setSelectedListId(l.id.toString());
                      setShowRenameInput(false);
                    }}
                  >
                    📁 {l.name}
                  </button>
                ))}
                {lists.length === 0 && (
                  <span className="text-xs text-light text-center py-4">لم يتم إنشاء أي قائمة بعد.</span>
                )}
              </div>
            </div>
          </div>

          {/* Left panel: List items and actions */}
          <div className="col-span-2 flex flex-col gap-4" style={{ gridColumn: 'span 2' }}>
            {currentList ? (
              <div className="card p-5">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    {!showRenameInput ? (
                      <>
                        <h3 className="font-bold text-xl text-navy m-0">{currentList.name}</h3>
                        <button 
                          type="button" 
                          className="text-xs text-brand hover:underline font-semibold"
                          onClick={() => {
                            setRenameValue(currentList.name);
                            setShowRenameInput(true);
                          }}
                        >
                          تعديل الاسم
                        </button>
                      </>
                    ) : (
                      <form onSubmit={handleRenameList} className="flex gap-2">
                        <input 
                          type="text" 
                          required 
                          className="input text-xs py-1" 
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary text-xs py-1">حفظ</button>
                        <button type="button" className="btn btn-outline text-xs py-1" onClick={() => setShowRenameInput(false)}>إلغاء</button>
                      </form>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline text-danger border-danger hover:bg-red-50 text-xs py-1 px-3"
                      onClick={handleDeleteList}
                    >
                      حذف القائمة
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1"
                      onClick={handleExportList}
                      disabled={currentListItems.length === 0}
                    >
                      📥 تصدير لـ Excel
                    </button>
                  </div>
                </div>

                <div className="table-container shadow-none border border-border">
                  <table>
                    <thead>
                      <tr>
                        <th>المرجع</th>
                        <th>اسم المنتج</th>
                        <th>النوع والطلب</th>
                        <th>الكمية المطلوبة</th>
                        <th>ملاحظة</th>
                        <th className="w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentListItems.map(item => (
                        <tr key={item.id}>
                          <td className="font-semibold">{item.product_reference || '-'}</td>
                          <td className="font-bold">{item.product_name}</td>
                          <td className="text-xs text-light">{item.type_name ? `${item.category_name} ← ${item.type_name}` : '-'}</td>
                          <td className="font-bold text-brand">{item.quantity} قطعة</td>
                          <td className="text-xs text-light">{item.note || '-'}</td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                className="btn btn-outline text-xs py-0.5 px-2"
                                onClick={() => openEditModal(item)}
                              >
                                تعديل
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-danger text-xs py-0.5 px-2"
                                onClick={() => handleRemoveItem(item)}
                              >
                                إزالة
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentListItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-6 text-light">لا توجد عناصر مضافة لهذه القائمة بعد. انتقل لتبويب "كتالوج المنتجات" لإضافة عناصر.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center text-light flex flex-col items-center justify-center min-h-[300px]">
                📁
                <p className="font-bold text-navy mt-2">لا توجد أي قائمة طلبات نشطة</p>
                <p className="text-xs mt-1">يرجى إنشاء قائمة جديدة من العمود الجانبي لبدء تجميع طلبات الموردين.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add To List Modal */}
      {addModalOpen && addModalProduct && (
        <div className="modal-backdrop fixed inset-0 bg-black-50 z-50 p-4 flex items-center justify-center" onClick={() => setAddModalOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden card p-0"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: 'rtl' }}
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-base mb-0">إضافة المنتج إلى قائمة الطلبات</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-light hover:text-danger text-xl leading-none cursor-pointer border-0 bg-transparent">&times;</button>
            </div>
            <form onSubmit={handleAddItemSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-light mb-1">المنتج المحدد</label>
                <p className="font-bold text-navy text-sm bg-gray-50 p-2 rounded border border-border">{addModalProduct.name}</p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-text">اختر قائمة الطلبات *</label>
                <select 
                  className="input" 
                  required
                  value={addModalListId}
                  onChange={(e) => setAddModalListId(e.target.value)}
                >
                  {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text">الكمية المطلوبة *</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  className="input text-lg font-bold" 
                  value={addModalQty}
                  onChange={(e) => setAddModalQty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text">ملاحظات أو تعليمات خاصة للمورد (اختياري)</label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="مثال: تغليف خاص، استعجالي، إلخ..."
                  value={addModalNote}
                  onChange={(e) => setAddModalNote(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-border">
                <button type="button" className="btn btn-outline" onClick={() => setAddModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>تأكيد الإضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editModalOpen && editModalItem && (
        <div className="modal-backdrop fixed inset-0 bg-black-50 z-50 p-4 flex items-center justify-center" onClick={() => setEditModalOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden card p-0"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: 'rtl' }}
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-base mb-0">تعديل بند الطلبية</h3>
              <button type="button" onClick={() => setEditModalOpen(false)} className="text-light hover:text-danger text-xl leading-none cursor-pointer border-0 bg-transparent">&times;</button>
            </div>
            <form onSubmit={handleEditItemSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-light mb-1">المنتج</label>
                <p className="font-bold text-navy text-sm bg-gray-50 p-2 rounded border border-border">{editModalItem.product_name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text">الكمية المطلوبة *</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  className="input text-lg font-bold" 
                  value={editModalQty}
                  onChange={(e) => setEditModalQty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text">الملاحظات</label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  value={editModalNote}
                  onChange={(e) => setEditModalNote(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-border">
                <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
