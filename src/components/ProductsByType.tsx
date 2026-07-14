'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

declare let XLSX: any;

interface Spec {
  name: string;
  options: string[];
}

interface Product {
  id: number;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string;
  pSpecs: Record<string, string>; // Parsed specifications
}

interface ProductType {
  id: number;
  category_id: number;
  name: string;
  default_specs: string;
  category_name: string;
}

interface ProductsByTypeProps {
  type: ProductType;
  initialProducts: Product[];
  specsList: Spec[];
}

export default function ProductsByType({ type, initialProducts, specsList }: ProductsByTypeProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Spec filters state
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSortDir = () => {
    setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSpecFilterChange = (specName: string, val: string) => {
    setSelectedSpecs(prev => ({ ...prev, [specName]: val }));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm.trim() !== '') {
      const cleanTerm = searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(cleanTerm) || 
        (p.reference && p.reference.toLowerCase().includes(cleanTerm))
      );
    }

    // Spec filters
    Object.keys(selectedSpecs).forEach(specName => {
      const selectedVal = selectedSpecs[specName];
      if (selectedVal !== '') {
        result = result.filter(p => p.pSpecs[specName] === selectedVal);
      }
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy.startsWith('spec_')) {
        const specName = sortBy.replace('spec_', '');
        const valA = a.pSpecs[specName] || '';
        const valB = b.pSpecs[specName] || '';
        comparison = valA.localeCompare(valB, 'ar');
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'price') {
        comparison = a.selling_price - b.selling_price;
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, selectedSpecs, sortBy, sortDir]);

  // Excel export
  const handleExportExcel = () => {
    const header = ['المرجع', 'اسم المنتج', 'سعر البيع', 'المخزون', ...specsList.map(s => s.name)];
    const data: string[][] = [header];

    filteredAndSortedProducts.forEach(p => {
      const row = [
        p.reference || '',
        p.name,
        `${p.selling_price} درهم`,
        p.stock.toString(),
        ...specsList.map(s => p.pSpecs[s.name] || '-')
      ];
      data.push(row);
    });

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, type.name);
      XLSX.writeFile(wb, `${type.name}.xlsx`);
    } else {
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
      link.setAttribute('download', `${type.name}.csv`);
      link.click();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        if (typeof XLSX === 'undefined') {
          alert('عذراً، مكتبة قراءة ملفات إكسل غير متوفرة حالياً.');
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const importedProducts = XLSX.utils.sheet_to_json(worksheet);

        if (importedProducts.length === 0) {
          alert('الملف فارغ أو لا يحتوي على بيانات صحيحة.');
          return;
        }

        setImporting(true);

        const response = await fetch('/api/products/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            products: importedProducts,
            default_type_id: type.id
          })
        });

        const result = await response.json();
        if (result.success) {
          alert(`تم استيراد ${result.imported} منتج بنجاح.`);
          window.location.reload();
        } else {
          alert('فشل الاستيراد: ' + (result.error || 'خطأ غير معروف'));
        }
      } catch (err: any) {
        alert('حدث خطأ أثناء قراءة الملف: ' + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="lazyOnload" />

      <div className="flex items-center gap-4 mb-6 justify-between">
        <div>
          <h2 className="h2 mb-1">{type.name}</h2>
          <p className="text-xs text-light">الفئة الرئيسية: {type.category_name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button" 
            id="importExcelBtn" 
            className="btn btn-outline flex items-center gap-2"
            onClick={handleImportClick}
            disabled={importing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {importing ? 'جاري الاستيراد...' : 'استيراد'}
          </button>
          <input 
            type="file" 
            id="importExcelInput" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleImportFileChange}
          />

          <button 
            type="button" 
            id="exportExcelBtn" 
            className="btn btn-outline flex items-center gap-2"
            onClick={handleExportExcel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            تصدير
          </button>
          <Link href={`/products/new?type=${type.id}`} className="btn btn-primary">+ منتج جديد</Link>
          <Link href="/products" className="btn btn-outline">← عودة للمنتجات</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold mb-1">بحث</label>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو المرجع..." 
            className="input w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {specsList.filter(s => s.options && s.options.length > 0).map(spec => (
          <div key={spec.name}>
            <label className="block text-sm font-semibold mb-1 text-brand">{spec.name}</label>
            <select 
              className="input w-40"
              value={selectedSpecs[spec.name] || ''}
              onChange={(e) => handleSpecFilterChange(spec.name, e.target.value)}
            >
              <option value="">الكل</option>
              {spec.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold mb-1">فرز حسب</label>
          <div className="flex gap-2 w-48">
            <select 
              className="input flex-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <optgroup label="أساسي">
                <option value="name">الاسم</option>
                <option value="price">السعر</option>
                <option value="stock">المخزون</option>
              </optgroup>
              {specsList.length > 0 && (
                <optgroup label="الخصائص (المواصفات)">
                  {specsList.map(spec => (
                    <option key={spec.name} value={`spec_${spec.name}`}>{spec.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button 
              type="button" 
              className="btn btn-outline px-3" 
              onClick={toggleSortDir}
              title="تبديل الترتيب"
            >
              {sortDir === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table id="productsTable">
          <thead>
            <tr>
              <th>المرجع</th>
              <th>اسم المنتج</th>
              <th>سعر البيع</th>
              <th>المخزون</th>
              {specsList.map(spec => (
                <th key={spec.name}>{spec.name}</th>
              ))}
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.map(product => (
              <tr key={product.id} className="product-row">
                <td className="font-semibold">{product.reference || '-'}</td>
                <td>{product.name}</td>
                <td className="text-brand font-bold">{product.selling_price} درهم</td>
                <td>
                  <span className={`badge ${product.stock > 10 ? 'badge-success' : 'badge-danger'}`}>
                    {product.stock}
                  </span>
                </td>
                {specsList.map(spec => (
                  <td key={spec.name}>{product.pSpecs[spec.name] || '-'}</td>
                ))}
                <td>
                  <Link href={`/products/${product.id}`} className="btn btn-outline text-sm py-1 px-2">
                    تفاصيل
                  </Link>
                </td>
              </tr>
            ))}
            {filteredAndSortedProducts.length === 0 && (
              <tr>
                <td colSpan={specsList.length + 5} className="text-center p-6 text-light">لا توجد منتجات في هذا النوع تطابق الفلاتر.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
