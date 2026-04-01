// 共享 UI 工具：按钮创建、动画、触屏检测
import Phaser from 'phaser';

const UI_FONT = 'monospace';

export function isTouch(scene: Phaser.Scene): boolean {
  return !!scene.sys.game.device.input.touch;
}

export function createMenuButton(
  scene: Phaser.Scene,
  x: number, y: number,
  label: string,
  color: string,
  fontSize: string,
  handler: () => void
): Phaser.GameObjects.Text {
  const text = scene.add
    .text(x, y, label, { fontSize, color, fontFamily: UI_FONT })
    .setOrigin(0.5)
    .setPadding(40, 15, 40, 15)
    .setInteractive({ useHandCursor: true });
  text.once('pointerdown', handler);
  return text;
}

export function addBlinkAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  minAlpha = 0.3,
  duration = 800
): void {
  scene.tweens.add({ targets: target, alpha: minAlpha, duration, yoyo: true, repeat: -1 });
}

export function addFloatAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  amplitude = 8,
  duration = 1500
): void {
  scene.tweens.add({
    targets: target, y: `-=${amplitude}`, duration,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
}
