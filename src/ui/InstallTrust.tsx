import { useEffect } from 'react';
import { buttonPrimary, glowLine, monoGradientToLeft } from './css';
import Details from './Details';
import Heading from './Heading';
import { SvgShield, SvgTool } from './Svg';
import Button from './Button';
import { useAppConfig } from '../context/AppConfigContext';
import { useInvoke } from '../hooks/useInvoke';
import Brand from './Brand';
import SvgTriangle from './Svg/SvgTriangle';

const BORDER_CSS_COLORS = 'border-white dark:border-black';
const BORDER_DASHED_CSS_COLORS =
  'border-dashed border-neutral-300 dark:border-neutral-700';

export default function InstallTrust() {
  const { invoke } = useInvoke();
  const { config, dispatch } = useAppConfig();
  const { trusted } = config;

  async function handleTrust() {
    await invoke(trusted ? 'untrust_lempify' : 'trust_lempify');
    dispatch({ type: 'set_trusted', trusted: !trusted });
  }

  return (
    <div className='text-neutral-600 dark:text-neutral-400'>
      <Heading
        size='h2'
        className='mb-10'
        title='Trust Lempify'
        split
        align='right'
      />

      <div
        className={`grid grid-cols-1 md:grid-cols-[1fr_2fr] md:gap-4 border-y ${BORDER_CSS_COLORS} mb-10`}
      >
        <div
          className={`flex items-center justify-center p-4 bg-white dark:bg-black`}
        >
          <p className=''>
            <span className='text-[var(--lempify-primary)] font-bold'>
              Lempify
            </span>{' '}
            needs{' '}
            <span className='text-black dark:text-white font-bold'>
              elevated privileges
            </span>{' '}
            for a few specific operations.
          </p>
        </div>

        <div className='py-5 md:py-10'>
          <ul className='text-sm'>
            <li className='mb-2'>
              Updating your hosts file. This allows your website to be
              accessible on your local network under{' '}
              <span className='text-black dark:text-white font-bold'>
                any domain
              </span>
              .
            </li>
            <li className='mb-2'>
              Writing files to your package manager directory i.e.{' '}
              <code>/opt/homebrew/</code>
            </li>
          </ul>
        </div>
      </div>

      <div className={`grid grid-cols-[2fr_1fr] md:gap-4 mb-10`}>
        <div className='flex justify-center items-center'>
          <p className='text-lg text-neutral-900 dark:text-neutral-100'>
            You can either enter your password each time, or grant{' '}
            <span className='text-[var(--lempify-primary)] font-bold'>
              Lempify
            </span>{' '}
            trusted access to avoid repeated prompts.
          </p>
        </div>

        <div className='flex justify-center items-center'>
          <p className='text-sm'>
            This can be toggled on/off anytime by clicking the{' '}
            <SvgShield
              className='inline-flex text-neutral-500 dark:text-neutral-500'
              size={16}
            />{' '}
            button in the header of the app.
          </p>
        </div>
        <div
          className={`col-span-2 relative flex justify-center items-center ${glowLine}`}
        >
          <img
            src='/header-trust.png'
            alt='Lempify header'
            className='rounded-tr-lg rounded-tl-lg border-x border-t border-neutral-200 dark:border-neutral-800 w-[90%]'
          />
        </div>
      </div>

      <div className='flex justify-center items-center mb-10'>
        <Button
          size='lg'
          className={`${buttonPrimary} group`}
          onClick={handleTrust}
        >
          <SvgShield
            size={24}
            className={`inline-flex mr-2 group-hover:text-[var(--lempify-green)] group-hover:scale-110 transition-scale duration-300 ${
              trusted
                ? 'text-[var(--lempify-green)]'
                : 'text-neutral-500 dark:text-neutral-500'
            }`}
          />
          Click to {trusted ? 'untrust' : 'trust'}
        </Button>
      </div>

      <div className='mb-10 bg-white dark:bg-black'>
        <Details
          className={`group py-5 px-4`}
          icon={{
            size: 16,
          }}
          summary={() => (
            <Heading
              size='h4'
              className='flex-1 select-none'
              title='How does this work?'
            />
          )}
        >
          <p className='mb-4 text-sm'>
            Trust creates a sudoers entry that allows Lempify to run specific
            commands without password prompts:
          </p>
          <pre className='bg-neutral-100 dark:bg-neutral-900 p-4 rounded-md text-sm overflow-x-auto mb-4'>
            {`# Allow /Applications/Lempify.app to run sudo commands without password
{username} ALL=(ALL) NOPASSWD: ALL`}
          </pre>
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>
            This file is created at <code>/etc/sudoers.d/lempify</code>.
          </p>
        </Details>
      </div>

      <p className='mb-6'>
        To begin creating amazing digital experiences, click the "Finish"
        button.
      </p>
    </div>
  );
}
