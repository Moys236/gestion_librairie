'use client';

import { useEffect, useState } from 'react';

export default function Topbar() {
  const [title, setTitle] = useState("ابن رشد - إدارة المكتبة");

  useEffect(() => {
    const handleTitleChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setTitle(customEvent.detail);
      }
    };
    
    document.addEventListener('set-page-title', handleTitleChange);
    return () => {
      document.removeEventListener('set-page-title', handleTitleChange);
    };
  }, []);

  return (
    <header className="topbar flex justify-between items-center mb-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="user-info">المدير</div>
    </header>
  );
}
