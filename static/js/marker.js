// 马克笔高亮:每处加粗一道暖黄——角度微差(手腕)、圆角微差(笔锋)、底部阴影(墨水渗透)
(function() {
  'use strict';

  function run() {
    document.querySelectorAll('.prose p strong, .prose p b, .prose blockquote strong, .prose blockquote b, .prose li strong, .prose li b').forEach(function(el) {
      if (el.dataset.marked) return;
      el.dataset.marked = 'true';

      var deg = 96 + Math.random() * 8;
      var b1 = 3 + Math.random() * 10, b2 = 5 + Math.random() * 12;
      var b3 = 3 + Math.random() * 10, b4 = 4 + Math.random() * 14;
      var v1 = 45 + Math.random() * 20, v2 = 48 + Math.random() * 18;
      var v3 = 42 + Math.random() * 20, v4 = 46 + Math.random() * 16;
      var pl = 3 + Math.random() * 3, pr = 3 + Math.random() * 3;

      el.style.cssText =
        'font-weight:600;'
        + 'background: linear-gradient(' + deg + 'deg,'
            + 'transparent 1%,'
            + 'var(--marker-color) 10%,'
            + 'var(--marker-color) 90%,'
            + 'transparent 99%'
        + ');'
        + 'padding: 2px ' + pr + 'px 2px ' + pl + 'px;'
        + 'margin: 0 -2px;'
        + 'border-radius: ' + b1 + '% ' + b2 + '% ' + b3 + '% ' + b4 + '% / ' + v1 + '% ' + v2 + '% ' + v3 + '% ' + v4 + '%;'
        + 'display: inline;'
        + 'box-decoration-break: clone;'
        + '-webkit-box-decoration-break: clone;'
        + 'box-shadow: 0 1px 2px rgba(0,0,0,.06);';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
