'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import type { Transaction, Categories, Budgets } from '@/lib/types';
import { getFinancialAdvice, FinancialSummary } from '@/ai/flows/advisor-flow';


interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Categories;
  budgets: Budgets;
  transactions: Transaction[];
}

export function AIAdvisorModal({ isOpen, onClose, categories, budgets, transactions }: AIAdvisorModalProps) {
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<{ analysis: string; recommendations: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const generateAdvice = async () => {
        setLoading(true);
        setError(null);
        setAdvice(null);
        try {
          // 1. Calcular gastos por subcategoría
          const expensesBySubcategory = transactions
            .filter(t => t.type === 'expense' && t.subcategory)
            .reduce((acc, t) => {
              if (!acc[t.subcategory!]) acc[t.subcategory!] = 0;
              acc[t.subcategory!] += t.amount;
              return acc;
            }, {} as { [key: string]: number });

          // 2. Construir el resumen financiero
          const summaries: FinancialSummary[] = [];
          for (const category in categories) {
            for (const subcategory of categories[category]) {
              const budgeted = budgets[subcategory] || 0;
              const spent = expensesBySubcategory[subcategory] || 0;
              // Solo incluir si hay presupuesto o gasto
              if (budgeted > 0 || spent > 0) {
                summaries.push({
                  category,
                  subcategory,
                  budgeted,
                  spent,
                  difference: budgeted - spent,
                });
              }
            }
          }
          
          if (summaries.length === 0) {
            setError("No hay suficientes datos de presupuestos o gastos para generar un análisis. Por favor, registra más actividad.");
            setLoading(false);
            return;
          }

          // 3. Llamar al flujo de IA
          const result = await getFinancialAdvice(summaries);
          setAdvice(result);
        } catch (e) {
          console.error(e);
          setError("Hubo un error al contactar al Asesor de IA. Por favor, inténtalo de nuevo más tarde.");
        } finally {
          setLoading(false);
        }
      };

      generateAdvice();
    }
  }, [isOpen, categories, budgets, transactions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <BrainCircuit className="w-7 h-7" /> Asesor Financiero IA
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Análisis y recomendaciones generadas por IA para ayudarte a mejorar tus finanzas.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-1 my-4 pr-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {advice && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Análisis General</h3>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md border">{advice.analysis}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Recomendaciones</h3>
                <ul className="space-y-3">
                  {advice.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-yellow-100 text-yellow-700 rounded-full p-1 mt-1">
                         <Lightbulb className="w-4 h-4" />
                      </div>
                      <span className="text-sm flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
