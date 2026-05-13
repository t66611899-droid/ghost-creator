'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Niche } from '@/lib/mock-data';

export type NicheFilter = Niche | 'all';

interface ReviewToolbarProps {
  niche: NicheFilter;
  onNicheChange: (niche: NicheFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  counts: { all: number; barber: number; gym: number };
}

export function ReviewToolbar({
  niche,
  onNicheChange,
  query,
  onQueryChange,
  counts,
}: ReviewToolbarProps) {
  const tabs: TabItem<NicheFilter>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'barber', label: 'Barber', count: counts.barber },
    { value: 'gym', label: 'Gym', count: counts.gym },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Tabs items={tabs} value={niche} onChange={onNicheChange} />
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search title, business, or owner"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-blue-400/40 focus:bg-white/[0.06] lg:w-80"
          />
        </div>
        <Button variant="secondary" size="md">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}
