/**
 * 桌面目录（仅文章页）：目录树重建 + 折叠/展开 + 滚动高亮 + 可见性检测 + 溢出 tooltip。
 *
 * 前提：本站是 MPA，页面卸载即回收全部监听器/Observer，故本文件不做
 * removeEventListener / disconnect。若未来引入 SPA 复用，必须先补回收逻辑。
 */

(function () {
  "use strict";

  class SmartTOC {
    constructor() {
      this.toc = null;
      this.headings = [];
      this.tree = [];
      this.currentActive = null;
      this.init();
    }

    init() {
      this.toc = document.querySelector("aside nav");
      if (!this.toc) return;

      const originalUl = this.toc.querySelector("ul");
      if (!originalUl) return;

      this.parseHeadings(originalUl);
      this.buildTree();
      this.rebuildTOC(originalUl);
      this.setupEventListeners();
      this.updateActiveState();
    }

    // 从 Hugo 生成的目录链接里解析标题层级（class="h2"/"h3"）
    parseHeadings(ul) {
      ul.querySelectorAll("a").forEach((link) => {
        const match = link.className.match(/h(\d)/);
        if (!match) return;

        const level = parseInt(match[1]);
        const href = link.getAttribute("href");
        if (!href) return;

        const id = href.substring(1);
        const element = document.getElementById(id);
        if (!element) return;

        this.headings.push({
          level,
          id,
          text: link.textContent.trim(),
          element,
          link,
        });
      });
    }

    buildTree() {
      if (this.headings.length === 0) return;

      const root = { level: 0, children: [] };
      const stack = [root];

      this.headings.forEach((heading) => {
        while (
          stack.length > 1 &&
          stack[stack.length - 1].level >= heading.level
        ) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        const node = { ...heading, children: [] };
        parent.children.push(node);
        stack.push(node);
      });

      this.tree = root.children;
    }

    rebuildTOC(originalUl) {
      originalUl.innerHTML = "";
      this.tree.forEach((node) =>
        originalUl.appendChild(this.renderNode(node)),
      );
    }

    renderNode(node, depth = 0) {
      const groupDiv = document.createElement("div");
      groupDiv.className = `toc-group toc-level-${depth}`;

      const itemDiv = document.createElement("div");
      itemDiv.className = `toc-item toc-h${node.level}-item`;
      itemDiv.setAttribute("data-id", node.id);
      itemDiv.setAttribute("data-level", node.level);

      const link = document.createElement("a");
      link.href = `#${node.id}`;
      link.innerHTML = `
        ${node.children.length > 0 ? '<span class="toc-collapse-icon">▶</span>' : ""}
        <span class="toc-level-dot"></span>
        <span class="toc-text">${node.text}</span>
      `;
      itemDiv.appendChild(link);

      if (node.children.length > 0) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "toc-children-container";
        node.children.forEach((child) =>
          childrenContainer.appendChild(this.renderNode(child, depth + 1)),
        );
        itemDiv.appendChild(childrenContainer);
      }

      groupDiv.appendChild(itemDiv);
      return groupDiv;
    }

    setupEventListeners() {
      this.toc.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;

        e.preventDefault();
        const targetElement = document.getElementById(
          link.getAttribute("href").substring(1),
        );
        if (targetElement) {
          // -80 = header 高度偏移，让锚点滚到标题正下方而非被 header 遮挡
          const y =
            window.scrollY + targetElement.getBoundingClientRect().top - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
          history.replaceState(null, null, `#${targetElement.id}`);
        }
      });

      this.toc.addEventListener("click", (e) => {
        const collapseIcon = e.target.closest(".toc-collapse-icon");
        if (!collapseIcon) return;
        e.preventDefault();
        e.stopPropagation();
        const item = e.target.closest(".toc-item");
        if (item) this.toggleExpand(item);
      });

      // 滚动监听（rAF 节流）
      let ticking = false;
      window.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            this.updateActiveState();
            ticking = false;
          });
        },
        { passive: true },
      );

      window.addEventListener("resize", () => this.updateActiveState());
    }

    toggleExpand(item) {
      const isExpanded = item.classList.contains("expanded");
      if (isExpanded) {
        item.classList.remove("expanded");
        item.classList.add("manually-collapsed");
        item.classList.remove("manually-expanded");
      } else {
        item.classList.add("expanded", "manually-expanded");
        item.classList.remove("manually-collapsed");
      }
    }

    getAncestorPath(item) {
      const path = [];
      let current = item;
      while (current) {
        if (current.classList.contains("toc-item")) path.push(current);
        current = current.parentElement;
        if (current && current.classList.contains("toc-children-container")) {
          current = current.parentElement;
        } else if (!current || !current.closest(".toc-item")) {
          break;
        }
      }
      return path;
    }

    updateExpandState(activeItem) {
      if (!activeItem) return;
      const activePathIds = new Set(
        this.getAncestorPath(activeItem).map((el) => el.dataset.id),
      );

      this.toc.querySelectorAll(".toc-item").forEach((item) => {
        const isInActivePath = activePathIds.has(item.dataset.id);
        const isManuallyExpanded = item.classList.contains("manually-expanded");
        const isManuallyCollapsed =
          item.classList.contains("manually-collapsed");

        if (isManuallyCollapsed) {
          item.classList.remove("expanded");
        } else if (isManuallyExpanded || isInActivePath) {
          item.classList.add("expanded");
        } else {
          item.classList.remove("expanded");
        }
      });
    }

    updateActiveState() {
      if (this.headings.length === 0) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      let newActive = null;

      if (scrollY + windowHeight >= docHeight - 10) {
        newActive = this.headings[this.headings.length - 1];
      } else {
        for (let i = this.headings.length - 1; i >= 0; i--) {
          if (this.headings[i].element.getBoundingClientRect().top <= 100) {
            newActive = this.headings[i];
            break;
          }
        }
      }

      if (newActive && newActive.id !== this.currentActive?.id) {
        this.updateHighlight(newActive);
        this.currentActive = newActive;
      }
    }

    updateHighlight(heading) {
      this.toc
        .querySelectorAll(".toc-item.active")
        .forEach((el) => el.classList.remove("active"));
      const tocItem = this.toc.querySelector(
        `.toc-item[data-id="${heading.id}"]`,
      );
      if (!tocItem) return;
      tocItem.classList.add("active");
      this.updateExpandState(tocItem);
    }
  }

  // 目录可见性：文章主体与右侧目录间距足够时才显示桌面目录
  function initTOCVisibility() {
    const main = document.querySelector("body.post #wrapper > main");
    if (!main) return;

    const MIN_GAP = 30; // 目录左边与文章右边的最小间距
    const TOC_WIDTH = 220; // 目录宽度（与 main.scss 里的 aside nav 宽度一致）
    const TOC_RIGHT = 20; // 目录距右边缘

    function checkTOCVisibility() {
      const tocLeft = window.innerWidth - TOC_RIGHT - TOC_WIDTH;
      const mainRight = main.getBoundingClientRect().right;
      document.body.classList.toggle(
        "toc-visible",
        tocLeft - mainRight >= MIN_GAP,
      );
    }

    checkTOCVisibility();

    if (window.ResizeObserver) {
      new ResizeObserver(checkTOCVisibility).observe(document.documentElement);
    } else {
      window.addEventListener("resize", checkTOCVisibility);
    }
  }

  // 溢出 tooltip：目录项文字被截断时加 title 提示
  function enableTocTooltip() {
    const anchors = document.querySelectorAll("aside nav a");
    if (anchors.length === 0) return;

    const toggleTooltip = () => {
      anchors.forEach((anchor) => {
        if (anchor.offsetWidth < anchor.scrollWidth) {
          anchor.setAttribute("title", anchor.textContent);
        } else {
          anchor.removeAttribute("title");
        }
      });
    };

    window.addEventListener("resize", toggleTooltip);
    toggleTooltip();
  }

  if (document.querySelector("aside nav")) {
    new SmartTOC();
  }
  initTOCVisibility();
  enableTocTooltip();
})();
