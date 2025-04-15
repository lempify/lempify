export default function RouteHeader({ title, description }: { title: string, description: string }) {
    return (
        <div className="mb-20">
            <h1 className="text-8xl w-full text-transparent bg-clip-text font-extrabold bg-gradient-to-r from-[var(--lempify-accent)] to-[var(--lempify-secondary)] mb-2">{title}</h1>
            <p className="text-neutral-600 dark:text-white">{description}</p>
        </div>
    )
}