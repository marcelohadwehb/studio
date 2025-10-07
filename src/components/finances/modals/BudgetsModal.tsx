'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Calendar as CalendarIcon, Trash2, Edit, Lock, Unlock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';

import type { Transaction, Categories, Budgets, BudgetEntry, TemporaryBudget } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatNumber, parseFormattedNumber, cn } from '@/lib/utils';


interface TempBudgetPopoverProps {
  subcategory: string;
  budgetEntry: BudgetEntry;
  onSave: (subcategory: string, budgetEntry: BudgetEntry) => Promise<void>;
  formatCurrency: (amount: number) => string;
  disabled: boolean;
}

function TempBudgetPopover({ subcategory, budgetEntry, onSave, formatCurrency, disabled }: TempBudgetPopoverProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [amount, setAmount] = useState('0');
  const [editingTemp, setEditingTemp] = useState<TemporaryBudget | null>(null);
  const { toast } = useToast();

  const handleSaveTempBudget = () => {
    if ((!dateRange?.from && !editingTemp) || parseFormattedNumber(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, selecciona un rango de fechas y un monto mayor a cero.' });
      return;
    }

    let newTemporaries = [...(budgetEntry.temporaries || [])];
    const newId = new Date().getTime().toString();

    if (editingTemp) {
      const from = dateRange?.from || new Date(editingTemp.startDate);
      const to = dateRange?.to || new Date(editingTemp.endDate);
      newTemporaries = newTemporaries.map(t =>
        t.id === editingTemp.id
          ? { ...t, startDate: startOfMonth(from).getTime(), endDate: endOfMonth(to || from).getTime(), amount: parseFormattedNumber(amount) }
          : t
      );
    } else {
       newTemporaries.push({
        id: newId,
        startDate: startOfMonth(dateRange!.from!).getTime(),
        endDate: endOfMonth(dateRange!.to || dateRange!.from!).getTime(),
        amount: parseFormattedNumber(amount)
      });
    }

    const updatedBudgetEntry = {
        ...budgetEntry,
        temporaries: newTemporaries
    };

    onSave(subcategory, updatedBudgetEntry);
    resetForm();
  };

  const handleDeleteTempBudget = (tempId: string) => {
    const newTemporaries = (budgetEntry.temporaries || []).filter(t => t.id !== tempId);
    const updatedBudgetEntry = {
        ...budgetEntry,
        temporaries: newTemporaries
    };
    onSave(subcategory, updatedBudgetEntry);
  };

  const handleEditTempBudget = (temp: TemporaryBudget) => {
    setEditingTemp(temp);
    setDateRange({ from: new Date(temp.startDate), to: new Date(temp.endDate) });
    setAmount(formatNumber(temp.amount));
  };

  const resetForm = () => {
    setEditingTemp(null);
    setDateRange(undefined);
    setAmount('0');
  };

  return (
    <Popover onOpenChange={(isOpen) => !isOpen && resetForm()}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 absolute right-0" disabled={disabled}>
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
          <div className="grid gap-4">
              <div className="space-y-2">
                  <h4 className="font-medium leading-none">{editingTemp ? 'Editar' : 'Nuevo'} Presupuesto Temporal</h4>
                  <p className="text-sm text-muted-foreground">
                      Define un monto para un período específico.
                  </p>
              </div>

              {(budgetEntry.temporaries || []).length > 0 && (
                <div className="space-y-2">
                  <Label>Períodos existentes</Label>
                   <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                    {(budgetEntry.temporaries || []).map(t => (
                      <div key={t.id} className="text-xs flex justify-between items-center bg-muted p-1 rounded-md">
                        <div>
                          <p className="font-semibold">{formatCurrency(t.amount)}</p>
                          <p>{format(new Date(t.startDate), 'MMM yyyy', {locale: es})} - {format(new Date(t.endDate), 'MMM yyyy', {locale: es})}</p>
                        </div>
                        <div className="flex">
                           <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditTempBudget(t)}>
                              <Edit className="h-3 w-3" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTempBudget(t.id)}>
                              <Trash2 className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                    ))}
                   </div>
                </div>
              )}

              <div className="grid gap-2">
                  <Label>Rango de Fechas</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                       <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "justify-start text-left font-normal h-8",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL y", { locale: es })} -{" "}
                              {format(dateRange.to, "LLL y", { locale: es })}
                            </>
                          ) : (
                            format(dateRange.from, "LLL y", { locale: es })
                          )
                        ) : (
                          <span>Elige un rango</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor={`temp-budget-${subcategory}`}>Monto</Label>
                  <Input
                      id={`temp-budget-${subcategory}`}
                      value={amount}
                      onChange={(e) => setAmount(formatNumber(parseFormattedNumber(e.target.value)))}
                      className="h-8"
                  />
              </div>
              <div className="flex justify-end gap-2">
                {editingTemp && <Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>}
                <Button size="sm" onClick={handleSaveTempBudget}>
                  <Save className="h-4 w-4 mr-2"/>
                  {editingTemp ? 'Actualizar Período' : 'Guardar Período'}
                </Button>
              </div>
          </div>
      </PopoverContent>
    </Popover>
  );
}


interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  budgets: Budgets;
  transactions: Transaction[];
  appId: string;
  formatCurrency: (amount: number) => string;
  currentDate: Date;
  requestPin: () => Promise<boolean>;
}

