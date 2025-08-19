/**
 * External imports
 */
import { FormEvent, useRef, useState } from 'react';

/**
 * Internal imports
 */
// Components
import FormFields from './FormFields';
// Hooks
import { useInvoke } from '../hooks/useInvoke';

// Constants
import siteCreateFields from '../utils/site-create-fields';
import Loader from './Loader';
import { buttonPrimary } from './css';
import { useAppConfig } from '../context/AppConfigContext';
import { Site } from '../types';
import { DEFAULT_SITE_TYPE } from '../constants';
import Heading from './Heading';
import Details from './Details';

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

export default function SiteCreate({ onRefresh }: { onRefresh: () => void }) {
  const { invoke, invokeStatus } = useInvoke();
  const [formValues, setFormValues] = useState<Record<string, any>>({
    ...defaultPayload,
  });
  const { config, dispatch } = useAppConfig();
  const inputRef = useRef<HTMLInputElement>(null);
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

    try {
      const { data, error } = await invoke<Site>('create_site', {
        payload,
      });
      if (error) {
        console.error('Failed to create site:', error);
      }
      if (data?.domain === formValues.domain) {
        setFormValues({ ...defaultPayload });
        dispatch({ type: 'set_sites', sites: [...config.sites, data] });
      }
    } catch (err) {
      console.error('Failed to create site:', err);
    } finally {
      onRefresh();
    }
  }

  return (
    <Details
      className={`group`}
      icon={{
        size: 20,
      }}
      onToggle={open => {
        if (open) {
          inputRef.current?.focus();
        }
      }}
      summary={open => (
        <Heading
          size='h2'
          className='flex-1 select-none'
          title={`${open ? 'Creating' : 'Create'} New Site`}
        />
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 gap-10 mb-10'>
          {siteCreateFields.map((field, index) => (
            <div className={field.wrapperClassName ?? ''} key={field.name}>
              <FormFields
                {...field}
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
    </Details>
  );
}
