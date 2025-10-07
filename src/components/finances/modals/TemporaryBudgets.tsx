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

    if (!budget) return null;

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
        
        // Ensure the subcategory budget exists before updating
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

        const fromDate = new Date(budget.from.year, budget.from.month, 1);
        const toDate = new Date(budget.to.year, budget.to.month, 1);

        if (fromDate > toDate) {
            toast({ variant: 'destructive', title: 'Error de Fechas', description: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
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
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground pt-2">
                  <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                  <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                  <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                 <div className="space-y-2">
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
                        <div key={subcat} className="p-3 rounded-md border">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold flex-1">{subcat}</h4>
                                <div className="flex gap-4 text-sm">
                                    <span className="font-semibold text-muted-foreground">Gastado: <span className="text-card-foreground">{formatCurrency(spent)}</span></span>
                                    <span className="font-semibold text-muted-foreground">Presupuesto: <span className="text-card-foreground">{formatCurrency(budgetAmount)}</span></span>
                                    <span className="font-semibold text-muted-foreground">Diferencial: <span className={diffColor}>{formatCurrency(diff)}</span></span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                <span className="font-semibold text-sm">Monto:</span>
                                <Input 
                                    value={formatNumber(budget?.amount || 0)}
                                    onChange={(e) => handleBudgetChange(subcat, 'amount', e.target.value)}
                                    className="h-8 w-24 text-right text-sm"
                                />
                                <span className="font-semibold text-sm">Desde:</span>
                                <Select 
                                value={`${fromMonth}`}
                                onValueChange={(m) => handleBudgetChange(subcat, 'from', { month: parseInt(m), year: fromYear })}>
                                <SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue /></SelectTrigger>
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

                                <span className="font-semibold text-sm">Hasta:</span>
                                <Select 
                                value={`${toMonth}`}
                                onValueChange={(m) => handleBudgetChange(subcat, 'to', { month: parseInt(m), year: toYear })}>
                                <SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue /></SelectTrigger>
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
