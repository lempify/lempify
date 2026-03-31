/**
 * External imports
 */
import { listen } from '@tauri-apps/api/event';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { FormEvent, useEffect, useRef, useState } from 'react';

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
import { DEFAULT_PHP_VERSION, DEFAULT_SITE_TYPE } from '../constants';
import { useLempifyd } from '../context/LempifydContext';
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
  php_version: DEFAULT_PHP_VERSION,
};

type Payload = {
  domain: string;
  site_name: string;
  ssl: boolean;
  site_type: string;
  site_type_config: Record<string, any>;
  php_version: string;
};

export default function SiteCreate({ onRefresh }: { onRefresh: () => void }) {
  const { invoke, invokeStatus } = useInvoke();
  const { emit } = useLempifyd();
  const [formValues, setFormValues] = useState<Record<string, any>>({
    ...defaultPayload,
  });
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    // Use raw invoke to avoid affecting the create-site loader state
    tauriInvoke<string>('get_stable_php_version')
      .then(version => setFormValues(prev => ({ ...prev, php_version: version })))
      .catch(() => {});
  }, []);
  const [createError, setCreateError] = useState<string | null>(null);
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
      php_version: formValues.php_version,
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

    setCurrentStep('');
    setCreateError(null);
    const unlisten = await listen<string>('site:progress', e => setCurrentStep(e.payload));

    try {
      const { data, error } = await invoke<Site>('create_site', {
        payload,
      });
      if (error) {
        setCreateError(error);
      } else if (data?.domain.toLowerCase() === formValues.domain.toLowerCase()) {
        emit(`php@${formValues.php_version || DEFAULT_PHP_VERSION}`, 'start');
        setFormValues({ ...defaultPayload });
        dispatch({ type: 'set_sites', sites: [...config.sites, data] });
      }
    } catch (err) {
      console.error('Failed to create site:', err);
    } finally {
      unlisten();
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
          split
          size='h2'
          className='flex-1 select-none'
          title={`${open ? 'Creating' : 'Create'} New Site`}
        />
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 gap-6 mb-8'>
          {siteCreateFields.map((field, index) => (
            <div className={field.wrapperClassName ?? ''} key={field.name}>
              <FormFields
                {...field}
                fieldPrefix='sites'
                inputRef={index === 0 ? inputRef : null}
                key={field.name}
                value={formValues[field.name]}
                onChange={(value, fieldName = field.name) =>
                  setFormValues(prev => ({ ...prev, [fieldName]: value }))
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
          Create Site
        </button>
      </form>
      <Loader isVisible={invokeStatus === 'pending'}>
        {currentStep && (
          <p className='text-xs text-neutral-600 dark:text-neutral-400 text-center max-w-xs'>
            {currentStep}
          </p>
        )}
      </Loader>
      {createError && (
        <p className='mt-4 text-sm text-red-500'>{createError}</p>
      )}
    </Details>
  );
}
