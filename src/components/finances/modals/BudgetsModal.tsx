'use client';

import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

import type { Transaction, Categories, Budgets, BudgetEntry } from '@/lib/types';
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

export function BudgetsModal({ isOpen, onClose, categories, budgets, transactions, appId, formatCurrency, currentDate }: BudgetsModalProps) {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
  const { toast } = useToast();
  const yearMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  
  useEffect(() => {
    setLocalBudgets(budgets);
  }, [budgets]);

  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);
  
  const getSubcategoryBudget = (subcat: string, yearMonth: string): number => {
    const budgetEntry = localBudgets[subcat];
    if (!budgetEntry) return 0;
    return budgetEntry.temporary?.[yearMonth] ?? budgetEntry.permanent ?? 0;
  };
  
  const handleBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    setLocalBudgets(prev => ({ 
        ...prev, 
        [subcategory]: {
            ...prev[subcategory],
            permanent: amount,
            temporary: prev[subcategory]?.temporary || {}
        } 
    }));
  };

  const handleTempBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    setLocalBudgets(prev => {
        const newBudgets = { ...prev };
        if (!newBudgets[subcategory]) {
            newBudgets[subcategory] = { permanent: 0, temporary: {} };
        }
        if (!newBudgets[subcategory].temporary) {
            newBudgets[subcategory].temporary = {};
        }
        newBudgets[subcategory].temporary[yearMonthKey] = amount;
        return newBudgets;
    });
  };

  const handleClearTempBudget = async (subcategory: string) => {
    const newBudgets = { ...localBudgets };
    if (newBudgets[subcategory]?.temporary?.[yearMonthKey]) {
        delete newBudgets[subcategory].temporary[yearMonthKey];
        setLocalBudgets(newBudgets);
        await saveBudgetEntry(subcategory, newBudgets[subcategory]);
        toast({ title: 'Presupuesto temporal eliminado' });
    }
  };

  const saveBudgetEntry = async (subcategory: string, budgetEntry: BudgetEntry) => {
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
      await setDoc(budgetsRef, { [subcategory]: budgetEntry }, { merge: true });
      toast({ title: `Presupuesto para "${subcategory}" guardado` });
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
            const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + getSubcategoryBudget(subcat, yearMonthKey), 0);
            const categorySpent = sortedSubcategories.reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
            const categoryDifference = categoryBudget - categorySpent;
            const differenceColor = categoryDifference >= 0 ? 'text-green-600' : 'text-red-600';

            return (
              <Card key={cat}>
                <CardHeader className="flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg">{cat}</CardTitle>
                   <span className="text-sm font-semibold text-muted-foreground">Presupuesto Mes: {formatCurrency(categoryBudget)}</span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
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
                    <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-4 px-2 pb-2 text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-1">Subcategoría</div>
                      <div className="col-span-1 text-right">Gastado</div>
                      <div className="col-span-1 text-right">Presupuesto</div>
                      <div />
                    </div>
                    {sortedSubcategories.map(subcat => {
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatBudgetEntry = localBudgets[subcat] || { permanent: 0, temporary: {} };
                      const subcatPermBudget = subcatBudgetEntry.permanent || 0;
                      const subcatTempBudget = subcatBudgetEntry.temporary?.[yearMonthKey];
                      const subcatBudget = subcatTempBudget ?? subcatPermBudget;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';

                      return (
                        <div key={subcat} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-4 items-center text-sm">
                          <label htmlFor={`budget-${subcat}`} className="col-span-1 truncate">{subcat}</label>
                          <div className="col-span-1 text-right text-muted-foreground">{formatCurrency(subcatSpent)}</div>
                          
                          <div className="col-span-1 flex items-center gap-1 relative">
                            <Input
                              id={`budget-${subcat}`}
                              value={formatNumber(subcatBudget)}
                              onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                              className="h-8 text-right w-full bg-background pr-8"
                              placeholder="0"
                              title={subcatTempBudget !== undefined ? `Temporal: ${formatCurrency(subcatTempBudget)} | Permanente: ${formatCurrency(subcatPermBudget)}` : `Permanente: ${formatCurrency(subcatPermBudget)}`}
                            />
                             {subcatTempBudget !== undefined && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" title="Presupuesto temporal activo"/>}
                             <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 absolute right-0">
                                    <CalendarIcon className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-60">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Presupuesto Temporal</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Para {currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`temp-budget-${subcat}`}>Monto</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id={`temp-budget-${subcat}`}
                                                    value={formatNumber(subcatTempBudget ?? 0)}
                                                    onChange={(e) => handleTempBudgetChange(subcat, e.target.value)}
                                                    className="h-8"
                                                />
                                                {subcatTempBudget !== undefined && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClearTempBudget(subcat)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                          </div>
                           
                           <div className="flex items-center gap-1">
                             <span className={`font-medium w-20 text-right ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</span>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveBudgetEntry(subcat, localBudgets[subcat])}>
                                <Save className="h-4 w-4" />
                             </Button>
                           </div>
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