export function BudgetsModal({ isOpen, onClose, categories, budgets, transactions, appId, formatCurrency, currentDate, requestPin }: BudgetsModalProps) {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
  const [pastDateLock, setPastDateLock] = useState(true);
  const { toast } = useToast();

  const isPastMonth = useMemo(() => {
    return isBefore(currentDate, startOfMonth(startOfToday()));
  }, [currentDate]);

  useEffect(() => {
    if (isOpen) {
      setLocalBudgets(JSON.parse(JSON.stringify(budgets)));
      setPastDateLock(true); // Reset lock on open
    }
  }, [budgets, isOpen]);
  
  const handleToggleLock = async () => {
    if (!pastDateLock) {
      setPastDateLock(true);
      toast({ title: 'Edición de meses pasados bloqueada.' });
      return;
    }
    const pinSuccess = await requestPin();
    if (pinSuccess) {
      setPastDateLock(false);
      toast({ title: 'Edición de meses pasados desbloqueada.' });
    } else {
      toast({ variant: 'destructive', title: 'PIN incorrecto' });
    }
  };


  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);

  const getSubcategoryBudget = useCallback((subcat: string, date: Date): number => {
    const budgetEntry = localBudgets[subcat];
    if (!budgetEntry) return 0;

    const currentTime = date.getTime();
    const activeTempBudget = budgetEntry.temporaries?.find(t =>
      currentTime >= t.startDate && currentTime <= t.endDate
    );

    return activeTempBudget?.amount ?? budgetEntry.permanent ?? 0;
  }, [localBudgets]);

  const handlePermanentBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    const updatedBudgets = {
        ...localBudgets,
        [subcategory]: {
            ...(localBudgets[subcategory] || { permanent: 0, temporaries: [] }),
            permanent: amount
        }
    };
    setLocalBudgets(updatedBudgets);
  };

  const saveBudgetEntry = useCallback(async (subcategory: string, budgetEntry: BudgetEntry) => {
    const finalBudgetEntry = {
      permanent: budgetEntry.permanent || 0,
      temporaries: budgetEntry.temporaries || []
    };
  
    const updatedLocalBudgets = {
      ...localBudgets,
      [subcategory]: finalBudgetEntry
    };
  
    setLocalBudgets(updatedLocalBudgets);
  
    try {
      const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
      await setDoc(budgetsRef, { [subcategory]: finalBudgetEntry }, { merge: true });
      toast({ title: `Presupuesto para "${subcategory}" guardado` });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({ variant: 'destructive', title: 'Error al guardar' });
      // Revert on failure by refetching or using the original state
      setLocalBudgets(budgets); 
    }
  }, [appId, budgets, localBudgets, toast]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-center flex-1">Gestión de Presupuestos</DialogTitle>
             {isPastMonth && (
              <Button onClick={handleToggleLock} variant="ghost" size="icon" className="text-muted-foreground">
                {pastDateLock ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5 text-primary" />}
                <span className="sr-only">Desbloquear edición</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 my-4">
          {Object.keys(categories).sort((a, b) => a.localeCompare(b)).map(cat => {
            const sortedSubcategories = [...categories[cat]].sort((a, b) => a.localeCompare(b));
            const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + getSubcategoryBudget(subcat, currentDate), 0);
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
                      const subcatBudgetEntry = localBudgets[subcat] || { permanent: 0, temporaries: [] };
                      const subcatPermBudget = subcatBudgetEntry.permanent || 0;

                      const currentTime = currentDate.getTime();
                      const activeTempBudget = subcatBudgetEntry.temporaries?.find(t =>
                        currentTime >= t.startDate && currentTime <= t.endDate
                      );

                      const subcatBudget = activeTempBudget?.amount ?? subcatPermBudget;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      const isEditingDisabled = isPastMonth && pastDateLock;

                      return (
                        <div key={subcat} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-4 items-center text-sm">
                          <label htmlFor={`budget-${subcat}`} className="col-span-1 truncate">{subcat}</label>
                          <div className="col-span-1 text-right text-muted-foreground">{formatCurrency(subcatSpent)}</div>

                          <div className="col-span-1 flex items-center gap-1 relative">
                            <Input
                              id={`budget-${subcat}`}
                              value={formatNumber(activeTempBudget?.amount ?? subcatPermBudget)}
                              onChange={(e) => handlePermanentBudgetChange(subcat, e.target.value)}
                              readOnly={isEditingDisabled}
                              className={cn("h-8 text-right w-full bg-background pr-8", activeTempBudget && "bg-blue-100 dark:bg-blue-900/50", isEditingDisabled && "cursor-not-allowed bg-gray-100")}
                              placeholder="0"
                              title={activeTempBudget ? `Temporal activo: ${formatCurrency(activeTempBudget.amount)} | Permanente: ${formatCurrency(subcatPermBudget)}` : `Permanente: ${formatCurrency(subcatPermBudget)}`}
                            />
                             {activeTempBudget && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-blue-500 rounded-full" title={`Presupuesto temporal activo: ${formatCurrency(activeTempBudget.amount)}`}/>}
                             <TempBudgetPopover
                                subcategory={subcat}
                                budgetEntry={subcatBudgetEntry}
                                onSave={saveBudgetEntry}
                                formatCurrency={formatCurrency}
                                disabled={isEditingDisabled}
                             />
                          </div>

                           <div className="flex items-center gap-1">
                             <span className={`font-medium w-20 text-right ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</span>
                             <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveBudgetEntry(subcat, localBudgets[subcat])} disabled={isEditingDisabled}>
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
