export default function Input({ 
    name, 
    label, 
    description, 
    type = 'text', 
    value, 
    onChange, 
    className 
}: { 
    name: string, 
    label: string, 
    description: string, 
    type: string, 
    value: string, 
    onChange: (value: string) => void,
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label htmlFor={name}>{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
            <span className="text-xs text-neutral-500">{description}</span>
        </div>
    );
}