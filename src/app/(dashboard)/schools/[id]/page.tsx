import db from '@/lib/db';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import SchoolDetails from '@/components/SchoolDetails';
import BackButton from '@/components/BackButton';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = Number(id);

  if (isNaN(schoolId)) {
    redirect('/schools');
  }

  // Fetch school details
  const school = await db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId) as School | undefined;

  if (!school) {
    redirect('/schools');
  }

  // Fetch school lists
  const lists = await db.prepare('SELECT * FROM school_lists WHERE school_id = ? ORDER BY id DESC').all(schoolId) as SchoolList[];

  return (
    <>
      <PageTitle title={`مدرسة: ${school.name}`} />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/schools" />
          <h2 className="h2 mb-0">لوائح المدرسة</h2>
        </div>
      </div>

      <SchoolDetails school={school} lists={lists} />
    </>
  );
}
