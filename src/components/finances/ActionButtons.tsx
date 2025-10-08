'use client';

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onOpenModal: (type: 'income' | 'expense' | 'budgets' | 'categories' | 'records' | 'charts') => void;
}

const actionButtons: { id: 'income' | 'expense' | 'charts' | 'budgets' | 'records' | 'categories'; label: string; style?: React.CSSProperties }[] = [
    { id: 'income', label: 'Ingreso', style: { backgroundColor: 'hsl(var(--button-income))', color: 'hsl(var(--button-income-foreground))' } },
    { id: 'expense', label: 'Gasto', style: { backgroundColor: 'hsl(var(--button-expense))', color: 'hsl(var(--button-expense-foreground))' } },
    { id: 'charts', label: 'Gráficos', style: { backgroundColor: 'hsl(var(--button-chart))', color: 'hsl(var(--button-chart-foreground))' } },
    { id: 'budgets', label: 'Presupuestos', style: { backgroundColor: 'hsl(var(--button-budget))', color: 'hsl(var(--button-budget-foreground))' } },
    { id: 'records', label: 'Registros', style: { backgroundColor: 'hsl(var(--button-records))', color: 'hsl(var(--button-records-foreground))' } },
    { id: 'categories', label: 'Categorías', style: { backgroundColor: 'hsl(var(--button-categories))', color: 'hsl(var(--button-categories-foreground))' } },
];

export function ActionButtons({ onOpenModal }: ActionButtonsProps) {
  return (
    <section className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {actionButtons.map(btn => (
        <Button
          key={btn.id}
          onClick={() => onOpenModal(btn.id)}
          className={`font-semibold py-2 px-3 rounded-full shadow-lg transition-transform duration-200 transform hover:scale-105 text-xs sm:text-sm h-12 sm:h-14 whitespace-normal`}
          style={btn.style}
        >
          {btn.label}
        </Button>
      ))}
    </section>
  );
}
