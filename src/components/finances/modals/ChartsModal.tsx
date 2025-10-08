'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Transaction, Categories, Budgets, TemporaryCategories, TemporaryBudgets } from '@/lib/types';
import { hslToHex } from '@/lib/theme';

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions: Transaction[];
  currentDate: Date;
  formatCurrency: (amount: number) => string;
  categories: Categories;
  budgets: Budgets;
  tempCategories: TemporaryCategories;
  tempBudgets: TemporaryBudgets;
}

const compactCurrencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
});


export function ChartsModal({ 
    isOpen, 
    onClose, 
    allTransactions, 
    currentDate, 
    formatCurrency,
    categories,
    budgets,
    tempCategories,
    tempBudgets
}: ChartsModalProps) {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const transactionsForCurrentMonth = useMemo(() => {
     return allTransactions.filter(
      t => new Date(t.timestamp).getMonth() === currentMonth && new Date(t.timestamp).getFullYear() === currentYear
    );
  }, [allTransactions, currentMonth, currentYear]);

  // Data for Income vs Expense (Bar Chart for current month)
  const barChartData = useMemo(() => {
    const income = transactionsForCurrentMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactionsForCurrentMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'Ingresos', value: income },
      { name: 'Gastos', value: expense },
    ];
  }, [transactionsForCurrentMonth]);

  const barChartConfig = {
    Ingresos: { label: 'Ingresos', color: hslToHex(140, 70, 50) },
    Gastos: { label: 'Gastos', color: hslToHex(0, 70, 50) },
  };

  const { totalIncome, totalExpenses } = useMemo(() => {
    return transactionsForCurrentMonth.reduce((acc, t) => {
      if (t.type === 'income') acc.totalIncome += t.amount;
      else acc.totalExpenses += t.amount;
      return acc;
    }, { totalIncome: 0, totalExpenses: 0 });
  }, [transactionsForCurrentMonth]);

  // Data for Budget Performance by Subcategory
  const budgetPerformanceData = useMemo(() => {
    const data: { category: string, subcategory: string, Presupuesto: number, Gastado: number, Diferencial: number }[] = [];
    const expensesBySubcategory = transactionsForCurrentMonth
      .filter(t => t.type === 'expense' && t.subcategory)
      .reduce((acc, t) => {
        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
        acc[t.subcategory!] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
      
    const processCategory = (categoryName: string, subcategories: string[], isTemporary: boolean) => {
        subcategories.sort((a,b) => a.localeCompare(b)).forEach(subcat => {
            let budgetAmount = 0;
            if (isTemporary) {
                const tempBudget = tempBudgets[subcat];
                if (tempBudget && typeof tempBudget.from?.year === 'number' && typeof tempBudget.to?.year === 'number') {
                    const fromDate = new Date(tempBudget.from.year, tempBudget.from.month, 1);
                    const toDate = new Date(tempBudget.to.year, tempBudget.to.month + 1, 0);
                    const currentMonthDate = new Date(currentYear, currentMonth, 1);

                    if (currentMonthDate >= fromDate && currentMonthDate <= toDate) {
                        budgetAmount = tempBudget.amount || 0;
                    }
                }
            } else {
                budgetAmount = budgets[subcat] || 0;
            }
            
            const spent = expensesBySubcategory[subcat] || 0;
            data.push({
                category: categoryName,
                subcategory: subcat,
                Presupuesto: budgetAmount,
                Gastado: spent,
                Diferencial: budgetAmount - spent,
            });
        });
    };

    Object.keys(categories).sort((a, b) => a.localeCompare(b)).forEach(cat => processCategory(cat, categories[cat], false));
    Object.keys(tempCategories).sort((a, b) => a.localeCompare(b)).forEach(cat => processCategory(cat, tempCategories[cat], true));
    
    return data.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof data>);

  }, [transactionsForCurrentMonth, categories, budgets, tempCategories, tempBudgets, currentMonth, currentYear]);

  // Data for Budget Performance by Category
  const categoryBudgetPerformanceData = useMemo(() => {
    const performanceData: { name: string, Presupuesto: number, Gastado: number, Diferencial: number }[] = [];
    const allCategoryNames = [...new Set([...Object.keys(categories), ...Object.keys(tempCategories)])].sort((a, b) => a.localeCompare(b));

    allCategoryNames.forEach(cat => {
        const permanentSubcats = categories[cat] || [];
        const tempSubcats = tempCategories[cat] || [];
        const allSubcats = [...new Set([...permanentSubcats, ...tempSubcats])];
        
        let totalBudget = 0;
        let totalSpent = 0;

        allSubcats.forEach(subcat => {
            const allPerformanceItems = Object.values(budgetPerformanceData).flat();
            const performanceItem = allPerformanceItems.find(item => item.subcategory === subcat);

            if (performanceItem) {
                totalBudget += performanceItem.Presupuesto;
                totalSpent += performanceItem.Gastado;
            } else {
                 const expensesBySubcategory = transactionsForCurrentMonth
                    .filter(t => t.type === 'expense' && t.subcategory)
                    .reduce((acc, t) => {
                        if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
                        acc[t.subcategory!] += t.amount;
                        return acc;
                    }, {} as { [key: string]: number });
                 totalSpent += expensesBySubcategory[subcat] || 0;
            }
        });
        
        if (totalBudget > 0 || totalSpent > 0) {
            performanceData.push({
                name: cat,
                Presupuesto: totalBudget,
                Gastado: totalSpent,
                Diferencial: totalBudget - totalSpent,
            });
        }
    });

    return performanceData;
  }, [categories, tempCategories, budgetPerformanceData, transactionsForCurrentMonth]);

  const budgetPerformanceConfig = {
    Presupuesto: { label: 'Presupuesto', color: hslToHex(210, 80, 60) },
    Gastado: { label: 'Gastado', color: hslToHex(0, 70, 60) },
  } satisfies ChartConfig;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Reportes Gráficos</DialogTitle>
           <DialogDescription className="text-center pt-2">
            Análisis visual de tus finanzas para el período de {currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Ingresos vs. Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <BarChart
                            data={[
                                { name: 'Ingresos', value: totalIncome, fill: 'var(--color-Ingresos)' },
                                { name: 'Gastos', value: totalExpenses, fill: 'var(--color-Gastos)' },
                            ]}
                            layout="vertical"
                            margin={{ left: 10, right: 10 }}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                className="text-sm"
                            />
                            <XAxis
                                dataKey="value"
                                type="number"
                                hide
                            />
                            <ChartTooltip 
                                cursor={false}
                                content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                        return (
                                            <div className="bg-background p-2 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold">{payload[0].payload.name}</p>
                                                <p>{formatCurrency(payload[0].value as number)}</p>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                             <defs>
                                <style dangerouslySetInnerHTML={{__html: `
                                    :root {
                                        --color-Ingresos: ${barChartConfig.Ingresos.color};
                                        --color-Gastos: ${barChartConfig.Gastos.color};
                                    }
                                `}} />
                            </defs>
                            <Bar dataKey="value" radius={5} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Rendimiento de Presupuestos por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    {categoryBudgetPerformanceData.length > 0 ? (
                        <ChartContainer config={budgetPerformanceConfig} className="w-full h-[300px]">
                            <BarChart layout="vertical" data={categoryBudgetPerformanceData} margin={{ left: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={150} className="text-xs" />
                                <XAxis type="number" tickFormatter={(value) => compactCurrencyFormatter.format(value as number)} />
                                <ChartTooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={({ payload, label }) => {
                                        if (payload && payload.length > 0) {
                                            const itemData = categoryBudgetPerformanceData.find(item => item.name === label);
                                            if (!itemData) return null;
                                            return (
                                                <div className="bg-background p-2 border rounded-lg shadow-lg text-sm w-64">
                                                    <p className="font-bold mb-2">{label}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center gap-4"><span>Presupuesto:</span><span className="font-bold">{formatCurrency(itemData.Presupuesto)}</span></div>
                                                        <div className="flex justify-between items-center gap-4"><span>Gastado:</span><span className="font-bold">{formatCurrency(itemData.Gastado)}</span></div>
                                                    </div>
                                                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                                        <span>Diferencial:</span>
                                                        <span className={itemData.Diferencial >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(itemData.Diferencial)}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="Presupuesto" fill="var(--color-Presupuesto)" radius={4} />
                                <Bar dataKey="Gastado" fill="var(--color-Gastado)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No hay datos de presupuesto para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-semibold text-center -mb-2">Rendimiento de Presupuestos por Subcategoría</h3>
                {Object.keys(budgetPerformanceData).map((category) => {
                    const subcategoryData = budgetPerformanceData[category];
                    const chartHeight = subcategoryData.length * 35 + 60; // 35px per bar + 60px for padding/axis/legend
                    return (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle>{category}</CardTitle>
                            </CardHeader>
                            <CardContent>
                               {subcategoryData.length > 0 ? (
                                <ChartContainer config={budgetPerformanceConfig} style={{ height: `${chartHeight}px` }} className="w-full">
                                    <BarChart 
                                        layout="vertical" 
                                        data={subcategoryData} 
                                        margin={{ left: 20, top: 5, right: 20, bottom: 20 }}
                                    >
                                       <CartesianGrid horizontal={false} />
                                        <YAxis 
                                            dataKey="subcategory" 
                                            type="category"
                                            tickLine={false} 
                                            axisLine={false}
                                            tickMargin={5}
                                            width={150}
                                            className="text-xs"
                                        />
                                        <XAxis type="number" tickFormatter={(value) => compactCurrencyFormatter.format(value as number)} />
                                        <ChartTooltip 
                                            cursor={{fill: 'hsl(var(--muted))'}}
                                            content={({ payload, label }) => {
                                              if (payload && payload.length > 0) {
                                                const performanceItem = subcategoryData.find(item => item.subcategory === label);
                                                if (!performanceItem) return null;

                                                return (
                                                  <div className="bg-background p-2 border rounded-lg shadow-lg text-sm w-64">
                                                    <p className="font-bold mb-2">{label}</p>
                                                    <div className="space-y-1">
                                                      <div className="flex justify-between items-center gap-4">
                                                        <span>Presupuesto:</span>
                                                        <span className="font-bold">{formatCurrency(performanceItem.Presupuesto)}</span>
                                                      </div>
                                                      <div className="flex justify-between items-center gap-4">
                                                        <span>Gastado:</span>
                                                        <span className="font-bold">{formatCurrency(performanceItem.Gastado)}</span>
                                                      </div>
                                                    </div>
                                                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                                        <span>Diferencial:</span>
                                                        <span className={performanceItem.Diferencial >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {formatCurrency(performanceItem.Diferencial)}
                                                        </span>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            }}
                                        />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="Presupuesto" fill="var(--color-Presupuesto)" radius={4} />
                                        <Bar dataKey="Gastado" fill="var(--color-Gastado)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                                ) : (
                                  <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                                    No hay subcategorías para esta categoría.
                                  </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>


        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
