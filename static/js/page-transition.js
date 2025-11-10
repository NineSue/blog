/**
 * 页面切换模糊过渡效果
 *
 * 注意：此脚本用于启用跨文档视图过渡（Cross-Document View Transitions）
 * 这是一个现代浏览器特性，目前主要在 Chrome 126+ 中支持
 *
 * 与 arvin 项目效果保持一致：blur(1rem) + opacity fade
 *
 * 实际的过渡动画由 CSS 中的 @view-transition 规则和
 * ::view-transition-old/new(root) 伪元素控制
 */

(function() {
  'use strict';

  // 检查用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // 如果用户偏好减少动画，禁用视图过渡
    if (document.documentElement.style) {
      document.documentElement.style.viewTransitionName = 'none';
    }
    return;
  }

  // 对于跨文档视图过渡，浏览器会自动处理页面导航时的动画
  // 我们只需要确保 CSS 规则已经定义（在 main.scss 中）

  // 可选：记录视图过渡支持情况
  const supportsViewTransition = CSS.supports('view-transition-name', 'none');

  if (supportsViewTransition) {
    console.log('✨ 页面切换模糊动画已启用（Cross-Document View Transitions）');
  } else {
    console.log('ℹ️  当前浏览器不支持视图过渡 API，将使用默认页面导航');
  }

  // 未来可以在这里添加自定义的过渡逻辑或增强功能
  // 例如：根据导航方向应用不同的动画效果
})();
