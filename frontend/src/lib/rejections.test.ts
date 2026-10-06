import { describe, expect, it } from 'vitest';
import { REJECT_TTL_MS, addRejection, dishKey, prune, removeRejection } from './rejections';

describe('rejections', () => {
  it('thêm chê có hạn 1 giờ', () => {
    const r = addRejection({}, dishKey(1), 1000);
    expect(r['dish:1']).toBe(1000 + REJECT_TTL_MS);
  });
  it('tự bỏ mục hết hạn khi thêm mới', () => {
    const old = { 'dish:1': 500 };
    expect(addRejection(old, 'dish:2', 1000)).not.toHaveProperty('dish:1');
  });
  it('prune giữ mục còn hạn', () => expect(prune({ a: 10, b: 2000 }, 1000)).toEqual({ b: 2000 }));
  it('bỏ chê một mục', () => expect(removeRejection({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 }));
});
