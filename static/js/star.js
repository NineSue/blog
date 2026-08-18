/**
 * 星星背景动画效果
 * 支持清理和重新初始化，适配 View Transition API 页面切换
 * 仅在暗色模式下显示
 */
(function () {
  "use strict";

  let canvas = null;
  let ctx = null;
  let width, height, dpr;
  let stars = [];
  let animationId = null;
  let resizeHandler = null;
  let themeObserver = null;
  let isPaused = false;

  /**
   * 检查是否为暗色模式
   */
  function isDarkMode() {
    return document.body.classList.contains("dark");
  }

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
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }

    // 移除主题变化监听器
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }

    // 移除 canvas 元素
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    // 清空变量
    canvas = null;
    ctx = null;
    stars = [];
  }

  /**
   * 初始化函数 - 创建 canvas 和启动动画
   */
  function init() {
    // 先清理旧的实例（如果存在）
    cleanup();

    // 创建新的 canvas 元素
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: ${isDarkMode() ? "1" : "0"};
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(canvas);

    // 监听主题变化
    themeObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === "class") {
          canvas.style.opacity = isDarkMode() ? "1" : "0";
          syncLoopToTheme();
        }
      });
    });
    themeObserver.observe(document.body, { attributes: true });

    // 窗口大小调整函数
    function resize() {
      dpr = window.devicePixelRatio || 1;
      const oldWidth = width;
      const oldHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // 尺寸变化时按比例缩放保留相对位置，超界就 clamp，不重新随机
      if (oldWidth && oldHeight && stars.length > 0) {
        const rx = width / oldWidth;
        const ry = height / oldHeight;
        for (const s of stars) {
          s.x = Math.min(s.x * rx, width);
          s.y = Math.min(s.y * ry, height);
        }
      }
    }

    // 保存 resize 处理器引用，以便清理
    resizeHandler = resize;
    window.addEventListener("resize", resizeHandler);
    resize();

    // 预渲染星星 sprite：避免每帧新建径向渐变带来的 GC 压力
    const spriteCache = new Map();
    function spriteFor(size) {
      const key = Math.round(size * 4);
      let sprite = spriteCache.get(key);
      if (sprite) return sprite;
      const s = key / 4;
      const r = s * 2;
      sprite = document.createElement("canvas");
      sprite.width = sprite.height = Math.ceil(r * 2);
      const g = sprite.getContext("2d");
      const gradient = g.createRadialGradient(r, r, 0, r, r, s);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      g.fillStyle = gradient;
      g.arc(r, r, r, 0, Math.PI * 2);
      g.fill();
      spriteCache.set(key, sprite);
      return sprite;
    }

    // 星星类：位置固定，仅亮度呼吸起伏（发光感），不下落
    class Star {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.baseAlpha = Math.random() * 0.6 + 0.3;
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        this.phase = Math.random() * Math.PI * 2;
        this.sprite = spriteFor(this.size);
      }

      update() {
        this.phase += this.twinkleSpeed;
        this.alpha = this.baseAlpha * (0.5 + 0.5 * Math.sin(this.phase));
      }

      draw() {
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(
          this.sprite,
          this.x - this.size * 2,
          this.y - this.size * 2,
        );
      }
    }

    // 创建 200 个星星
    stars = Array.from({ length: 200 }, () => new Star());

    // 动画循环
    function animate() {
      if (isPaused) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.update();
        s.draw();
      }
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    }

    // 亮色模式挂起绘制循环，暗色模式恢复（省 CPU：canvas 不可见时不再空转）
    function syncLoopToTheme() {
      if (isDarkMode()) {
        if (!animationId) animate();
      } else if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    // 仅暗色模式启动动画
    syncLoopToTheme();
  }

  // 导出全局接口（pause/resume 供主题切换动画暂停星空）
  window.pauseStars = function () {
    isPaused = true;
  };
  window.resumeStars = function () {
    isPaused = false;
  };

  // 首次加载时自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
