// 友链随机排序脚本 - 优化版（预排序，零闪烁）
(function() {
  'use strict';

  // 随机排序函数 - Fisher-Yates shuffle 算法
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * 预先生成随机排序顺序
   * 在任何页面加载时执行，结果保存到 sessionStorage
   * 确保用户进入友人帐页面时，排序已经准备好
   */
  function preGenerateOrder() {
    // 检查是否已经生成过排序
    if (sessionStorage.getItem('friendsOrder')) {
      console.log('✅ 友人帐排序已存在，跳过重复生成');
      return;  // 已存在，跳过重复生成
    }

    // 动态检测友链数量
    const container = document.getElementById('friends-container');
    let friendsCount = 4;  // 默认值

    if (container) {
      const wrapper = container.querySelector('.collection-wrapper');
      if (wrapper) {
        const items = wrapper.querySelectorAll('.collection-box-wrapper');
        friendsCount = items.length;
        console.log(`📊 检测到 ${friendsCount} 个友链`);
      }
    }

    // 生成默认顺序数组 [0, 1, 2, 3, ...]
    const order = Array.from({ length: friendsCount }, (_, i) => i);

    // 随机打乱
    shuffle(order);

    // 保存到 sessionStorage（会话级别，关闭浏览器后清除）
    sessionStorage.setItem('friendsOrder', JSON.stringify(order));

    console.log('🎲 友人帐排序已预生成:', order);
  }

  /**
   * 初始化函数 - 应用预排序结果
   * 使用 CSS order 属性重排，避免 DOM 清空操作
   */
  function init() {
    // 获取友链容器
    const container = document.getElementById('friends-container');
    if (!container) {
      console.log('⚠️ 未找到 #friends-container，跳过初始化');
      return;
    }

    // 获取 wrapper
    const wrapper = container.querySelector('.collection-wrapper');
    if (!wrapper) {
      console.log('⚠️ 未找到 .collection-wrapper，跳过初始化');
      return;
    }

    // 获取所有友链卡片
    const items = Array.from(wrapper.querySelectorAll('.collection-box-wrapper'));

    if (items.length === 0) {
      console.log('⚠️ 未找到友链卡片，跳过初始化');
      return;
    }

    console.log(`📦 找到 ${items.length} 个友链卡片`);

    // 从 sessionStorage 读取预生成的排序
    const savedOrder = sessionStorage.getItem('friendsOrder');

    if (savedOrder) {
      const order = JSON.parse(savedOrder);
      console.log('🔄 应用排序:', order);

      // 使用 CSS order 属性重排（不需要清空 DOM）
      items.forEach((item, index) => {
        const newOrder = order[index] !== undefined ? order[index] : index;
        item.style.order = newOrder;
        console.log(`  卡片 ${index} → order: ${newOrder}`);
      });

      console.log('✅ 友人帐排序已应用（使用 CSS order 属性）');
    } else {
      // 如果没有预生成排序，保持原始顺序
      console.log('ℹ️ 未找到预生成排序，使用原始顺序');
    }

    // 为每个卡片添加背景装饰层（保持原有功能）
    items.forEach(item => {
      const card = item.querySelector('.collection.box');
      const img = card?.querySelector('img');

      if (card && img) {
        // 检查是否已经有背景装饰（避免重复添加）
        if (card.querySelector('.friend-card-bg')) {
          return;
        }

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

    console.log(`✅ 友链初始化完成，共 ${items.length} 个友链`);
  }

  // 在脚本加载时立即执行预生成（无论在哪个页面）
  preGenerateOrder();

  // 导出到全局，供 page-transition.js 调用
  window.preGenerateFriendsOrder = preGenerateOrder;
  window.initFriends = init;

  // 页面初始加载时执行初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
