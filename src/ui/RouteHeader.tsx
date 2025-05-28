export default function RouteHeader({ title, description }: { title: string, description: string }) {
    return (
        <header className="mb-10 relative">
            <h1 className="
                text-8xl line-height-[200px] text-transparent font-extrabold  
                mb-2 inline-flex 
                bg-clip-text bg-gradient-to-l 
                from-[var(--lempify-primary-300)] to-[var(--lempify-primary)]
                dark:from-[var(--lempify-primary-700)] dark:to-[var(--lempify-primary)]
            "
            >{title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
        </header>
    )
}