import { describe, expect, it } from 'vitest';
import { isOpenNow } from './time';

// 2026-01-15 03:30 UTC = 10:30 giờ Việt Nam
const at = (vnHour: number, vnMin = 0) => new Date(Date.UTC(2026, 0, 15, vnHour - 7, vnMin));

describe('isOpenNow', () => {
  it('chưa nhập giờ thì không biết', () => expect(isOpenNow(null, null)).toBeNull());
  it('trong khung giờ thường', () => {
    expect(isOpenNow('06:00', '22:00', at(10, 30))).toBe(true);
    expect(isOpenNow('06:00', '22:00', at(22, 0))).toBe(false);
    expect(isOpenNow('06:00', '22:00', at(5, 59))).toBe(false);
  });
  it('khung giờ qua nửa đêm', () => {
    expect(isOpenNow('18:00', '02:00', at(23))).toBe(true);
    expect(isOpenNow('18:00', '02:00', at(1, 30))).toBe(true);
    expect(isOpenNow('18:00', '02:00', at(10))).toBe(false);
  });
  it('mở = đóng nghĩa là cả ngày', () => expect(isOpenNow('00:00', '00:00', at(15))).toBe(true));
});
