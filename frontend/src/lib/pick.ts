/** Chọn ngẫu nhiên theo trọng số (weight 1-5): weight 5 có xác suất gấp 5 lần weight 1. */
export function pickWeighted<T extends { weight: number }>(items: T[], rand: () => number = Math.random): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.weight;
    if (r < 0) return it;
  }
  return items[items.length - 1] ?? null;
}
