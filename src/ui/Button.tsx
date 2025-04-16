export default function Button({ children, onClick, className = '', disabled = false }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) {
    return (
        <button className={`disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--lempify-primary)] px-2 py-1 rounded-full ${className}`} onClick={onClick} {...{ disabled }}>
            {children}
        </button>
    );
}