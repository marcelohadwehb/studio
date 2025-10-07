'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const FinancesDashboard = dynamic(
  () => import('@/components/finances/FinancesDashboard').then(mod => mod.FinancesDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="flex items-start justify-center min-h-screen p-4 sm:p-6 md:p-8">
      <FinancesDashboard />
    </main>
  );
}
