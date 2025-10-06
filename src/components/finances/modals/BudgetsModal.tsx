'use client';

import { useMemo, useState } from 'react';
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
}

export function BudgetsModal({ isOpen, onClose, categories, budgets, transactions, appId, formatCurrency }: BudgetsModalProps) {
  const [localBudgets, setLocalBudgets] = useState(budgets);
  const { toast } = useToast();

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
    setLocalBudgets(prev => ({ ...prev, [subcategory]: amount }));
  };

  const handleSaveBudget = async (subcategory: string) => {
    const newBudget = localBudgets[subcategory] || 0;
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
      await setDoc(budgetsRef, { [subcategory]: newBudget }, { merge: true });
      toast({ title: 'Presupuesto guardado' });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({ variant: 'destructive', title: 'Error al guardar' });
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
                  <span className="text-sm font-semibold text-muted-foreground">Total: {formatCurrency(categoryBudget)}</span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Presupuesto: </span>
                        <span className="font-semibold">{formatCurrency(categoryBudget)}</span>
                      </div>
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
                    <div className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] gap-4 px-2 pb-2 text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-1">Subcategoría</div>
                      <div className="col-span-1 text-right">Gastado</div>
                      <div className="col-span-1 text-right">Presupuesto</div>
                      <div className="col-span-1 text-right">Diferencial</div>
                      <div />
                    </div>
                    {sortedSubcategories.map(subcat => {
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatBudget = localBudgets[subcat] || 0;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';

                      return (
                        <div key={subcat} className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] gap-4 items-center text-sm">
                          <label htmlFor={`budget-${subcat}`} className="col-span-1 truncate">{subcat}</label>
                          <div className="col-span-1 text-right text-muted-foreground">{formatCurrency(subcatSpent)}</div>
                          <div className="col-span-1">
                            <Input
                              id={`budget-${subcat}`}
                              value={formatNumber(subcatBudget)}
                              onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                              className="h-8 text-right w-full bg-background"
                              placeholder="0"
                            />
                          </div>
                           <div className={`col-span-1 text-right font-medium ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</div>
                           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveBudget(subcat)}>
                              <Save className="h-4 w-4" />
                           </Button>
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
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
