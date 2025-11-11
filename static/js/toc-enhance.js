/**
 * 智能折叠目录脚本
 * 功能：
 * - 自动将H2和H3分组
 * - 当前章节自动展开，其他折叠
 * - 平滑滚动锚点
 * - 滚动高亮当前章节
 * - 波动动画效果
 */

(function() {
  'use strict';

  class SmartTOC {
    constructor() {
      this.toc = null;
      this.h2Groups = [];
      this.currentActiveH2Index = -1;
      this.currentActiveH3Index = -1;
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

      // 分组处理 H2 和 H3
      this.groupHeadings(originalUl);

      // 重新构建 TOC 结构
      this.rebuildTOC(originalUl);

      // 设置事件监听
      this.setupEventListeners();

      // 初始化高亮
      this.updateActiveState();
    }

    /**
     * 将 H2 和 H3 分组
     */
    groupHeadings(ul) {
      const items = Array.from(ul.children);
      let currentGroup = null;

      items.forEach(li => {
        const link = li.querySelector('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const id = href ? href.substring(1) : '';
        const element = id ? document.getElementById(id) : null;
        if (!element) return;

        const isH2 = link.classList.contains('h2');
        const isH3 = link.classList.contains('h3');

        if (isH2) {
          // 创建新的 H2 分组
          currentGroup = {
            h2: {
              link,
              element,
              id,
              text: link.textContent.trim()
            },
            h3List: []
          };
          this.h2Groups.push(currentGroup);
        } else if (isH3 && currentGroup) {
          // 添加 H3 到当前分组
          currentGroup.h3List.push({
            link,
            element,
            id,
            text: link.textContent.trim()
          });
        }
      });
    }

    /**
     * 重新构建目录 DOM 结构
     */
    rebuildTOC(originalUl) {
      // 清空原有内容
      originalUl.innerHTML = '';

      this.h2Groups.forEach((group, groupIndex) => {
        // 创建 H2 分组容器
        const h2GroupDiv = document.createElement('div');
        h2GroupDiv.className = 'toc-h2-group';

        // 创建 H2 项
        const h2Item = document.createElement('div');
        h2Item.className = 'toc-h2-item';
        h2Item.setAttribute('data-group-index', groupIndex);

        // 创建 H2 链接
        const h2Link = document.createElement('a');
        h2Link.href = `#${group.h2.id}`;
        h2Link.innerHTML = `
          ${group.h3List.length > 0 ? '<span class="toc-collapse-icon">▶</span>' : ''}
          <span class="toc-level-dot"></span>
          <span class="toc-text">${group.h2.text}</span>
        `;
        h2Item.appendChild(h2Link);

        // 如果有 H3 子项，创建 H3 容器
        if (group.h3List.length > 0) {
          const h3Container = document.createElement('div');
          h3Container.className = 'toc-h3-container';

          group.h3List.forEach((h3, h3Index) => {
            const h3Item = document.createElement('div');
            h3Item.className = 'toc-h3-item';
            h3Item.setAttribute('data-group-index', groupIndex);
            h3Item.setAttribute('data-h3-index', h3Index);

            const h3Link = document.createElement('a');
            h3Link.href = `#${h3.id}`;
            h3Link.innerHTML = `
              <span class="toc-level-dot"></span>
              <span class="toc-text">${h3.text}</span>
            `;
            h3Item.appendChild(h3Link);
            h3Container.appendChild(h3Item);
          });

          h2Item.appendChild(h3Container);
        }

        h2GroupDiv.appendChild(h2Item);
        originalUl.appendChild(h2GroupDiv);
      });
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

      // 手动点击 H2 切换折叠
      this.toc.addEventListener('click', (e) => {
        const h2Item = e.target.closest('.toc-h2-item');
        if (!h2Item) return;

        const collapseIcon = e.target.closest('.toc-collapse-icon');
        if (collapseIcon) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleH2Expand(h2Item);
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
        this.recalculatePositions();
      });
    }

    /**
     * 手动切换 H2 展开/折叠
     */
    toggleH2Expand(h2Item) {
      const isExpanded = h2Item.classList.contains('expanded');
      if (isExpanded) {
        h2Item.classList.remove('expanded');
      } else {
        h2Item.classList.add('expanded');
      }
    }

    /**
     * 展开指定的 H2 分组
     */
    expandH2(groupIndex) {
      const h2Items = this.toc.querySelectorAll('.toc-h2-item');
      if (groupIndex >= 0 && groupIndex < h2Items.length) {
        h2Items[groupIndex].classList.add('expanded');
      }
    }

    /**
     * 收起指定的 H2 分组
     */
    collapseH2(groupIndex) {
      const h2Items = this.toc.querySelectorAll('.toc-h2-item');
      if (groupIndex >= 0 && groupIndex < h2Items.length) {
        h2Items[groupIndex].classList.remove('expanded');
      }
    }

    /**
     * 收起所有 H2 分组
     */
    collapseAllH2() {
      const h2Items = this.toc.querySelectorAll('.toc-h2-item');
      h2Items.forEach(item => item.classList.remove('expanded'));
    }

    /**
     * 更新激活状态
     */
    updateActiveState() {
      if (this.h2Groups.length === 0) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 找到当前激活的章节
      let newActiveH2Index = -1;
      let newActiveH3Index = -1;

      // 如果滚动到页面底部，激活最后一个
      if (scrollY + windowHeight >= docHeight - 10) {
        const lastGroup = this.h2Groups[this.h2Groups.length - 1];
        newActiveH2Index = this.h2Groups.length - 1;
        if (lastGroup.h3List.length > 0) {
          newActiveH3Index = lastGroup.h3List.length - 1;
        }
      } else {
        // 从下往上查找第一个在视口上方或内部的标题
        for (let i = this.h2Groups.length - 1; i >= 0; i--) {
          const group = this.h2Groups[i];

          // 检查 H3
          for (let j = group.h3List.length - 1; j >= 0; j--) {
            const h3 = group.h3List[j];
            const rect = h3.element.getBoundingClientRect();
            if (rect.top <= 100) {
              newActiveH2Index = i;
              newActiveH3Index = j;
              break;
            }
          }

          if (newActiveH2Index >= 0) break;

          // 检查 H2
          const h2Rect = group.h2.element.getBoundingClientRect();
          if (h2Rect.top <= 100) {
            newActiveH2Index = i;
            newActiveH3Index = -1;
            break;
          }
        }
      }

      // 如果激活状态改变
      if (newActiveH2Index !== this.currentActiveH2Index || newActiveH3Index !== this.currentActiveH3Index) {
        this.updateHighlight(newActiveH2Index, newActiveH3Index);
        this.currentActiveH2Index = newActiveH2Index;
        this.currentActiveH3Index = newActiveH3Index;
      }
    }

    /**
     * 更新高亮状态
     */
    updateHighlight(h2Index, h3Index) {
      // 移除所有高亮
      this.toc.querySelectorAll('.toc-h2-item.active').forEach(el => {
        el.classList.remove('active');
      });
      this.toc.querySelectorAll('.toc-h3-item.active').forEach(el => {
        el.classList.remove('active');
      });

      // 添加新高亮
      const h2Items = this.toc.querySelectorAll('.toc-h2-item');

      if (h2Index >= 0 && h2Index < h2Items.length) {
        const h2Item = h2Items[h2Index];
        h2Item.classList.add('active');

        // 自动展开当前 H2，收起其他
        this.collapseAllH2();
        this.expandH2(h2Index);

        // 高亮 H3
        if (h3Index >= 0) {
          const h3Items = h2Item.querySelectorAll('.toc-h3-item');
          if (h3Index < h3Items.length) {
            h3Items[h3Index].classList.add('active');
          }
        }
      }
    }

    /**
     * 重新计算位置（窗口大小改变时）
     */
    recalculatePositions() {
      this.h2Groups.forEach(group => {
        group.h2.element = document.getElementById(group.h2.id);
        group.h3List.forEach(h3 => {
          h3.element = document.getElementById(h3.id);
        });
      });
      this.updateActiveState();
    }

    /**
     * 重新初始化（页面切换后）
     */
    reinit() {
      // 清理
      this.h2Groups = [];
      this.currentActiveH2Index = -1;
      this.currentActiveH3Index = -1;

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
