import { Link } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white border-r border-neutral-300 dark:border-neutral-700">
          <nav className="flex flex-col p-4 gap-2">
            <Link to="/" className="hover:text-[var(--lempify-accent)]">Dashboard</Link>
            <Link to="/sites" className="hover:text-[var(--lempify-accent)]">Sites</Link>
            <Link to="/settings" className="hover:text-[var(--lempify-accent)]">Settings</Link>
          </nav>
        </aside>
    )
}