'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  total_debt: number;
}

interface ClientsListProps {
  initialClients: Client[];
}

export default function ClientsList({ initialClients }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'debt'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSortDir = () => {
    setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = [...initialClients];

    // Filter
    if (searchTerm.trim() !== '') {
      const cleanTerm = searchTerm.toLowerCase().trim();
      result = result.filter(client => 
        client.name.toLowerCase().includes(cleanTerm) || 
        (client.phone && client.phone.toLowerCase().includes(cleanTerm))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'date') {
        comparison = a.id - b.id; // larger id means more recently added
      } else if (sortBy === 'debt') {
        comparison = a.total_debt - b.total_debt;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialClients, searchTerm, sortBy, sortDir]);

  return (
    <>
      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="بحث بالاسم أو الهاتف..." 
          className="input w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 w-full sm:w-48">
          <select 
            className="input flex-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="date">تاريخ الإضافة</option>
            <option value="name">الاسم</option>
            <option value="debt">الدين</option>
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
        <table>
          <thead>
            <tr>
              <th>الاسم / الشركة</th>
              <th>الهاتف</th>
              <th>العنوان</th>
              <th>إجمالي الدين</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClients.map(client => (
              <tr key={client.id} className="client-row">
                <td className="font-semibold">{client.name}</td>
                <td>{client.phone || '-'}</td>
                <td>{client.address || '-'}</td>
                <td className={`font-bold ${client.total_debt > 0 ? 'text-brand' : 'text-light'}`}>
                  {client.total_debt} درهم
                </td>
                <td>
                  <Link href={`/clients/${client.id}`} className="btn btn-outline text-sm py-1 px-2">
                    التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
            {filteredAndSortedClients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-6 text-light">لا يوجد زبائن يطابقون البحث.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
