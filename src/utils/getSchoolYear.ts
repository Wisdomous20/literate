export function getSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const previousYear = currentYear - 1;

  // Determine the school year based on the current month.
  // getMonth() is 0-indexed, so 5 = June. The Philippine school year starts
  // in June, so June onward already belongs to the new school year.
  if (now.getMonth() < 5) {
    // January to May: Previous year - Current year
    return `${previousYear}-${currentYear}`;
  } else {
    // June to December: Current year - Next year
    return `${currentYear}-${nextYear}`;
  }
}