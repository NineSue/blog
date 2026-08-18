// 主题唯一事实来源：applyTheme 是唯一写入口，toggleTheme 是唯一切换入口。
// 首帧初始化在 layouts/_default/baseof.html 的内联脚本（防闪白），判断逻辑与此处一致。
(function () {
  "use strict";

  const preferDark = window.matchMedia("(prefers-color-scheme: dark)");

  // 唯一的主题写入口：统一 body/html class、localStorage（代码块高亮固定深色，不随主题切换）
  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }

  // 唯一的主题切换入口（含圆形扩散动画）。亮→暗：从外向内收缩；暗→亮：从内向外扩散。
  function toggleTheme(event) {
    const newTheme = document.body.classList.contains("dark")
      ? "light"
      : "dark";

    const canAnimate =
      document.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      event &&
      typeof event.clientX === "number";

    if (!canAnimate) {
      applyTheme(newTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    // 动画期间挂起星空，避免掉帧
    if (window.pauseStars) window.pauseStars();

    const transition = document.startViewTransition(() => applyTheme(newTheme));

    transition.ready.then(() => {
      const nowDark = document.body.classList.contains("dark");
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        { clipPath: nowDark ? [...clipPath].reverse() : clipPath },
        {
          duration: 300,
          easing: "ease-out",
          fill: "forwards",
          pseudoElement: nowDark
            ? "::view-transition-old(root)"
            : "::view-transition-new(root)",
        },
      );
    });

    transition.finished.then(() => {
      if (window.resumeStars) window.resumeStars();
    });
  }

  // 系统偏好变化时跟随
  preferDark.addEventListener("change", () =>
    applyTheme(preferDark.matches ? "dark" : "light"),
  );

  // 导出 + 绑定所有主题按钮（首页/内页 header 的 #theme-toggle + 移动端目录面板的 #mobile-theme-toggle）
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  document
    .querySelectorAll("#theme-toggle, #mobile-theme-toggle")
    .forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });
})();
