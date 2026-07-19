/**
 * 智能折叠目录脚本 - 完整层级支持版本
 * 功能：
 * - 支持任意深度的标题层级（H2-H6）
 * - 当前章节自动展开，其他折叠
 * - 平滑滚动锚点
 * - 滚动高亮当前章节
 * - 递归展开/折叠动画
 *
 * 前提：本站是 MPA，页面卸载即回收全部监听器/Observer，故本文件不做
 * removeEventListener / disconnect。若未来引入 SPA 复用本文件，必须先补回收逻辑。
 */

(function() {
  'use strict';

  class SmartTOC {
    constructor() {
      this.toc = null;
      this.headings = [];
      this.tree = [];
      this.currentActive = null;
      this.init();
    }

    /**
     * 初始化目录功能
     */
    init() {
      // 查找目录导航
      this.toc = document.querySelector('aside nav');
      if (!this.toc) return;

      // 获取原始目录列表
      const originalUl = this.toc.querySelector('ul');
      if (!originalUl) return;

      // 解析所有标题链接
      this.parseHeadings(originalUl);

      // 构建树形结构
      this.buildTree();

      // 重新构建 TOC DOM
      this.rebuildTOC(originalUl);

      // 设置事件监听
      this.setupEventListeners();

      // 初始化高亮
      this.updateActiveState();
    }

    /**
     * 解析所有标题链接，提取层级信息
     */
    parseHeadings(ul) {
      const allLinks = ul.querySelectorAll('a');

      allLinks.forEach(link => {
        // 提取层级（从 class="h2", "h3" 等）
        const match = link.className.match(/h(\d)/);
        if (!match) return;

        const level = parseInt(match[1]);
        const href = link.getAttribute('href');
        if (!href) return;

        const id = href.substring(1);
        const element = document.getElementById(id);
        if (!element) return;

        this.headings.push({
          level,
          id,
          text: link.textContent.trim(),
          element,
          link
        });
      });
    }

    /**
     * 构建树形结构
     */
    buildTree() {
      if (this.headings.length === 0) return;

      // 使用栈来构建树
      const root = { level: 0, children: [] };
      const stack = [root];

      this.headings.forEach(heading => {
        // 找到合适的父节点
        while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }

        const parent = stack[stack.length - 1];
        const node = { ...heading, children: [] };

        parent.children.push(node);
        stack.push(node);
      });

      this.tree = root.children;
    }

    /**
     * 重新构建目录 DOM 结构
     */
    rebuildTOC(originalUl) {
      // 清空原有内容
      originalUl.innerHTML = '';

      // 递归渲染树
      this.tree.forEach(node => {
        const item = this.renderNode(node);
        originalUl.appendChild(item);
      });
    }

    /**
     * 递归渲染单个节点
     */
    renderNode(node, depth = 0) {
      const groupDiv = document.createElement('div');
      groupDiv.className = `toc-group toc-level-${depth}`;

      const itemDiv = document.createElement('div');
      itemDiv.className = `toc-item toc-h${node.level}-item`;
      itemDiv.setAttribute('data-id', node.id);
      itemDiv.setAttribute('data-level', node.level);

      // 创建链接
      const link = document.createElement('a');
      link.href = `#${node.id}`;
      link.innerHTML = `
        ${node.children.length > 0 ? '<span class="toc-collapse-icon">▶</span>' : ''}
        <span class="toc-level-dot"></span>
        <span class="toc-text">${node.text}</span>
      `;
      itemDiv.appendChild(link);

      // 如果有子节点，递归渲染
      if (node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'toc-children-container';

        node.children.forEach(child => {
          const childItem = this.renderNode(child, depth + 1);
          childrenContainer.appendChild(childItem);
        });

        itemDiv.appendChild(childrenContainer);
      }

      groupDiv.appendChild(itemDiv);
      return groupDiv;
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
      // 平滑滚动
      this.toc.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          const y = window.scrollY + targetElement.getBoundingClientRect().top - 80;
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });

          // 更新 URL hash
          history.replaceState(null, null, `#${targetId}`);
        }
      });

      // 手动点击折叠图标切换展开/折叠
      this.toc.addEventListener('click', (e) => {
        const collapseIcon = e.target.closest('.toc-collapse-icon');
        if (collapseIcon) {
          e.preventDefault();
          e.stopPropagation();

          const item = e.target.closest('.toc-item');
          if (item) {
            this.toggleExpand(item);
          }
        }
      });

      // 滚动监听（rAF 节流）
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          this.updateActiveState();
          ticking = false;
        });
      }, { passive: true });

      // 窗口大小改变
      window.addEventListener('resize', () => {
        this.updateActiveState();
      });
    }

    /**
     * 切换展开/折叠（手动操作）
     */
    toggleExpand(item) {
      const isExpanded = item.classList.contains('expanded');
      if (isExpanded) {
        // 手动收起：标记为手动收起状态
        item.classList.remove('expanded');
        item.classList.add('manually-collapsed');
        item.classList.remove('manually-expanded');
      } else {
        // 手动展开：标记为手动展开状态
        item.classList.add('expanded');
        item.classList.add('manually-expanded');
        item.classList.remove('manually-collapsed');
      }
    }

    /**
     * 获取当前项到根的路径上所有 toc-item
     */
    getAncestorPath(item) {
      const path = [];
      let current = item;

      while (current) {
        if (current.classList.contains('toc-item')) {
          path.push(current);
        }
        current = current.parentElement;
        if (current && current.classList.contains('toc-children-container')) {
          current = current.parentElement;
        } else if (!current || !current.closest('.toc-item')) {
          break;
        }
      }
      return path;
    }

    /**
     * 更新展开状态（滚动时调用）
     * 逻辑：
     * - 当前路径上的项展开
     * - 手动展开的项保持展开
     * - 手动收起的项保持收起
     * - 其他项收起
     */
    updateExpandState(activeItem) {
      if (!activeItem) return;

      // 获取当前激活项的祖先路径
      const activePath = this.getAncestorPath(activeItem);
      const activePathIds = new Set(activePath.map(el => el.dataset.id));

      // 遍历所有 toc-item
      const allItems = this.toc.querySelectorAll('.toc-item');
      allItems.forEach(item => {
        const isInActivePath = activePathIds.has(item.dataset.id);
        const isManuallyExpanded = item.classList.contains('manually-expanded');
        const isManuallyCollapsed = item.classList.contains('manually-collapsed');

        if (isManuallyCollapsed) {
          // 手动收起的保持收起
          item.classList.remove('expanded');
        } else if (isManuallyExpanded || isInActivePath) {
          // 手动展开的或在当前路径上的：展开
          item.classList.add('expanded');
        } else {
          // 其他的：收起
          item.classList.remove('expanded');
        }
      });
    }

    /**
     * 更新激活状态
     */
    updateActiveState() {
      if (this.headings.length === 0) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 找到当前激活的标题
      let newActive = null;

      // 如果滚动到页面底部，激活最后一个
      if (scrollY + windowHeight >= docHeight - 10) {
        newActive = this.headings[this.headings.length - 1];
      } else {
        // 从下往上查找第一个在视口上方或内部的标题
        for (let i = this.headings.length - 1; i >= 0; i--) {
          const heading = this.headings[i];
          const rect = heading.element.getBoundingClientRect();

          if (rect.top <= 100) {
            newActive = heading;
            break;
          }
        }
      }

      // 如果激活状态改变
      if (newActive && newActive.id !== this.currentActive?.id) {
        this.updateHighlight(newActive);
        this.currentActive = newActive;
      }
    }

    /**
     * 更新高亮状态
     */
    updateHighlight(heading) {
      // 移除所有高亮
      this.toc.querySelectorAll('.toc-item.active').forEach(el => {
        el.classList.remove('active');
      });

      // 找到对应的 TOC 项
      const tocItem = this.toc.querySelector(`.toc-item[data-id="${heading.id}"]`);
      if (!tocItem) return;

      // 添加新高亮
      tocItem.classList.add('active');

      // 更新展开状态
      this.updateExpandState(tocItem);
    }

  }

  // 页面加载时初始化
  function initTOC() {
    if (document.querySelector('aside nav')) {
      new SmartTOC();
    }
    // 初始化移动端目录
    initMobileTOC();
    // 初始化 TOC 可见性检测
    initTOCVisibility();
  }

  // TOC 可见性检测 - 根据 TOC 左边距离文章主体的空间动态切换
  function initTOCVisibility() {
    const main = document.querySelector('body.post #wrapper > main');
    if (!main) return;

    const MIN_GAP = 30; // TOC 左边与文章右边的最小间距（像素）
    const TOC_WIDTH = 220; // TOC 宽度
    const TOC_RIGHT = 20; // TOC 距离右边的距离

    function checkTOCVisibility() {
      const mainRect = main.getBoundingClientRect();
      const windowWidth = window.innerWidth;

      // TOC 左边位置 = 窗口宽度 - TOC右边距 - TOC宽度
      const tocLeft = windowWidth - TOC_RIGHT - TOC_WIDTH;
      // 文章主体右边位置
      const mainRight = mainRect.right;
      // 计算间距
      const gap = tocLeft - mainRight;

      if (gap >= MIN_GAP) {
        document.body.classList.add('toc-visible');
      } else {
        document.body.classList.remove('toc-visible');
      }
    }

    // 立即检测
    checkTOCVisibility();

    // 使用 ResizeObserver 监听窗口变化，响应更快
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(checkTOCVisibility);
      ro.observe(document.documentElement);
    } else {
      // 降级：用 resize 事件
      window.addEventListener('resize', checkTOCVisibility);
    }
  }

  // 尽早执行可见性检测（不等待其他初始化）
  if (document.body.classList.contains('post')) {
    // DOM 已经可用，立即检测
    const main = document.querySelector('#wrapper > main');
    if (main) {
      const MIN_GAP = 30, TOC_WIDTH = 220, TOC_RIGHT = 20;
      const tocLeft = window.innerWidth - TOC_RIGHT - TOC_WIDTH;
      const mainRight = main.getBoundingClientRect().right;
      if (tocLeft - mainRight >= MIN_GAP) {
        document.body.classList.add('toc-visible');
      }
    }
  }

  // 移动端目录控制
  function initMobileTOC() {
    const btn = document.getElementById('mobile-toc-btn');
    const overlay = document.getElementById('mobile-toc-overlay');
    const panel = document.getElementById('mobile-toc-panel');
    const closeBtn = document.getElementById('mobile-toc-close');
    const themeToggle = document.getElementById('mobile-theme-toggle');
    const nav = document.getElementById('mobile-toc-nav');

    if (!btn || !panel) return;

    function openTOC() {
      overlay.classList.add('show');
      panel.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeTOC() {
      overlay.classList.remove('show');
      panel.classList.remove('show');
      document.body.style.overflow = '';
    }

    // 主题切换（复用 main.js 的圆形扩散动画）
    if (themeToggle) {
      themeToggle.addEventListener('click', (event) => {
        if (window.runThemeCircleTransition) {
          window.runThemeCircleTransition(event);
          return;
        }
        // 兜底：无动画直接切换
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        document.body.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        const hlLink = document.querySelector('link#hl');
        if (hlLink) hlLink.href = `/hl-${newTheme}.css`;
        localStorage.setItem('theme', newTheme);
      });
    }

    // 打开目录
    btn.addEventListener('click', openTOC);

    // 关闭目录
    if (closeBtn) {
      closeBtn.addEventListener('click', closeTOC);
    }
    if (overlay) {
      overlay.addEventListener('click', closeTOC);
    }

    // 点击目录链接后关闭面板并平滑滚动
    if (nav) {
      nav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          closeTOC();
          // 延迟滚动，等面板关闭动画完成
          setTimeout(() => {
            const y = window.scrollY + targetElement.getBoundingClientRect().top - 80;
            window.scrollTo({
              top: y,
              behavior: 'smooth'
            });
            history.replaceState(null, null, `#${targetId}`);
          }, 150);
        }
      });
    }

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('show')) {
        closeTOC();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOC);
  } else {
    initTOC();
  }
})();
