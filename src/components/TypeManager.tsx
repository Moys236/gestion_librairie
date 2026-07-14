'use client';

import { useState, useEffect, useRef } from 'react';

interface Category {
  id: number;
  name: string;
}

interface Spec {
  name: string;
  options: string[];
}

interface EditSpec {
  name: string;
  optionsInput: string;
}

interface ProductType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string; // JSON string of Spec[]
  category_name?: string;
}

export default function TypeManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'types'>('categories');
  const [hasChanges, setHasChanges] = useState(false);

  // Data lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);

  // Category tab state
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [catName, setCatName] = useState<string>('');

  // Type tab state
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [typeParentCatId, setTypeParentCatId] = useState<string>('');
  const [typeName, setTypeName] = useState<string>('');
  const [specs, setSpecs] = useState<EditSpec[]>([]);

  const isInitialLoad = useRef(true);

  // Expose global open functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openTypeManager = () => {
        setIsOpen(true);
      };
      (window as any).openCategoryManager = () => {
        setIsOpen(true);
      };
    }
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await fetch('/api/types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadTypes();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (hasChanges) {
      window.location.reload();
    }
  };

  // Category handlers
  const handleCatSelectChange = (id: string) => {
    setSelectedCatId(id);
    if (id === '') {
      setCatName('');
    } else {
      const cat = categories.find(c => c.id.toString() === id);
      if (cat) {
        setCatName(cat.name);
      }
    }
  };

  const handleNewCategoryClick = () => {
    setSelectedCatId('');
    setCatName('');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;

    const method = selectedCatId ? 'PUT' : 'POST';
    const url = selectedCatId ? `/api/categories/${selectedCatId}` : '/api/categories';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        setHasChanges(true);
        const savedCat = await res.json();
        await loadCategories();
        
        setSelectedCatId(savedCat.id.toString());
        setCatName(savedCat.name);
        alert('تم الحفظ بنجاح');
      } else {
        const errData = await res.json();
        alert('خطأ: ' + (errData.error || 'فشل الحفظ'));
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCatId) return;
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟ لا يمكن حذف فئة تحتوي على أنواع منتجات.')) {
      try {
        const res = await fetch(`/api/categories/${selectedCatId}`, { method: 'DELETE' });
        if (res.ok) {
          setHasChanges(true);
          await loadCategories();
          handleNewCategoryClick();
          alert('تم الحذف بنجاح');
        } else {
          const errData = await res.json();
          alert('خطأ: ' + (errData.error || 'فشل الحذف'));
        }
      } catch (err) {
        alert('خطأ في الاتصال بالخادم');
      }
    }
  };

  // Type handlers
  const handleTypeSelectChange = (id: string) => {
    setSelectedTypeId(id);
    if (id === '') {
      setTypeParentCatId('');
      setTypeName('');
      setSpecs([]);
    } else {
      const t = types.find(typeItem => typeItem.id.toString() === id);
      if (t) {
        setTypeParentCatId(t.category_id.toString());
        setTypeName(t.name);
        try {
          const parsedSpecs = JSON.parse(t.default_specs || '[]');
          setSpecs(parsedSpecs.map((s: any) => {
            if (typeof s === 'string') {
              return { name: s, optionsInput: '' };
            }
            return {
              name: s.name,
              optionsInput: Array.isArray(s.options) ? s.options.join(', ') : ''
            };
          }));
        } catch (e) {
          setSpecs([]);
        }
      }
    }
  };

  const handleNewTypeClick = () => {
    setSelectedTypeId('');
    setTypeParentCatId('');
    setTypeName('');
    setSpecs([]);
  };

  const handleAddSpecField = () => {
    setSpecs(prev => [...prev, { name: '', optionsInput: '' }]);
  };

  const handleRemoveSpecField = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecNameChange = (index: number, val: string) => {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, name: val } : s));
  };

  const handleSpecOptionsChange = (index: number, val: string) => {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, optionsInput: val } : s));
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    const catId = typeParentCatId;
    const name = typeName.trim();
    if (!catId || !name) return;

    // Filter empty spec names and parse options from comma-separated string
    const filteredSpecs = specs
      .filter(s => s.name.trim() !== '')
      .map(s => ({
        name: s.name,
        options: s.optionsInput.split(/[,،]/).map(o => o.trim()).filter(o => o !== '')
      }));

    const method = selectedTypeId ? 'PUT' : 'POST';
    const url = selectedTypeId ? `/api/types/${selectedTypeId}` : '/api/types';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: catId, name, default_specs: filteredSpecs })
      });

      if (res.ok) {
        setHasChanges(true);
        const savedType = await res.json();
        await loadTypes();
        
        setSelectedTypeId(savedType.id.toString());
        setTypeParentCatId(savedType.category_id.toString());
        setTypeName(savedType.name);
        
        try {
          const parsed = JSON.parse(savedType.default_specs || '[]');
          setSpecs(parsed.map((s: any) => ({
            name: s.name,
            optionsInput: Array.isArray(s.options) ? s.options.join(', ') : ''
          })));
        } catch (e) {
          setSpecs([]);
        }
        alert('تم الحفظ بنجاح');
      } else {
        const errData = await res.json();
        alert('خطأ: ' + (errData.error || 'فشل الحفظ'));
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const handleDeleteType = async () => {
    if (!selectedTypeId) return;
    if (confirm('هل أنت متأكد من حذف هذا النوع؟ لا يمكن حذف نوع مرتبط بمنتجات.')) {
      try {
        const res = await fetch(`/api/types/${selectedTypeId}`, { method: 'DELETE' });
        if (res.ok) {
          setHasChanges(true);
          await loadTypes();
          handleNewTypeClick();
          alert('تم الحذف بنجاح');
        } else {
          const errData = await res.json();
          alert('خطأ: ' + (errData.error || 'فشل الحذف'));
        }
      } catch (err) {
        alert('خطأ في الاتصال بالخادم');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="typeManagerModal" 
      className="modal-backdrop fixed inset-0 bg-black-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="card max-w-xl w-full bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
          <h3 className="h3 mb-0">إدارة الفئات والأنواع</h3>
          <button type="button" className="text-light hover:text-text text-xl font-bold border-0 bg-transparent px-2 cursor-pointer" onClick={handleClose}>&times;</button>
        </div>
        
        {/* Tab Headers */}
        <div className="flex border-b border-border mb-4 gap-2">
          <button 
            type="button" 
            className={`flex-1 py-2 text-center font-bold border-b-2 ${activeTab === 'categories' ? 'border-brand text-brand' : 'border-transparent text-light hover:text-text'}`}
            onClick={() => setActiveTab('categories')}
          >
            الفئات الرئيسية
          </button>
          <button 
            type="button" 
            className={`flex-1 py-2 text-center font-bold border-b-2 ${activeTab === 'types' ? 'border-brand text-brand' : 'border-transparent text-light hover:text-text'}`}
            onClick={() => setActiveTab('types')}
          >
            أنواع المنتجات
          </button>
        </div>

        {/* Tab 1: Categories */}
        {activeTab === 'categories' && (
          <div id="tabCategoriesContent" className="flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
            <div className="flex gap-2 items-center bg-gray-50 p-3 rounded border border-border">
              <select 
                id="catSelector" 
                className="input flex-1"
                value={selectedCatId}
                onChange={(e) => handleCatSelectChange(e.target.value)}
              >
                <option value="">-- اختر فئة للتعديل --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary text-sm shrink-0 no-wrap" onClick={handleNewCategoryClick}>+ فئة جديدة</button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold mb-2">اسم الفئة *</label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  placeholder="مثال: أدوات مكتبية" 
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>

              <div className="mt-2 pt-4 border-t border-border flex justify-between items-center">
                {selectedCatId && (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteCategory}>حذف الفئة</button>
                )}
                <div className="flex gap-2 mr-auto">
                  <button type="button" className="btn btn-outline" onClick={handleClose}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">حفظ</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Types */}
        {activeTab === 'types' && (
          <div id="tabTypesContent" className="flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
            <div className="flex gap-2 items-center bg-gray-50 p-3 rounded border border-border">
              <select 
                id="typeSelector" 
                className="input flex-1"
                value={selectedTypeId}
                onChange={(e) => handleTypeSelectChange(e.target.value)}
              >
                <option value="">-- اختر نوعاً للتعديل --</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary text-sm shrink-0 no-wrap" onClick={handleNewTypeClick}>+ نوع جديد</button>
            </div>

            <form onSubmit={handleSaveType} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-sm font-semibold mb-2">الفئة الرئيسية *</label>
                <select 
                  required 
                  className="input"
                  value={typeParentCatId}
                  onChange={(e) => setTypeParentCatId(e.target.value)}
                >
                  <option value="">اختر الفئة الرئيسية...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">اسم النوع *</label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  placeholder="مثال: دفاتر" 
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded border border-border">
                <label className="block text-sm font-semibold mb-4">المواصفات الافتراضية للنوع</label>
                
                <div id="specsContainer" className="flex flex-col gap-2 mb-3 mt-2">
                  {specs.map((spec, index) => (
                    <div key={index} className="flex gap-2 flex-wrap sm:flex-nowrap items-start">
                      <input 
                        type="text" 
                        className="input flex-1" 
                        placeholder="الاسم (مثال: الحجم)" 
                        value={spec.name || ''}
                        onChange={(e) => handleSpecNameChange(index, e.target.value)}
                        required 
                      />
                      <input 
                        type="text" 
                        className="input flex-1" 
                        placeholder="خيارات (A4, A5) اختياري" 
                        value={spec.optionsInput || ''}
                        onChange={(e) => handleSpecOptionsChange(index, e.target.value)}
                        title="أدخل الخيارات مفصولة بفاصلة" 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline text-danger border-danger px-2"
                        onClick={() => handleRemoveSpecField(index)}
                        title="حذف"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                
                <button type="button" className="btn btn-outline text-sm py-1 px-3 w-max" onClick={handleAddSpecField}>+ إضافة خاصية</button>
              </div>

              <div className="mt-2 pt-4 border-t border-border flex justify-between items-center">
                {selectedTypeId && (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteType}>حذف النوع</button>
                )}
                <div className="flex gap-2 mr-auto">
                  <button type="button" className="btn btn-outline" onClick={handleClose}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">حفظ</button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
