// 无人机：最基础的敌人，灰色菱形，直线下降
// HP 1 / 得分 100 / 10% 武器掉落 + 5% 分数奖励

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS } from '../../data/ShooterConstants';

const TEXTURE_KEY = 'enemy_drone';
const SIZE = 32;
const SPEED = 120;

export class Drone extends ShooterEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    Drone.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 1, 100, [
      { type: PowerUpType.WEAPON_VULCAN, weight: 0.10 },
      { type: PowerUpType.SCORE_BONUS, weight: 0.05 },
    ]);

    // 物理体尺寸
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SIZE - 4, SIZE - 4);
    body.setVelocity(0, SPEED);
  }

  // ═══════════════════════════════════════════════
  // 行为
  // ═══════════════════════════════════════════════

  updateBehavior(_time: number, _delta: number): void {
    // 直线下降，无额外逻辑
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  /** 确保纹理已创建 */
  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      // 白色描边（增强可见性）
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokePoints([
        new Phaser.Geom.Point(cx, 1),
        new Phaser.Geom.Point(SIZE - 1, cy),
        new Phaser.Geom.Point(cx, SIZE - 1),
        new Phaser.Geom.Point(1, cy),
      ], true);

      // 菱形机身（鲜红色）
      g.fillStyle(SHOOTER_COLORS.DRONE, 1);
      g.fillPoints([
        new Phaser.Geom.Point(cx, 2),
        new Phaser.Geom.Point(SIZE - 2, cy),
        new Phaser.Geom.Point(cx, SIZE - 2),
        new Phaser.Geom.Point(2, cy),
      ], true);

      // 暗色内部纹理
      g.fillStyle(0x000000, 0.25);
      g.fillPoints([
        new Phaser.Geom.Point(cx, 6),
        new Phaser.Geom.Point(SIZE - 6, cy),
        new Phaser.Geom.Point(cx, SIZE - 6),
        new Phaser.Geom.Point(6, cy),
      ], true);

      // 亮黄眼点
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx, cy - 2, 3);

      return { width: SIZE, height: SIZE };
    });
  }
}
