/**
 * WattZup — Server-Side Energy Math Utilities
 */

export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDaysElapsedInMonth(date: Date = new Date()): number {
  return date.getDate();
}

export function getDaysRemainingInMonth(date: Date = new Date()): number {
  const total = getDaysInMonth(date);
  const elapsed = getDaysElapsedInMonth(date);
  return Math.max(0, total - elapsed);
}

export function calculateBurnRate(totalCost: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return totalCost / daysElapsed;
}

/**
 * Formats a number into Philippine Peso (PHP)
 */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}