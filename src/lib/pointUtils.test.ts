import { describe, expect, it } from 'vitest';
import { buildPoints, formatPrice } from './pointUtils';
import { formatTimeLocal } from './dateUtils';
import { bestTimeLabels } from './priceUtils';
import { clockSlotAt } from './chartHelpers';
import { generateICSUri } from './icsUtils';

const HALF_HOUR = 30 * 60_000;
const t0 = new Date(2026, 0, 10, 10, 0).getTime(); // local 10:00
const slots = [12, 20, 8, 30, 16].map((price, i) => ({
  startMs: t0 + i * HALF_HOUR,
  endMs: t0 + (i + 1) * HALF_HOUR,
  price,
}));

describe('buildPoints', () => {
  it('drops slots older than the lookback and sets status / colours', () => {
    const now = t0 + 2.5 * HALF_HOUR; // 11:15, inside slot 2
    const points = buildPoints(slots, now);
    // lookback is 1h: 10:00 is not after 10:15, so it is dropped
    expect(points.map((p) => p.label)).toEqual([
      '10:30am',
      '11am',
      '11:30am',
      '12pm',
    ]);
    expect(points.map((p) => p.status)).toEqual([
      'past',
      'active',
      'upcoming',
      'upcoming',
    ]);
    expect(points[0].color).toBe('rgba(0,120,212,0.5)');
    expect(points[1].color).toBe('rgb(46,204,113)'); // cheapest is green
    expect(points[2].color).toBe('rgb(231,76,60)'); // most expensive is red
    expect(points.map((p) => p.isOnTheHour)).toEqual([
      false,
      true,
      false,
      true,
    ]);
    expect(
      points.every(
        (p) => p.isConfirmed && p.low === p.price && p.high === p.price,
      ),
    ).toBe(true);
  });

  it('appends up to a day of forecast after the last published slot', () => {
    const now = t0;
    const last = slots[slots.length - 1].startMs;
    const forecast = [
      { startMs: last, price: 99, low: 98, high: 100 }, // overlaps published: ignored
      { startMs: last + HALF_HOUR, price: 15, low: 10, high: 21 },
      { startMs: last + 24 * 3_600_000, price: 15, low: 10, high: 21 }, // exactly 1 day: kept
      {
        startMs: last + 24 * 3_600_000 + HALF_HOUR,
        price: 15,
        low: 10,
        high: 21,
      }, // beyond: dropped
    ];
    const points = buildPoints(slots, now, forecast);
    const predicted = points.filter((p) => !p.isConfirmed);
    expect(points).toHaveLength(slots.length + 2);
    expect(predicted.map((p) => p.startMs)).toEqual([
      forecast[1].startMs,
      forecast[2].startMs,
    ]);
    expect(predicted[0]).toMatchObject({
      price: 15,
      low: 10,
      high: 21,
      status: 'upcoming',
      color: 'transparent',
    });
    expect(formatPrice(predicted[0])).toBe('10.00–21.00p/kWh');
    expect(formatPrice(points[0], 'p')).toBe('12.00p');
  });

  it('returns nothing without published prices', () => {
    expect(
      buildPoints([], t0, [{ startMs: t0, price: 1, low: 0, high: 2 }]),
    ).toEqual([]);
  });
});

describe('formatTimeLocal', () => {
  it.each([
    [0, 0, '12am'],
    [0, 30, '12:30am'],
    [9, 5, '9:05am'],
    [12, 0, '12pm'],
    [23, 30, '11:30pm'],
  ])('%i:%i -> %s', (h, m, expected) => {
    expect(formatTimeLocal(new Date(2026, 0, 1, h, m))).toBe(expected);
  });
});

describe('bestTimeLabels', () => {
  it('groups consumers that share a best start, skipping unknown ones', () => {
    const c = (hours: number, minutes: number, bestStartMs?: number) => ({
      config: { name: `${hours}`, duration: { hours, minutes }, timers: [] },
      bestStartMs,
    });
    const labels = bestTimeLabels([
      c(1, 0, 5),
      c(2, 25, 5),
      c(1, 0, 5),
      c(3, 0, 9),
      c(6, 0),
    ]);
    expect([...labels]).toEqual([
      [5, '1h, 2h25m'],
      [9, '3h'],
    ]);
  });
});

describe('clockSlotAt', () => {
  it('maps pointer angle to half-hour slots clockwise from 12 o’clock', () => {
    const at = (hours: number) => {
      const a = (hours / 12) * 2 * Math.PI - Math.PI / 2;
      return clockSlotAt(
        100 + 50 * Math.cos(a),
        100 + 50 * Math.sin(a),
        200,
        200,
      );
    };
    expect(at(0.1).slot).toBe(0);
    expect(at(0.6).slot).toBe(1);
    expect(at(3.2).slot).toBe(6);
    expect(at(7.2).slot).toBe(14);
    expect(at(11.9).slot).toBe(23);
    expect(at(7.2).hours).toBeCloseTo(7.2);
  });
});

describe('generateICSUri', () => {
  it('builds a calendar event with a reminder alarm', () => {
    const uri = generateICSUri(
      Date.UTC(2026, 0, 5, 13, 30),
      'https://example.com/',
      'Set Washer, now; please',
      'Line 1\nLine 2',
    );
    expect(uri.startsWith('data:text/calendar;charset=utf-8,')).toBe(true);
    const ics = decodeURIComponent(uri.split(',').slice(1).join(','));
    expect(ics).toContain('\r\nDTSTART:20260105T133000Z\r\n');
    expect(ics).toContain('\r\nSUMMARY:Set Washer\\, now\\; please\r\n');
    expect(ics).toContain('\r\nDESCRIPTION:Line 1\\nLine 2\r\n');
    expect(ics).toContain('\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\n');
    expect(ics).toContain('\r\nTRIGGER:-PT10S\r\n');
    expect(ics.split('\r\n').every((line) => line.length <= 75)).toBe(true);
  });
});
