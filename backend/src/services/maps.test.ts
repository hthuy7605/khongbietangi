import { describe, expect, it } from 'vitest';
import { parseCoords } from './maps';

describe('parseCoords', () => {
  it('ưu tiên !3d!4d của ghim địa điểm', () =>
    expect(parseCoords('https://www.google.com/maps/place/X/@10.7,106.6,17z/data=!3d10.7712!4d106.6912')).toEqual({
      lat: 10.7712,
      lng: 106.6912,
    }));
  it('đọc @lat,lng', () =>
    expect(parseCoords('https://www.google.com/maps/@10.77,106.69,15z')).toEqual({ lat: 10.77, lng: 106.69 }));
  it('đọc ?q=lat,lng', () =>
    expect(parseCoords('https://maps.google.com/?q=10.77,106.69')).toEqual({ lat: 10.77, lng: 106.69 }));
  it('link rút gọn không có tọa độ', () => expect(parseCoords('https://maps.app.goo.gl/abc123')).toBeNull());
});
