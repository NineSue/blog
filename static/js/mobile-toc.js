/**
 * 移动端目录（仅文章页）：右下圆钮 + 底部抽屉。
 * 主题切换由 theme.js 统一绑定 #mobile-theme-toggle，本文件不处理。
 */

(function () {
  "use strict";

  function initMobileTOC() {
    const btn = document.getElementById("mobile-toc-btn");
    const overlay = document.getElementById("mobile-toc-overlay");
    const panel = document.getElementById("mobile-toc-panel");
    const closeBtn = document.getElementById("mobile-toc-close");
    const nav = document.getElementById("mobile-toc-nav");

    if (!btn || !panel) return;

    function openTOC() {
      overlay.classList.add("show");
      panel.classList.add("show");
      document.body.style.overflow = "hidden";
    }

    function closeTOC() {
      overlay.classList.remove("show");
      panel.classList.remove("show");
      document.body.style.overflow = "";
    }

    btn.addEventListener("click", openTOC);

    if (closeBtn) closeBtn.addEventListener("click", closeTOC);
    if (overlay) overlay.addEventListener("click", closeTOC);

    // 点击目录链接后关闭面板并平滑滚动
    if (nav) {
      nav.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;

        e.preventDefault();
        const targetElement = document.getElementById(
          link.getAttribute("href").substring(1),
        );
        if (!targetElement) return;

        closeTOC();
        // 延迟滚动，等面板关闭动画完成
        setTimeout(() => {
          // -80 = header 高度偏移（与 toc.js 一致，改 header 高度需同步）
          const y =
            window.scrollY + targetElement.getBoundingClientRect().top - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
          history.replaceState(null, null, `#${targetElement.id}`);
        }, 150);
      });
    }

    // ESC 键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("show")) {
        closeTOC();
      }
    });
  }

  if (document.getElementById("mobile-toc-btn")) {
    initMobileTOC();
  }
})();
