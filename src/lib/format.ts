// ₹ with Indian digit grouping, e.g. 85395 → "₹85,395"
export function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
