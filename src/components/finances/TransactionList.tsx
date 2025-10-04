'use client';

import { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export function TransactionList({ transactions, loading, onEdit, onDelete, formatCurrency }: TransactionListProps) {
  
  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Transacciones</h2>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </section>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Transacciones</h2>
      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay transacciones para este mes.</p>
        ) : (
          sortedTransactions.map(t => (
            <div key={t.id} className={`p-4 rounded-lg shadow-sm flex items-center justify-between ${t.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 capitalize">{t.type === 'income' ? t.description : t.subcategory}</p>
                <p className="text-sm text-gray-500 capitalize">{format(new Date(t.date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-right">
                <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(t.amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={() => onEdit(t)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => onDelete(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
