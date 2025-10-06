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
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
}

export function TransactionList({ transactions, loading, onEdit, onDelete, formatCurrency, filter, setFilter }: TransactionListProps) {
  
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

  const filterButtons: {label: string, value: 'all' | 'income' | 'expense'}[] = [
    { label: 'Todos', value: 'all'},
    { label: 'Ingresos', value: 'income'},
    { label: 'Gastos', value: 'expense'},
  ]

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
        <h2 className="text-lg font-semibold">Transacciones</h2>
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
          {filterButtons.map(({label, value}) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? 'default' : 'ghost'}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 text-xs sm:px-4 sm:text-sm font-medium transition-colors h-8`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay transacciones para este período y filtro.</p>
        ) : (
          sortedTransactions.map(t => (
            <div key={t.id} className={`p-3 sm:p-4 rounded-lg shadow-sm flex items-center justify-between gap-2 ${t.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-gray-800 capitalize truncate text-sm sm:text-base">{t.type === 'income' ? t.description : t.subcategory}</p>
                <p className="text-xs text-gray-500 capitalize">{format(new Date(t.timestamp), "d 'de' MMMM, yyyy", { locale: es })}</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 text-right">
                <span className={`font-bold text-sm sm:text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(t.amount)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:text-blue-700" onClick={() => onEdit(t)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-700" onClick={() => onDelete(t.id)}>
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
