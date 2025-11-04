// 友链随机排序脚本
(function() {
  'use strict';

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // 获取友链容器
    const container = document.getElementById('friends-container');
    if (!container) {
      console.warn('Friends container not found');
      return;
    }

    // 获取所有友链卡片 - 直接选择 .collection-box-wrapper
    const items = Array.from(container.querySelectorAll('.collection-box-wrapper'));

    if (items.length === 0) {
      console.warn('No friend links found');
      return;
    }

    // 为每个卡片添加背景装饰层
    items.forEach(item => {
      const card = item.querySelector('.collection.box');
      const img = card?.querySelector('img');

      if (card && img) {
        // 创建背景装饰元素
        const bgDecoration = document.createElement('div');
        bgDecoration.className = 'friend-card-bg';
        bgDecoration.style.cssText = `
          position: absolute;
          left: -0.5rem;
          top: 0;
          width: 66.66%;
          height: 100%;
          background-image: url(${img.src});
          background-size: cover;
          background-position: center;
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
          mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
          -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
        `;

        // 插入到卡片的第一个子元素之前
        card.insertBefore(bgDecoration, card.firstChild);
      }
    });

    // 随机打乱数组
    shuffle(items);

    // 获取 collection-wrapper（如果存在）
    const wrapper = container.querySelector('.collection-wrapper');
    if (wrapper) {
      // 清空 wrapper
      wrapper.innerHTML = '';

      // 重新插入打乱顺序的卡片到 wrapper
      items.forEach((item, index) => {
        // 添加延迟动画效果
        item.style.animationDelay = `${index * 0.05}s`;
        wrapper.appendChild(item);
      });
    }

    console.log(`✅ 友链随机排序完成，共 ${items.length} 个友链`);
  }

  // 随机排序函数 - Fisher-Yates shuffle 算法
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

})();
