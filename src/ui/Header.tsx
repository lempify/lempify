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
import { SvgChevron, SvgShield, SvgLogo2 as Logo } from './Svg';

import { buttonPrimaryXs } from './css';
import { NavLink } from 'react-router-dom';

export default function Header() {
  const { invoke } = useInvoke();
  const { config, dispatch } = useAppConfig();
  const { trusted } = config;

  const { canGoBack, canGoForward, goBack, goForward } = useHistory();

  async function handleTrust() {
    const result = await invoke(trusted ? 'untrust_lempify' : 'trust_lempify');
    if (result.error) {
      console.error(`Failed to ${trusted ? 'untrust' : 'trust'} Lempify: ${result.error}`);
      return;
    }
    dispatch({ type: 'set_trusted', trusted: !trusted });
  }

  return (
    <header className='grid grid-cols-[auto_auto_auto_108px] items-center w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 col-span-2 sticky top-0 z-2'>
      <div className='flex items-center'>
        <div className='mx-4 -mb-[28px] text-xl text-[var(--lempify-primary)]'>
          <NavLink to='/'><Logo size={[200, 'auto']} /></NavLink>
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
          <span className='text-xs hidden sm:block'>
            {trusted ? 'Click to untrust' : 'Click to trust'}
          </span>
          <span className='top-0 pointer-events-none absolute left-[16px] right-0 h-full bg-neutral-100 dark:bg-neutral-900 group-hover:left-[100%] motion-safe:transition-[left] motion-safe:duration-300 ease-out'></span>
        </button>
      </div>

      <div className='text-xl mx-auto'>
        <DarkModeToggle />
      </div>
      <div className='p-5 ml-auto'>
        <HeaderServices />
      </div>
      <div className='p-5 flex  flex-row justify-end gap-2'>
        <Button
          disabled={!canGoBack}
          size='sm'
          className={`${buttonPrimaryXs} ${canGoBack ? '' : 'opacity-50'}`}
          onClick={goBack}
        >
          <SvgChevron direction='left' size={12} />
        </Button>
        {'  '}
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
