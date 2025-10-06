'use server';
/**
 * @fileOverview Flujo de IA para dar consejos financieros.
 *
 * - getFinancialAdvice - Función que obtiene el consejo financiero.
 * - FinancialSummary - El tipo de entrada para el resumen financiero.
 * - FinancialAdvice - El tipo de salida para el consejo financiero.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

export const FinancialSummarySchema = z.object({
    category: z.string().describe('La categoría principal del gasto (ej. "Fijos del hogar", "Alimentación").'),
    subcategory: z.string().describe('La subcategoría específica del gasto (ej. "Dividendo", "Supermercado").'),
    budgeted: z.number().describe('El monto presupuestado para esta subcategoría.'),
    spent: z.number().describe('El monto gastado en esta subcategoría.'),
    difference: z.number().describe('La diferencia entre lo presupuestado y lo gastado (presupuestado - gastado).'),
});

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

export const FinancialAdviceSchema = z.object({
    analysis: z.string().describe('Un análisis general de la situación financiera basado en los datos proporcionados.'),
    recommendations: z.array(z.string()).describe('Una lista de recomendaciones específicas y accionables para mejorar la salud financiera.'),
});

export type FinancialAdvice = z.infer<typeof FinancialAdviceSchema>;


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
