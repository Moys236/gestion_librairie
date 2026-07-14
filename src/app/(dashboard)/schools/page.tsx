import db from '@/lib/db';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';

export const dynamic = 'force-dynamic';

interface School {
  id: number;
  name: string;
  address: string | null;
  contact: string | null;
  notes: string | null;
  lists_count: number;
}

export default async function SchoolsPage() {
  const schools = db.prepare(`
    SELECT s.*, (SELECT COUNT(*) FROM school_lists WHERE school_id = s.id) as lists_count 
    FROM schools s
    ORDER BY s.name ASC
  `).all() as School[];

  return (
    <>
      <PageTitle title="المدارس واللوائح" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="h2">دليل المدارس واللوائح</h2>
        <Link href="/schools/new" className="btn btn-primary">+ مدرسة جديدة</Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>اسم المدرسة</th>
              <th>العنوان</th>
              <th>جهات الاتصال</th>
              <th>ملاحظات</th>
              <th>عدد اللوائح المرفقة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {schools.map(school => (
              <tr key={school.id}>
                <td className="font-semibold">{school.name}</td>
                <td>{school.address || '-'}</td>
                <td>{school.contact || '-'}</td>
                <td className="text-sm text-light">{school.notes || '-'}</td>
                <td>
                  <span className={`badge ${school.lists_count > 0 ? 'badge-success' : 'badge-warning'}`}>
                    {school.lists_count} لائحة
                  </span>
                </td>
                <td>
                  <Link href={`/schools/${school.id}`} className="btn btn-outline text-sm py-1 px-2">
                    عرض اللوائح
                  </Link>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-6 text-light">لم يتم تسجيل أي مدرسة بعد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
