import Svg from './Svg';

export default function SvgSun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Svg viewBox='0 0 24 24' xmlSpace='preserve' {...props}>
      <path fill='currentColor' d='M19.4 13c0-.3.1-.7.1-1s0-.7-.1-1l2.1-1.5c.2-.1.3-.4.1-.7l-2-3.5c-.1-.3-.4-.4-.6-.3l-2.4 1.1c-.5-.4-1.2-.8-1.8-1l-.3-2.6c0-.3-.2-.5-.5-.5h-4c-.3 0-.5.2-.5.5L9.2 5c-.7.3-1.3.6-1.8 1L5 5c-.2-.1-.5 0-.6.2l-2 3.5c-.2.3-.2.6.1.7L4.6 11c0 .3-.1.7-.1 1s0 .7.1 1l-2.1 1.5c-.2.1-.3.4-.1.7l2 3.5c.1.3.4.4.6.3l2.4-1.1c.5.4 1.2.8 1.8 1l.3 2.6c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5l.3-2.6c.7-.3 1.3-.6 1.8-1L19 19c.2.1.5 0 .6-.2l2-3.5c.1-.2.1-.5-.1-.7zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4' />
      <path style={{ fill: 'none' }} d='M0 0h24v24H0z' />
    </Svg>
  );
}
