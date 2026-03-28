// 横屏方向管理：在游戏场景内锁定横屏 + 显示旋转提示遮罩，返回 Hub 时解除

// 防止重复注册 resize 监听器
let listenerActive = false;

/**
 * 锁定横屏方向并显示旋转提示遮罩
 * 在进入游戏标题/游戏场景时调用（可安全多次调用）
 */
export function lockLandscape(): void {
  // 显示竖屏旋转提示遮罩
  const overlay = document.getElementById('rotate-overlay');
  if (overlay) {
    overlay.dataset.active = 'true';
    updateOverlayVisibility();
  }

  // 尝试锁定横屏（iOS Safari 不支持，静默失败）
  screen.orientation?.lock?.('landscape')?.catch(() => {});

  // 监听方向变化以更新遮罩（仅注册一次）
  if (!listenerActive) {
    window.addEventListener('resize', updateOverlayVisibility);
    listenerActive = true;
  }
}

/**
 * 解除横屏锁定并隐藏旋转提示遮罩
 * 在返回 Hub 场景时调用
 */
export function unlockOrientation(): void {
  const overlay = document.getElementById('rotate-overlay');
  if (overlay) {
    overlay.dataset.active = '';
    overlay.style.display = 'none';
  }

  screen.orientation?.unlock?.();

  if (listenerActive) {
    window.removeEventListener('resize', updateOverlayVisibility);
    listenerActive = false;
  }
}

/** 根据当前方向和激活状态更新遮罩显示 */
function updateOverlayVisibility(): void {
  const overlay = document.getElementById('rotate-overlay');
  if (!overlay || overlay.dataset.active !== 'true') return;

  const isPortrait = window.innerHeight > window.innerWidth;
  overlay.style.display = isPortrait ? 'flex' : 'none';
}
