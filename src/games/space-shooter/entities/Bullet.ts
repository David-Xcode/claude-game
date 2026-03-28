// 子弹实体：继承 Arcade.Sprite，支持对象池回收

import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  /** 伤害值 */
  damage = 1;
  /** 追踪弹标记 */
  isHoming = false;
  /** 穿透弹标记（碰撞后不回收） */
  isPiercing = false;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    super(scene, x, y, textureKey);
  }

  /** 激活子弹并设置速度和伤害 */
  fire(vx: number, vy: number, damage: number = 1): void {
    this.damage = damage;
    this.setActive(true);
    this.setVisible(true);
    this.body!.enable = true;
    this.setVelocity(vx, vy);
  }

  /** 回收子弹到池中 */
  recycle(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    // 重置武器特殊标记，防止池复用时残留
    this.isHoming = false;
    this.isPiercing = false;
    if (this.body) {
      this.body.enable = false;
    }
  }
}
