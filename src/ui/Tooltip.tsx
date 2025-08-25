export default function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <span className='inline-flex group relative'>
      <span className='bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs p-2 rounded-md absolute z-1 left-full bottom-0 invisible group-hover:visible'>
        {text}
      </span>
      {children}
    </span>
  );
}
