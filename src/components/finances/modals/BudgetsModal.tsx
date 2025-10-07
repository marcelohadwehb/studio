'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Trash2 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import type { Transaction, Categories, Budgets, BudgetEntry, TempBudget } from '@/lib/types';
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

const TempBudgetPopover: React.FC<{
  budgetEntry: BudgetEntry;
  onSave: (newTempBudgets: TempBudget[]) => void;
  formatCurrency: (amount: number) => string;
}> = ({ budgetEntry, onSave, formatCurrency }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [amountStr, setAmountStr] = useState('0');

  const handleAddPeriod = () => {
    const amount = parseFormattedNumber(amountStr);
    if (!dateRange?.from || amount <= 0) {
      alert('Por favor, selecciona al menos una fecha de inicio y un monto mayor a cero.');
      return;
    }

    const newPeriod: TempBudget = {
      id: new Date().getTime().toString(),
      startDate: startOfMonth(dateRange.from).getTime(),
      endDate: endOfMonth(dateRange.to || dateRange.from).getTime(),
      amount: amount,
    };

    const updatedTemporary = [...budgetEntry.temporary, newPeriod];
    onSave(updatedTemporary);
    setDateRange(undefined);
    setAmountStr('0');
  };

  const handleDeletePeriod = (id: string) => {
    const updatedTemporary = budgetEntry.temporary.filter(p => p.id !== id);
    onSave(updatedTemporary);
  };
  
  return (
    <PopoverContent className="w-auto p-4" align="end">
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Agregar Período Temporal</h4>
          <div className="space-y-2">
            <Calendar
              locale={es}
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              initialFocus
              numberOfMonths={2}
            />
            <Input
              placeholder="Monto para el período"
              value={formatNumber(parseFormattedNumber(amountStr))}
              onChange={e => setAmountStr(e.target.value)}
              className="h-9"
            />
            <Button onClick={handleAddPeriod} size="sm" className="w-full">
              Agregar Período
            </Button>
          </div>
        </div>
        
        {budgetEntry.temporary && budgetEntry.temporary.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Períodos Activos</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {budgetEntry.temporary.map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded-md">
                  <div>
                    <p>{format(new Date(p.startDate), 'MMM yyyy', { locale: es })} - {format(new Date(p.endDate), 'MMM yyyy', { locale: es })}</p>
                    <p className="font-bold">{formatCurrency(p.amount)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePeriod(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PopoverContent>
  );
};


export function BudgetsModal({ isOpen, onClose, categories, budgets, transactions, appId, formatCurrency, currentDate }: BudgetsModalProps) {
  const [localBudgets, setLocalBudgets] = useState<Budgets>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Deep copy and ensure data structure
      const initialBudgets: Budgets = {};
      Object.keys(categories).forEach(cat => {
        categories[cat].forEach(subcat => {
          const existing = budgets[subcat];
          initialBudgets[subcat] = {
            permanent: existing?.permanent || 0,
            temporary: existing?.temporary || [],
          };
        });
      });
      setLocalBudgets(initialBudgets);
    }
  }, [budgets, categories, isOpen]);

  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);
  
  const getSubcategoryBudget = useCallback((subcat: string): number => {
    const budgetEntry = localBudgets[subcat];
    if (!budgetEntry) return 0;
    
    const currentTime = currentDate.getTime();
    const activeTempBudget = budgetEntry.temporary.find(
      t => currentTime >= t.startDate && currentTime <= t.endDate
    );

    return activeTempBudget ? activeTempBudget.amount : budgetEntry.permanent;
  }, [localBudgets, currentDate]);
  
  
  const handlePermanentBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        permanent: amount,
      },
    }));
  };

  const handleTemporaryBudgetChange = (subcategory: string, tempBudgets: TempBudget[]) => {
     setLocalBudgets(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        temporary: tempBudgets,
      },
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Gestión de Presupuestos</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-4">
          {Object.keys(categories).sort((a, b) => a.localeCompare(b)).map(cat => {
            const sortedSubcategories = [...categories[cat]].sort((a, b) => a.localeCompare(b));
            
            const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + getSubcategoryBudget(subcat), 0);
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
                      const subcatBudgetEntry = localBudgets[subcat] || { permanent: 0, temporary: [] };
                      const subcatCurrentBudget = getSubcategoryBudget(subcat);
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatDiff = subcatCurrentBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={subcat} className="grid grid-cols-[1fr_110px_110px_110px_auto] gap-x-4 items-center text-sm">
                          <label htmlFor={`budget-${subcat}`}>{subcat}</label>
                          <Input
                            id={`budget-${subcat}`}
                            value={formatNumber(subcatBudgetEntry.permanent)}
                            onChange={(e) => handlePermanentBudgetChange(subcat, e.target.value)}
                            className="h-8 text-right"
                            placeholder="0"
                            title={`Presupuesto permanente: ${formatCurrency(subcatBudgetEntry.permanent)}`}
                          />
                          <div className="text-right font-semibold">{formatCurrency(subcatCurrentBudget)}</div>
                          <div className="text-right text-muted-foreground">{formatCurrency(subcatSpent)}</div>
                           <div className="flex items-center gap-1">
                              <div className={`text-right font-medium w-20 ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <CalendarIcon className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <TempBudgetPopover
                                  budgetEntry={subcatBudgetEntry}
                                  onSave={(temps) => handleTemporaryBudgetChange(subcat, temps)}
                                  formatCurrency={formatCurrency}
                                />
                              </Popover>
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
