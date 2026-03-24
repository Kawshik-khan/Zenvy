'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchInput({ placeholder, className }: { placeholder?: string, className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // Debounce or immediate transition
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (val.trim()) {
        params.set('q', val);
      } else {
        params.delete('q');
      }
      
      // We use replace to not fill up history, and preserve scroll position
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <input 
      type="text" 
      value={query}
      onChange={handleSearch}
      placeholder={placeholder || 'Search...'}
      className={className || "w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all outline-none"}
    />
  );
}
