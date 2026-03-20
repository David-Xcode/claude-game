// 动画设置工具
// V1 使用程序化纹理，本文件为 V2 精灵图动画做准备

import Phaser from 'phaser';

export class AnimationHelper {
  // V2: 从精灵图创建角色动画
  static createPlayerAnimations(_scene: Phaser.Scene, _spriteKey: string): void {
    // TODO: V2 实现 - 创建 idle, run, jump, fall, hit 动画
  }

  // V2: 从精灵图创建敌人动画
  static createEnemyAnimations(_scene: Phaser.Scene, _spriteKey: string): void {
    // TODO: V2 实现
  }

  // 通用闪烁效果（已在 V1 中使用）
  static flashSprite(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite,
    duration = 1500
  ): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(duration / 200),
      onComplete: () => {
        sprite.alpha = 1;
      },
    });
  }
}
