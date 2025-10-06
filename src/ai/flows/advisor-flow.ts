'use server';
/**
 * @fileOverview Flujo de IA para dar consejos financieros.
 *
 * - getFinancialAdvice - Función que obtiene el consejo financiero.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FinancialSummarySchema, FinancialAdviceSchema, type FinancialSummary, type FinancialAdvice } from './advisor-types';

export async function getFinancialAdvice(summaries: FinancialSummary[]): Promise<FinancialAdvice> {
  return financialAdvisorFlow(summaries);
}

const financialAdvisorFlow = ai.defineFlow(
  {
    name: 'financialAdvisorFlow',
    inputSchema: z.array(FinancialSummarySchema),
    outputSchema: FinancialAdviceSchema,
  },
  async (summaries) => {
    
    const prompt = `
      Eres un asesor financiero experto. Tu tarea es analizar el siguiente resumen de presupuestos y gastos de una familia.
      Basado en estos datos, proporciona un análisis claro y conciso de su situación financiera y ofrece recomendaciones prácticas para mejorar su manejo del dinero.
      
      Datos financieros:
      ${JSON.stringify(summaries, null, 2)}

      En tu análisis, identifica las categorías con mayores gastos, los mayores déficits (donde se gastó más de lo presupuestado) y también las áreas donde hubo superávits (se gastó menos de lo presupuestado).
      
      Tus recomendaciones deben ser específicas, realistas y fáciles de implementar. Por ejemplo, en lugar de decir "gasta menos en comida", podrías sugerir "considera optimizar tus compras en el supermercado en la categoría 'Alimentación', donde se observa un gasto superior al presupuesto".
      
      Sé directo, empático y constructivo en tu comunicación. El objetivo es empoderar a la familia para que tomen mejores decisiones financieras, no criticarlos.
      
      Devuelve tu respuesta en el formato JSON especificado.
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
          schema: FinancialAdviceSchema,
      }
    });

    return output!;
  }
);
