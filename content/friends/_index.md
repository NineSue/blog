+++
title = "友人帐"
description = "我的友链"
template = "prose.html"
insert_anchor_links = "none"

[extra]
lang = "zh"
title = "友人帐"
subtitle = "一起闪闪发光"
math = false
mermaid = false
copy = false
comment = false
reaction = false
+++

怎么可能有顺序呢，当然是随机的~ It's random

<div id="friends-container">

{{ collection(file="links.toml") }}

</div>

<script src="/js/friends.js" defer></script>
