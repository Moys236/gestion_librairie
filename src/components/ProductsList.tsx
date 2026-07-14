'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

declare let XLSX: any;

interface Product {
  id: number;
  type_id: number | null;
  name: string;
  reference: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_available: number;
  specifications: string;
  type_name: string | null;
  category_name: string | null;
}

interface CategoryGroup {
  id: number;
  name: string;
  types: { id: number; name: string }[];
}

interface ProductsListProps {
  initialProducts: Product[];
  categoriesWithTypes: CategoryGroup[];
}

export default function ProductsList({ initialProducts, categoriesWithTypes }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSortDir = () => {
    setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const cleanTerm = searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(cleanTerm) || 
        (p.reference && p.reference.toLowerCase().includes(cleanTerm))
      );
    }

    // Filter by type
    if (typeFilter !== '') {
      if (typeFilter === 'none') {
        result = result.filter(p => p.type_id === null);
      } else {
        result = result.filter(p => p.type_id?.toString() === typeFilter);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'price') {
        comparison = a.selling_price - b.selling_price;
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, typeFilter, sortBy, sortDir]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const data: string[][] = [
      ['المرجع', 'اسم المنتج', 'الفئة والنوع', 'سعر الشراء', 'سعر البيع', 'المخزون']
    ];

    filteredAndSortedProducts.forEach(p => {
      const catType = p.type_name ? `${p.category_name} ← ${p.type_name}` : '-';
      data.push([
        p.reference || '',
        p.name,
        catType,
        `${p.purchase_price} درهم`,
        `${p.selling_price} درهم`,
        p.stock.toString()
      ]);
    });

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');
      XLSX.writeFile(wb, 'المنتجات.xlsx');
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
      link.setAttribute('download', 'المنتجات.csv');
      link.click();
    }
  };

  // Excel Import Trigger
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Excel Import Handler
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
          body: JSON.stringify({ products: importedProducts })
        });

        const result = await response.json() as any;
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

  const openTypeManager = () => {
    if ((window as any).openTypeManager) {
      (window as any).openTypeManager();
    }
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="lazyOnload" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="h2">إدارة المنتجات</h2>
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
          <button type="button" className="btn btn-outline" onClick={openTypeManager}>إدارة الفئات والأنواع</button>
          <Link href="/products/new" className="btn btn-primary">+ منتج جديد</Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="بحث بالاسم أو المرجع..." 
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
        <div className="flex gap-2 w-48">
          <select 
            className="input flex-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">الاسم</option>
            <option value="price">السعر</option>
            <option value="stock">المخزون</option>
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

      <div className="table-container">
        <table id="productsTable">
          <thead>
            <tr>
              <th>المرجع</th>
              <th>اسم المنتج</th>
              <th>الفئة والنوع</th>
              <th>سعر الشراء</th>
              <th>سعر البيع</th>
              <th>المخزون</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.map(product => (
              <tr key={product.id} className="product-row">
                <td className="font-semibold">{product.reference || '-'}</td>
                <td>{product.name}</td>
                <td>{product.type_name ? `${product.category_name} ← ${product.type_name}` : '-'}</td>
                <td>{product.purchase_price} درهم</td>
                <td className="text-brand font-bold">{product.selling_price} درهم</td>
                <td>
                  <span className={`badge ${product.stock > 10 ? 'badge-success' : 'badge-danger'}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <Link href={`/products/${product.id}`} className="btn btn-outline text-sm py-1 px-2">
                    تفاصيل
                  </Link>
                </td>
              </tr>
            ))}
            {filteredAndSortedProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 text-light">لا توجد منتجات تطابق البحث.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
