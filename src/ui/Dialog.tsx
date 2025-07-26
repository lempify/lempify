import { useLayoutEffect, useRef } from 'react';

export default function Dialog({
  children,
  open,
  onClose = () => {},
  className,
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

  function handleClose() {
    onClose();
    dialog.current?.close();
  }

  return (
    <dialog
      onClick={handleClose}
      ref={dialog}
      className={className}
    >
      <div
        className='flex flex-col gap-2 p-4 h-full'
        onClick={e => e.stopPropagation()}
      >
        {children}
        <button onClick={handleClose}>Close</button>
      </div>
    </dialog>
  );
}
