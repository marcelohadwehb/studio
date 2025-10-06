import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFormattedNumber(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('es-CL').format(num);
}

export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, dots, and then replace comma with a dot for decimal point if any.
  // For es-CL, '.' is a thousand separator and ',' is a decimal separator.
  // But since we are dealing with integers, we just remove dots.
  const cleanedValue = value.replace(/\$/g, '').replace(/\./g, '').trim();
  const number = parseInt(cleanedValue, 10);
  return isNaN(number) ? 0 : number;
}
