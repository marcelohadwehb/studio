'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction, TemporaryBudget, TemporaryBudgets, TemporaryCategories } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';


interface TemporaryBudgetsProps {
  appId: string;
  formatCurrency: (amount: number) => string;
  currentDate: Date;
  transactions: Transaction[];
  tempBudgets: TemporaryBudgets;
  tempCategories: TemporaryCategories;
}

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear + i);


export function TemporaryBudgets({ appId, formatCurrency, currentDate, transactions, tempBudgets, tempCategories }: TemporaryBudgetsProps) {
  const [localBudgets, setLocalBudgets] = useState<TemporaryBudgets>({});
  const { toast } = useToast();

  useEffect(() => {
    const sanitized: TemporaryBudgets = {};
    for (const subcat in tempBudgets) {
        const budget = tempBudgets[subcat];
        if (budget) {
            sanitized[subcat] = {
                ...budget,
                amount: (typeof budget.amount === 'number' && !isNaN(budget.amount)) ? budget.amount : 0,
            };
        }
    }
    setLocalBudgets(sanitized);
  }, [tempBudgets]);

  const expensesBySubcategory = useMemo(() => {
    const relevantSubcategories = new Set(Object.values(tempCategories).flat());
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory && relevantSubcategories.has(t.subcategory))
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions, tempCategories]);
  
  const getActiveBudgetForCurrentDate = (subcategory: string): TemporaryBudget | null => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const budget = localBudgets[subcategory];

    if (!budget || !budget.from || !budget.to) return null;

    const currentMonthDate = new Date(year, month, 1);
    const fromDate = new Date(budget.from.year, budget.from.month, 1);
    const toDate = new Date(budget.to.year, budget.to.month + 1, 0); // End of the 'to' month
    
    if (currentMonthDate >= fromDate && currentMonthDate <= toDate) {
        return budget;
    }
    
    return null;
  };
  
 const handleBudgetChange = (subcategory: string, field: 'amount' | 'from' | 'to', value: any) => {
    setLocalBudgets(prev => {
        const newLocalBudgets = { ...prev };
        
        // Ensure the subcategory exists in localBudgets, if not, initialize it.
        if (!newLocalBudgets[subcategory]) {
            const today = new Date();
            newLocalBudgets[subcategory] = {
                amount: 0,
                from: { month: today.getMonth(), year: today.getFullYear() },
                to: { month: today.getMonth(), year: today.getFullYear() },
            };
        }
        
        const budget = { ...newLocalBudgets[subcategory] };

        if (field === 'amount') {
            const numValue = parseFormattedNumber(value);
            budget.amount = isNaN(numValue) ? 0 : numValue;
        } else if (field === 'from' || field === 'to') {
            budget[field] = value;
        }

        newLocalBudgets[subcategory] = budget;

        // Perform date validation only if both from and to dates are fully defined.
        if (budget.from && budget.to && typeof budget.from.year === 'number' && typeof budget.from.month === 'number' && typeof budget.to.year === 'number' && typeof budget.to.month === 'number') {
          const fromDate = new Date(budget.from.year, budget.from.month, 1);
          const toDate = new Date(budget.to.year, budget.to.month, 1);

          if (fromDate > toDate) {
              toast({ variant: 'destructive', title: 'Error de Fechas', description: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
          }
        }

        return newLocalBudgets;
    });
};

  const handleSaveBudgets = async () => {
    try {
        const budgetsRef = doc(db, "artifacts", appId, "public", "data", "temp_budgets", "temp_budgets");
        await setDoc(budgetsRef, localBudgets);
        toast({ title: `Presupuestos temporales guardados.` });
    } catch (error) {
        console.error("Error saving temporary budgets:", error);
        toast({ variant: 'destructive', title: 'Error al guardar.' });
    }
  };

  return (
    <>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-4">
        {Object.keys(tempCategories).sort((a,b) => a.localeCompare(b)).map(cat => {
          const sortedSubcategories = [...tempCategories[cat]].sort((a,b) => a.localeCompare(b));
          
          const categoryBudget = sortedSubcategories.reduce((sum, subcat) => {
            const activeBudget = getActiveBudgetForCurrentDate(subcat);
            return sum + (activeBudget?.amount || 0);
          }, 0);
          
          const categorySpent = sortedSubcategories.reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
          const categoryDifference = categoryBudget - categorySpent;
          const differenceColor = categoryDifference >= 0 ? 'text-green-600' : 'text-red-600';

          return (
            <Card key={cat}>
              <CardHeader className="p-4">
                 <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{cat}</CardTitle>
                   <span className="text-sm font-semibold text-muted-foreground">Total: {formatCurrency(categoryBudget)}</span>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
                  <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                  <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                  <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_auto] gap-x-4 items-center text-xs text-muted-foreground mb-2 px-2">
                  <div className="font-medium">Subcategoría</div>
                  <div className="text-right font-medium">Gastado</div>
                  <div className="text-right font-medium">Presupuesto</div>
                  <div className="text-right font-medium">Diferencial</div>
                </div>
                <div className="space-y-4 sm:space-y-2">
                  {sortedSubcategories.map(subcat => {
                    const budget = localBudgets[subcat];
                    const activeBudget = getActiveBudgetForCurrentDate(subcat);
                    const spent = expensesBySubcategory[subcat] || 0;
                    const budgetAmount = activeBudget?.amount || 0;
                    const diff = budgetAmount - spent;
                    const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
                    
                    const fromMonth = budget?.from?.month ?? currentDate.getMonth();
                    const fromYear = budget?.from?.year ?? currentDate.getFullYear();
                    const toMonth = budget?.to?.month ?? currentDate.getMonth();
                    const toYear = budget?.to?.year ?? currentDate.getFullYear();
                    
                    return (
                      <div key={subcat} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_auto] gap-x-4 gap-y-2 items-center text-sm px-2 py-2 rounded-md hover:bg-muted/50 border sm:border-none">
                        <label htmlFor={`budget-${subcat}`} className="font-semibold sm:font-normal">{subcat}</label>
                        <div className="text-right flex justify-between sm:block"><span className="sm:hidden text-muted-foreground">Gastado:</span> {formatCurrency(spent)}</div>
                        <div className="text-right flex justify-between sm:block"><span className="sm:hidden text-muted-foreground">Presupuesto:</span> {formatCurrency(budgetAmount)}</div>
                        <div className={`text-right font-medium flex justify-between sm:block ${diffColor}`}><span className="sm:hidden text-muted-foreground">Diferencial:</span> {formatCurrency(diff)}</div>
                        
                        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-muted/50 mt-2 sm:mt-0">
                            <span className="font-semibold text-xs">Monto:</span>
                            <Input 
                                value={formatNumber(budget?.amount || 0)}
                                onChange={(e) => handleBudgetChange(subcat, 'amount', e.target.value)}
                                className="h-8 w-24 text-right text-xs"
                            />
                            <span className="font-semibold text-xs">Desde:</span>
                            <Select 
                            value={`${fromMonth}`}
                            onValueChange={(m) => handleBudgetChange(subcat, 'from', { month: parseInt(m), year: fromYear })}>
                            <SelectTrigger className="h-8 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {months.map((m, i) => <SelectItem key={m} value={`${i}`}>{m}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <Select
                            value={`${fromYear}`}
                            onValueChange={(y) => handleBudgetChange(subcat, 'from', { month: fromMonth, year: parseInt(y) })}>
                            <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={`${y}`}>{y}</SelectItem>)}
                            </SelectContent>
                            </Select>

                            <span className="font-semibold text-xs">Hasta:</span>
                            <Select 
                            value={`${toMonth}`}
                            onValueChange={(m) => handleBudgetChange(subcat, 'to', { month: parseInt(m), year: toYear })}>
                            <SelectTrigger className="h-8 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {months.map((m, i) => <SelectItem key={m} value={`${i}`}>{m}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <Select
                            value={`${toYear}`}
                            onValueChange={(y) => handleBudgetChange(subcat, 'to', { month: toMonth, year: parseInt(y) })}>
                            <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={`${y}`}>{y}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveBudgets}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </>
  );
}
