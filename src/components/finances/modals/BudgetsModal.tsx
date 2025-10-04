'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';

import type { Transaction, Categories, Budgets } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    const amount = parseInt(value, 10) || 0;
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
          <Accordion type="multiple" className="w-full">
            {Object.keys(categories).map(cat => {
              const categoryBudget = categories[cat].reduce((sum, subcat) => sum + (localBudgets[subcat] || 0), 0);
              const categorySpent = categories[cat].reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
              const progress = categoryBudget > 0 ? (categorySpent / categoryBudget) * 100 : 0;
              const isOverBudget = progress > 100;

              return (
                <AccordionItem value={cat} key={cat}>
                  <AccordionTrigger>
                    <div className="w-full">
                      <div className="flex justify-between font-semibold">
                        <span>{cat}</span>
                        <span className={isOverBudget ? 'text-destructive' : ''}>
                          {formatCurrency(categorySpent)} / {formatCurrency(categoryBudget)}
                        </span>
                      </div>
                      <Progress value={Math.min(100, progress)} className="h-2 mt-1" indicatorClassName={isOverBudget ? "bg-destructive" : ""} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1 pt-2">
                    <div className="grid grid-cols-4 gap-x-4 px-2 pb-2 text-xs font-medium text-muted-foreground">
                        <div className="col-span-1">Subcategoría</div>
                        <div className="col-span-1 text-right">Gastado</div>
                        <div className="col-span-1 text-right">Presupuesto</div>
                        <div className="col-span-1 text-right">Diferencia</div>
                    </div>
                    {categories[cat].map(subcat => {
                      const spent = expensesBySubcategory[subcat] || 0;
                      const budget = localBudgets[subcat] || 0;
                      const difference = budget - spent;
                      const differenceColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={subcat} className="grid grid-cols-4 gap-x-4 items-center text-sm px-2 py-1 rounded-md hover:bg-accent">
                          <span className="truncate col-span-1">{subcat}</span>
                          <span className="text-right col-span-1">{formatCurrency(spent)}</span>
                          <div className="col-span-1">
                            <Input
                                type="number"
                                value={budget}
                                onChange={(e) => handleBudgetChange(subcat, e.target.value)}
                                onBlur={() => handleSaveBudget(subcat)}
                                className="h-8 text-right w-full bg-background"
                                placeholder="Presupuesto"
                            />
                          </div>
                          <span className={`text-right font-medium col-span-1 ${differenceColor}`}>
                              {formatCurrency(difference)}
                          </span>
                        </div>
                      )
                    })}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
