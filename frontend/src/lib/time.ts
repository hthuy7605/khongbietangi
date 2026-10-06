const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function vnMinutes(date = new Date()): number {
  const parts = fmt.formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour')?.value);
  const m = Number(parts.find((p) => p.type === 'minute')?.value);
  return h * 60 + m;
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** null = quán chưa nhập giờ. Hỗ trợ khung giờ qua nửa đêm (vd 18:00-02:00); mở = đóng nghĩa là cả ngày. */
export function isOpenNow(open: string | null, close: string | null, date = new Date()): boolean | null {
  if (!open || !close) return null;
  const n = vnMinutes(date);
  const o = toMin(open);
  const c = toMin(close);
  if (o === c) return true;
  return o < c ? n >= o && n < c : n >= o || n < c;
}
