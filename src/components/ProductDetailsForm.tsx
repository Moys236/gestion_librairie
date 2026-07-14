'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { editProduct, deleteProduct } from '@/app/actions';
import ConfirmModal from '@/components/ConfirmModal';
import StockHistoryTable from '@/components/StockHistoryTable';
import StockMovementModal from '@/components/StockMovementModal';
import TypeManager from '@/components/TypeManager';
import Combobox from '@/components/Combobox';

interface Category {
  id: number;
  name: string;
}

interface ProductType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string;
}

interface Product {
  id: number;
  type_id: number | null;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string; // JSON string
  category_id: number | null;
  category_name: string | null;
  type_name: string | null;
}

interface ProductDetailsFormProps {
  product: Product;
  categories: Category[];
  types: ProductType[];
  initialHistory: any;
}

export default function ProductDetailsForm({ product, categories, types, initialHistory }: ProductDetailsFormProps) {
  const router = useRouter();

  // Form edit fields
  const [name, setName] = useState(product.name);
  const [reference, setReference] = useState(product.reference || '');
  const [selectedCatId, setSelectedCatId] = useState(product.category_id?.toString() || '');
  const [selectedTypeId, setSelectedTypeId] = useState(product.type_id?.toString() || '');
  const [purchasePrice, setPurchasePrice] = useState(product.purchase_price.toString());
  const [sellingPrice, setSellingPrice] = useState(product.selling_price.toString());
  
  // Stock display synced on stock updates
  const [currentStock, setCurrentStock] = useState(product.stock);

  // Specifications
  const [defaultSpecsList, setDefaultSpecsList] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<{ name: string; value: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter types based on category
  const filteredTypes = useMemo(() => {
    if (!selectedCatId) return [];
    return types.filter(t => t.category_id.toString() === selectedCatId);
  }, [types, selectedCatId]);

  // Sync stock update
  useEffect(() => {
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newStock: number }>;
      if (customEvent.detail && customEvent.detail.newStock !== undefined) {
        setCurrentStock(customEvent.detail.newStock);
      }
    };
    document.addEventListener('stock-updated', handleStockUpdate);
    return () => {
      document.removeEventListener('stock-updated', handleStockUpdate);
    };
  }, []);

  // Parse specifications on load
  useEffect(() => {
    let currentSpecs: Record<string, string> = {};
    try {
      currentSpecs = JSON.parse(product.specifications || '{}');
    } catch (e) {}

    const selectedType = types.find(t => t.id.toString() === selectedTypeId);
    let defaults: any[] = [];
    if (selectedType) {
      try {
        defaults = JSON.parse(selectedType.default_specs || '[]');
      } catch (e) {}
    }
    setDefaultSpecsList(defaults);

    const defaultNames = new Set(defaults.map(s => typeof s === 'object' ? s.name : s));

    // Map default spec values
    const defVals: Record<string, string> = {};
    defaultNames.forEach(specName => {
      defVals[specName] = currentSpecs[specName] || '';
    });
    setSpecValues(defVals);

    // Map custom specs (that are not in default spec list)
    const custSpecs: { name: string; value: string }[] = [];
    Object.keys(currentSpecs).forEach(key => {
      if (!defaultNames.has(key)) {
        custSpecs.push({ name: key, value: currentSpecs[key] });
      }
    });
    setCustomSpecs(custSpecs);
  }, [product.specifications, selectedTypeId, types]);

  // Handle Category select change
  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    setSelectedTypeId('');
    setDefaultSpecsList([]);
    setSpecValues({});
  };

  // Handle Type select change
  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    setSpecValues({});

    if (!typeId) {
      setDefaultSpecsList([]);
      return;
    }

    const t = types.find(item => item.id.toString() === typeId);
    if (t) {
      try {
        setDefaultSpecsList(JSON.parse(t.default_specs || '[]'));
      } catch (e) {
        setDefaultSpecsList([]);
      }
    }
  };

  const handleSpecValChange = (name: string, val: string) => {
    setSpecValues(prev => ({ ...prev, [name]: val }));
  };

  const handleAddCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { name: '', value: '' }]);
  };

  const handleRemoveCustomSpec = (index: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomSpecChange = (index: number, field: 'name' | 'value', val: string) => {
    setCustomSpecs(prev => prev.map((item, i) => i === index ? { ...item, [field]: val } : item));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const specifications: Record<string, string> = {};
    defaultSpecsList.forEach(spec => {
      const specName = typeof spec === 'object' ? spec.name : spec;
      specifications[specName] = specValues[specName] || '';
    });

    customSpecs.forEach(spec => {
      if (spec.name.trim() !== '') {
        specifications[spec.name.trim()] = spec.value;
      }
    });

    const res = await editProduct(product.id, {
      name,
      reference,
      type_id: selectedTypeId ? Number(selectedTypeId) : null,
      purchase_price: Number(purchasePrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      specifications
    });

    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
    } else {
      setSuccess('تم تحديث بيانات المنتج بنجاح.');
      router.refresh();
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    setError('');
    const res = await deleteProduct(product.id);
    if (res && !res.success) {
      setError(res.error || 'حدث خطأ أثناء حذف المنتج.');
    }
  };

  const openDeleteModal = () => {
    if ((window as any).openModal) {
      (window as any).openModal('deleteProductModal');
    }
  };

  const openTypeManager = () => {
    if ((window as any).openTypeManager) {
      (window as any).openTypeManager();
    }
  };

  return (
    <>
      <div className="card max-w-3xl mx-auto">
        {error && <div className="badge badge-danger p-4 w-full mb-4 text-center block" style={{ display: 'block' }}>{error}</div>}
        {success && <div className="badge badge-success p-4 w-full mb-4 text-center block" style={{ display: 'block' }}>{success}</div>}
        
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">اسم المنتج *</label>
              <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">المرجع *</label>
              <input type="text" required className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">الفئة *</label>
              <select 
                required 
                className="input"
                value={selectedCatId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">اختر الفئة...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold">نوع المنتج *</label>
                <button type="button" className="text-brand text-xs font-semibold hover:underline" onClick={openTypeManager}>+ إدارة الفئات والأنواع</button>
              </div>
              <select 
                required 
                className="input"
                disabled={!selectedCatId}
                value={selectedTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="">{selectedCatId ? 'اختر نوع المنتج...' : 'اختر الفئة أولاً...'}</option>
                {filteredTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div id="specsSection" className="bg-gray-50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold text-sm mb-3">المواصفات (Specifications)</h4>
            
            <div id="dynamicSpecsContainer" className="flex flex-col gap-3 mb-3">
              {defaultSpecsList.length === 0 && selectedTypeId && (
                <span className="text-xs text-light">لا توجد خصائص افتراضية لهذا النوع.</span>
              )}
              {defaultSpecsList.map((spec, index) => {
                const isObj = typeof spec === 'object';
                const specName = isObj ? spec.name : spec;
                const options = isObj ? (spec.options || []) : [];
                const val = specValues[specName] || '';
                return (
                  <div key={index} className="flex items-center gap-2">
                    <label className="w-1/3 text-sm text-text">{specName}</label>
                    {options.length > 0 ? (
                      <Combobox
                        placeholder={`قيمة ${specName}...`}
                        value={val}
                        options={options}
                        onChange={(newVal) => handleSpecValChange(specName, newVal)}
                      />
                    ) : (
                      <input 
                        type="text" 
                        className="input flex-1" 
                        placeholder={`قيمة ${specName}...`}
                        value={val}
                        onChange={(e) => handleSpecValChange(specName, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div id="customSpecsContainer" className="flex flex-col gap-3 mb-3 border-t border-border pt-3 mt-3">
              {customSpecs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    className="input w-1/3" 
                    placeholder="اسم الخاصية..." 
                    value={spec.name}
                    onChange={(e) => handleCustomSpecChange(index, 'name', e.target.value)}
                    required 
                  />
                  <input 
                    type="text" 
                    className="input flex-1" 
                    placeholder="القيمة..." 
                    value={spec.value}
                    onChange={(e) => handleCustomSpecChange(index, 'value', e.target.value)}
                    required 
                  />
                  <button type="button" className="btn btn-outline text-danger border-danger px-2" onClick={() => handleRemoveCustomSpec(index)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-outline text-xs mt-2" onClick={handleAddCustomSpec}>+ إضافة خاصية</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">سعر الشراء</label>
              <input type="number" step="0.01" className="input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-brand">سعر البيع *</label>
              <input type="number" step="0.01" required className="input font-bold" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-light">المخزون الحالي (يُعدّل من قسم حركة المخزون)</label>
              <input type="number" className="input bg-gray-50 text-light cursor-not-allowed" value={currentStock} readOnly />
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <button type="button" className="btn btn-danger" onClick={openDeleteModal}>
              حذف المنتج
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'تحديث البيانات'}
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-3xl mx-auto">
        <StockHistoryTable productId={product.id} initialHistory={initialHistory} initialStock={product.stock} />
      </div>

      <ConfirmModal 
        id="deleteProductModal"
        title="تأكيد حذف المنتج"
        message={`هل أنت متأكد من حذف المنتج "${product.name}" نهائياً من النظام؟`}
        warning="من الأفضل تصفير كمية المخزون (تغييرها إلى 0) بدلاً من حذفه، وذلك لتجنب أية مشاكل في سجلات الطلبات القديمة المرتبطة به. الحذف النهائي لا يمكن التراجع عنه!"
        confirmText="نعم، احذف نهائياً"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
      />

      <TypeManager />

      <StockMovementModal id="addStockModal" type="entree" productId={product.id} />
      <StockMovementModal id="removeStockModal" type="sortie" productId={product.id} />
    </>
  );
}
