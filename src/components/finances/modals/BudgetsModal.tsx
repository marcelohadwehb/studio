'use client';

import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

import type { Transaction, Categories, Budgets } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  budgets: Budgets;
  transactions: Transaction[];
  appId: string;
  formatCurrency: (amount: number) => string;
  currentDate: Date;
}

export function BudgetsModal({ isOpen, onClose, categories, budgets, transactions, appId, formatCurrency }: BudgetsModalProps) {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
  const { toast } = useToast();
  
  useEffect(() => {
    // When the modal opens, sync the local state with the props
    if (isOpen) {
      setLocalBudgets(budgets);
    }
  }, [budgets, isOpen]);

  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);
  
  const handleBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: amount,
    }));
  };
  
  const handleSaveBudgets = async () => {
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
      await setDoc(budgetsRef, localBudgets);
      toast({ title: 'Presupuestos guardados.' });
      onClose();
    } catch (error) {
      console.error("Error saving budgets:", error);
      toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Gestión de Presupuestos</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-4">
          {Object.keys(categories).sort((a, b) => a.localeCompare(b)).map(cat => {
            const sortedSubcategories = [...categories[cat]].sort((a, b) => a.localeCompare(b));
            const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + (localBudgets[subcat] || 0), 0);
            const categorySpent = sortedSubcategories.reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
            const categoryDifference = categoryBudget - categorySpent;
            const differenceColor = categoryDifference >= 0 ? 'text-green-600' : 'text-red-600';

            return (
              <Card key={cat}>
                <CardHeader className="flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg">{cat}</CardTitle>
                  <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(categoryBudget)}</span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Gastado: </span>
                        <span className="font-semibold">{formatCurrency(categorySpent)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Diferencial: </span>
                        <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span>
                      </div>
                  </div>
                  <div className="space-y-3">
                    {sortedSubcategories.map(subcat => {
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatBudget = localBudgets[subcat] || 0;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';

                      return (
                        <div key={subcat} className="grid grid-cols-[1fr_100px_100px_100px] gap-4 items-center text-sm">
                          <label htmlFor={`budget-${subcat}`}>{subcat}</label>
                          <Input
                            id={`budget-${subcat}`}
                            value={formatNumber(subcatBudget)}
                            onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                          <div className="text-right text-muted-foreground">{formatCurrency(subcatSpent)}</div>
                          <div className={`text-right font-medium ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSaveBudgets}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
