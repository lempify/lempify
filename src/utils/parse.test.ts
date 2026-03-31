import { describe, it, expect } from 'vitest';
import { getCssVar, parsIntCssVar, parsePercentages, parseSiteUrl } from './parse';

// ── parseSiteUrl ─────────────────────────────────────────────────────────────

describe('parseSiteUrl', () => {
  it('uses https when ssl is true', () => {
    expect(parseSiteUrl('lempify.local', true)).toBe('https://lempify.local');
  });

  it('uses http when ssl is false', () => {
    expect(parseSiteUrl('lempify.local', false)).toBe('http://lempify.local');
  });
});

// ── parsePercentages ─────────────────────────────────────────────────────────

describe('parsePercentages', () => {
  it('produces [0, 25, 50, 75, 100] for 25% steps on a total of 100', () => {
    expect(parsePercentages({ total: 100 })).toEqual([0, 25, 50, 75, 100]);
  });

  it('always starts at startAt', () => {
    const result = parsePercentages({ total: 200, startAt: 50, percentage: 50 });
    expect(result[0]).toBe(50);
  });

  it('always ends at total', () => {
    const result = parsePercentages({ total: 200, startAt: 50, percentage: 50 });
    expect(result[result.length - 1]).toBe(200);
  });

  it('returns (100 / percentage) + 1 values', () => {
    // 10% steps → 10 steps from the map + total appended = 11 values
    const result = parsePercentages({ total: 100, percentage: 10 });
    expect(result).toHaveLength(11);
  });
});

// ── getCssVar ────────────────────────────────────────────────────────────────

describe('getCssVar', () => {
  it('reads an inline CSS custom property from an HTMLElement', () => {
    const el = document.createElement('div');
    el.style.setProperty('--my-var', 'red');
    expect(getCssVar({ element: el, cssVar: '--my-var' })).toBe('red');
  });

  it('returns empty string for an SVGElement (non-HTMLElement)', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(getCssVar({ element: el, cssVar: '--my-var' })).toBe('');
  });
});

// ── parsIntCssVar ────────────────────────────────────────────────────────────

describe('parsIntCssVar', () => {
  it('returns 0 when the variable is not set', () => {
    const el = document.createElement('div');
    expect(parsIntCssVar({ element: el, cssVar: '--missing' })).toBe(0);
  });

  it('parses the integer from the inline custom property', () => {
    const el = document.createElement('div');
    el.style.setProperty('--count', '42');
    expect(parsIntCssVar({ element: el, cssVar: '--count' })).toBe(42);
  });
});
