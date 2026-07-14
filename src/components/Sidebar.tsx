'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarType {
  id: number;
  name: string;
}

interface SidebarCategory {
  id: number;
  name: string;
  types: SidebarType[];
}

interface SidebarProps {
  categoriesTree: SidebarCategory[];
}

export default function Sidebar({ categoriesTree }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const isHomeActive = pathname === '/';
  const isOrdersActive = pathname.startsWith('/orders');
  const isClientsActive = pathname.startsWith('/clients');
  const isProductsActive = pathname.startsWith('/products');
  const isSchoolsActive = pathname.startsWith('/schools');
  const isSupplierRequestsActive = pathname.startsWith('/supplier-requests');

  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Close accordion when Products menu collapses
  useEffect(() => {
    if (!isProductsMenuOpen) {
      setActiveCategoryId(null);
    }
  }, [isProductsMenuOpen]);

  // Highlight active category/type on load
  useEffect(() => {
    if (pathname.startsWith('/products/type/')) {
      const typeIdStr = pathname.split('/').pop();
      if (typeIdStr) {
        const typeId = Number(typeIdStr);
        const activeCat = categoriesTree.find(cat => 
          cat.types.some(t => t.id === typeId)
        );
        if (activeCat) {
          setIsProductsMenuOpen(true);
          setActiveCategoryId(activeCat.id);
        }
      }
    }
  }, [pathname, categoriesTree]);

  const handleProductsClick = (e: React.MouseEvent) => {
    // Mobile tap support: toggle menu visibility on first tap, navigate on second if needed
    if (!isProductsMenuOpen) {
      e.preventDefault();
      setIsProductsMenuOpen(true);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent, catId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveCategoryId(prev => prev === catId ? null : catId);
  };

  return (
    <nav className="sidebar" ref={sidebarRef}>
      <div className="logo">
        <h2>ابن رشد</h2>
      </div>
      <ul className="nav-links">
        <li>
          <Link href="/" className={isHomeActive ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            الرئيسية
          </Link>
        </li>
        <li>
          <Link href="/orders" className={isOrdersActive ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            الطلبات
          </Link>
        </li>
        <li>
          <Link href="/clients" className={isClientsActive ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            الزبائن
          </Link>
        </li>
        <li 
          className="nav-item-with-sub"
          onMouseEnter={() => setIsProductsMenuOpen(true)}
          onMouseLeave={() => setIsProductsMenuOpen(false)}
        >
          <Link href="/products" className={isProductsActive ? 'active' : ''} onClick={handleProductsClick}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            المنتجات
            <span className={`menu-arrow-icon ${isProductsMenuOpen ? 'rotated' : ''}`}>▼</span>
          </Link>
          
          <ul className={`sub-nav-links dropdown-menu-container ${isProductsMenuOpen ? 'open' : ''}`}>
            <li className="sub-nav-header-link">
              <Link href="/products" className="view-all-products-link">
                عرض جميع المنتجات ←
              </Link>
            </li>
            {categoriesTree.length > 0 ? (
              categoriesTree.map(cat => {
                const isCatActive = activeCategoryId === cat.id;
                return (
                  <li key={cat.id} className="category-item-container">
                    <div 
                      className={`sub-nav-category-title-interactive ${isCatActive ? 'active' : ''}`}
                      onClick={(e) => handleCategoryClick(e, cat.id)}
                      role="button"
                      aria-expanded={isCatActive}
                    >
                      <span>{cat.name}</span>
                      <span className={`accordion-arrow ${isCatActive ? 'rotated' : ''}`}>▼</span>
                    </div>
                    
                    <ul className={`sub-nav-types-list-accordion ${isCatActive ? 'open' : ''}`}>
                      {cat.types.map(t => {
                        const isTypeActive = pathname === `/products/type/${t.id}`;
                        return (
                          <li key={t.id}>
                            <Link 
                              href={`/products/type/${t.id}`} 
                              className={isTypeActive ? 'active' : ''}
                              onClick={() => {
                                // Close menu after navigating on mobile/desktop
                                setIsProductsMenuOpen(false);
                              }}
                            >
                              {t.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })
            ) : (
              <li className="text-center p-3 text-xs text-light">لا توجد تصنيفات</li>
            )}
          </ul>
        </li>
        <li>
          <Link href="/supplier-requests" className={isSupplierRequestsActive ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            طلبات الموردين
          </Link>
        </li>
        <li>
          <Link href="/schools" className={isSchoolsActive ? 'active' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
            المدارس واللوائح
          </Link>
        </li>
      </ul>
    </nav>
  );
}
