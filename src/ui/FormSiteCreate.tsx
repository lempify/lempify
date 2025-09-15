import { FormEvent, useRef, useState } from 'react';

import { buttonPrimary } from './css';

import { Site } from '../types';
import FormFields from './FormFields';
import Loader from './Loader';

import { useInvoke } from '../hooks/useInvoke';
import { useAppConfig } from '../context/AppConfigContext';
import { DEFAULT_SITE_TYPE } from '../constants';
import siteCreateFields from '../utils/site-create-fields';

/**
 * Constants
 */
const defaultPayload = {
  domain: '',
  site_name: '',
  ssl: true,
  site_type: DEFAULT_SITE_TYPE,
  site_type_config: {},
};

type Payload = {
  domain: string;
  site_name: string;
  ssl: boolean;
  site_type: string;
  site_type_config: Record<string, any>;
};
export function FormSiteCreate({
  fieldPrefix = '',
  onRefresh,
  onSubmit,
}: {
  fieldPrefix: string;
  onRefresh: () => void;
  onSubmit: (domain: string) => void;
}) {
  const { invoke, invokeStatus } = useInvoke();
  const [formValues, setFormValues] = useState<Record<string, any>>({
    ...defaultPayload,
  });
  const { config, dispatch } = useAppConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Handle form submission
   * @param e
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload: Payload = {
      domain: formValues.domain,
      site_name: formValues.site_name,
      ssl: formValues.ssl,
      site_type: formValues.site_type,
      site_type_config: {},
    };

    for (const [key, value] of Object.entries(formValues)) {
      // i.e. site_type|wordpress
      if (key.includes(`site_type|${formValues.site_type}|`)) {
        const [nestedKey, , nestedName] = key.split('|');
        if (nestedKey === 'site_type') {
          payload['site_type_config'][nestedName] = value ?? {};
        }
        // Handle other cases in the future.
      }
    }

    let domain = '';

    try {
      const { data, error } = await invoke<Site>('create_site', {
        payload,
      });
      if (error) {
        console.error('Failed to create site:', error);
      }
      if (data?.domain === formValues.domain) {
        domain = data?.domain ?? '';
        setFormValues({ ...defaultPayload });
        dispatch({ type: 'set_sites', sites: [...config.sites, data] });
      }
    } catch (err) {
      console.error('Failed to create site:', err);
    } finally {
      onSubmit(domain);
      onRefresh();
    }
  }
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 gap-10 mb-10'>
          {siteCreateFields.map((field, index) => (
            <div className={field.wrapperClassName ?? ''} key={field.name}>
              <FormFields
                {...field}
                fieldPrefix={fieldPrefix || ''}
                inputRef={index === 0 ? inputRef : null}
                key={field.name}
                value={formValues[field.name]}
                onChange={(value, fieldName = field.name) =>
                  setFormValues({ ...formValues, [fieldName]: value })
                }
              />
            </div>
          ))}
        </div>
        <button
          type='submit'
          disabled={
            formValues?.domain === '' || !formValues?.domain.includes('.')
          }
          className={buttonPrimary}
        >
          Submit form
        </button>
      </form>
      <Loader isVisible={invokeStatus === 'pending'} />
    </>
  );
}
