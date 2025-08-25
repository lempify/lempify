import Heading from './Heading';
import { SvgShield, SvgTool } from './Svg';
import SvgTriangle from './Svg/SvgTriangle';

function BulletPoint(props: { children: React.ReactNode; className?: string }) {
  return (
    <li className={props.className || ''}>
      <SvgTriangle
        size={10}
        direction='right'
        className='inline-flex mr-2 text-[var(--lempify-primary)]'
      />{' '}
      {props.children}
    </li>
  );
}

const BORDER_CSS_COLORS = 'border-white dark:border-black';
const BORDER_DASHED_CSS_COLORS =
  'border-dashed border-neutral-300 dark:border-neutral-700';

export default function InstallWelcome() {
  return (
    <div className='text-neutral-600 dark:text-neutral-400'>
      <Heading
        size='h2'
        className='mb-10'
        title='Welcome&nbsp;to Lempify'
        split
        align='right'
      />

      <div
        className={`grid grid-cols-1 md:grid-cols-[1fr_2fr] md:gap-4 border-y ${BORDER_CSS_COLORS}`}
      >
        <div
          className={`flex items-center p-4 bg-white dark:bg-black justify-center`}
        >
          <Heading size='h3' split title='What&nbsp;is&nbsp;this thing?' />
        </div>
        <div className='py-5 md:py-10'>
          <p className='mb-5'>
            <span className='text-[var(--lempify-primary)] font-bold'>
              Lempify{' '}
            </span>{' '}
            is a desktop application that helps you install, manage and run
            common{' '}
            <span className='text-black dark:text-white font-bold'>LEMP</span>{' '}
            stack based web services and tools on your system.
          </p>
          <p className='text-sm'>
            The{' '}
            <span className='font-bold text-black dark:text-white'>
              site creation
            </span>{' '}
            tools use these technologies to configure a new site in seconds
            while incorporating some of the most popular CMS's and frameworks.
          </p>
        </div>
      </div>

      <div className={`py-10`}>
        <div className='mb-4 text-center'>
          <p className='text-lg text-neutral-900 dark:text-neutral-100'>
            This <span className='font-bold'>interface</span> is{' '}
            <span className='font-bold'>designed</span> to help you:
          </p>
        </div>

        <ul
          className={`grid grid-cols-2 text-center border-y ${BORDER_CSS_COLORS}`}
        >
          <li
            className={`p-7 border-r md:col-span-1 ${BORDER_DASHED_CSS_COLORS}`}
          >
            <p className='text-center mb-2'>
              <SvgTriangle
                size={30}
                direction='up'
                className='text-[var(--lempify-primary)] inline-flex'
              />
            </p>
            Install{' '}
            <span className='text-black dark:text-white font-bold'>
              Services
            </span>
          </li>
          <li className='p-7 md:col-span-1'>
            <p className='text-center mb-2'>
              <SvgTool
                size={30}
                className='text-neutral-700 dark:text-neutral-300 inline-flex'
              />
            </p>
            Install{' '}
            <span className='text-black dark:text-white font-bold'>Tools</span>
          </li>
          <li className={`col-span-2 p-7 border-t ${BORDER_CSS_COLORS}`}>
            <p className='text-center mb-2'>
              <SvgShield
                size={30}
                className='text-[var(--lempify-green)] inline-flex'
              />
            </p>
            <span className='text-black dark:text-white font-bold'>Trust</span>{' '}
            Lempify App
          </li>
        </ul>
      </div>

      <Heading size='h4' className='mb-4' title='You can skip...' />

      <ul className='mb-6 ml-4 text-sm'>
        <BulletPoint>
          <span className='text-black dark:text-white font-bold'>Any step</span>{' '}
          by clicking the "<span className='text-xs'>{'>'}</span>" button.
        </BulletPoint>
        <BulletPoint>
          The entire process by clicking the "
          <span className='text-xs'>Skip install {'>'}</span>" in the bottom
          right corner.
        </BulletPoint>
      </ul>
    </div>
  );
}
