export function getSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const previousYear = currentYear - 1;

  // Determine the school year based on the current month
  if (now.getMonth() < 6) {
    // January to June: Previous year - Current year
    return `${previousYear}-${currentYear}`;
  } else {
    // July to December: Current year - Next year
    return `${currentYear}-${nextYear}`;
  }
}