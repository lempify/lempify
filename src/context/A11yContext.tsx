import { createContext, useContext, useEffect } from "react";

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const A11yContext = createContext({
  prefersReducedMotion,
});

export const A11yProvider = ({ children }: { children: React.ReactNode }) => {
    const onReducedMotionChange = (event: MediaQueryListEvent) => {
        console.log('onReducedMotionChange', event.matches);
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    useEffect(() => {
        media.addEventListener('change', onReducedMotionChange);
        return () => {
            media.removeEventListener('change', onReducedMotionChange);
        }
    }, []);
  return <A11yContext.Provider value={{ prefersReducedMotion }}>{children}</A11yContext.Provider>;
};

export function useA11y() {
  return useContext(A11yContext);
}