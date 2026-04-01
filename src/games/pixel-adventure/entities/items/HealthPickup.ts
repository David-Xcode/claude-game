// 血量恢复道具

import Phaser from 'phaser';
import { COLORS, DEPTH, ITEMS } from '../../data/PAConstants';

export class HealthPickup extends Phaser.Physics.Arcade.Sprite {
  public readonly healAmount = ITEMS.HEALTH_RESTORE;
  private pulseTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = 'health_sprite';
    if (!scene.textures.exists(key)) {
      HealthPickup.createTexture(scene, key);
    }
    super(scene, x, y, key);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setDepth(DEPTH.ITEMS);

    // 脉动动画（保存引用，收集时停止以避免 tween 冲突）
    this.pulseTween = scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static createTexture(scene: Phaser.Scene, key: string): void {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.HEALTH);
    // 十字形心脏
    g.fillRect(6, 2, 8, 16);
    g.fillRect(2, 6, 16, 8);

    g.generateTexture(key, 20, 20);
    g.destroy();
  }

  collect(): void {
    if (!this.active) return; // 防止重复收集
    // 停止脉动 tween，避免与收集动画冲突
    this.pulseTween.stop();
    this.body!.enable = false;
    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}
