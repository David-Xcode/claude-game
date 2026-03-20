// 金币：收集后增加分数

import Phaser from 'phaser';
import { COLORS, DEPTH, ITEMS } from '../../utils/Constants';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  public readonly scoreValue = ITEMS.COIN_SCORE;
  private floatTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = 'coin_sprite';
    if (!scene.textures.exists(key)) {
      Coin.createTexture(scene, key);
    }
    super(scene, x, y, key);

    scene.add.existing(this);
    scene.physics.add.existing(this, false); // 动态物体，让 tween 动画与碰撞盒同步
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setDepth(DEPTH.ITEMS);

    // 浮动动画（保存引用，收集时停止以避免 tween 冲突）
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static createTexture(scene: Phaser.Scene, key: string): void {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.COIN);
    g.fillCircle(10, 10, 8);
    g.fillStyle(0xffaa00);
    g.fillCircle(10, 10, 5);
    g.fillStyle(COLORS.COIN);
    g.fillRect(8, 7, 4, 6);

    g.generateTexture(key, 20, 20);
    g.destroy();
  }

  collect(): void {
    if (!this.active) return; // 防止重复收集
    // 停止浮动 tween，避免两个 tween 同时修改 y 导致抖动
    this.floatTween.stop();
    // 收集动画：弹起消失
    this.body!.enable = false;
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}
