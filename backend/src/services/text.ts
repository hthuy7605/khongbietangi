export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bigrams(s: string): string[] {
  const t = s.replace(/ /g, '');
  return t.length < 2 ? [t] : Array.from({ length: t.length - 1 }, (_, i) => t.slice(i, i + 2));
}

export function similar(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.length >= 5 && ` ${long} `.includes(` ${short} `)) return true;
  const A = bigrams(x);
  const pool = bigrams(y);
  const total = A.length + pool.length;
  let hit = 0;
  for (const g of A) {
    const i = pool.indexOf(g);
    if (i >= 0) {
      hit++;
      pool.splice(i, 1);
    }
  }
  return (2 * hit) / total >= 0.8;
}
