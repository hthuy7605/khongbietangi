import { describe, expect, it } from 'vitest';
import { pickWeighted } from './pick';

describe('pickWeighted', () => {
  it('danh sách rỗng thì trả null', () => expect(pickWeighted([])).toBeNull());
  it('chọn theo ngưỡng trọng số', () => {
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 4 },
    ];
    expect(pickWeighted(items, () => 0)?.id).toBe('a');
    expect(pickWeighted(items, () => 0.19)?.id).toBe('a');
    expect(pickWeighted(items, () => 0.21)?.id).toBe('b');
    expect(pickWeighted(items, () => 0.999)?.id).toBe('b');
  });
  it('phân phối gần đúng tỉ lệ trọng số', () => {
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 3 },
    ];
    let b = 0;
    for (let i = 0; i < 20000; i++) if (pickWeighted(items)?.id === 'b') b++;
    expect(b / 20000).toBeGreaterThan(0.72);
    expect(b / 20000).toBeLessThan(0.78);
  });
});
