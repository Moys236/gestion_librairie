'use client';

import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('set-page-title', { detail: title }));
    document.title = title;
  }, [title]);

  return null;
}
