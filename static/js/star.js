(function(){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: -1;
  `;
    document.body.appendChild(canvas);

    let width, height, dpr;
    function resize(){
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    // 小星星类
    class Star {
        constructor(){
            this.reset();
        }
        reset(){
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 2 + 1;
            this.speed = Math.random() * 0.8 + 0.2;
            this.alpha = Math.random() * 0.8 + 0.2;
            this.twinkle = Math.random() * 0.05 + 0.01;
        }
        update(){
            this.y += this.speed;
            this.alpha += this.twinkle * (Math.random() > 0.5 ? 1 : -1);
            if (this.alpha < 0.1) this.alpha = 0.1;
            if (this.alpha > 1) this.alpha = 1;
            if (this.y > height + 10) this.reset();
        }
        draw(){
            ctx.save();
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, `rgba(180,220,255,${this.alpha})`);
            gradient.addColorStop(0.5, `rgba(80,150,255,${this.alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(0,0,80,0)`);
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    const stars = Array.from({length: 200}, () => new Star());

    function animate(){
        ctx.clearRect(0,0,width,height);
        for(const s of stars){
            s.update();
            s.draw();
        }
        requestAnimationFrame(animate);
    }

    animate();
})();
