import { z } from 'zod';

/**
 * @fileOverview Tipos y esquemas para el flujo de asesoramiento financiero.
 */

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
