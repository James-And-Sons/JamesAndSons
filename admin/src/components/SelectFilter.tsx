'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

function SelectFilterInner({
  paramName,
  options,
  placeholder = 'All'
}: {
  paramName: string;
  options: FilterOption[];
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramName) || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) {
      params.set(paramName, val);
    } else {
      params.delete(paramName);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <select 
      value={currentValue}
      onChange={handleChange}
      className="px-5 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-[0.1em] focus:outline-none focus:border-accent transition-colors cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function SelectFilter(props: {
  paramName: string;
  options: FilterOption[];
  placeholder?: string;
}) {
  return (
    <Suspense fallback={
      <select disabled className="px-5 py-2.5 border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-[0.1em] focus:outline-none focus:border-accent transition-colors opacity-50">
        <option>{props.placeholder || 'Loading...'}</option>
      </select>
    }>
      <SelectFilterInner {...props} />
    </Suspense>
  );
}
