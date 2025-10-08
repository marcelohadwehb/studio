'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, CartesianGrid } from 'recharts';
import type { Transaction, ChartSubcategoryData } from '@/lib/types';
import { hslToHex } from '@/lib/theme';

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions: Transaction[];
  currentDate: Date;
  formatCurrency: (amount: number) => string;
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

export function ChartsModal({ isOpen, onClose, allTransactions, currentDate, formatCurrency }: ChartsModalProps) {
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

  // Data for Subcategory Expenses (Stacked Bar Chart)
  const { subcategoryChartData, subcategoryChartConfig } = useMemo(() => {
      const expenses = transactionsForCurrentMonth.filter(t => t.type === 'expense');
      const subcategories = [...new Set(expenses.map(t => t.subcategory).filter(Boolean))] as string[];
      const colors = generateDistinctColors(subcategories.length);

      const config = subcategories.reduce((acc, subcat, index) => {
          acc[subcat] = { label: subcat, color: colors[index] };
          return acc;
      }, {} as ChartConfig);

      const dataByCat: { [key: string]: ChartSubcategoryData } = {};

      expenses.forEach(t => {
          if (t.category && t.subcategory) {
              if (!dataByCat[t.category]) {
                  dataByCat[t.category] = { category: t.category };
              }
              if (!dataByCat[t.category][t.subcategory]) {
                  dataByCat[t.category][t.subcategory] = 0;
              }
              dataByCat[t.category][t.subcategory]! += t.amount;
          }
      });
      
      return {
          subcategoryChartData: Object.values(dataByCat),
          subcategoryChartConfig: config,
      };

  }, [transactionsForCurrentMonth]);

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
                        <PieChart>
                            <ChartTooltip 
                                cursor={false}
                                content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                        const { name, value } = payload[0].payload;
                                        return (
                                            <div className="bg-background p-2 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold">{name}</p>
                                                <p className="text-foreground">{formatCurrency(value as number)}</p>
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
                                labelLine={false} 
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                className="text-xs"
                            >
                                 {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
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
                            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} className="text-xs" />
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
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                            <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Gastos por Subcategoría (Mes Actual)</CardTitle>
                </CardHeader>
                <CardContent>
                   {subcategoryChartData.length > 0 ? (
                    <ChartContainer config={subcategoryChartConfig} className="h-[400px] w-full">
                        <BarChart data={subcategoryChartData} layout="vertical" stackOffset="expand">
                           <CartesianGrid horizontal={false} />
                            <YAxis 
                                dataKey="category" 
                                type="category"
                                tickLine={false} 
                                axisLine={false}
                                tickMargin={10}
                                width={120}
                                className="text-xs"
                            />
                            <XAxis type="number" hide={true} />
                            <ChartTooltip 
                                content={({ payload, label }) => {
                                  if (payload && payload.length > 0) {
                                    const total = payload.reduce((acc, entry) => acc + (entry.value as number), 0);
                                    return (
                                      <div className="bg-background p-2 border rounded-lg shadow-lg text-sm w-64">
                                        <p className="font-bold mb-2">{label}</p>
                                        <div className="space-y-1">
                                          {payload.slice().reverse().map((entry, index) => (
                                            <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                                                <span className="text-xs">{entry.name}</span>
                                              </div>
                                              <span className="text-xs font-bold">{formatCurrency(entry.value as number)}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                            <span>Total</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            {Object.keys(subcategoryChartConfig).map((key) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} radius={4} />
                            ))}
                        </BarChart>
                    </ChartContainer>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                        No hay gastos con subcategorías para mostrar.
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>


        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
