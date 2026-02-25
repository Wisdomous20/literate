export default function classifyComprehensionLevel(percentage: number): string {
  if (percentage >= 80) return "INDEPENDENT";
  if (percentage >= 59) return "INSTRUCTIONAL";
  return "FRUSTRATION";
}