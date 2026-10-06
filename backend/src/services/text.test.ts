import { describe, expect, it } from 'vitest';
import { normalize, similar } from './text';

describe('text', () => {
  it('bỏ dấu tiếng Việt', () => expect(normalize('Phở Bò Đặc Biệt!')).toBe('pho bo dac biet'));
  it('nhận ra tên gần giống', () => {
    expect(similar('Phở bò', 'pho bo')).toBe(true);
    expect(similar('Bún chả Hương Liên', 'Bun cha Huong Lien ')).toBe(true);
  });
  it('tên chứa nguyên tên kia thì coi là gần giống, trừ tên quá ngắn', () => {
    expect(similar('Phở bò', 'Phở bò tái')).toBe(true);
    expect(similar('Cơm', 'Cơm tấm')).toBe(false);
  });
  it('phân biệt tên khác', () => expect(similar('Phở bò', 'Cơm tấm')).toBe(false));
});
