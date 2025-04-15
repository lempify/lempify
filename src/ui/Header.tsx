import Services from "./Services";
import { useDarkMode } from "../context/DarkModeProvider";

export default function Header() {

    // const [theme, setTheme] = useState(getSavedTheme());

    // const toggle = () => {
    //     toggleTheme();
    //     const updated = getSavedTheme();
    //     setTheme(updated);
    // };

    const { theme, isDark, toggleTheme } = useDarkMode();

    return (
        <header className="flex w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 sticky top-0 z-10">
            <div className="p-4 text-xl font-bold">
                <span className="text-[var(--lempify-accent)]">LEMP</span>
                <span className="text-[var(--lempify-secondary)] after:content-['.'] after:text-neutral-500">ify</span>

                <label className="inline-flex items-center cursor-pointer">
                {theme}
                    <input type="checkbox" value="" className="sr-only peer" checked={isDark} onChange={toggleTheme} />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{isDark ? 'dark' : 'light'}</span>
                </label>

            </div>

            <div className="p-4 text-xl leading-none group/services-status ml-auto">
                <Services />
            </div>
        </header>
    );
}