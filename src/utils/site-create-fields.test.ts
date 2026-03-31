import { describe, it, expect } from 'vitest';
import fieldRelationships from './site-create-fields';

const domainField = fieldRelationships.find(f => f.name === 'domain')!;
const siteTypeField = fieldRelationships.find(f => f.name === 'site_type')!;
const phpField = fieldRelationships.find(f => f.name === 'php_version')!;

describe('domain field', () => {
  const pattern = new RegExp(`^${domainField.inputAttributes!.pattern}$`);

  it('is required', () => {
    expect(domainField.required).toBe(true);
  });

  it('has a validationMessage', () => {
    expect(domainField.validationMessage).toBeTruthy();
  });

  it.each([
    'lempify.local',
    'my-site.test',
    'sub.domain.local',
    'wordpress.dev',
  ])('pattern accepts valid domain: %s', domain => {
    expect(pattern.test(domain)).toBe(true);
  });

  it.each([
    ['lempify', 'no dot'],
    ['lempify.', 'empty TLD'],
    ['.local', 'empty name'],
    ['my site.local', 'contains space'],
  ])('pattern rejects "%s" (%s)', domain => {
    expect(pattern.test(domain)).toBe(false);
  });
});

describe('site_type field', () => {
  it('does not include Laravel', () => {
    const laravel = siteTypeField.options?.find(o => o.name === 'laravel');
    expect(laravel).toBeUndefined();
  });

  it('includes Vanilla and WordPress', () => {
    const names = siteTypeField.options?.map(o => o.name);
    expect(names).toContain('vanilla');
    expect(names).toContain('wordpress');
  });
});

describe('php_version field', () => {
  it('has an optionsContainerClassName for the pill layout', () => {
    expect(phpField.optionsContainerClassName).toBeTruthy();
  });

  it('hides the radio input via sr-only on every option', () => {
    phpField.options?.forEach(opt => {
      expect(opt.className).toBe('sr-only');
    });
  });

  it('provides a labelClassName for every option', () => {
    phpField.options?.forEach(opt => {
      expect(opt.labelClassName).toBeTruthy();
    });
  });
});
