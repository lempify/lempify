import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export default function useWindowEvents() {
    const [lastWindowEvent, setLastWindowEvent] = useState<string>('');

    useEffect(() => {
        const unlistenFocus = async () => await getCurrentWindow().listen<any>('tauri://focus', () => {
            setLastWindowEvent('focus');
        });
        const unlistenBlur = async () => await getCurrentWindow().listen<any>('tauri://blur', () => {
            setLastWindowEvent('blur');
        });
        const unlistenMove = async () => await getCurrentWindow().listen<any>('tauri://move', () => {
            setLastWindowEvent('move');
        });
        const unlistenResize = async () => await getCurrentWindow().listen<any>('tauri://resize', () => {
            setLastWindowEvent('resize');
        });
        return () => {
            unlistenFocus();
            unlistenBlur();
            unlistenMove();
            unlistenResize();
        };
    }, []);

    return lastWindowEvent;
}