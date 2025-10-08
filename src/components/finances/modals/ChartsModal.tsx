'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import type { Transaction } from '@/lib/types';
import { hslToHex } from '@/lib/theme';

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions: Transaction[];
  currentDate: Date;
  formatCurrency: (amount: number) => string;
}

const generatePieColors = (count: number): string[] => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 137.508) % 360; // Use golden angle for distinct colors
        colors.push(hslToHex(hue, 60, 65));
    }
    return colors;
};

export function ChartsModal({ isOpen, onClose, allTransactions, currentDate, formatCurrency }: ChartsModalProps) {

  // Data for Monthly Expenses by Category (Pie Chart)
  const { pieChartData, pieChartConfig, pieChartColors } = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const expenses = allTransactions.filter(
      t => t.type === 'expense' && new Date(t.timestamp).getMonth() === currentMonth && new Date(t.timestamp).getFullYear() === currentYear
    );

    const expensesByCategory = expenses.reduce((acc, t) => {
      const category = t.category || 'Sin Categoría';
      if (!acc[category]) acc[category] = 0;
      acc[category] += t.amount;
      return acc;
    }, {} as { [key: string]: number });
    
    const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);
    
    const pieChartColors = generatePieColors(sortedCategories.length);

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

    return { pieChartData, pieChartConfig, pieChartColors };
  }, [allTransactions, currentDate]);


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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] sm:w-full">
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
                                content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                        const { name, value } = payload[0];
                                        return (
                                            <div className="bg-background p-2 border rounded shadow-lg">
                                                <p className="font-bold">{name}</p>
                                                <p>{formatCurrency(value as number)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Pie data={pieChartData} dataKey="value" nameKey="name" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
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
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                            <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
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
