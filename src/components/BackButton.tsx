'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  fallbackHref: string;
}

export default function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If there is history to go back to, navigate back. Otherwise, go to fallback path.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="btn btn-outline cursor-pointer"
    >
      ← رجوع
    </button>
  );
}
