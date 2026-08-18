// 站内链接预渲染（speculationrules，不支持则降级 prefetch）
function enablePrerender() {
  const prerender = (a) => {
    if (!a.classList.contains("instant")) return;
    let script = document.getElementById("speculation-rules");
    if (!script) {
      script = document.createElement("script");
      script.id = "speculation-rules";
      script.type = "speculationrules";
      document.body.append(script);
    }
    script.textContent = JSON.stringify({
      prerender: [{ source: "list", urls: [a.href] }],
    });
    a.classList.remove("instant");
  };
  const prefetch = (a) => {
    if (!a.classList.contains("instant")) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = a.href;
    document.head.append(link);
    a.classList.remove("instant");
  };
  const support =
    HTMLScriptElement.supports &&
    HTMLScriptElement.supports("speculationrules");
  const handle = support ? prerender : prefetch;
  document.querySelectorAll("a.instant").forEach((a) => {
    if (a.href.endsWith(window.location.pathname)) return;
    let timer;
    a.addEventListener("mouseenter", () => {
      timer = setTimeout(() => handle(a), 50);
    });
    a.addEventListener("mouseleave", () => clearTimeout(timer));
    a.addEventListener("touchstart", () => handle(a), { passive: true });
  });
}

// 代码块复制按钮
function addCopyBtns() {
  const cfg = document.querySelector("#copy-cfg");
  if (!cfg) return;
  const copyIcon = cfg.dataset.copyIcon;
  const checkIcon = cfg.dataset.checkIcon;
  document.querySelectorAll("pre").forEach((block) => {
    const wrapper = document.createElement("div");
    wrapper.className = "codeblock";
    const btn = document.createElement("button");
    btn.className = "copy";
    btn.ariaLabel = "copy";
    btn.innerHTML = copyIcon;
    const copy = () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.innerHTML = checkIcon;
        btn.classList.add("copied");
        btn.removeEventListener("click", copy);
        setTimeout(() => {
          btn.innerHTML = copyIcon;
          btn.classList.remove("copied");
          btn.addEventListener("click", copy);
        }, 1500);
      });
    };
    btn.addEventListener("click", copy);
    wrapper.appendChild(block.cloneNode(true));
    wrapper.appendChild(btn);
    block.replaceWith(wrapper);
  });
}

// 回到顶部按钮（滚动超过 200px 才显示）
function addBackToTopBtn() {
  const backBtn = document.querySelector("#back-to-top");
  if (!backBtn) return;
  const toTop = () => window.scrollTo({ top: 0 });
  const toggle = () => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 200 && !backBtn.classList.contains("shown")) {
      backBtn.classList.add("shown");
      backBtn.setAttribute("tabindex", 0);
      backBtn.addEventListener("click", toTop);
    } else if (scrollTop <= 200 && backBtn.classList.contains("shown")) {
      backBtn.classList.remove("shown");
      backBtn.setAttribute("tabindex", -1);
      backBtn.removeEventListener("click", toTop);
    }
  };
  window.addEventListener("scroll", toggle);
  toggle();
}

// 脚注回跳按钮
function addFootnoteBacklink() {
  const footnotes = document.querySelectorAll(".footnote-definition");
  footnotes.forEach((footnote) => {
    const backlink = document.createElement("button");
    backlink.className = "backlink";
    backlink.ariaLabel = "backlink";
    backlink.innerHTML = "↩︎";
    backlink.addEventListener("click", () =>
      window.scrollTo({
        top:
          document
            .querySelector(`.footnote-reference a[href="#${footnote.id}"]`)
            .getBoundingClientRect().top + window.scrollY,
      }),
    );
    const lastEl = footnote.lastElementChild || footnote;
    lastEl.appendChild(backlink);
  });
}

// 图片点击放大
function enableImgLightense() {
  window.addEventListener("load", () =>
    Lightense(".prose img:not(.no-lightense)", {
      background: "rgba(0, 0, 0, 0.9)", // 恢复高不透明度
      zIndex: 9999999,
    }),
  );
}

// 初始化：全站增强 + 文章页增强
enablePrerender();
if (document.body.classList.contains("post")) {
  addBackToTopBtn();
}
if (document.querySelector(".prose")) {
  addCopyBtns();
  addFootnoteBacklink();
  enableImgLightense();
}
