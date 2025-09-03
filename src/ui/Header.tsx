/**
 * Header component
 *
 * This component is the header of the application.
 * It displays the logo, the services status, and the dark mode toggle.
 */

/**
 * Internal dependencies
 */
import { useInvoke } from '../hooks/useInvoke';
import { useAppConfig } from '../context/AppConfigContext';
import { useHistory } from '../hooks/useHistory';

import Button from './Button';
import HeaderServices from './HeaderServices';
import DarkModeToggle from './DarkModeToggle';
import { SvgChevron, SvgShield } from './Svg';
import { buttonPrimaryXs } from './css';

export default function Header() {
  const { invoke } = useInvoke();
  const { config, dispatch } = useAppConfig();
  const { trusted } = config;

  const { canGoBack, canGoForward, goBack, goForward } = useHistory();

  async function handleTrust() {
    await invoke(trusted ? 'untrust_lempify' : 'trust_lempify');
    dispatch({ type: 'set_trusted', trusted: !trusted });
  }

  return (
    <header className='grid grid-cols-[auto_1fr_auto_auto] items-center w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 col-span-2 sticky top-0 z-2'>
      <div className='flex items-center'>
        <div className='p-4 text-xl font-bold'>
          <span className='text-[var(--lempify-primary)]'>LEMP</span>
          <span className="text-black dark:text-white after:content-['.'] after:text-neutral-300 dark:after:text-neutral-700">
            ify
          </span>
        </div>
        <button
          onClick={handleTrust}
          className={`relative group flex items-center gap-2 ${
            trusted
              ? 'text-[var(--lempify-green)]'
              : 'text-neutral-500 dark:text-neutral-500 hover:text-[var(--lempify-green)]'
          }`}
        >
          <SvgShield
            size={16}
            className={`${
              trusted
                ? 'text-[var(--lempify-green)]'
                : 'text-neutral-500 dark:text-neutral-500'
            }`}
          />
          <span className='text-xs'>
            {trusted ? 'Click to untrust' : 'Click to trust'}
          </span>
          <span className='overflow-hidden pointer-events-none absolute left-[16px] right-0 h-full bg-neutral-100 dark:bg-neutral-900 group-hover:translate-x-full motion-safe:transition-transform motion-safe:duration-300 ease-out'></span>
        </button>
      </div>

      <div className='text-xl mx-auto'>
        <DarkModeToggle />
      </div>
      <div className='p-5 ml-auto'>
        <HeaderServices />
      </div>
      <div className='p-5 grid grid-cols-2 gap-2'>
        <Button
          disabled={!canGoBack}
          size='sm'
          className={`${buttonPrimaryXs} ${canGoBack ? '' : 'opacity-50'}`}
          onClick={goBack}
        >
          <SvgChevron direction='left' size={12} />
        </Button>{'  '}
        <Button
          disabled={!canGoForward}
          size='sm'
          className={`${buttonPrimaryXs} ${canGoForward ? '' : 'opacity-50'}`}
          onClick={goForward}
        >
          <SvgChevron direction='right' size={12} />
        </Button>
      </div>
    </header>
  );
}
