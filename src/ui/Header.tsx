/**
 * Header component
 * 
 * This component is the header of the application.
 * It displays the logo, the services status, and the dark mode toggle.
 */

/**
 * Internal dependencies
 */
import Services from "./Services";
import DarkModeToggle from "./DarkModeToggle";
import { ServicesProvider } from "../context/ServicesProvider";
import { useInvoke } from "../hooks/useInvoke";
import { useAppConfig } from "../context/AppConfigContext";

export default function Header() {
    const { invoke } = useInvoke();
    const { config, dispatch } = useAppConfig();
    const { trusted } = config;

    const handleTrust = () => {
        invoke("trust_lempify");
        dispatch({ type: "set_trusted", trusted: true });
    };

    return (
        <header className="flex items-center w-full bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 sticky top-0 z-10">
            <div className="p-4 text-xl font-bold">
                <span className="text-[var(--lempify-primary)]">LEMP</span>
                <span className="text-[var(--lempify-primary-200)] after:content-['.'] after:text-neutral-500">ify</span>
            </div>
            <div>
                {/* {trusted ? 'IS TRUSTED' : 'IS NOT TRUSTED'} */}
                {trusted ? <button onClick={() => {
                    invoke("untrust_lempify");
                    dispatch({ type: "set_trusted", trusted: false });
                }}>UNTRUST</button> : <button onClick={() => {
                    invoke("trust_lempify");
                    dispatch({ type: "set_trusted", trusted: true });
                }}>TRUST</button>}
            </div>
            <div className="text-xl ml-auto">
                <DarkModeToggle />
            </div>
            <div className="p-5 ml-auto">
                <ServicesProvider>
                    <Services />
                </ServicesProvider>
            </div>
        </header>
    );
}