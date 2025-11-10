/**
 * 页面切换模糊过渡效果（模拟SPA）
 *
 * 使用 View Transition API + fetch 实现多页面网站的平滑页面切换
 * 与 arvin 项目效果保持一致：blur(1rem) + opacity fade
 *
 * 原理：
 * 1. 拦截链接点击
 * 2. 使用 fetch 加载目标页面
 * 3. 用 View Transition API 包装 DOM 替换
 * 4. 更新浏览器 URL 和历史记录
 */

(function() {
  'use strict';

  // 检查浏览器是否支持 View Transition API
  const supportsViewTransition = 'startViewTransition' in document;

  // 检查用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 如果不支持或用户偏好减少动画，直接返回
  if (!supportsViewTransition || prefersReducedMotion) {
    if (!supportsViewTransition) {
      console.log('ℹ️  当前浏览器不支持视图过渡 API，将使用默认页面导航');
    }
    return;
  }

  // 页面缓存（可选优化）
  const pageCache = new Map();

  /**
   * 判断是否为内部链接
   */
  function isInternalLink(url) {
    try {
      const link = new URL(url, window.location.origin);
      return link.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * 判断是否应该拦截此链接
   */
  function shouldInterceptNavigation(link) {
    // 排除带有特定属性的链接
    if (link.hasAttribute('download') ||
        link.hasAttribute('target') ||
        link.getAttribute('rel') === 'external') {
      return false;
    }

    const href = link.getAttribute('href');

    // 排除特殊链接
    if (!href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')) {
      return false;
    }

    // 只拦截内部链接
    return isInternalLink(link.href);
  }

  /**
   * 使用 fetch 加载页面内容
   */
  async function fetchPage(url) {
    // 检查缓存
    if (pageCache.has(url)) {
      return pageCache.get(url);
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 缓存页面（最多缓存10个页面）
      if (pageCache.size >= 10) {
        const firstKey = pageCache.keys().next().value;
        pageCache.delete(firstKey);
      }
      pageCache.set(url, doc);

      return doc;
    } catch (error) {
      console.error('❌ 页面加载失败:', error);
      throw error;
    }
  }

  /**
   * 替换页面内容
   */
  function replacePage(newDoc) {
    // 1. 更新标题
    document.title = newDoc.title;

    // 2. 替换 body 内容
    document.body.innerHTML = newDoc.body.innerHTML;

    // 3. 复制 body 的 class（用于主题等状态）
    document.body.className = newDoc.body.className;

    // 4. 可选：同步 meta 标签（description、keywords 等）
    const newMeta = newDoc.head.querySelectorAll('meta[name], meta[property]');
    newMeta.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const existing = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (existing) {
        existing.setAttribute('content', meta.getAttribute('content'));
      }
    });
  }

  /**
   * 重新初始化页面脚本和事件
   */
  function reinitialize() {
    // 1. 重新绑定链接点击事件
    setupLinkInterception();

    // 2. 重新初始化主题切换功能（main.js）
    if (window.enableThemeToggle) {
      window.enableThemeToggle();
    }

    // 3. 重新初始化主题切换动画（theme-transition.js）
    if (window.initThemeTransition) {
      window.initThemeTransition();
    }

    // 4. 重新初始化友人列表（friends.js）
    if (window.initFriends) {
      window.initFriends();
    }

    // 5. 重新初始化其他交互功能
    // 可以在这里添加其他需要重新初始化的脚本

    // 6. 滚动到页面顶部
    window.scrollTo(0, 0);

    // 7. 触发自定义事件，让其他脚本知道页面已更新
    window.dispatchEvent(new Event('page-loaded'));

    console.log('✅ 页面已重新初始化');
  }

  /**
   * 使用 View Transition 进行导航
   */
  async function navigateWithTransition(url) {
    // 如果是当前页面，不做处理
    if (url === window.location.href) {
      return;
    }

    try {
      // 1. 加载新页面
      const newDoc = await fetchPage(url);

      // 2. 使用 View Transition 包装 DOM 替换
      const transition = document.startViewTransition(() => {
        replacePage(newDoc);
      });

      // 3. 等待过渡完成
      await transition.finished;

      // 4. 更新浏览器历史记录
      window.history.pushState({ url }, '', url);

      // 5. 重新初始化页面
      reinitialize();

    } catch (error) {
      console.error('❌ 页面切换失败，使用普通导航:', error);
      // 降级：使用普通导航
      window.location.href = url;
    }
  }

  /**
   * 设置链接点击拦截
   */
  function setupLinkInterception() {
    // 移除旧的事件监听器（如果存在）
    document.removeEventListener('click', handleLinkClick);

    // 添加新的事件监听器
    document.addEventListener('click', handleLinkClick, false);
  }

  /**
   * 处理链接点击事件
   */
  function handleLinkClick(event) {
    // 查找最近的 <a> 元素
    const link = event.target.closest('a');

    if (!link) return;

    // 判断是否应该拦截
    if (!shouldInterceptNavigation(link)) return;

    // 阻止默认导航行为
    event.preventDefault();

    // 使用 View Transition 导航
    navigateWithTransition(link.href);
  }

  /**
   * 处理浏览器前进/后退按钮
   */
  function handlePopState(event) {
    const url = window.location.href;

    // 使用 View Transition 加载历史页面
    navigateWithTransition(url).catch(() => {
      // 如果失败，刷新页面
      window.location.reload();
    });
  }

  /**
   * 初始化
   */
  function initialize() {
    // 1. 设置链接拦截
    setupLinkInterception();

    // 2. 监听浏览器前进/后退
    window.addEventListener('popstate', handlePopState);

    // 3. 保存当前页面到历史记录
    window.history.replaceState({ url: window.location.href }, '', window.location.href);

    console.log('✨ 页面切换模糊动画已启用（View Transition API + SPA Mode）');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
