/**
 * Proration credit for an unused portion of a subscription period.
 *
 * credit = priceAmountSnapshot × max(0, end − now) / (end − start)
 *
 * Always reads the per-subscription snapshot price (never the mutable Plan row).
 * Returns 0 when the period is missing, already elapsed, or degenerate.
 */
export function computeProrationCredit(input: {
  priceAmountSnapshot: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  now?: Date;
}): number {
  const { priceAmountSnapshot, currentPeriodStart, currentPeriodEnd } = input;
  const now = input.now ?? new Date();

  if (!currentPeriodStart || !currentPeriodEnd) return 0;

  const total = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
  const remaining = currentPeriodEnd.getTime() - now.getTime();

  if (total <= 0 || remaining <= 0) return 0;

  const fraction = Math.min(1, remaining / total);
  return roundCurrency(priceAmountSnapshot * fraction);
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
