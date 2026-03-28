/**
 * WattZup — Pure Energy Calculation Functions
 * No API calls, no side effects. Pure math.
 */

export function calculateDailyKwh(wattage: number, hours: number, quantity: number): number {
  return (wattage * hours * quantity) / 1000;
}

export function calculateMonthlyCost(dailyKwh: number, ratePerKwh: number, daysInMonth: number = 30): number {
  return dailyKwh * ratePerKwh * daysInMonth;
}

export function calculateBurnRate(totalCostSoFar: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return totalCostSoFar / daysElapsed;
}

export function calculateProjectedBill(dailyAvgCost: number, daysInMonth: number): number {
  return dailyAvgCost * daysInMonth;
}

export function calculateBudgetStatus(projected: number, budget: number): 'under' | 'warning' | 'over' {
  const ratio = projected / budget;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'under';
}

export function calculateWhatIfSavings(
  currentHours: number,
  reducedHours: number,
  wattage: number,
  rate: number,
  quantity: number = 1,
  daysInMonth: number = 30
): number {
  const currentMonthly = calculateMonthlyCost(
    calculateDailyKwh(wattage, currentHours, quantity), rate, daysInMonth
  );
  const reducedMonthly = calculateMonthlyCost(
    calculateDailyKwh(wattage, reducedHours, quantity), rate, daysInMonth
  );
  return currentMonthly - reducedMonthly;
}

export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDaysElapsedInMonth(date: Date = new Date()): number {
  return date.getDate();
}

export function getDaysRemainingInMonth(date: Date = new Date()): number {
  return getDaysInMonth(date) - getDaysElapsedInMonth(date);
}

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

export function calculateCO2Saved(kwhSaved: number): number {
  // Philippine grid emission factor: 0.7 kg CO2 per kWh
  return kwhSaved * 0.7;
}
