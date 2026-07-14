'use client';

import { useState } from 'react';
import BackButton from '@/components/BackButton';
import PageTitle from '@/components/PageTitle';
import { createClient } from '@/app/actions';

export default function NewClientPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    const res = await createClient({ name, phone, address });
    if (res && !res.success) {
      setError(res.error || 'حدث خطأ ما');
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="زبون جديد" />
      
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackHref="/clients" />
        <h2 className="h2 mb-0">إضافة زبون</h2>
      </div>

      <div className="card max-w-xl">
        {error && <div className="badge badge-danger p-4 w-full mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">الاسم / الشركة *</label>
            <input type="text" name="name" required className="input" placeholder="الاسم الكامل" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">الهاتف</label>
            <input type="text" name="phone" className="input" placeholder="مثال: 0612345678" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">العنوان</label>
            <textarea name="address" className="input" rows={3} placeholder="العنوان الكامل"></textarea>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ الزبون'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
