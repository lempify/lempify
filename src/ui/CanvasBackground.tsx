// @TODO: Unused
import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "../utils/debounce";
import { useDarkMode } from "../context/DarkModeProvider";

const spotlightRadius = 300;
const gridSize = 80;
const BODY_ELEMENT = document.body;

interface FallingLine {
    id: number;
    x: number;
    y: number;
    speed: number;
    opacity: number;
}

export default function CanvasBackground() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const animationFrameRef = useRef<number>(0);
    const { isDark, valueByTheme } = useDarkMode();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [fallingLines, setFallingLines] = useState<FallingLine[]>([]);
    const nextLineIdRef = useRef(0);
    const animateRef = useRef<() => void>(() => {
        console.log('animateRef');
    });
    const noiseImageDataRef = useRef<ImageData | null>(null);
    const lastNoiseDimensionsRef = useRef({ width: 0, height: 0, isDark: isDark });

    const onResize = useCallback(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            // Clear cached noise when canvas size changes
            noiseImageDataRef.current = null;
        }
    }, []);

    const generateNoiseImageData = useCallback((width: number, height: number) => {
        if (!ctxRef.current) return null;
        
        const imageData = ctxRef.current.createImageData(width, height);
        const data = imageData.data;
        const noiseIntensity = 0.95; // 1.5% of pixels
        const baseOpacity = isDark ? 0.051 : 0.051;
        
        // Clear the image data (transparent by default)
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 0; // A (transparent)
        }
        
        // Add noise pixels
        const totalNoisePixels = Math.floor(width * height * noiseIntensity);
        for (let i = 0; i < totalNoisePixels; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const pixelIndex = (y * width + x) * 4;
            const opacity = Math.random() * baseOpacity;
            
            if (isDark) {
                // Light dots in dark mode
                data[pixelIndex] = 255;     // R
                data[pixelIndex + 1] = 255; // G
                data[pixelIndex + 2] = 255; // B
            } else {
                // Dark dots in light mode
                data[pixelIndex] = 0;       // R
                data[pixelIndex + 1] = 0;   // G
                data[pixelIndex + 2] = 0;   // B
            }
            data[pixelIndex + 3] = Math.floor(opacity * 255); // A
        }
        
        return imageData;
    }, [isDark]);

    const spawnFallingLine = useCallback(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const gridColumns = Math.floor(canvas.width / gridSize);
        const randomColumn = Math.floor(Math.random() * gridColumns);
        const x = randomColumn * gridSize;
        
        const newLine: FallingLine = {
            id: nextLineIdRef.current++,
            x: x,
            y: -100,
            speed: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4
        };
        
        setFallingLines(prev => [...prev, newLine]);
    }, []);

    const drawNoise = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const currentDimensions = { width: canvas.width, height: canvas.height, isDark };
        
        // Check if we need to regenerate noise (size change or theme change)
        const needsRegeneration = !noiseImageDataRef.current ||
            lastNoiseDimensionsRef.current.width !== currentDimensions.width ||
            lastNoiseDimensionsRef.current.height !== currentDimensions.height ||
            lastNoiseDimensionsRef.current.isDark !== currentDimensions.isDark;
        
        if (needsRegeneration) {
            noiseImageDataRef.current = generateNoiseImageData(canvas.width, canvas.height);
            lastNoiseDimensionsRef.current = currentDimensions;
        }
        
        // Draw the cached noise
        if (noiseImageDataRef.current) {
            ctx.putImageData(noiseImageDataRef.current, 0, 0);
        }
    }, [isDark, generateNoiseImageData]);

    const drawGrid = useCallback(() => {
        if (!ctxRef.current || !canvasRef.current) return;
        
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        
        // Draw noise texture first (as background)
        drawNoise(ctx, canvas);
        
        // Draw grid lines on top of noise
        ctx.strokeStyle = valueByTheme('rgba(210, 210, 210, 1)', 'rgba(0, 0, 0, 1)');
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }, [valueByTheme, drawNoise]);

    const drawFallingLines = useCallback(() => {
        if (!ctxRef.current) return;

        const ctx = ctxRef.current;
        const color = valueByTheme('150,150,150', '205,205,205');

        fallingLines.forEach(line => {
            // Set shadow properties for falling lines only
            ctx.shadowColor = `rgba(${color}, 1)`;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;

            // Create gradient for each falling line
            const gradient = ctx.createLinearGradient(line.x, line.y, line.x, line.y + 100);
            gradient.addColorStop(0, `rgba(${color}, 0)`);
            gradient.addColorStop(0.5, `rgba(${color}, ${line.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(${valueByTheme('50,50,50', '255,255,255')}, 1)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(line.x, line.y, 1, 100);
        });

        // Reset shadow properties after drawing falling lines
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }, [fallingLines, valueByTheme]);

    const drawSpotlight = useCallback((x: number, y: number) => {
        if (!ctxRef.current || !canvasRef.current) return;

        const ctx = ctxRef.current;
        const canvas = canvasRef.current;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid first
        drawGrid();

        // Draw falling lines
        drawFallingLines();

        // Create spotlight gradient that will act as a mask
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, spotlightRadius);
        gradient.addColorStop(0, valueByTheme('rgba(255, 255, 255, 0)', 'rgba(10, 10, 10, 0)'));
        gradient.addColorStop(0.7, valueByTheme('rgba(235, 235, 235, 0.3)', 'rgba(30, 30, 30, 0.3)'));
        gradient.addColorStop(1, valueByTheme('rgba(220, 220, 220, 0.6)', 'rgba(0, 0, 0, 0.6)'));

        // Apply the gradient overlay
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }, [drawGrid, drawFallingLines, valueByTheme]);

    const animate = useCallback(() => {
        if (!canvasRef.current) return;

        // Smooth easing for spotlight position
        const easingFactor = 0.1;
        setPosition(prev => {
            const newX = prev.x + (targetPosition.x - prev.x) * easingFactor;
            const newY = prev.y + (targetPosition.y - prev.y) * easingFactor;

            // Draw everything
            drawSpotlight(newX, newY);

            return { x: newX, y: newY };
        });

        // Update falling lines
        setFallingLines(prevLines =>
            prevLines
                .map(line => ({
                    ...line,
                    y: line.y + line.speed
                }))
                .filter(line => line.y < canvasRef.current!.height + 100) // Remove lines that are off screen
        );

        // Randomly spawn new falling lines
        if (Math.random() < 0.01) { // 1% chance each frame
            spawnFallingLine();
        }

        animationFrameRef.current = requestAnimationFrame(() => animateRef.current?.());
    }, [targetPosition, drawSpotlight, spawnFallingLine]);

    // Update the ref when animate changes
    useEffect(() => {
        animateRef.current = animate;
    }, [animate]);

    const onSpotlightMove = useCallback((e: MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();

        // Calculate position relative to the canvas using clientX/Y and canvas bounds
        const newTargetPosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        setTargetPosition(newTargetPosition);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        ctxRef.current = canvas.getContext('2d', { alpha: false });
        onResize();

        const debouncedResize = debounce(onResize, 100);

        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(() => animateRef.current?.());

        BODY_ELEMENT.addEventListener('resize', debouncedResize);
        BODY_ELEMENT.addEventListener('mousemove', onSpotlightMove);

        return () => {
            BODY_ELEMENT.removeEventListener('resize', debouncedResize);
            BODY_ELEMENT.removeEventListener('mousemove', onSpotlightMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onResize, onSpotlightMove, animateRef]);

    // Redraw when isDark changes
    useEffect(() => {
        drawSpotlight(position.x, position.y);
    }, [isDark, drawSpotlight, position]);

    return (
        <canvas ref={canvasRef} className="w-full fixed top-[65px] left-64 bottom-0"></canvas>
    );
}