export function fullWorkspacePlan(employees) {
  if (!Number.isInteger(employees) || employees < 1 || employees > 50) return null;
  if (employees < 10) return { code: 'starter', name: 'Starter', employeeLimit: Math.max(5, employees), price: 29999 + Math.max(0, employees - 5) * 4500 };
  if (employees <= 15) return { code: 'team', name: 'Team', employeeLimit: 15, price: 64999 };
  if (employees <= 30) return { code: 'business', name: 'Business', employeeLimit: 30, price: 114999 };
  return { code: 'scale', name: 'Scale', employeeLimit: 50, price: 189999 };
}
export function fullWorkspaceAnnualPence(employees) {
  return fullWorkspacePlan(employees)?.price ?? null;
}

export function clockxPlan(employees) {
  if (!Number.isInteger(employees) || employees < 1 || employees > 20) return null;
  if (employees <= 5) return { code: 'starter', name: 'Clockx 5', employeeLimit: 5, price: 14999 };
  if (employees <= 10) return { code: 'team', name: 'Clockx 10', employeeLimit: 10, price: 21999 };
  return { code: 'business', name: 'Clockx 20', employeeLimit: 20, price: 36999 };
}
