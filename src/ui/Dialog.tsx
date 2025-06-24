import { useLayoutEffect, useRef } from "react";

export default function Dialog({ children, open, onClose }: { children: React.ReactNode, open: boolean, onClose: () => void }) {
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
        <dialog onClick={handleClose} ref={dialog} className="backdrop:bg-gray-100/70 dark:backdrop:bg-gray-900/70">
            <div className="flex flex-col gap-2 p-4" onClick={e => e.stopPropagation()}>
                {children}
                <button onClick={handleClose}>Close</button>
            </div>
        </dialog>
    );
}