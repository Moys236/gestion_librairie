import db from '@/lib/db';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';

export const dynamic = 'force-dynamic';

interface LowStockProduct {
  id: number;
  name: string;
  reference: string | null;
  stock: number;
  type_name: string | null;
  category_name: string | null;
}

export default async function DashboardPage() {
  // Product Statistics
  const totalProducts = (db.prepare(`
    SELECT COUNT(*) as count
    FROM products
  `).get() as { count: number }).count;

  const totalCategories = (db.prepare(`
    SELECT COUNT(*) as count
    FROM categories
  `).get() as { count: number }).count;

  const totalTypes = (db.prepare(`
    SELECT COUNT(*) as count
    FROM types
  `).get() as { count: number }).count;

  const totalStock = (db.prepare(`
    SELECT COALESCE(SUM(stock), 0) as total
    FROM products
  `).get() as { total: number }).total;

  const stockValueSelling = (db.prepare(`
    SELECT COALESCE(SUM(selling_price * stock), 0) as total
    FROM products
  `).get() as { total: number }).total;

  const stockValuePurchase = (db.prepare(`
    SELECT COALESCE(SUM(purchase_price * stock), 0) as total
    FROM products
  `).get() as { total: number }).total;

  const outOfStock = (db.prepare(`
    SELECT COUNT(*) as count
    FROM products
    WHERE stock = 0
  `).get() as { count: number }).count;

  const lowStock = (db.prepare(`
    SELECT COUNT(*) as count
    FROM products
    WHERE stock > 0 AND stock <= 10
  `).get() as { count: number }).count;

  const lowStockProducts = db.prepare(`
    SELECT p.id, p.name, p.reference, p.stock, t.name as type_name, c.name as category_name
    FROM products p
    LEFT JOIN types t ON p.type_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE p.stock <= 10
    ORDER BY p.stock ASC
    LIMIT 5
  `).all() as LowStockProduct[];

  return (
    <>
      <PageTitle title="الرئيسية - إحصائيات المنتجات" />
      
      {/* Dynamic Product Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card flex-col gap-2">
          <h3 className="text-light text-sm">إجمالي الأصناف والأنواع</h3>
          <p className="text-2xl font-bold">{totalProducts} منتج</p>
          <div className="text-xs text-light flex gap-2">
            <span>الفئات: <strong>{totalCategories}</strong></span>
            <span>•</span>
            <span>الأنواع: <strong>{totalTypes}</strong></span>
          </div>
        </div>
        
        <div className="card flex-col gap-2">
          <h3 className="text-light text-sm">إجمالي قطع المخزون</h3>
          <p className="text-2xl font-bold">{totalStock} قطعة</p>
          <div className="text-xs flex gap-2">
            <span className="text-danger font-semibold">نفذت: {outOfStock}</span>
            <span className="text-light">•</span>
            <span className="text-warning font-semibold">منخفضة: {lowStock}</span>
          </div>
        </div>

        <div className="card flex-col gap-2">
          <h3 className="text-light text-sm">القيمة المالية للمخزون</h3>
          <p className="text-2xl font-bold text-brand">{stockValueSelling.toLocaleString('fr-FR')} درهم</p>
          <span className="text-xs text-light">تكلفة الشراء الإجمالية: {stockValuePurchase.toLocaleString('fr-FR')} درهم</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Stock Health Summary Card */}
        <div className="card flex-col gap-3 col-span-2" style={{ gridColumn: 'span 2' }}>
          <h3 className="font-bold text-base mb-1 text-navy">حالة توفر المخزون</h3>
          <div className="flex gap-4 w-full">
            <div className="badge badge-danger p-4 flex-1 flex items-center justify-between rounded-md">
              <span className="text-sm font-semibold">منتجات نفذت (مخزون 0):</span>
              <span className="font-bold text-xl">{outOfStock}</span>
            </div>
            <div className="badge badge-warning p-4 flex-1 flex items-center justify-between rounded-md">
              <span className="text-sm font-semibold">منتجات منخفضة المخزون (1 إلى 10):</span>
              <span className="font-bold text-xl">{lowStock}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card flex-col gap-3">
          <h3 className="font-bold text-base mb-1 text-navy">إجراءات المنتجات السريعة</h3>
          <div className="flex flex-col gap-2 w-full">
            <Link href="/products/new" className="btn btn-primary w-full text-center">+ إضافة منتج جديد</Link>
            <Link href="/products" className="btn btn-outline w-full text-center">إدارة جميع المنتجات</Link>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 ? (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-navy m-0">تنبيهات شراء المخزون (نفذت أو توشك على النفاد)</h3>
            <span className="badge badge-danger">تنبيه مخزون</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المرجع</th>
                  <th>اسم المنتج</th>
                  <th>النوع والفئة</th>
                  <th>المخزون المتبقي</th>
                  <th>حالة التوفر</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.reference || '-'}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.type_name ? `${p.category_name} ← ${p.type_name}` : '-'}</td>
                    <td className={`font-bold text-base ${p.stock === 0 ? 'text-danger' : 'text-warning'}`}>{p.stock} قطعة</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {p.stock === 0 ? 'غير متوفر' : 'منخفض جداً'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/products/${p.id}`} className="btn btn-outline text-xs py-1 px-3">تعديل المخزون</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-light">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="48" height="48" className="mx-auto text-brand opacity-40 mb-3" style={{ display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-navy">جميع المنتجات متوفرة بمخزون جيد!</p>
          <p className="text-xs text-light mt-1">لا توجد تنبيهات للمخزون المنخفض حالياً.</p>
        </div>
      )}
    </>
  );
}
