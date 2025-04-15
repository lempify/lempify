export default function Button({ children, onClick, className = '', disabled = false }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) {
    return (
        <button className={`disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--lempify-accent)] text-white px-2 py-1 rounded-full hover:bg-[var(--lempify-accent-dark)] cursor-pointer ${className}`} onClick={onClick} {...{ disabled }}>
            {children}
        </button>
    );
}