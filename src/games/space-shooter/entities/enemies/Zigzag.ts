// Z字机：绿色棱角飞机，正弦波水平移动边下降
// HP 2 / 得分 150 / 15% 武器掉落

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS } from '@shared/utils/Constants';

const TEXTURE_KEY = 'enemy_zigzag';
const SIZE = 32;
const DESCENT_SPEED = 80;
const WAVE_AMPLITUDE = 80;
const WAVE_FREQUENCY = 0.003;

export class Zigzag extends ShooterEnemy {
  /** 生成时的 x 坐标（正弦波的中心） */
  private spawnX: number;
  /** 正弦波随机偏移，避免所有 Zigzag 同步 */
  private phaseOffset: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    Zigzag.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 2, 150, [
      { type: PowerUpType.WEAPON_SPREAD, weight: 0.15 },
    ]);

    this.spawnX = x;
    this.phaseOffset = Math.random() * Math.PI * 2;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SIZE - 4, SIZE - 4);
    body.setVelocityY(DESCENT_SPEED);
  }

  // ═══════════════════════════════════════════════
  // 行为：正弦波水平移动
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, _delta: number): void {
    this.x = this.spawnX + Math.sin(time * WAVE_FREQUENCY + this.phaseOffset) * WAVE_AMPLITUDE;
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = SIZE / 2;

      // 白色轮廓，提升可见度
      const outlinePoints = [
        new Phaser.Geom.Point(cx, 0),
        new Phaser.Geom.Point(SIZE, SIZE * 0.4),
        new Phaser.Geom.Point(SIZE - 2, SIZE),
        new Phaser.Geom.Point(cx, SIZE * 0.7),
        new Phaser.Geom.Point(2, SIZE),
        new Phaser.Geom.Point(0, SIZE * 0.4),
      ];
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokePoints(outlinePoints, true);

      // 尖锐棱角飞机
      g.fillStyle(SHOOTER_COLORS.ZIGZAG, 1);
      g.fillPoints(outlinePoints, true);

      // 机翼高光
      g.fillStyle(0xffffff, 0.25);
      g.fillPoints([
        new Phaser.Geom.Point(cx, 3),
        new Phaser.Geom.Point(SIZE - 4, SIZE * 0.4),
        new Phaser.Geom.Point(cx, SIZE * 0.5),
        new Phaser.Geom.Point(4, SIZE * 0.4),
      ], true);

      // 明亮发光眼
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx, SIZE * 0.3, 3);

      return { width: SIZE, height: SIZE };
    });
  }
}
