---
version: alpha
name: An · 雾蓝纸页 v2
description: ninesue.online 的设计系统(重构目标状态)——黛青主色、衬线长文排版、亮色纯白 / 暗色星空双世界观。2026-07 重构定稿。
colors:
  # 主色(黛青,方案 A 定稿:雾蓝进化,全站唯一蓝)
  primary: "#4c6699"
  primary-dark: "#6f8fd1"
  primary-pale: "#4c669933"
  primary-pale-dark: "#6f8fd166"
  primary-decoration: "#4c669910"
  primary-decoration-dark: "#6f8fd115"
  # 背景
  bg: "#ffffff"
  bg-dark: "#090C10"
  # 文字(冷灰阶,与主色同族)
  text: "#262a33"
  text-dark: "#e0e0e0"
  text-pale: "#5c6470"
  text-pale-dark: "#9e9e9e"
  text-decoration: "#aab3c0"
  text-decoration-dark: "#4a4a4a"
  heading: "#1a1e26"
  heading-dark: "#f0f0f0"
  # 链接(= 主色体系,hover 提亮一档)
  link: "#4c6699"
  link-hover: "#5f7cb3"
  link-dark: "#79a8e8"
  link-hover-dark: "#a0c4f0"
  # Callout 五色体系(随黛青同步微调)
  callout-note: "#4c6699"
  callout-tip: "#2b7a52"
  callout-important: "#7a5cb8"
  callout-warning: "#a05a2a"
  callout-caution: "#bf4545"
  callout-note-dark: "#6f8fd1"
  callout-tip-dark: "#47976f"
  callout-important-dark: "#9776cd"
  callout-warning-dark: "#ad7a52"
  callout-caution-dark: "#d06161"
typography:
  body:
    fontFamily: "Noto Serif SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  h1:
    fontFamily: "Noto Serif SC"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.3
  h2:
    fontFamily: "Noto Serif SC"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Noto Serif SC"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  h4:
    fontFamily: "Noto Serif SC"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.3
  h5:
    fontFamily: "Noto Serif SC"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
  code-block:
    fontFamily: "Fira Code, Consolas, Monaco, ui-monospace, monospace"
    fontSize: 1.015em
    fontWeight: 600
    lineHeight: 1.75
  code-inline:
    fontFamily: "Fira Code, Consolas, Monaco, ui-monospace, monospace"
    fontSize: 0.9em
    fontWeight: 500
    lineHeight: 1.6
  site-name:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 1.4rem
    fontWeight: 500
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
rounded:
  none: 0px
  xs: 2px
  md: 8px
  xl: 16px
  full: 9999px
components:
  friend-card:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.xl}"
    padding: 0.5rem 1rem
  friend-card-hover:
    backgroundColor: "{colors.primary-decoration}"
  tag-link:
    backgroundColor: "{colors.primary-decoration}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    padding: 0.4rem 0.75rem
  tag-link-hover:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
  toc-panel:
    rounded: "{rounded.md}"
    padding: 16px
    width: 220px
  mobile-toc-btn:
    backgroundColor: "{colors.primary}"
    textColor: white
    rounded: "{rounded.full}"
    size: 48px
  code-block:
    backgroundColor: "#090C10"
    rounded: "{rounded.md}"
---

# An · 雾蓝纸页 v2

## Overview

个人技术博客(Hugo,单仓无主题层),内容以操作系统 / 内核 / 云原生长文为主。设计目标:**长文阅读舒适度优先**,视觉克制、去装饰、强调靠字重而非颜色。

本文件是 **2026-07 重构的目标状态**(单一事实来源),不是历史现状的记录。重构决议:

1. 亮色调色板采用**方案 A「黛青」**:主色 `#5871a2 → #4c6699`,灰阶全部换成带蓝调的冷灰,全面达标 WCAG AA。
2. 暗色页面背景统一为 **`#090C10` 深藏青**(原 custom.css 的 `#000000` 组件背景一并迁移;"纯黑主题"注释作废)。
3. 样式唯一来源 = `assets/sass/main.scss`(Hugo 单仓,无主题层、无 custom.css,"站点样式 vs 主题样式"的边界概念已消灭)。
4. 字体全部自托管子集化:中文按 unicode-range 切片,等宽只保留 Fira Code(DM Mono 从栈中移除)。
5. **文章页与列表页采用 antfu 式降噪美学**:纯白贴底、无纸张卡片、无马克笔;强调靠标题字重(700/600)而非颜色;代码块统一深底 `#090C10`(与暗色星空同系)。主页与友链页保留各自的卡片设计。

核心世界观——**亮暗两套性格**:

- **亮色 = 纯白**:纯白背景贴底,零装饰(网格/SVG/梅花/雨滴/纸张/马克笔均已被否决,不要任何粒子和动效)。
- **暗色 = 夜空**:`#090C10` 深藏青 + 星空动画(star.js,仅暗色运行)+ 淡网格纹理。

## Colors

- 主色**黛青 `#4c6699`**(暗色提亮为 `#6f8fd1`),承担:链接、TOC 激活态、边框强调、移动端 TOC 按钮。链接 hover 亮色用 `#5f7cb3`。
- 每个颜色有 `-pale`(33 alpha)和 `-decoration`(10 alpha)两档淡化,用于 hover 背景和淡边框。**需要淡色时用这两档,不要新造 rgba。**
- 灰阶(正文/淡字/线条)是**冷灰**,与主色同族:`#262a33 / #5c6470 / #aab3c0`。不要引入纯灰(`#767676` 一类)。
- 对比度基线(白底):正文 13.8:1,淡字 5.9:1,链接 5.7:1——改任何文字色前先验算,**不得低于 4.5:1**。
- 暗色模式**独立调色**,不是反色。暗色灰阶暂沿用现行值(`#e0e0e0 / #9e9e9e / #4a4a4a`)。
- **规则:不新增裸 hex。**一律 `var(--*)`;变量不够先在 `body` / `body.dark` 上补。

