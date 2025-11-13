/**
 * 智能折叠目录脚本 - 完整层级支持版本
 * 功能：
 * - 支持任意深度的标题层级（H2-H6）
 * - 当前章节自动展开，其他折叠
 * - 平滑滚动锚点
 * - 滚动高亮当前章节
 * - 递归展开/折叠动画
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

      // 滚动监听
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.updateActiveState();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // 窗口大小改变
      window.addEventListener('resize', () => {
        this.updateActiveState();
      });
    }

    /**
     * 切换展开/折叠
     */
    toggleExpand(item) {
      const isExpanded = item.classList.contains('expanded');
      if (isExpanded) {
        item.classList.remove('expanded');
      } else {
        item.classList.add('expanded');
      }
    }

    /**
     * 展开指定项及其所有祖先
     */
    expandToItem(item) {
      let current = item;

      // 向上遍历，展开所有祖先
      while (current) {
        if (current.classList.contains('toc-item')) {
          current.classList.add('expanded');
        }

        // 向上查找父级 toc-item
        current = current.parentElement;
        if (current && current.classList.contains('toc-children-container')) {
          current = current.parentElement;
        } else {
          break;
        }
      }
    }

    /**
     * 折叠所有项
     */
    collapseAll() {
      const items = this.toc.querySelectorAll('.toc-item');
      items.forEach(item => item.classList.remove('expanded'));
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

      // 自动展开当前项及其祖先，收起其他
      this.collapseAll();
      this.expandToItem(tocItem);
    }

    /**
     * 重新初始化（页面切换后）
     */
    reinit() {
      // 清理
      this.headings = [];
      this.tree = [];
      this.currentActive = null;

      // 重新初始化
      this.init();
    }
  }

  // 页面加载时初始化
  let tocInstance = null;

  function initTOC() {
    if (document.querySelector('aside nav')) {
      tocInstance = new SmartTOC();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOC);
  } else {
    initTOC();
  }

  // 支持页面切换后重新初始化
  window.tocEnhanceInit = function() {
    if (tocInstance) {
      tocInstance.reinit();
    } else {
      initTOC();
    }
  };

  // 注册重新初始化回调
  if (typeof window.addReinitCallback === 'function') {
    window.addReinitCallback(window.tocEnhanceInit);
  }
})();
