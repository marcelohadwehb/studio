'use client';

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onOpenModal: (type: 'income' | 'expense' | 'budgets' | 'categories' | 'records' | 'aiAdvisor') => void;
}

const actionButtons: { id: 'income' | 'expense' | 'budgets' | 'records' | 'categories'; label: string; className: string }[] = [
    { id: 'income', label: 'Ingreso', className: 'bg-green-500 hover:bg-green-600 text-white' },
    { id: 'expense', label: 'Gasto', className: 'bg-red-500 hover:bg-red-600 text-white' },
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
          className={`font-semibold py-2 px-3 rounded-full shadow-lg transition-transform duration-200 transform hover:scale-105 text-xs sm:text-sm h-14 whitespace-normal ${btn.className}`}
        >
          {btn.label}
        </Button>
      ))}
      <Button
          onClick={() => onOpenModal('aiAdvisor')}
          className="font-semibold py-2 px-3 rounded-full shadow-lg transition-transform duration-200 transform hover:scale-105 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center h-14 whitespace-normal"
        >
          Asesor IA
        </Button>
    </section>
  );
}
