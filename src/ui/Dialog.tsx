import { useEffect, useLayoutEffect, useRef } from 'react';
import Button from './Button';
import { buttonPrimary } from './css';

export default function Dialog({
  children,
  open,
  onClose = () => {},
  className = '',
}: {
  children: React.ReactNode;
  open: boolean;
  onClose?: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    if (dialog.current && open) {
      dialog.current.showModal();
    }
  }, [dialog.current, open]);

  useEffect(() => {
    if (dialog.current) {
      dialog.current.addEventListener('close', onClose);
    }
    return () => {
      if (dialog.current) {
        dialog.current.removeEventListener('close', onClose);
      }
    };
  }, []);

  function handleClose() {
    onClose();
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      onClick={handleClose}
      className={`lempify-dialog ${className}`}
    >
      <div
        className='flex flex-col gap-2 p-4 absolute bg-neutral-100 dark:bg-neutral-900 lg:w-2/3 lg:h-2/3 lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 inset-4 lg:inset-0'
        onClick={e => e.stopPropagation()}
      >
        {children}
        <div className='flex justify-end'>
          <Button
            onClick={handleClose}
            size='sm'
            className={buttonPrimary + ' inline-flex'}
          >
            Close
          </Button>
        </div>
      </div>
    </dialog>
  );
}
