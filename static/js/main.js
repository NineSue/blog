function enableThemeToggle() {
  const themeToggle = document.querySelector('#theme-toggle');
  const hlLink = document.querySelector('link#hl');
  const preferDark = window.matchMedia("(prefers-color-scheme: dark)");

  // 应用主题(切换路径)。首帧初始化在 templates/_base.html 的内联脚本(防闪白)
  // —— 改存储键或默认值时,两处必须同步。
  function applyTheme(theme) {
    if (theme == "dark") {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    if (hlLink) hlLink.href = `/hl-${theme}.css`;
    localStorage.setItem("theme", theme);
    toggleGiscusTheme(theme);
  }
  function toggleGiscusTheme(theme) {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: `${location.origin}/giscus_${theme}.css` } } }, 'https://giscus.app');
  }
  function initGiscusTheme(evt) {
    if (evt.origin !== 'https://giscus.app') return;
    if (!(typeof evt.data === 'object' && evt.data.giscus)) return;
    toggleGiscusTheme(localStorage.getItem("theme") || (preferDark.matches ? "dark" : "light"));
    window.removeEventListener('message', initGiscusTheme);
  }
  window.addEventListener('message', initGiscusTheme);

  // 主题切换：圆形扩散/收缩动画
  // 亮 → 暗：从外向内收缩；暗 → 亮：从内向外扩散
  function runThemeCircleTransition(event) {
    const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';

    const canAnimate = document.startViewTransition
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && event && typeof event.clientX === 'number';

    if (!canAnimate) {
      applyTheme(newTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // 动画期间挂起星空，避免掉帧
    if (window.pauseStars) window.pauseStars();

    const transition = document.startViewTransition(() => applyTheme(newTheme));

    transition.ready.then(() => {
      const nowDark = document.body.classList.contains('dark');
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];
      document.documentElement.animate(
        { clipPath: nowDark ? [...clipPath].reverse() : clipPath },
        {
          duration: 300,
          easing: 'ease-out',
          fill: 'forwards',
          pseudoElement: nowDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
        }
      );
    });

    transition.finished.then(() => {
      if (window.resumeStars) window.resumeStars();
    });
  }

  // 供移动端目录面板的主题按钮复用（toc-enhance.js）
  window.runThemeCircleTransition = runThemeCircleTransition;

  if (themeToggle) {
    themeToggle.addEventListener('click', runThemeCircleTransition);
  }
  preferDark.addEventListener("change", e => applyTheme(e.matches ? "dark" : "light"));
}

function enablePrerender() {
  const prerender = (a) => {
    if (!a.classList.contains('instant')) return;
    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify({ prerender: [{ source: 'list', urls: [a.href] }] });
    document.body.append(script);
    a.classList.remove('instant');
  }
  const prefetch = (a) => {
    if (!a.classList.contains('instant')) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = a.href;
    document.head.append(link);
    a.classList.remove('instant');
  }
  const support = HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
  const handle = support ? prerender : prefetch;
  document.querySelectorAll('a.instant').forEach(a => {
    if (a.href.endsWith(window.location.pathname)) return;
    let timer;
    a.addEventListener('mouseenter', () => {
      timer = setTimeout(() => handle(a), 50);
    });
    a.addEventListener('mouseleave', () => clearTimeout(timer));
    a.addEventListener('touchstart', () => handle(a), { passive: true });
  });
}

function enableTocTooltip() {
  const anchors = document.querySelectorAll('aside nav a');
  if (anchors.length == 0) return;
  const toggleTooltip = () => {
    anchors.forEach(anchor => {
      if (anchor.offsetWidth < anchor.scrollWidth) {
        anchor.setAttribute('title', anchor.textContent);
      } else {
        anchor.removeAttribute('title');
      }
    });
  };
  window.addEventListener('resize', toggleTooltip);
  toggleTooltip();
}

function addCopyBtns() {
  const cfg = document.querySelector('#copy-cfg');
  if (!cfg) return;
  const copyIcon = cfg.dataset.copyIcon;
  const checkIcon = cfg.dataset.checkIcon;
  document.querySelectorAll('pre').forEach(block => {
    if (block.classList.contains('mermaid')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'codeblock';
    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.ariaLabel = 'copy';
    btn.innerHTML = copyIcon;
    const copy = () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.innerHTML = checkIcon;
        btn.classList.add('copied');
        btn.removeEventListener('click', copy);
        setTimeout(() => {
          btn.innerHTML = copyIcon;
          btn.classList.remove('copied');
          btn.addEventListener('click', copy);
        }, 1500);
      });
    };
    btn.addEventListener('click', copy);
    wrapper.appendChild(block.cloneNode(true));
    wrapper.appendChild(btn);
    block.replaceWith(wrapper);
  });
}

function addBackToTopBtn() {
  const backBtn = document.querySelector('#back-to-top');
  if (!backBtn) return;
  const toTop = () => window.scrollTo({ top: 0 });
  const toggle = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 200 && !backBtn.classList.contains('shown')) {
      backBtn.classList.add('shown');
      backBtn.setAttribute('tabindex', 0);
      backBtn.addEventListener('click', toTop);
    } else if (scrollTop <= 200 && backBtn.classList.contains('shown')) {
      backBtn.classList.remove('shown');
      backBtn.setAttribute('tabindex', -1);
      backBtn.removeEventListener('click', toTop);
    }
  };
  window.addEventListener('scroll', toggle);
  toggle();
}

function addFootnoteBacklink() {
  const footnotes = document.querySelectorAll('.footnote-definition');
  footnotes.forEach(footnote => {
    const backlink = document.createElement('button');
    backlink.className = 'backlink';
    backlink.ariaLabel = 'backlink';
    backlink.innerHTML = '↩︎';
    backlink.addEventListener('click', () => window.scrollTo({
      top: document.querySelector(`.footnote-reference a[href="#${footnote.id}"]`).getBoundingClientRect().top + window.scrollY,
    }));
    const lastEl = footnote.lastElementChild || footnote;
    lastEl.appendChild(backlink);
  });
}

function enableImgLightense() {
  window.addEventListener("load", () => Lightense(".prose img:not(.no-lightense)", {
    background: 'rgba(0, 0, 0, 0.9)',  // 恢复高不透明度
    zIndex: 9999999
  }));
}

function enableBackLink() {
  const backLink = document.querySelector('#back-link');
  if (!backLink) return;
  const referrer = document.referrer;
  const hasReferrerHistory = referrer && referrer.startsWith(location.origin);

  if (hasReferrerHistory) {
    window.sessionStorage.setItem('hasNavigated', 'true');
  }
  const hasInternalHistory = hasReferrerHistory || sessionStorage.getItem('hasNavigated') === 'true';

  if (hasInternalHistory) {
    document.body.classList.add('has-history');
    document.body.classList.remove('no-history');
  } else {
    document.body.classList.add('no-history');
    document.body.classList.remove('has-history');
  }

  backLink.addEventListener('click', (e) => {
    if (hasInternalHistory && !location.hash) {
      e.preventDefault();
      history.back();
    }
  });
}

enableThemeToggle();
enablePrerender();
enableBackLink();
if (document.body.classList.contains('post')) {
  addBackToTopBtn();
  enableTocTooltip();
}
if (document.querySelector('.prose')) {
  addCopyBtns();
  addFootnoteBacklink();
  enableImgLightense();
}
