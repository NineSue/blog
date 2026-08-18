// oneko.js — 跟随鼠标的像素猫
// 致谢: 源自 Adrian Bowyer 1989 年的 X11 程序 oneko,网页移植版 by adryd (MIT License)
// https://github.com/ZerXGIT/oneko.js
(function oneko() {
  const nekoEl = document.createElement("div");
  let nekoPosX = 32;
  let nekoPosY = 32;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  const nekoSpeed = 10;
  // —— 跟随意愿(最小侵入): 默认不追,摸猫或随机点击才激活 ——
  let wantFollow = false;
  let followUntil = 0;
  const FOLLOW_MS = 10000;
  const SHELF_ID = "cat-shelf";
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratch: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };
  function create() {
    nekoEl.id = "oneko";
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.backgroundImage = "url('/img/oneko.gif')";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = "16px";
    nekoEl.style.top = "16px";

    document.body.appendChild(nekoEl);

    document.onmousemove = (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };

    // 摸猫(点猫 32px 内)或屏幕任意点击有概率吸引它过来
    document.addEventListener("click", (event) => {
      const dx = event.clientX - nekoPosX;
      const dy = event.clientY - nekoPosY;
      const nearCat = Math.hypot(dx, dy) < 32;
      const randomAttract = Math.random() < 0.25;
      if (nearCat || randomAttract) {
        wantFollow = true;
        followUntil = Date.now() + FOLLOW_MS;
      }
    });

    // 初始位置: 优先猫爬架横线,否则屏幕中上部
    const shelf = document.getElementById(SHELF_ID);
    if (shelf) {
      const r = shelf.getBoundingClientRect();
      nekoPosX = r.left + r.width / 2;
      nekoPosY = r.top + r.height / 2;
    } else {
      nekoPosX = window.innerWidth / 2;
      nekoPosY = window.innerHeight / 3;
    }
    // 同步 DOM: 不跟随时 frame() 会提前 return,必须在这里先把位置渲染出来
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;

    window.onekoInterval = setInterval(frame, 100);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      idleAnimation = ["sleeping", "scratch"][Math.floor(Math.random() * 2)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratch":
        setSprite("scratch", idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;

    // 跟随超时 → 停止追,回到原版 idle(会自己睡觉/挠痒)
    if (wantFollow && Date.now() > followUntil) {
      wantFollow = false;
    }

    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // 不想跟随 → 原地 idle,靠原版 idle() 自动进入睡觉/挠痒
    if (!wantFollow) {
      idle();
      return;
    }

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      // count down after being alerted before moving
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  create();
})();
