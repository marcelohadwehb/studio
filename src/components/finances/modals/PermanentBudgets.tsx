'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Lock, Unlock } from 'lucide-react';
import type { Categories, Budgets, Transaction } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { PinPromptModal } from './PinPromptModal';

interface PermanentBudgetsProps {
  categories: Categories;
  budgets: Budgets;
  transactions: Transaction[];
  appId: string;
  formatCurrency: (amount: number) => string;
  currentDate: Date;
}

export function PermanentBudgets({ categories, budgets, transactions, appId, formatCurrency, currentDate }: PermanentBudgetsProps) {
  const [localBudgets, setLocalBudgets] = useState<Budgets>({});
  const [isPinPromptOpen, setPinPromptOpen] = useState(false);
  const [pastDateLock, setPastDateLock] = useState(true);

  const { toast } = useToast();

  const isPastMonth = useMemo(() => {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentDate < startOfCurrentMonth;
  }, [currentDate]);

  useEffect(() => {
    setPastDateLock(isPastMonth); // Lock by default if past month
    const sanitizedBudgets: Budgets = {};
    for (const key in budgets) {
      const value = budgets[key];
      sanitizedBudgets[key] = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    }
    setLocalBudgets(sanitizedBudgets);
  }, [budgets, isPastMonth]);

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
    const numericAmount = isNaN(amount) ? 0 : amount;

    setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: numericAmount,
    }));
  };

  const saveBudget = async (subcategory: string, amount: number) => {
    try {
        const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
        await setDoc(budgetsRef, { [subcategory]: amount }, { merge: true });
        toast({ title: 'Presupuesto guardado.' });
    } catch (error) {
        console.error("Error saving budget:", error);
        toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  const handleSaveSubcategoryBudget = (subcategory: string) => {
    const amount = localBudgets[subcategory] || 0;
    saveBudget(subcategory, amount);
  };
  
  const handleSaveBudgets = async () => {
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
      await setDoc(budgetsRef, localBudgets, { merge: true });
      toast({ title: 'Presupuestos guardados.' });
    } catch (error) {
      console.error("Error saving budgets:", error);
      toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  const handlePinSuccess = () => {
    setPastDateLock(false);
    setPinPromptOpen(false);
  };

  return (
    <>
      <div className="flex-row items-center justify-between mb-4">
        {isPastMonth && (
           <Button
              variant="ghost"
              size="sm"
              onClick={() => pastDateLock ? setPinPromptOpen(true) : setPastDateLock(true)}
              className="text-muted-foreground"
            >
              {pastDateLock ? <Lock className="h-5 w-5 mr-2" /> : <Unlock className="h-5 w-5 mr-2 text-primary" />}
              {pastDateLock ? 'Desbloquear Edición' : 'Bloquear Edición'}
            </Button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-4">
        {Object.keys(categories).sort((a,b) => a.localeCompare(b)).map(cat => {
          const sortedSubcategories = [...categories[cat]].sort((a,b) => a.localeCompare(b));
          
          const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + (localBudgets[subcat] || 0), 0);
          const categorySpent = sortedSubcategories.reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
          const categoryDifference = categoryBudget - categorySpent;
          const differenceColor = categoryDifference >= 0 ? 'text-green-600' : 'text-red-600';

          return (
            <Card key={cat}>
              <CardHeader className="p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <CardTitle className="text-lg mb-2 sm:mb-0">{cat}</CardTitle>
                  <span className="text-sm font-semibold text-muted-foreground">Total: {formatCurrency(categoryBudget)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
                  <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                  <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                  <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_40px] gap-x-4 items-center text-xs text-muted-foreground mb-2 px-2">
                  <div className="font-medium">Subcategoría</div>
                  <div className="text-right font-medium">Gastado</div>
                  <div className="text-right font-medium">Presupuesto</div>
                  <div className="text-right font-medium">Diferencial</div>
                  <div></div>
                </div>
                <div className="space-y-3 sm:space-y-2">
                  {sortedSubcategories.map(subcat => {
                    const subcatBudget = localBudgets[subcat] || 0;
                    const subcatSpent = expensesBySubcategory[subcat] || 0;
                    const subcatDiff = subcatBudget - subcatSpent;
                    const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';
                    
                    return (
                      <div key={subcat} className="text-sm px-2 py-2 sm:py-1 rounded-md hover:bg-muted/50 border-b sm:border-none">
                        <div className="grid grid-cols-2 sm:grid-cols-[1fr_100px_100px_100px_40px] sm:gap-x-4 items-center">
                          <label htmlFor={`budget-${subcat}`} className="font-semibold sm:font-normal col-span-2 sm:col-span-1">{subcat}</label>
                          <div className="text-right flex justify-between items-center sm:block mt-2 sm:mt-0">
                              <span className='sm:hidden text-muted-foreground'>Gastado:</span>
                              <span>{formatCurrency(subcatSpent)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 sm:mt-0">
                            <span className='sm:hidden text-muted-foreground'>Presupuesto:</span>
                            <Input
                              id={`budget-${subcat}`}
                              value={formatNumber(localBudgets[subcat])}
                              onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                              className="h-8 text-right w-24"
                              placeholder="0"
                              readOnly={isPastMonth && pastDateLock}
                            />
                          </div>
                          <div className={`text-right font-medium flex justify-between items-center sm:block mt-2 sm:mt-0 ${subcatDiffColor}`}>
                              <span className='sm:hidden text-muted-foreground'>Diferencial:</span>
                              <span>{formatCurrency(subcatDiff)}</span>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleSaveSubcategoryBudget(subcat)}
                              disabled={isPastMonth && pastDateLock}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
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
      <div className="flex justify-end">
          <Button type="button" onClick={handleSaveBudgets} disabled={isPastMonth && pastDateLock}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
          </Button>
      </div>

      <PinPromptModal 
        isOpen={isPinPromptOpen}
        onClose={(success) => {
          if (success) {
            handlePinSuccess();
          } else {
            setPinPromptOpen(false);
          }
        }}
      />
    </>
  );
}
