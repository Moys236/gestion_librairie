'use client';

import { useState } from 'react';
import BackButton from '@/components/BackButton';
import PageTitle from '@/components/PageTitle';
import { createSchool } from '@/app/actions';

export default function NewSchoolPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const contact = formData.get('contact') as string;
    const notes = formData.get('notes') as string;

    const res = await createSchool({ name, address, contact, notes });
    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="مدرسة جديدة" />
      
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/schools" />
        <h2 className="h2 mb-0">إضافة مدرسة جديدة</h2>
      </div>

      <div className="card max-w-xl">
        {error && <div className="badge badge-danger p-4 w-full mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">اسم المؤسسة التعليمية *</label>
            <input type="text" name="name" required className="input" placeholder="مثال: ثانوية ابن رشد" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">العنوان</label>
            <input type="text" name="address" className="input" placeholder="عنوان المدرسة" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">جهات الاتصال (الهاتف، المدير، إلخ)</label>
            <input type="text" name="contact" className="input" placeholder="معلومات الاتصال" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">ملاحظات</label>
            <textarea name="notes" className="input" rows={3} placeholder="أي ملاحظات حول المدرسة..."></textarea>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ المدرسة'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
