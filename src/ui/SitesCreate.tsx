/**
 * External imports
 */
import { FormEvent, useState } from 'react';

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
import { buttonPrimary, cornerTopRight, pageSection } from './css';
import { useAppConfig } from '../context/AppConfigContext';
import { Site } from '../types';
import { DEFAULT_SITE_TYPE } from '../constants';
import Heading from './Heading';

/**
 * Constants
 */
const defaultPayload = {
  domain: '',
  ssl: true,
  type: DEFAULT_SITE_TYPE,
};

type Payload = {
  domain: string;
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload: Payload = {
      domain: formValues.domain,
      site_type: formValues.type,
      ssl: formValues.ssl,
      site_type_config: {},
    };

    for (const [key, value] of Object.entries(formValues)) {
      // i.e. type|wordpress
      if (key.includes(`type|${formValues.type}|`)) {
        const [nestedKey, , nestedName] = key.split('|');
        if (nestedKey === 'type') {
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
    <div id='create-site' className={`${pageSection} ${cornerTopRight}`}>
      <details>
        <summary className='text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)] mb-8'>
          <Heading size='h2'>Create New Site</Heading>
        </summary>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 gap-10 mb-10'>
            {siteCreateFields.map(field => (
              <div className={field.wrapperClassName ?? ''} key={field.name}>
                <FormFields
                  {...field}
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
            disabled={formValues?.domain === ''}
            className={buttonPrimary}
          >
            Submit form
          </button>
        </form>
        <Loader isVisible={invokeStatus === 'pending'} />
      </details>
    </div>
  );
}
