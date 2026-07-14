import db from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export const runtime = 'edge';

interface SidebarRow {
  cat_id: number;
  cat_name: string;
  type_id: number;
  type_name: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categoriesTree: any[] = [];
  try {
    const rows = await db.prepare(`
      SELECT c.id as cat_id, c.name as cat_name,
             t.id as type_id, t.name as type_name
      FROM categories c
      JOIN types t ON t.category_id = c.id
      JOIN products p ON p.type_id = t.id
      GROUP BY c.id, t.id
      ORDER BY c.name ASC, t.name ASC
    `).all() as SidebarRow[];

    const categoriesMap = new Map<number, { id: number; name: string; types: { id: number; name: string }[] }>();
    rows.forEach(row => {
      if (!categoriesMap.has(row.cat_id)) {
        categoriesMap.set(row.cat_id, {
          id: row.cat_id,
          name: row.cat_name,
          types: []
        });
      }
      categoriesMap.get(row.cat_id)!.types.push({
        id: row.type_id,
        name: row.type_name
      });
    });
    categoriesTree = Array.from(categoriesMap.values());
  } catch (e) {
    console.error("Error fetching categories and types for sidebar:", e);
  }

  return (
    <div className="app-container">
      <Sidebar categoriesTree={categoriesTree} />
      <main className="main-content">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
