import { describe, it, expect } from 'vitest';
import { computeTenure, daysBetweenInclusive, EMPTY_TENURE } from './tenureLogic';

describe('daysBetweenInclusive', () => {
  it('counts both ends', () => {
    expect(daysBetweenInclusive('2026-08-21', '2026-08-21')).toBe(1);
    expect(daysBetweenInclusive('2026-08-20', '2026-08-21')).toBe(2);
  });

  it('crosses months, years and a leap day without drift', () => {
    expect(daysBetweenInclusive('2026-01-30', '2026-02-02')).toBe(4);
    expect(daysBetweenInclusive('2025-12-30', '2026-01-02')).toBe(4);
    expect(daysBetweenInclusive('2028-02-27', '2028-03-01')).toBe(4); // 29 Feb exists
  });
});

describe('computeTenure', () => {
  it('counts day 1 as the first active day', () => {
    expect(computeTenure(['2026-08-21'], '2026-08-21')).toMatchObject({
      firstDate: '2026-08-21', dayNumber: 1, activeDays: 1, totalDays: 1, pct: 100,
    });
  });

  it('computes the rate over elapsed days, not over days logged', () => {
    // active on 3 of the 5 days from Aug 17 to Aug 21
    const t = computeTenure(['2026-08-17', '2026-08-19', '2026-08-21'], '2026-08-21');
    expect(t).toMatchObject({ dayNumber: 5, activeDays: 3, totalDays: 5, pct: 60 });
  });

  it('keeps counting elapsed days when the seeker stops logging', () => {
    // The point of a rate: silence still moves it, but never to a "broken" state.
    const t = computeTenure(['2026-08-01', '2026-08-02'], '2026-08-21');
    expect(t).toMatchObject({ activeDays: 2, totalDays: 21, pct: 10 });
  });

  it('deduplicates: many entries on one day is still one active day', () => {
    const t = computeTenure(['2026-08-20', '2026-08-20', '2026-08-20', '2026-08-21'], '2026-08-21');
    expect(t).toMatchObject({ activeDays: 2, pct: 100 });
  });

  it('accepts timestamps alongside plain dates (quick notes vs task dates)', () => {
    const t = computeTenure(['2026-08-20T09:30:00Z', '2026-08-21'], '2026-08-21');
    expect(t).toMatchObject({ activeDays: 2, totalDays: 2, pct: 100 });
  });

  it('ignores malformed entries rather than crashing', () => {
    const t = computeTenure(['', 'not-a-date', null as unknown as string, '2026-08-21'], '2026-08-21');
    expect(t).toMatchObject({ activeDays: 1, firstDate: '2026-08-21' });
  });

  it('ignores dates after today, which would otherwise inflate the span', () => {
    const t = computeTenure(['2026-08-20', '2026-08-21', '2027-01-01'], '2026-08-21');
    expect(t).toMatchObject({ activeDays: 2, totalDays: 2, pct: 100 });
  });

  it('never exceeds 100%', () => {
    const t = computeTenure(['2026-08-19', '2026-08-20', '2026-08-21'], '2026-08-21');
    expect(t.pct).toBe(100);
  });

  it('returns an empty tenure for no activity or a bad today', () => {
    expect(computeTenure([], '2026-08-21')).toEqual(EMPTY_TENURE);
    expect(computeTenure(['2026-08-21'], 'nonsense')).toEqual(EMPTY_TENURE);
  });

  it('matches the real corpus shape', () => {
    // 100 active days across a 139-day span → 72%
    const dates = Array.from({ length: 100 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 3, 5));
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const t = computeTenure(dates, '2026-08-21');
    expect(t).toMatchObject({ firstDate: '2026-04-05', activeDays: 100, totalDays: 139 });
    expect(t.pct).toBe(72);
  });
});
