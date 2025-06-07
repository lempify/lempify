import { Link } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="sticky top-0 z-1 h-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white border-r border-neutral-300 dark:border-neutral-700">
          <nav className="flex flex-col p-4 gap-2">
            <Link to="/" className="hover:text-[var(--lempify-primary)]">Dashboard</Link>
            <Link to="/sites" className="hover:text-[var(--lempify-primary)]">Sites</Link>
            <Link to="/settings" className="hover:text-[var(--lempify-primary)]">Settings</Link>
          </nav>
        </aside>
    )
}