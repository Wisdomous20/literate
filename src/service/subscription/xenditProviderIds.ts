export function isXenditRecurringPlanId(providerId: string | null | undefined) {
  if (!providerId) return false;

  return providerId.startsWith("repl_") || providerId.startsWith("recurring_");
}
