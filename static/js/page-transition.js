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

    // 2. 先保存当前主题状态（防止闪烁）
    const currentTheme = sessionStorage.getItem("theme");
    const isDark = currentTheme === "dark" || currentTheme === null;  // null视为暗色

    // 3. 先更新 body class（在替换内容之前，确保主题状态正确）
    const newBodyClasses = newDoc.body.className.split(' ');

    // 保留当前的主题状态，使用新页面的其他 class
    document.body.className = newBodyClasses
      .filter(cls => cls !== 'dark')  // 移除新页面的 dark class
      .concat(isDark ? ['dark'] : [])  // 添加当前的主题状态
      .join(' ');

    // 4. 替换 body 内容
    document.body.innerHTML = newDoc.body.innerHTML;

    // 5. 可选：同步 meta 标签（description、keywords 等）
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
    // 1. 移除主题切换按钮的初始化标记
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.removeAttribute('data-theme-toggle-initialized');
    }

    // 2. 重新初始化主题切换功能（main.js）
    if (window.enableThemeToggle) {
      window.enableThemeToggle();
    }

    // 3. 重新初始化主题切换动画（theme-transition.js）
    if (window.initThemeTransition) {
      window.initThemeTransition();
    }

    // 4. 重新初始化友人列表（friends.js）
    // 先确保友人帐排序已预生成
    if (window.preGenerateFriendsOrder) {
      window.preGenerateFriendsOrder();
    }
    // 然后应用排序
    if (window.initFriends) {
      window.initFriends();
    }

    // 5. 重新初始化目录功能（toc-enhance.js）
    if (window.tocEnhanceInit) {
      window.tocEnhanceInit();
    }

    // 6. 重新初始化星星背景效果（star.js）
    if (window.cleanupStars) {
      window.cleanupStars();
    }
    if (window.initStars) {
      window.initStars();
    }

    // 7. 重新初始化头像切换功能（avatar-switcher.js）
    if (window.cleanupAvatarSwitcher) {
      window.cleanupAvatarSwitcher();
    }
    if (window.initAvatarSwitcher) {
      window.initAvatarSwitcher();
    }

    // 8. 重新初始化其他交互功能
    // 可以在这里添加其他需要重新初始化的脚本

    // 9. 滚动到页面顶部
    window.scrollTo(0, 0);

    // 10. 触发自定义事件，让其他脚本知道页面已更新
    window.dispatchEvent(new Event('page-loaded'));

    console.log('✅ 页面已重新初始化');
  }

  /**
   * 规范化URL用于比较
   */
  function normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // 移除尾部斜杠进行统一比较（但保留根路径的斜杠）
      let pathname = parsed.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      return parsed.origin + pathname + parsed.search + parsed.hash;
    } catch (e) {
      return url;
    }
  }

  /**
   * 使用 View Transition 进行导航
   */
  async function navigateWithTransition(url) {
    // 规范化URL比较
    const normalizedUrl = normalizeUrl(url);
    const normalizedHref = normalizeUrl(window.location.href);

    if (normalizedUrl === normalizedHref) {
      console.log('⏭️ 跳过导航：已在目标页面');
      return;
    }

    // 防止循环：检查是否正在导航中
    if (window.isNavigating) {
      console.log('⏭️ 跳过导航：正在导航中');
      return;
    }

    try {
      window.isNavigating = true;

      // 1. 加载新页面
      const newDoc = await fetchPage(url);

      // 2. 使用 View Transition API
      if (!document.startViewTransition) {
        replacePage(newDoc);
        history.pushState(null, '', url);
        reinitialize();
        window.isNavigating = false;
        return;
      }

      const transition = document.startViewTransition(() => {
        replacePage(newDoc);
      });

      await transition.finished;

      // 3. 更新浏览器历史
      history.pushState(null, '', url);

      // 4. 重新初始化页面脚本
      reinitialize();

      window.isNavigating = false;

    } catch (error) {
      window.isNavigating = false;
      console.error('❌ 页面切换失败:', error);
      // 降级方案：使用传统方式跳转
      window.location.href = url;
    }
  }

  /**
   * 设置链接点击拦截
   */
  let isLinkInterceptionSetup = false;

  function setupLinkInterception() {
    // 防止重复绑定
    if (isLinkInterceptionSetup) {
      console.log('⏭️ 链接拦截已设置');
      return;
    }

    document.addEventListener('click', handleLinkClick, false);
    isLinkInterceptionSetup = true;
    console.log('✅ 链接拦截已设置');
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

    // 防止循环
    if (window.isNavigating) {
      return;
    }

    // 使用 View Transition 加载历史页面
    navigateWithTransition(url).catch((error) => {
      console.error('后退/前进失败，刷新页面:', error);
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
