'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, CartesianGrid } from 'recharts';
import type { Transaction, Categories, Budgets, TemporaryCategories, TemporaryBudgets, TemporaryBudget } from '@/lib/types';
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

const generateDistinctColors = (count: number): string[] => {
    const colors = [];
    const saturation = 70;
    const lightness = 55;
    for (let i = 0; i < count; i++) {
        const hue = (i * 137.508) % 360; // Use golden angle for distinct colors
        colors.push(hslToHex(hue, saturation, lightness));
    }
    return colors;
};

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

  // Data for Monthly Expenses by Category (Pie Chart)
  const { pieChartData, pieChartConfig } = useMemo(() => {
    const expenses = transactionsForCurrentMonth.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = expenses.reduce((acc, t) => {
      const category = t.category || 'Sin Categoría';
      if (!acc[category]) acc[category] = 0;
      acc[category] += t.amount;
      return acc;
    }, {} as { [key: string]: number });
    
    const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);
    
    const pieChartColors = generateDistinctColors(sortedCategories.length);

    const pieChartData = sortedCategories.map(([name, value], index) => ({
      name,
      value,
      fill: pieChartColors[index],
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
    }));

    const pieChartConfig = sortedCategories.reduce((acc, [name], index) => {
      acc[name] = {
        label: name,
        color: pieChartColors[index],
      };
      return acc;
    }, {} as ChartConfig);

    return { pieChartData, pieChartConfig };
  }, [transactionsForCurrentMonth]);


  // Data for Income vs Expense (Bar Chart)
  const barChartData = useMemo(() => {
    const data: { month: string; year: number; Ingresos: number; Gastos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();

      const monthTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.timestamp);
        return transDate.getMonth() === month && transDate.getFullYear() === year;
      });

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: d.toLocaleString('es-CL', { month: 'short' }),
        year: year,
        Ingresos: income,
        Gastos: expense,
      });
    }
    return data;
  }, [allTransactions, currentDate]);
  
  const barChartConfig = {
    Ingresos: { label: 'Ingresos', color: hslToHex(140, 70, 50) },
    Gastos: { label: 'Gastos', color: hslToHex(0, 70, 50) },
  } satisfies ChartConfig;

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
        subcategories.forEach(subcat => {
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

    Object.entries(categories).forEach(([cat, subcats]) => processCategory(cat, subcats, false));
    Object.entries(tempCategories).forEach(([cat, subcats]) => processCategory(cat, subcats, true));
    
    return data.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof data>);

  }, [transactionsForCurrentMonth, categories, budgets, tempCategories, tempBudgets, currentMonth, currentYear]);

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
            <Card>
                <CardHeader>
                    <CardTitle>Gastos por Categoría (Mes Actual)</CardTitle>
                </CardHeader>
                <CardContent>
                    {pieChartData.length > 0 ? (
                    <ChartContainer config={pieChartConfig} className="mx-auto aspect-square h-[300px]">
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <ChartTooltip 
                                cursor={false}
                                content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                        const { name, value, percentage } = payload[0].payload;
                                        return (
                                            <div className="bg-background p-2 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold">{name}</p>
                                                <p className="text-foreground">{formatCurrency(value as number)} ({percentage.toFixed(1)}%)</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Pie 
                                data={pieChartData} 
                                dataKey="value" 
                                nameKey="name" 
                            >
                                 {pieChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ChartContainer>
                     ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No hay gastos registrados este mes.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ingresos vs. Gastos (Últimos 6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                        <BarChart data={barChartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} className="text-xs" />
                            <YAxis tickFormatter={(value) => compactCurrencyFormatter.format(value as number)} className="text-xs" />
                            <ChartTooltip 
                                content={({ payload, label }) => {
                                    if(payload && payload.length > 0) {
                                        return (
                                            <div className="bg-background p-2 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold mb-1">{label}</p>
                                                {payload.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                            <span>{item.name}:</span>
                                                        </div>
                                                        <span className="font-semibold">{formatCurrency(item.value as number)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                             <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                            <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-semibold text-center -mb-2">Rendimiento de Presupuestos por Subcategoría</h3>
                {Object.entries(budgetPerformanceData).map(([category, subcategoryData]) => {
                    const chartHeight = subcategoryData.length * 35 + 50; // 35px per bar + 50px for padding/axis
                    return (
                        <Card key={category}>
                            <CardHeader>
                                <CardTitle>{category}</CardTitle>
                            </CardHeader>
                            <CardContent>
                               {subcategoryData.length > 0 ? (
                                <ChartContainer config={budgetPerformanceConfig} className={`h-[${chartHeight}px] w-full`}>
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
