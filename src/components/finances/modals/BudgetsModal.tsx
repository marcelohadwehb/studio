'use client';

import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ClipboardCopy } from 'lucide-react';
import type { Categories, Budgets, Transaction } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { PinPromptModal } from './PinPromptModal';

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
  const [localBudgets, setLocalBudgets] = useState<Budgets>({});
  const [isPinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinCallback, setPinCallback] = useState<{ onConfirm: () => void } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const sanitizedBudgets: Budgets = {};
      for (const key in budgets) {
        const value = budgets[key];
        sanitizedBudgets[key] = (typeof value === 'number' && !isNaN(value)) ? value : 0;
      }
      setLocalBudgets(sanitizedBudgets);
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
  
  const isPastMonth = useMemo(() => {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentDate < startOfCurrentMonth;
  }, [currentDate]);

  const handleBudgetChange = (subcategory: string, value: string) => {
    const amount = parseFormattedNumber(value);
    const numericAmount = isNaN(amount) ? 0 : amount;

    const action = () => {
      setLocalBudgets(prev => ({
        ...prev,
        [subcategory]: numericAmount,
      }));
    };

    if (isPastMonth) {
      setPinCallback({ onConfirm: action });
      setPinPromptOpen(true);
    } else {
      action();
    }
  };

  const handleSaveBudgets = () => {
    const action = async () => {
      try {
        const budgetsRef = doc(db, "artifacts", appId, "public", "data", "budgets", "budgets");
        await setDoc(budgetsRef, localBudgets, { merge: true });
        toast({ title: 'Presupuestos guardados.' });
        onClose();
      } catch (error) {
        console.error("Error saving budgets:", error);
        toast({ variant: 'destructive', title: 'Error al guardar.' });
      }
    };
    
    if (isPastMonth) {
      setPinCallback({ onConfirm: action });
      setPinPromptOpen(true);
    } else {
      action();
    }
  };

  const handlePinSuccess = () => {
    if (pinCallback) {
      pinCallback.onConfirm();
    }
    setPinPromptOpen(false);
    setPinCallback(null);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Gestión de Presupuestos</DialogTitle>
        </DialogHeader>

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
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{cat}</CardTitle>
                    <span className="text-sm font-semibold text-muted-foreground">Total: {formatCurrency(categoryBudget)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground pt-2">
                    <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                    <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                    <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-[1fr_100px_100px_100px_40px] gap-x-4 items-center text-xs text-muted-foreground mb-2 px-2">
                    <div className="font-medium">Subcategoría</div>
                    <div className="text-right font-medium">Gastado</div>
                    <div className="text-right font-medium">Presupuesto</div>
                    <div className="text-right font-medium">Diferencial</div>
                    <div></div>
                  </div>
                  <div className="space-y-2">
                    {sortedSubcategories.map(subcat => {
                      const subcatBudget = localBudgets[subcat] || 0;
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={subcat} className="grid grid-cols-[1fr_100px_100px_100px_40px] gap-x-4 items-center text-sm px-2 py-1 rounded-md hover:bg-muted/50">
                          <label htmlFor={`budget-${subcat}`}>{subcat}</label>
                          <div className="text-right">{formatCurrency(subcatSpent)}</div>
                          <Input
                            id={`budget-${subcat}`}
                            value={formatNumber(localBudgets[subcat])}
                            onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                          <div className={`text-right font-medium ${subcatDiffColor}`}>{formatCurrency(subcatDiff)}</div>
                           <div className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <ClipboardCopy className="h-4 w-4" />
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
          <Button type="button" onClick={handleSaveBudgets}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <PinPromptModal 
      isOpen={isPinPromptOpen}
      onClose={(success) => {
        if (success) {
          handlePinSuccess();
        } else {
          setPinPromptOpen(false);
          setPinCallback(null);
        }
      }}
    />
    </>
  );
}
