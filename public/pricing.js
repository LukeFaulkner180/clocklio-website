export function fullWorkspaceAnnualPence(employees) {
  if (!Number.isInteger(employees) || employees < 1 || employees > 10000) return null;
  return 29999 + Math.max(0, employees - 5) * 4500;
}
