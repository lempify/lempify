import { useCallback, useEffect, useRef, useState } from "react";
import useWindowEvents from "../hooks/useWindowActive";

import "../css/bg-animation.css";

interface FallingLine {
    id: number;
    left: number;
    duration: number;
    delay: number;
    height: number;
    className: string;
}

const COLORS = [
    "color-blue",
    "color-lightblue",
    "color-darkblue",
    "color-orange",
    "color-yellow",
]

const MIN_MAX_HEIGHT = [50, 120];

const FALLING_LINE_PROBABILITY = 0.1;

export default function Background() {
    const [fallingLines, setFallingLines] = useState<FallingLine[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const nextLineIdRef = useRef(0);
    const spawnIntervalRef = useRef<number>(0);
    const windowEvent = useWindowEvents();

    // @TODO: make this dynamic based on `--grid-size` css property
    const gridSize = 80;

    function pauseFallingLines() {
        if (spawnIntervalRef.current) {
            window.clearInterval(spawnIntervalRef.current);
        }
    }

    function startSpawning() {
        if (spawnIntervalRef.current) {
            window.clearInterval(spawnIntervalRef.current);
        }
        spawnIntervalRef.current = window.setInterval(() => {
            if (Math.random() < FALLING_LINE_PROBABILITY) { // 10% chance every 100ms = ~1 line per second
                spawnFallingLine();
            }
        }, 100);
    }

    const spawnFallingLine = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const gridColumns = Math.floor(containerWidth / gridSize);
        const randomColumn = Math.floor(Math.random() * gridColumns);
        const left = randomColumn * gridSize;

        const newLine: FallingLine = {
            id: nextLineIdRef.current++,
            left,
            duration: 2 + Math.random() * 4,
            delay: Math.random() * 0.5,
            height: Math.floor(Math.random() * (MIN_MAX_HEIGHT[1] - MIN_MAX_HEIGHT[0] + 1)) + MIN_MAX_HEIGHT[0],
            className: COLORS[Math.floor(Math.random() * COLORS.length)],
        };

        setFallingLines(prev => [...prev, newLine]);

        setTimeout(() => {
            setFallingLines(prev => prev.filter(line => line.id !== newLine.id));
        }, (newLine.duration + newLine.delay) * 1000);
    }, []);

    useEffect(() => {
        // Spawn lines at random intervals
        startSpawning();

        return () => {
            if (spawnIntervalRef.current) {
                window.clearInterval(spawnIntervalRef.current);
            }
        };
    }, [spawnFallingLine]);

    useEffect(() => {
        if (windowEvent === 'blur') {
            pauseFallingLines();
        } else if (windowEvent === 'focus') {
            startSpawning();
        }
    }, [windowEvent]);

    return (
        <div className="grid-background fixed w-[100vh] h-[100vh] top-0 left-0">
            {/* Falling lines container */}
            <div ref={containerRef} className="falling-lines-container">
                {fallingLines.map(line => (
                    <div
                        key={line.id}
                        className={`falling-line ${line.className}`}
                        style={{
                            left: `${line.left}px`,
                            animationName: 'fall',
                            animationDuration: `${line.duration}s`,
                            animationDelay: `${line.delay}s`,
                            height: `${line.height}px`,
                        }}
                    />
                ))}
            </div>

            {/* Spotlight follow effect */}
            <div className="spotlight-follow" />
        </div>
    );
} 