## Typography

- 正文:**Noto Serif SC 中文衬线**,1rem(根字号 110%,≈17.6px)/ 1.75 行高;文章行宽 65ch(≈65 字符/行)。不换无衬线、不加宽、不缩字号。
- 标题:line-height 1.3,字重 h1=700 / h2=600 / h3=600 / h4-h6=500,字号 30/24/20/18/16px(桌面),移动端降一档(24/20/18/17/16px)。
- 代码:Fira Code,块代码 600 字重 + 深底浅字,行内 0.9em / 500 字重 + 主色淡背景。首页站名与 header 品牌名用系统无衬线栈(DM Mono 已移除)。
- **字体加载纪律**:所有声明在栈里的自定义字体必须自托管 woff2 子集——中文用 cn-font-split 按 unicode-range 切片(首屏 ~300KB),Fira Code 只带 latin 400/600 两档。禁止:整包 TTF、preload 未使用的字体、只写名字不托管的"幽灵字体"。中文字体永远 `font-display: swap`。

## Layout

- 内容主宽度 768px;文章页正文直接贴底,**内文限 65ch 居中**。
- 博客列表页:单列 768px 居中。标题下方是标签筛选条(Fira Code 12px 按钮,选中=主色淡底),列表按年份分组,年份以超大描边字作背景装饰。每篇文章显示黛青标题 + `Jan 2 · 3 min` 日期栏(50% 透明度弱化,右对齐)。旧侧栏已退役。
- 友链卡片:1 列 → ≥640px 2 列 → ≥1024px 3 列,gap 1rem。
- TOC:桌面空间足够时(JS 检测)fixed 右侧 220px 面板;不足则降级为底部抽屉(70vh)+ 右下 48px 圆钮。
- 间距 4px 基准刻度(xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2xl 48)。

## Elevation & Depth

两层材质语言,新组件先归类,不发明第三种:

1. **平面**(文章页、列表页、友链页):无阴影、无卡片,正文贴底,靠边框和背景色区分。
2. **毛玻璃**(TOC 面板):`rgba(255,255,255,0.85)` + blur(12px),暗色 `rgba(9,12,16,0.85)`。

## Shapes

- 圆角刻度收敛为 4 档:**0(图片/详情块)、2px(行内代码)、8px(卡片/面板/代码块)、16px(抽屉/友链卡)、全圆(头像/圆钮)**。
- 旧的 6px 和 10px 在重构中一律迁移到 8px;不再新增其他圆角值。

## Components

- **friend-card**:56px 圆头像 + 两行文本;hover 背景变主色淡色、头像叠遮罩 + `→`;入场淡入,顺序随机(Fisher-Yates)。
- **tag-filter-bar**:文章列表标题下方一排横排标签按钮,选中即主色淡底。文章页底部有淡色 Fira Code 文末标签。旧侧栏五彩胶囊已退役。
- **toc-panel**:毛玻璃、H2–H6 逐级缩小、折叠 400ms、激活项 `border-left: 3px var(--primary-color)` + 主色淡底(导航≠强调)。
- **mobile-toc-btn**:48px 主色圆钮,fixed 右下。
- **文章页信息**:标题下方 `日期  #标签 · 3 min · 1003 字`(阅读时长+字数跟在标签行末)。正文 `65ch` 限宽贴底。文末一行淡色 Fira Code 文章标签。
- **首页签名**:`「沉淀」`——bio + meta description + og:description 三处一致。理念:输入(读)→ 理解 → 输出(写)→ 沉淀,即长期积累后留下真正重要的东西。
- **页脚**:`2025-PRESENT © An`(起笔年份格式,antfu 同款)。
- **动效预算**:过渡 150–400ms;主题切换 clip-path 圆形扩散(300ms);`prefers-reduced-motion` 尊重。
- ~~heatmap~~:已移除(从未启用)。

## Do's and Don'ts

**Do**

- 所有样式写进 `assets/sass/main.scss` 对应分区;变量只在文件顶部定义一次。
- 亮色纯白零装饰(网格/梅花/雨滴/粒子均已实验否决,不再尝试);暗色 `#090C10` + 星空 + 网格。
- 暗色单独调色,参照 `-dark` token。
- star.js 只在暗色模式绘制,亮色挂起循环。
- `user-select: none` 只允许出现在 `@media (pointer: coarse)` 内——桌面读者必须能复制正文。
- 图片命名:友链头像 = `img/friends/<显示名小写或拼音>.webp`;文章配图放 `assets/img/posts/<文章slug>/<内容描述>.png`,文中仍以 `/img/...` 绝对路径引用——构建期管线(render-image hook)自动转 webp/限宽/懒加载,**贴原图即可,不手工压图**。
- 大资源按需加载(参照字体切片);性能改动用 `hugo` 构建 + 浏览器实测验证。

**Don't**

- 不新增裸 hex、不新增 `!important`(覆盖第三方内联样式除外)、不新增圆角值。
- 不引入未自托管的字体名;不 preload 用不到的资源。
- 不给正文第二种高亮;标题字重不超 h1=700;代码块字重保持 600。
- 不加宽 768px 容器、不缩小正文根字号(html 110%)。
- 不在文章页/列表页加纸张材质或阴影——平面贴底是刻意的。
- 不复活 SPA(page-transition.js 已删);若将来重加,必须先修 toc-enhance/main.js 的监听器累积问题。
- **样式冻结令(2026-07 起)**:发布满 10 篇文章之前,只修 bug、不加任何新视觉特性。站的气质由文章喂出来,不是 CSS 调出来。
