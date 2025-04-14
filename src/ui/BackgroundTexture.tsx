export default function BackgroundTexture() {
    return (
        <div className="absolute z-[-1] inset-0 bg-neutral-900 opacity-50">
            <svg viewBox='0 0 1920 1080' xmlns='http://www.w3.org/2000/svg'>
                <filter id='noiseFilter'>
                    <feTurbulence
                        type='fractalNoise'
                        baseFrequency='0.65'
                        numOctaves='3'
                        stitchTiles='stitch' />
                </filter>

                <rect width='100%' height='100%' filter='url(#noiseFilter)' />
            </svg>
        </div>
    );
}