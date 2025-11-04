(function() {
    'use strict';

    const r180 = Math.PI;
    const r90 = Math.PI / 2;
    const r15 = Math.PI / 12;
    const color = '#88888850';  // 中度灰,提高不透明度到约31%
    const MIN_BRANCH = 30;
    const len = 6;
    const MAX_STEPS = 30000;  // 限制总步数,控制树枝长度

    function initCanvas(canvas, width, height) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        const dpi = dpr / bsr;

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = dpi * width;
        canvas.height = dpi * height;
        ctx.scale(dpi, dpi);

        return { ctx, dpi };
    }

    function polar2cart(x, y, r, theta) {
        const dx = r * Math.cos(theta);
        const dy = r * Math.sin(theta);
        return [x + dx, y + dy];
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'plum-canvas';
    canvas.style.cssText = `  
        position: fixed;  
        top: 0;  
        bottom: 0;  
        left: 0;  
        right: 0;  
        pointer-events: none;  
        z-index: -1;  
        mask-image: radial-gradient(circle, transparent, black);  
        -webkit-mask-image: radial-gradient(circle, transparent, black);  
    `;
    document.body.appendChild(canvas);

    let ctx = initCanvas(canvas, window.innerWidth, window.innerHeight).ctx;
    const { width, height } = canvas;

    let steps = [];
    let prevSteps = [];
    let stopped = false;
    let totalSteps = 0;  // 记录总步数

    function step(x, y, rad, counter = { value: 0 }) {
        // 检查总步数限制
        if (totalSteps >= MAX_STEPS) {
            return;
        }

        const length = Math.random() * len;
        counter.value += 1;
        totalSteps += 1;

        const [nx, ny] = polar2cart(x, y, length, rad);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        const rad1 = rad + Math.random() * r15;
        const rad2 = rad - Math.random() * r15;

        if (nx < -100 || nx > window.innerWidth + 100 ||
            ny < -100 || ny > window.innerHeight + 100) {
            return;
        }

        const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5;

        if (Math.random() < rate) {
            steps.push(() => step(nx, ny, rad1, counter));
        }

        if (Math.random() < rate) {
            steps.push(() => step(nx, ny, rad2, counter));
        }
    }

    let lastTime = performance.now();
    const interval = 1000 / 30;

    function frame() {
        if (stopped) return;

        const now = performance.now();
        if (now - lastTime < interval) {
            requestAnimationFrame(frame);
            return;
        }

        prevSteps = steps;
        steps = [];
        lastTime = now;

        if (!prevSteps.length || totalSteps >= MAX_STEPS) {
            stopped = true;
            return;
        }

        prevSteps.forEach((fn) => {
            if (Math.random() < 0.5) {
                steps.push(fn);
            } else {
                fn();
            }
        });

        requestAnimationFrame(frame);
    }

    function start() {
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        prevSteps = [];
        totalSteps = 0;  // 重置计数器

        const randomMiddle = () => Math.random() * 0.6 + 0.2;

        steps = [
            () => step(randomMiddle() * window.innerWidth, -5, r90),
            () => step(randomMiddle() * window.innerWidth, window.innerHeight + 5, -r90),
            () => step(-5, randomMiddle() * window.innerHeight, 0),
            () => step(window.innerWidth + 5, randomMiddle() * window.innerHeight, r180),
        ];

        if (window.innerWidth < 500) {
            steps = steps.slice(0, 2);
        }

        stopped = false;
        requestAnimationFrame(frame);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const handleResize = debounce(() => {
        stopped = true;
        ctx = initCanvas(canvas, window.innerWidth, window.innerHeight).ctx;
        start();
    }, 300);

    window.addEventListener('resize', handleResize);

    const style = document.createElement('style');
    style.textContent = '@media print { #plum-canvas { display: none; } }';
    document.head.appendChild(style);

    window.plumCleanup = function() {
        stopped = true;
        window.removeEventListener('resize', handleResize);
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    };

    start();
})();