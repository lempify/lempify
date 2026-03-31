import { describe, it, expect, beforeEach } from 'vitest';
import { Storage, getPreferences, setPreferences } from './storage';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get()', () => {
    it('returns defaultValue when nothing is stored', () => {
      const s = new Storage({ key: 'test', defaultValue: 'fallback' });
      expect(s.get()).toBe('fallback');
    });

    it('returns a stored value', () => {
      const s = new Storage({ key: 'test', defaultValue: '' });
      s.set('hello');
      expect(s.get()).toBe('hello');
    });

    it('returns defaultValue when stored data is invalid JSON', () => {
      localStorage.setItem('test', '{{bad');
      const s = new Storage({ key: 'test', defaultValue: 99 });
      expect(s.get()).toBe(99);
    });

    it('uses a custom deserializer when provided', () => {
      localStorage.setItem('test', 'HELLO');
      const s = new Storage({
        key: 'test',
        defaultValue: '',
        serialize: v => v,
        deserialize: v => v.toLowerCase(),
      });
      expect(s.get()).toBe('hello');
    });
  });

  describe('set()', () => {
    it('persists the value to localStorage', () => {
      const s = new Storage({ key: 'test', defaultValue: 0 });
      s.set(123);
      expect(localStorage.getItem('test')).toBe('123');
    });

    it('uses a custom serializer when provided', () => {
      const s = new Storage({
        key: 'test',
        defaultValue: '',
        serialize: v => v.toUpperCase(),
        deserialize: v => v,
      });
      s.set('hello');
      expect(localStorage.getItem('test')).toBe('HELLO');
    });
  });

  describe('remove()', () => {
    it('removes the key from localStorage', () => {
      const s = new Storage({ key: 'test', defaultValue: '' });
      s.set('value');
      s.remove();
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('get() returns defaultValue after remove()', () => {
      const s = new Storage({ key: 'test', defaultValue: 'default' });
      s.set('stored');
      s.remove();
      expect(s.get()).toBe('default');
    });
  });

  describe('has()', () => {
    it('returns false when the key is not set', () => {
      const s = new Storage({ key: 'test', defaultValue: '' });
      expect(s.has()).toBe(false);
    });

    it('returns true after set()', () => {
      const s = new Storage({ key: 'test', defaultValue: '' });
      s.set('x');
      expect(s.has()).toBe(true);
    });

    it('returns false after remove()', () => {
      const s = new Storage({ key: 'test', defaultValue: '' });
      s.set('x');
      s.remove();
      expect(s.has()).toBe(false);
    });
  });
});

describe('getPreferences / setPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty object when nothing is stored', () => {
    expect(getPreferences()).toEqual({});
  });

  it('round-trips an arbitrary preferences object', () => {
    setPreferences({ theme: 'dark', sidebarWidth: 200 });
    expect(getPreferences()).toEqual({ theme: 'dark', sidebarWidth: 200 });
  });

  it('overwrites previous preferences on a second call', () => {
    setPreferences({ theme: 'dark' });
    setPreferences({ theme: 'light' });
    expect(getPreferences()).toEqual({ theme: 'light' });
  });
});
