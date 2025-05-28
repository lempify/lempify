import { useCallback, useEffect, useRef } from "react";
import { debounce } from "../utils/debounce";

export default function CanvasBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const onResize = useCallback(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            draw();
        }
    }, [canvasRef]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && ctxRef.current) {
            ctxRef.current.fillStyle = 'transparent';
            ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(0, 0);
            ctxRef.current.lineTo(canvas.width, canvas.height);
            ctxRef.current.stroke();
        }
    }, [canvasRef, ctxRef]);

    useEffect(() => {
        if (canvasRef.current) {
            ctxRef.current = canvasRef.current.getContext('2d');
        }
        onResize();
        
        const debouncedResize = debounce(onResize, 100);
        window.addEventListener('resize', debouncedResize);
        return () => window.removeEventListener('resize', debouncedResize);
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full fixed top-0 left-64 opacity-50"></canvas>;
}