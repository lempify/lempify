export default function trackMousePosition(rootElement: HTMLElement) {

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;
    let isAnimating = false;
    let isMouseInWindow = true;

    rootElement.style.setProperty("--mouse-x", "0px");
    rootElement.style.setProperty("--mouse-y", "0px");

    const animate = (_easingFactor: number | undefined = 0.1) => {
        const easingFactor = _easingFactor ?? 0.1;
        
        const diffX = targetX - currentX;
        const diffY = targetY - currentY;
        
        if (Math.abs(diffX) < 1 && Math.abs(diffY) < 1) {
            currentX = targetX;
            currentY = targetY;
            rootElement.style.setProperty("--mouse-x", `${currentX}px`);
            rootElement.style.setProperty("--mouse-y", `${currentY}px`);
            isAnimating = false; 
            return;
        }
        
        isAnimating = true;
        
        currentX += Math.round(diffX * easingFactor * 100) / 100;
        currentY += Math.round(diffY * easingFactor * 100) / 100;
        
        rootElement.style.setProperty("--mouse-x", `${currentX}px`);
        rootElement.style.setProperty("--mouse-y", `${currentY}px`);
        
        animationFrameId = requestAnimationFrame(() => animate(easingFactor));
    };

    const startAnimation = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animate();
    };

    startAnimation();

    rootElement.addEventListener("mousemove", (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        
        if (!isAnimating) {
            animate();
        }
    }, { passive: true });

    rootElement.addEventListener("mouseleave", () => {
        isMouseInWindow = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    }, { passive: true });

    rootElement.addEventListener("mouseenter", () => {
        startAnimation();
        isMouseInWindow = true;
    }, { passive: true });
}