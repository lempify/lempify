import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormFields from './FormFields';

describe('FormFields', () => {
  describe('id generation', () => {
    it('uses name as id when no fieldPrefix is given', () => {
      render(
        <FormFields name='domain' type='text' value='' onChange={() => {}} />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'domain');
    });

    it('prefixes the id when fieldPrefix is provided', () => {
      render(
        <FormFields
          name='domain'
          type='text'
          fieldPrefix='sites'
          value=''
          onChange={() => {}}
        />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'sites-domain');
    });

    it('links label htmlFor to the prefixed id', () => {
      render(
        <FormFields
          name='domain'
          type='text'
          label='Domain'
          labelPosition='top'
          fieldPrefix='sites'
          value=''
          onChange={() => {}}
        />
      );
      expect(screen.getByText('Domain')).toHaveAttribute('for', 'sites-domain');
    });
  });

  describe('validationMessage', () => {
    it('renders the message in the DOM when provided', () => {
      render(
        <FormFields
          name='domain'
          type='text'
          value=''
          onChange={() => {}}
          validationMessage='Must match format: name.tld'
        />
      );
      expect(
        screen.getByText('Must match format: name.tld')
      ).toBeInTheDocument();
    });

    it('adds the peer class to the input when validationMessage is set', () => {
      render(
        <FormFields
          name='domain'
          type='text'
          value=''
          onChange={() => {}}
          validationMessage='Must match format: name.tld'
        />
      );
      expect(screen.getByRole('textbox').className).toContain('peer');
    });

    it('does not add peer class when validationMessage is omitted', () => {
      render(
        <FormFields name='domain' type='text' value='' onChange={() => {}} />
      );
      expect(screen.getByRole('textbox').className).not.toContain('peer');
    });
  });

  describe('radio options', () => {
    const options = [
      { label: 'PHP 8.4', name: '8.4', type: 'checkbox' as const },
      { label: 'PHP 8.3', name: '8.3', type: 'checkbox' as const },
    ];

    it('prefixes each radio option id with fieldPrefix', () => {
      render(
        <FormFields
          name='php_version'
          type='radio'
          fieldPrefix='sites'
          value='8.4'
          onChange={() => {}}
          options={options}
        />
      );
      expect(screen.getByDisplayValue('8.4')).toHaveAttribute(
        'id',
        'sites-8.4'
      );
      expect(screen.getByDisplayValue('8.3')).toHaveAttribute(
        'id',
        'sites-8.3'
      );
    });

    it('applies optionsContainerClassName as a wrapper div', () => {
      const { container } = render(
        <FormFields
          name='php_version'
          type='radio'
          value='8.4'
          onChange={() => {}}
          options={options}
          optionsContainerClassName='flex flex-wrap gap-2'
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper.className).toContain('flex');
    });
  });
});
