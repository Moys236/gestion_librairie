'use client';

import { useState } from 'react';
import { addSchoolList } from '@/app/actions';

interface School {
  id: number;
  name: string;
  address: string | null;
  contact: string | null;
  notes: string | null;
}

interface SchoolList {
  id: number;
  school_id: number;
  level_name: string;
  file_url: string | null;
  uploaded_at: string;
}

interface SchoolDetailsProps {
  school: School;
  lists: SchoolList[];
}

export default function SchoolDetails({ school, lists }: SchoolDetailsProps) {
  const [selectedListUrl, setSelectedListUrl] = useState<string | null>(
    lists.length > 0 ? lists[0].file_url : null
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('school_id', school.id.toString());

    const res = await addSchoolList(formData);
    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
      setLoading(false);
    } else {
      // Reset form and reload
      window.location.reload();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[80vh]">
      {/* Visualisation Fichier (Gauche) */}
      <div className="card flex flex-col h-full overflow-y-scroll">
        <h3 className="h3 mb-4">عرض اللائحة</h3>
        {selectedListUrl ? (
          <div className="flex-1 w-full min-h-[550px] relative border border-border rounded-md overflow-hidden bg-gray-50">
            {selectedListUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={selectedListUrl} className="absolute inset-0 w-full h-full border-0"></iframe>
            ) : (
              <img src={selectedListUrl} className="absolute inset-0 w-full h-full object-contain p-2" alt="لائحة الكتب" />
            )}
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 rounded-md flex items-center justify-center text-light">
            لا توجد لائحة محددة للعرض
          </div>
        )}
      </div>

      {/* Détails et Upload (Droite) */}
      <div className="card flex flex-col h-full overflow-y-auto">
        <div className="border-b border-border pb-4 mb-4">
          <h3 className="h3 mb-1">{school.name}</h3>
          <div className="text-sm text-light space-y-1">
            <p><strong>العنوان:</strong> {school.address || '-'}</p>
            <p><strong>الاتصال:</strong> {school.contact || '-'}</p>
            {school.notes && <p className="text-xs bg-gray-50 p-2 rounded border border-border mt-1">{school.notes}</p>}
          </div>
        </div>

        {/* Upload form */}
        <div className="bg-gray-50 p-4 rounded-md border border-border mb-6">
          <h4 className="font-bold text-sm text-brand mb-3">إرفاق لائحة كتب جديدة</h4>
          {error && <div className="badge badge-danger p-3 w-full mb-3">{error}</div>}
          
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">المستوى الدراسي *</label>
              <input type="text" name="level_name" required className="input text-sm" placeholder="مثال: أولى باك علوم تجريبية" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">الملف (PDF أو صورة) *</label>
              <input type="file" name="file" required accept="image/*,application/pdf" className="input text-sm" />
            </div>
            <button type="submit" className="btn btn-primary text-sm py-2" disabled={loading}>
              {loading ? 'جاري الرفع...' : 'رفع اللائحة'}
            </button>
          </form>
        </div>

        {/* School Lists Table */}
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-3">اللوائح المرفقة بالمؤسسة</h4>
          {lists.length > 0 ? (
            <div className="table-container shadow-none border border-border">
              <table>
                <thead>
                  <tr>
                    <th>المستوى الدراسي</th>
                    <th>تاريخ الرفع</th>
                    <th className="w-20">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map(list => (
                    <tr 
                      key={list.id} 
                      onClick={() => list.file_url && setSelectedListUrl(list.file_url)}
                      className={`cursor-pointer hover:bg-gray-50 ${selectedListUrl === list.file_url ? 'bg-brand-light font-bold text-brand' : ''}`}
                    >
                      <td>{list.level_name}</td>
                      <td className="text-light text-xs">{new Date(list.uploaded_at).toLocaleDateString('ar-MA')}</td>
                      <td>
                        <button type="button" className="btn btn-outline text-xs py-1 px-2">عرض</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-light text-center py-4 text-sm">لم يتم رفع أي لائحة بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}
