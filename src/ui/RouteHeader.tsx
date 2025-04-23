export default function RouteHeader({ title, description }: { title: string, description: string }) {
    return (
        <div className="mb-20">
            <h1 className="
                text-8xl line-height-[200px] text-transparent font-extrabold  
                mb-2 inline-flex 
                bg-clip-text bg-gradient-to-r 
                from-[var(--lempify-primary-300)] to-[var(--lempify-primary)]
            "
            >{title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>
    )
}