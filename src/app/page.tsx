import { FinancesDashboard } from '@/components/finances/FinancesDashboard';

export default function Home() {
  return (
    <main className="flex items-start justify-center min-h-screen p-4 sm:p-6 md:p-8">
      <FinancesDashboard />
    </main>
  );
}
