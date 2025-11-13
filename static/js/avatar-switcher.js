(function() {
  'use strict';

  // Available avatar files
  const avatars = ['/img/an.png'];
  let currentIndex = 0;
  let isAnimating = false;  // 防抖标志

  /**
   * Get a random avatar from the list
   */
  function getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * avatars.length);
    currentIndex = randomIndex;
    return avatars[randomIndex];
  }

  /**
   * Switch to the next avatar in the list
   */
  function switchToNextAvatar() {
    const img = document.querySelector('#info img');
    if (!img || isAnimating) return;  // 动画进行中直接返回

    isAnimating = true;  // 上锁

    // Calculate next index
    currentIndex = (currentIndex + 1) % avatars.length;
    const nextAvatar = avatars[currentIndex];

    // 添加 CSS 动画 class
    img.classList.add('avatar-shake');

    // 监听动画结束事件
    function onAnimationEnd() {
      // 移除动画 class
      img.classList.remove('avatar-shake');

      // 切换图片
      img.src = nextAvatar;

      // 恢复透明度（修复动画 forwards 导致的透明问题）
      img.style.opacity = '1';

      // 保存状态到 sessionStorage
      sessionStorage.setItem('avatarIndex', currentIndex);

      // 解锁
      isAnimating = false;

      // 移除事件监听器
      img.removeEventListener('animationend', onAnimationEnd);
    }

    img.addEventListener('animationend', onAnimationEnd);
  }

  /**
   * Initialize avatar switcher
   */
  function init() {
    const img = document.querySelector('#info img');
    if (!img) return;

    // 尝试从 sessionStorage 恢复头像索引
    const savedIndex = sessionStorage.getItem('avatarIndex');
    if (savedIndex !== null) {
      // 恢复保存的头像，避免重新随机
      currentIndex = parseInt(savedIndex);
      img.src = avatars[currentIndex];
    } else {
      // 首次访问：随机选择头像
      const randomAvatar = getRandomAvatar();
      img.src = randomAvatar;
      // 保存初始状态
      sessionStorage.setItem('avatarIndex', currentIndex);
    }

    // Setup click handler
    img.style.cursor = 'pointer';
    img.addEventListener('click', switchToNextAvatar);
  }

  /**
   * Cleanup function for View Transition API
   */
  function cleanup() {
    const img = document.querySelector('#info img');
    if (!img) return;
    img.removeEventListener('click', switchToNextAvatar);
  }

  // Expose functions globally for View Transition API reinitialization
  window.initAvatarSwitcher = init;
  window.cleanupAvatarSwitcher = cleanup;

  // Auto-initialize on DOMContentLoaded or immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
