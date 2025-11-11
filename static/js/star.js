/**
 * 星星背景动画效果
 * 支持清理和重新初始化，适配 View Transition API 页面切换
 */
(function() {
  'use strict';

  let canvas = null;
  let ctx = null;
  let width, height, dpr;
  let stars = [];
  let animationId = null;
  let resizeHandler = null;

  /**
   * 清理函数 - 移除 canvas 和停止动画
   */
  function cleanup() {
    // 停止动画循环
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // 移除窗口大小调整监听器
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }

    // 移除 canvas 元素
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    // 清空变量
    canvas = null;
    ctx = null;
    stars = [];

    console.log('⭐ 星星效果已清理');
  }

  /**
   * 初始化函数 - 创建 canvas 和启动动画
   */
  function init() {
    // 先清理旧的实例（如果存在）
    cleanup();

    // 创建新的 canvas 元素
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    `;
    document.body.appendChild(canvas);

    // 窗口大小调整函数
    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    // 保存 resize 处理器引用，以便清理
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);
    resize();

    // 星星类
    class Star {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 0.8 + 0.2;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.twinkle = Math.random() * 0.05 + 0.01;
      }

      update() {
        this.y += this.speed;
        this.alpha += this.twinkle * (Math.random() > 0.5 ? 1 : -1);
        if (this.alpha < 0.1) this.alpha = 0.1;
        if (this.alpha > 1) this.alpha = 1;
        if (this.y > height + 10) this.reset();
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(180, 220, 255, ${this.alpha})`);
        gradient.addColorStop(0.5, `rgba(80, 150, 255, ${this.alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(0, 0, 80, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 创建 200 个星星
    stars = Array.from({length: 200}, () => new Star());

    // 动画循环
    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.update();
        s.draw();
      }
      animationId = requestAnimationFrame(animate);
    }

    // 启动动画
    animate();
    console.log('⭐ 星星效果已初始化 (200个粒子)');
  }

  // 导出全局接口
  window.initStars = init;
  window.cleanupStars = cleanup;

  // 首次加载时自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
