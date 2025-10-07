'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PermanentBudgets } from './PermanentBudgets';
import { TemporaryBudgets } from './TemporaryBudgets';
import { SummaryView } from './SummaryView';

import type { Categories, Budgets, Transaction, TemporaryCategories, TemporaryBudgets } from '@/lib/types';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  budgets: Budgets;
  transactions: Transaction[];
  appId: string;
  formatCurrency: (amount: number) => string;
  currentDate: Date;
  tempBudgets: TemporaryBudgets;
  tempCategories: TemporaryCategories;
}

export function BudgetsModal({ 
  isOpen, 
  onClose, 
  categories, 
  budgets, 
  transactions, 
  appId, 
  formatCurrency, 
  currentDate,
  tempBudgets,
  tempCategories,
}: BudgetsModalProps) {
  const [activeTab, setActiveTab] = useState<'permanent' | 'temporary' | 'summary'>('summary');

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Gestión de Presupuestos</DialogTitle>
             <div className="flex justify-center gap-2 pt-4">
               <Button
                variant={activeTab === 'summary' ? 'default' : 'outline'}
                onClick={() => setActiveTab('summary')}
              >
                Resumen
              </Button>
              <Button
                variant={activeTab === 'permanent' ? 'default' : 'outline'}
                onClick={() => setActiveTab('permanent')}
              >
                Presupuestos Permanentes
              </Button>
              <Button
                variant={activeTab === 'temporary' ? 'default' : 'outline'}
                onClick={() => setActiveTab('temporary')}
              >
                Presupuestos Temporales
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {activeTab === 'summary' && (
              <SummaryView
                categories={categories}
                budgets={budgets}
                tempCategories={tempCategories}
                tempBudgets={tempBudgets}
                transactions={transactions}
                formatCurrency={formatCurrency}
                currentDate={currentDate}
              />
            )}
            {activeTab === 'permanent' && (
              <PermanentBudgets
                categories={categories}
                budgets={budgets}
                transactions={transactions}
                appId={appId}
                formatCurrency={formatCurrency}
                currentDate={currentDate}
              />
            )}
            {activeTab === 'temporary' && (
              <TemporaryBudgets 
                appId={appId}
                formatCurrency={formatCurrency}
                currentDate={currentDate}
                transactions={transactions}
                tempBudgets={tempBudgets}
                tempCategories={tempCategories}
              />
            )}
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
