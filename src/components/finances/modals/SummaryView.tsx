'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Categories, Budgets, Transaction, TemporaryBudgets, TemporaryCategories, TemporaryBudget } from '@/lib/types';

interface SummaryViewProps {
  categories: Categories;
  budgets: Budgets;
  tempCategories: TemporaryCategories;
  tempBudgets: TemporaryBudgets;
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  currentDate: Date;
}

export function SummaryView({
  categories,
  budgets,
  tempCategories,
  tempBudgets,
  transactions,
  formatCurrency,
  currentDate,
}: SummaryViewProps) {

  // --- Permanent Budgets Logic ---
  const expensesBySubcategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);


  // --- Temporary Budgets Logic ---
  const getActiveBudgetForCurrentDate = (subcategory: string): TemporaryBudget | null => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const budget = tempBudgets[subcategory];

    if (!budget || !budget.from || !budget.to) return null;
     if (typeof budget.from.year !== 'number' || typeof budget.from.month !== 'number' || typeof budget.to.year !== 'number' || typeof budget.to.month !== 'number') {
        return null;
    }

    const currentMonthDate = new Date(year, month, 1);
    const fromDate = new Date(budget.from.year, budget.from.month, 1);
    const toDate = new Date(budget.to.year, budget.to.month + 1, 0); 
    
    if (currentMonthDate >= fromDate && currentMonthDate <= toDate) {
        return budget;
    }
    
    return null;
  };


  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
      {/* Permanent Budgets Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Presupuestos Permanentes</h3>
        <div className="space-y-4">
          {Object.keys(categories).sort((a,b) => a.localeCompare(b)).map(cat => {
            const sortedSubcategories = [...categories[cat]].sort((a,b) => a.localeCompare(b));
            
            const categoryBudget = sortedSubcategories.reduce((sum, subcat) => sum + (budgets[subcat] || 0), 0);
            const categorySpent = sortedSubcategories.reduce((sum, subcat) => sum + (expensesBySubcategory[subcat] || 0), 0);
            const categoryDifference = categoryBudget - categorySpent;
            const differenceColor = categoryDifference >= 0 ? 'text-green-600' : 'text-red-600';

            return (
              <Card key={cat}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{cat}</CardTitle>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
                    <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                    <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                    <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px] gap-x-4 items-center text-xs text-muted-foreground mb-2 px-2">
                    <div className="font-medium">Subcategoría</div>
                    <div className="text-right font-medium">Gastado</div>
                    <div className="text-right font-medium">Presupuesto</div>
                    <div className="text-right font-medium">Diferencial</div>
                  </div>
                  <div className="space-y-3 sm:space-y-2">
                    {sortedSubcategories.map(subcat => {
                      const subcatBudget = budgets[subcat] || 0;
                      const subcatSpent = expensesBySubcategory[subcat] || 0;
                      const subcatDiff = subcatBudget - subcatSpent;
                      const subcatDiffColor = subcatDiff >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={subcat} className="grid grid-cols-2 sm:grid-cols-[1fr_100px_100px_100px] sm:gap-x-4 items-center text-sm sm:px-2 py-2 sm:py-1 rounded-md hover:bg-muted/50 border-b sm:border-none">
                          <div className="font-medium sm:font-normal col-span-2 sm:col-span-1">{subcat}</div>
                          <div className="text-right"><span className="sm:hidden text-muted-foreground">Gastado: </span>{formatCurrency(subcatSpent)}</div>
                          <div className="text-right"><span className="sm:hidden text-muted-foreground">Presupuesto: </span>{formatCurrency(subcatBudget)}</div>
                          <div className={`text-right font-medium ${subcatDiffColor}`}><span className="sm:hidden text-muted-foreground">Diferencial: </span>{formatCurrency(subcatDiff)}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Temporary Budgets Section */}
      <div>
        <h3 className="text-xl font-bold mb-4 mt-6">Presupuestos Temporales</h3>
        <div className="space-y-4">
          {Object.keys(tempCategories).sort((a,b) => a.localeCompare(b)).map(cat => {
            const sortedSubcategories = [...tempCategories[cat]].sort((a,b) => a.localeCompare(b));

            const isCategoryOutOfPeriod = sortedSubcategories.every(subcat => !getActiveBudgetForCurrentDate(subcat));

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
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {cat}
                        {isCategoryOutOfPeriod && <span className="text-xs font-normal text-muted-foreground">(fuera de periodo)</span>}
                    </CardTitle>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
                    <div>Presupuesto: <span className="font-semibold text-card-foreground">{formatCurrency(categoryBudget)}</span></div>
                    <div>Gastado: <span className="font-semibold text-card-foreground">{formatCurrency(categorySpent)}</span></div>
                    <div>Diferencial: <span className={`font-semibold ${differenceColor}`}>{formatCurrency(categoryDifference)}</span></div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px] gap-x-4 items-center text-xs text-muted-foreground mb-2 px-2">
                    <div className="font-medium">Subcategoría</div>
                    <div className="text-right font-medium">Gastado</div>
                    <div className="text-right font-medium">Presupuesto</div>
                    <div className="text-right font-medium">Diferencial</div>
                  </div>
                  <div className="space-y-3 sm:space-y-2">
                    {sortedSubcategories.map(subcat => {
                      const activeBudget = getActiveBudgetForCurrentDate(subcat);
                      const spent = expensesBySubcategory[subcat] || 0;
                      const budgetAmount = activeBudget?.amount || 0;
                      const diff = budgetAmount - spent;
                      const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';

                      return (
                        <div key={subcat} className="grid grid-cols-2 sm:grid-cols-[1fr_100px_100px_100px] sm:gap-x-4 items-center text-sm sm:px-2 py-2 sm:py-1 rounded-md hover:bg-muted/50 border-b sm:border-none">
                          <div className="font-medium sm:font-normal col-span-2 sm:col-span-1">{subcat}</div>
                          <div className="text-right"><span className="sm:hidden text-muted-foreground">Gastado: </span>{formatCurrency(spent)}</div>
                          <div className="text-right"><span className="sm:hidden text-muted-foreground">Presupuesto: </span>{formatCurrency(budgetAmount)}</div>
                          <div className={`text-right font-medium ${diffColor}`}><span className="sm:hidden text-muted-foreground">Diferencial: </span>{formatCurrency(diff)}</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}
