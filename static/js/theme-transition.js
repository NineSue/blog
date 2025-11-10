// 主题切换圆形扩散动画
// 覆盖主题默认的切换逻辑，添加 View Transitions API 动画效果
(function() {
  'use strict';

  function init() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const hlLink = document.querySelector('link#hl');

    // 增强的主题切换函数（带圆形扩散动画）
    function toggleThemeWithTransition(theme, event) {
      // 检查浏览器支持和用户偏好
      const isAppearanceTransition = document.startViewTransition
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!isAppearanceTransition || !event) {
        // 降级处理：直接切换
        if (theme == "dark") {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }

        if (hlLink) {
          hlLink.href = `/hl-${theme}.css`;
        }
        sessionStorage.setItem("theme", theme);
        toggleGiscusTheme(theme);
        return;
      }

      // 获取点击位置
      const x = event.clientX;
      const y = event.clientY;

      // 计算扩散半径（到四个角的最大距离）
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      );

      // 创建 View Transition
      const transition = document.startViewTransition(() => {
        // 切换主题
        if (theme == "dark") {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }

        if (hlLink) {
          hlLink.href = `/hl-${theme}.css`;
        }
        sessionStorage.setItem("theme", theme);
        toggleGiscusTheme(theme);
      });

      // 应用圆形扩散动画
      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];

        document.documentElement.animate(
          {
            clipPath: clipPath
          },
          {
            duration: 400,
            easing: 'ease-out',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });
    }

    // Giscus 主题切换
    function toggleGiscusTheme(theme) {
      const iframe = document.querySelector('iframe.giscus-frame');
      if (!iframe) return;
      iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: `/giscus_${theme}.css` } } }, 'https://giscus.app');
    }

    // 移除原有的事件监听器，添加新的
    const newThemeToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

    // 添加新的点击事件
    newThemeToggle.addEventListener('click', (event) => {
      const currentTheme = sessionStorage.getItem("theme") == "dark" ? "light" : "dark";
      toggleThemeWithTransition(currentTheme, event);
    });

    console.log('✅ 主题切换动画已加载');
  }

  // 导出到全局，供 page-transition.js 调用
  window.initThemeTransition = init;

  // 等待所有脚本加载完成后再覆盖
  // 使用 setTimeout 确保在 main.js 执行完成后再执行
  window.addEventListener('load', function() {
    // 额外延迟确保 main.js 的事件监听器已经绑定
    setTimeout(init, 100);
  });

})();
