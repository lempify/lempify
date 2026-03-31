import { describe, it, expect } from 'vitest';
import { appConfigReducer } from './AppConfigContext';
import type { Site } from '../types';

// ── Fixture ─────────────────────────────────────────────────────────────────

const makeSite = (overrides: Partial<Site> = {}): Site => ({
  name: 'Test Site',
  domain: 'test.local',
  ssl: true,
  ping: null,
  services: { php: '8.4', mysql: '8.0', nginx: '1.0', redis: '7.0', memcached: '1.6' },
  site_type: 'wordpress',
  language: 'php',
  database: 'mysql',
  site_config: { ssl: true, root: '/root', logs: '/logs', ssl_key: '/key', ssl_cert: '/cert' },
  path: '/opt/homebrew/var/www/test.local',
  ...overrides,
});

const defaultState = {
  trusted: false,
  sites: [],
  installed: null as boolean | null,
  settings: {
    mysql_host: 'localhost',
    mysql_user: 'root',
    mysql_password: 'root',
    mysql_port: 3306,
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('appConfigReducer', () => {
  describe('set_trusted', () => {
    it('flips trusted to true', () => {
      const state = appConfigReducer(defaultState, { type: 'set_trusted', trusted: true });
      expect(state.trusted).toBe(true);
    });

    it('flips trusted back to false', () => {
      const state = appConfigReducer(
        { ...defaultState, trusted: true },
        { type: 'set_trusted', trusted: false }
      );
      expect(state.trusted).toBe(false);
    });

    it('does not mutate other fields', () => {
      const sites = [makeSite()];
      const state = appConfigReducer(
        { ...defaultState, sites },
        { type: 'set_trusted', trusted: true }
      );
      expect(state.sites).toBe(sites);
    });
  });

  describe('set_sites', () => {
    it('replaces the sites array', () => {
      const sites = [makeSite(), makeSite({ domain: 'other.local' })];
      const state = appConfigReducer(defaultState, { type: 'set_sites', sites });
      expect(state.sites).toEqual(sites);
    });

    it('clears sites when passed an empty array', () => {
      const state = appConfigReducer(
        { ...defaultState, sites: [makeSite()] },
        { type: 'set_sites', sites: [] }
      );
      expect(state.sites).toHaveLength(0);
    });
  });

  describe('update_site', () => {
    it('updates the site that matches by domain', () => {
      const original = makeSite({ domain: 'test.local', name: 'Old' });
      const updated = makeSite({ domain: 'test.local', name: 'New' });

      const state = appConfigReducer(
        { ...defaultState, sites: [original] },
        { type: 'update_site', site: updated }
      );

      expect(state.sites[0].name).toBe('New');
    });

    it('leaves non-matching sites unchanged', () => {
      const siteA = makeSite({ domain: 'a.local' });
      const siteB = makeSite({ domain: 'b.local', name: 'B' });

      const state = appConfigReducer(
        { ...defaultState, sites: [siteA, siteB] },
        { type: 'update_site', site: makeSite({ domain: 'a.local', name: 'A Updated' }) }
      );

      expect(state.sites[1].name).toBe('B');
    });

    it('keeps the same site count', () => {
      const sites = [makeSite({ domain: 'a.local' }), makeSite({ domain: 'b.local' })];
      const state = appConfigReducer(
        { ...defaultState, sites },
        { type: 'update_site', site: makeSite({ domain: 'a.local' }) }
      );
      expect(state.sites).toHaveLength(2);
    });
  });

  describe('set_config', () => {
    it('replaces the entire config object', () => {
      const newConfig = {
        trusted: true,
        sites: [makeSite()],
        installed: true,
        settings: { mysql_host: '127.0.0.1', mysql_user: 'admin', mysql_password: 'pw', mysql_port: 3307 },
      };
      const state = appConfigReducer(defaultState, { type: 'set_config', config: newConfig });
      expect(state).toEqual(newConfig);
    });
  });

  describe('set_settings', () => {
    it('updates only the settings field', () => {
      const newSettings = { mysql_host: '10.0.0.1', mysql_user: 'dev', mysql_password: 'dev', mysql_port: 3308 };
      const state = appConfigReducer(
        defaultState,
        { type: 'set_settings', config: { settings: newSettings } }
      );
      expect(state.settings).toEqual(newSettings);
    });

    it('does not affect trusted or sites', () => {
      const sites = [makeSite()];
      const state = appConfigReducer(
        { ...defaultState, trusted: true, sites },
        { type: 'set_settings', config: { settings: defaultState.settings } }
      );
      expect(state.trusted).toBe(true);
      expect(state.sites).toBe(sites);
    });
  });

  describe('set_installed', () => {
    it('sets installed to true', () => {
      const state = appConfigReducer(defaultState, { type: 'set_installed', installed: true });
      expect(state.installed).toBe(true);
    });

    it('sets installed to false', () => {
      const state = appConfigReducer(
        { ...defaultState, installed: true },
        { type: 'set_installed', installed: false }
      );
      expect(state.installed).toBe(false);
    });
  });

  describe('unknown action', () => {
    it('returns the same state reference unchanged', () => {
      const state = appConfigReducer(defaultState, { type: '__unknown__' });
      expect(state).toBe(defaultState);
    });
  });
});
