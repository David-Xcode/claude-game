// 飞行眼：空中正弦波移动，不可踩（迫使玩家躲避）

import Phaser from 'phaser';
import { Enemy, EnemyState } from '../Enemy';
import { ENEMY, COLORS } from '../../utils/Constants';

export class FlyingEye extends Enemy {
  private baseY: number;
  private amplitude: number;
  private frequency: number;
  private startX: number;
  private patrolRange: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = 'flying_eye_sprite';
    if (!scene.textures.exists(key)) {
      FlyingEye.createTexture(scene, key);
    }
    super(
      scene, x, y, key,
      1, ENEMY.FLYING_EYE_SPEED, 300, false
    );

    this.baseY = y;
    this.startX = x;
    this.patrolRange = 120;
    this.amplitude = ENEMY.FLYING_EYE_AMPLITUDE;
    this.frequency = ENEMY.FLYING_EYE_FREQUENCY;
    this.aiState = EnemyState.PATROL;

    // 飞行敌人不受重力影响
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 22);
    body.setOffset(5, 5);
  }

  static createTexture(scene: Phaser.Scene, key: string): void {
    const g = scene.add.graphics();
    // 身体
    g.fillStyle(COLORS.FLYING_EYE);
    g.fillCircle(16, 16, 12);
    // 眼球
    g.fillStyle(0xffffff);
    g.fillCircle(16, 16, 7);
    g.fillStyle(0xff0000);
    g.fillCircle(16, 16, 4);
    g.fillStyle(0x000000);
    g.fillCircle(16, 16, 2);
    // 翅膀
    g.fillStyle(0x7733aa);
    g.fillTriangle(2, 12, 8, 6, 8, 18);
    g.fillTriangle(30, 12, 24, 6, 24, 18);

    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  protected onIdle(): void {
    this.aiState = EnemyState.PATROL;
  }

  protected onPatrol(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 水平巡逻
    if (this.x <= this.startX - this.patrolRange) {
      this.direction = 1;
    } else if (this.x >= this.startX + this.patrolRange) {
      this.direction = -1;
    }

    body.setVelocityX(this.speed * this.direction);

    // 正弦波垂直运动（通过速度驱动，保持物理体同步且不清空已有速度）
    const targetY = this.baseY + Math.sin(time * this.frequency) * this.amplitude;
    body.setVelocityY((targetY - this.y) * 10);

    this.setFlipX(this.direction < 0);
  }

  protected onHit(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }
}
