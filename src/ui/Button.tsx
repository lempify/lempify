export default function Button({ children, onClick, className = '', disabled = false }: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean }) {
    return (
        <button className={`disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 cursor-pointer ${className}`} onClick={onClick} {...{ disabled }}>
            {children}
        </button>
    );
}