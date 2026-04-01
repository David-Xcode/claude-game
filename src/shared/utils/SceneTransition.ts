// 场景过渡工具：统一处理防重复点击 + 淡出 + 切换
import Phaser from 'phaser';

const TRANSITION_KEY = '__transitioning';

export function fadeToScene(
  scene: Phaser.Scene,
  targetKey: string,
  data?: object,
  duration = 500
): void {
  if (scene.data.get(TRANSITION_KEY)) return;
  scene.data.set(TRANSITION_KEY, true);

  // 场景关闭时清除标记，防止重启后残留
  scene.events.once('shutdown', () => {
    scene.data.set(TRANSITION_KEY, false);
  });

  scene.cameras.main.fadeOut(duration, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(targetKey, data);
  });
}
