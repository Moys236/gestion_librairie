import db from '@/lib/db';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';
import ClientsList from '@/components/ClientsList';

export const dynamic = 'force-dynamic';

interface Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  total_debt: number;
}

export default async function ClientsPage() {
  const clients = db.prepare(`
    SELECT * FROM clients ORDER BY name ASC
  `).all() as Client[];

  return (
    <>
      <PageTitle title="الزبائن" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="h2">دليل الزبائن</h2>
        <Link href="/clients/new" className="btn btn-primary">+ زبون جديد</Link>
      </div>

      <ClientsList initialClients={clients} />
    </>
  );
}
