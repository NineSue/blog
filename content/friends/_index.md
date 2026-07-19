+++
title = "友人帐"
description = "我的友链"
subtitle = "一起闪闪发光"
+++

怎么可能有顺序呢，当然是随机的~ It's random

<div id="friends-container">

{{< friends >}}

</div>

<script>
  // 随机排序 + 头像底纹:内联在容器之后同步执行,先于首次绘制
  (function () {
    'use strict';
    var container = document.getElementById('friends-container');
    if (!container || container.dataset.friendsEnhanced === '1') return;
    container.dataset.friendsEnhanced = '1';

    var items = Array.prototype.slice.call(container.querySelectorAll('.collection-box-wrapper'));

    var order = items.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    items.forEach(function (item, index) {
      item.style.order = String(order[index]);
    });

    items.forEach(function (item) {
      var card = item.querySelector('.collection.box');
      var img = card && card.querySelector('img');
      if (!card || !img || card.querySelector('.friend-card-bg')) return;
      var bg = document.createElement('div');
      bg.className = 'friend-card-bg';
      bg.style.cssText = 'position:absolute;left:-0.5rem;top:0;width:66.66%;height:100%;'
        + 'background-image:url(' + img.src + ');background-size:cover;background-position:center;'
        + 'opacity:0.15;z-index:0;pointer-events:none;'
        + '-webkit-mask-image:linear-gradient(to left, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%);'
        + 'mask-image:linear-gradient(to left, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)';
      card.insertBefore(bg, card.firstChild);
    });
  })();
</script>
