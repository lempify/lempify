import Services from "./Services";

export default function Header() {
    return (
        <header className="flex w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 sticky top-0 z-10">
            <div className="p-4 text-xl font-bold">
                <span className="text-[var(--lempify-accent)]">LEMP</span><span className="text-[var(--lempify-secondary)] after:content-['.'] after:text-neutral-500">ify</span>
            </div>
            <div className="flex justify-end w-full p-4 text-xl font-bold">
                <Services />
            </div>
        </header>
    );
}