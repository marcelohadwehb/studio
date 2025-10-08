'use client';

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onOpenModal: (type: 'income' | 'expense' | 'budgets' | 'categories' | 'records' | 'charts') => void;
}

const actionButtons: { id: 'income' | 'expense' | 'charts' | 'budgets' | 'records' | 'categories'; label: string; className?: string; style?: React.CSSProperties }[] = [
    { id: 'income', label: 'Ingreso', style: { backgroundColor: 'hsl(var(--button-income))', color: 'hsl(var(--button-income-foreground))' } },
    { id: 'expense', label: 'Gasto', style: { backgroundColor: 'hsl(var(--button-expense))', color: 'hsl(var(--button-expense-foreground))' } },
    { id: 'charts', label: 'Gráficos', style: { backgroundColor: 'hsl(var(--button-chart))', color: 'hsl(var(--button-chart-foreground))' } },
    { id: 'budgets', label: 'Presupuestos', className: 'bg-gray-300 hover:bg-gray-400 text-gray-800' },
    { id: 'records', label: 'Registros', className: 'bg-gray-300 hover:bg-gray-400 text-gray-800' },
    { id: 'categories', label: 'Categorías', className: 'bg-gray-300 hover:bg-gray-400 text-gray-800' },
];

export function ActionButtons({ onOpenModal }: ActionButtonsProps) {
  return (
    <section className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {actionButtons.map(btn => (
        <Button
          key={btn.id}
          onClick={() => onOpenModal(btn.id)}
          className={`font-semibold py-2 px-3 rounded-full shadow-lg transition-transform duration-200 transform hover:scale-105 text-xs sm:text-sm h-12 sm:h-14 whitespace-normal ${btn.className || ''}`}
          style={btn.style}
        >
          {btn.label}
        </Button>
      ))}
    </section>
  );
}
