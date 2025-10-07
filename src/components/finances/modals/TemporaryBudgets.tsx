'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
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
    // Sanitize budgets on load
    const sanitized: TemporaryBudgets = {};
    for (const subcat in tempBudgets) {
      sanitized[subcat] = tempBudgets[subcat].map(b => ({
        ...b,
        amount: (typeof b.amount === 'number' && !isNaN(b.amount)) ? b.amount : 0,
      }));
    }
    setLocalBudgets(sanitized);
  }, [tempBudgets]);

  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);

  const getBudgetForCurrentDate = (subcategory: string): TemporaryBudget | null => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const budgets = localBudgets[subcategory];

    if (!budgets) return null;

    for (const budget of budgets) {
      const fromDate = new Date(budget.from.year, budget.from.month, 1);
      const toDate = new Date(budget.to.year, budget.to.month + 1, 0); // End of the month
      if (currentDate >= fromDate && currentDate <= toDate) {
        return budget;
      }
    }
    return null;
  };
  
  const handleAddPeriod = (subcategory: string) => {
    const newPeriod: TemporaryBudget = {
      amount: 0,
      from: { month: currentDate.getMonth(), year: currentDate.getFullYear() },
      to: { month: currentDate.getMonth(), year: currentDate.getFullYear() },
    };
    setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: [...(prev[subcategory] || []), newPeriod],
    }));
  };

  const handleRemovePeriod = (subcategory: string, index: number) => {
    setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: prev[subcategory].filter((_, i) => i !== index),
    }));
  };
  
  const handlePeriodChange = (subcategory: string, index: number, field: 'amount' | 'from' | 'to', value: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setLocalBudgets(prev => {
        const updatedPeriods = [...prev[subcategory]];
        const period = { ...updatedPeriods[index] };
        
        if (field === 'amount') {
            period.amount = isNaN(parseFormattedNumber(value)) ? 0 : parseFormattedNumber(value);
        } else if (field === 'from' || field === 'to') {
            const newDate = new Date(value.year, value.month, 1);
            if (newDate < today) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pueden establecer fechas anteriores al mes actual.' });
                return prev;
            }
            period[field] = value;
        }

        updatedPeriods[index] = period;
        return { ...prev, [subcategory]: updatedPeriods };
    });
  };

  const handleSaveBudgets = async () => {
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "temp_budgets", "temp_budgets");
      await setDoc(budgetsRef, localBudgets);
      toast({ title: 'Presupuestos Temporales guardados.' });
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
          
          return (
            <Card key={cat}>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {sortedSubcategories.map(subcat => {
                    const activeBudget = getBudgetForCurrentDate(subcat);
                    const spent = expensesBySubcategory[subcat] || 0;
                    const budgetAmount = activeBudget?.amount || 0;
                    const diff = budgetAmount - spent;
                    const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';

                    return (
                        <div key={subcat} className="p-3 rounded-md bg-muted/50">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{subcat}</h4>
                                <div className="flex gap-4 text-sm">
                                    <span>Presupuesto: <span className="font-bold">{formatCurrency(budgetAmount)}</span></span>
                                    <span>Gastado: <span className="font-bold">{formatCurrency(spent)}</span></span>
                                    <span>Diferencial: <span className={`font-bold ${diffColor}`}>{formatCurrency(diff)}</span></span>
                                </div>
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              {(localBudgets[subcat] || []).map((period, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                  <span className="font-semibold">Monto:</span>
                                  <Input 
                                      value={formatNumber(period.amount)}
                                      onChange={(e) => handlePeriodChange(subcat, index, 'amount', e.target.value)}
                                      className="h-8 w-28 text-right"
                                  />
                                   <span className="font-semibold">Desde:</span>
                                  <Select 
                                    value={`${period.from.month}`}
                                    onValueChange={(m) => handlePeriodChange(subcat, index, 'from', { ...period.from, month: parseInt(m) })}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {months.map((m, i) => <SelectItem key={m} value={`${i}`}>{m}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={`${period.from.year}`}
                                    onValueChange={(y) => handlePeriodChange(subcat, index, 'from', { ...period.from, year: parseInt(y) })}>
                                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {years.map(y => <SelectItem key={y} value={`${y}`}>{y}</SelectItem>)}
                                    </SelectContent>
                                  </Select>

                                  <span className="font-semibold">Hasta:</span>
                                  <Select 
                                    value={`${period.to.month}`}
                                    onValueChange={(m) => handlePeriodChange(subcat, index, 'to', { ...period.to, month: parseInt(m) })}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {months.map((m, i) => <SelectItem key={m} value={`${i}`}>{m}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                   <Select
                                    value={`${period.to.year}`}
                                    onValueChange={(y) => handlePeriodChange(subcat, index, 'to', { ...period.to, year: parseInt(y) })}>
                                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {years.map(y => <SelectItem key={y} value={`${y}`}>{y}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemovePeriod(subcat, index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddPeriod(subcat)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Período
                            </Button>
                        </div>
                    );
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
       <div className="flex justify-end">
          <Button type="button" onClick={handleSaveBudgets}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Presupuestos Temporales
          </Button>
      </div>
    </>
  );
}
