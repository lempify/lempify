/**
 * Header component
 * 
 * This component is the header of the application.
 * It displays the logo, the services status, and the dark mode toggle.
 */

/**
 * Internal dependencies
 */
import HeaderServices from "./HeaderServices";
import DarkModeToggle from "./DarkModeToggle";
import { useInvoke } from "../hooks/useInvoke";
import { useAppConfig } from "../context/AppConfigContext";

export default function Header() {
    const { invoke } = useInvoke();
    const { config, dispatch } = useAppConfig();
    const { trusted } = config;

    const handleTrust = () => {
        invoke(trusted ? "untrust_lempify" : "trust_lempify");
        dispatch({ type: "set_trusted", trusted: !trusted });
    };

    return (
        <header className="flex items-center w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 col-span-2 sticky top-0 z-1">
            <div className="p-4 text-xl font-bold">
                <span className="text-[var(--lempify-primary)]">LEMP</span>
                <span className="text-[var(--lempify-primary-200)] after:content-['.'] after:text-neutral-500">ify</span>
            </div>
            <div>
                {/* {trusted ? 'IS TRUSTED' : 'IS NOT TRUSTED'} */}
                <button onClick={handleTrust}>{trusted ? 'UNTRUST' : 'TRUST'}</button>
            </div>
            <div className="text-xl ml-auto">
                <DarkModeToggle />
            </div>
            <div className="p-5 ml-auto">
                <HeaderServices />
            </div>
        </header>
    );
}