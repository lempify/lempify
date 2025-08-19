import { createContext, useContext, useEffect, useState } from "react";

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const A11yContext = createContext({
  prefersReducedMotion,
});

export const A11yProvider = ({ children }: { children: React.ReactNode }) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(media.matches);
    const onReducedMotionChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
    }
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