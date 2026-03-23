// 旋转追踪器：螺旋接近玩家位置，越来越快
// HP 3 / 得分 200 / 15% 武器掉落

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS } from '@shared/utils/Constants';

const TEXTURE_KEY = 'enemy_spinner';
const SIZE = 32;
const BASE_SPEED = 60;
const MAX_SPEED = 180;
const ACCELERATION = 30; // 每秒加速
const ROTATION_SPEED = 4; // 自旋速度 rad/s

export class Spinner extends ShooterEnemy {
  private playerRef: Phaser.GameObjects.Sprite;
  /** 当前移动速度 */
  private currentSpeed: number;
  /** 生成时间（用于加速） */
  private spawnTime: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerRef: Phaser.GameObjects.Sprite
  ) {
    Spinner.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 3, 200, [
      { type: PowerUpType.WEAPON_HOMING, weight: 0.10 },
      { type: PowerUpType.WEAPON_VULCAN, weight: 0.05 },
    ]);

    this.playerRef = playerRef;
    this.currentSpeed = BASE_SPEED;
    this.spawnTime = scene.time.now;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SIZE - 6, SIZE - 6);
  }

  // ═══════════════════════════════════════════════
  // 行为：螺旋追踪玩家
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, delta: number): void {
    // 加速
    const elapsed = (time - this.spawnTime) / 1000;
    this.currentSpeed = Math.min(BASE_SPEED + ACCELERATION * elapsed, MAX_SPEED);

    // 自旋视觉效果
    this.rotation += ROTATION_SPEED * (delta / 1000);

    // 追踪玩家
    if (this.playerRef.active) {
      const dx = this.playerRef.x - this.x;
      const dy = this.playerRef.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
          (dx / dist) * this.currentSpeed,
          (dy / dist) * this.currentSpeed
        );
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 覆盖 isOffScreen：追踪器不应因飞出上方而被回收
  // ═══════════════════════════════════════════════

  isOffScreen(): boolean {
    // 只在飞出画面很远时回收
    return (
      this.y > 600 ||
      this.y < -200 ||
      this.x > 900 ||
      this.x < -100
    );
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      // 白色轮廓圆，提升可见度
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeCircle(cx, cy, SIZE / 2 - 2);

      // 螺旋体：三叶风车（放大叶片）
      g.fillStyle(SHOOTER_COLORS.SPINNER, 1);
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const tx = cx + Math.cos(angle) * 11;
        const ty = cy + Math.sin(angle) * 11;
        g.fillTriangle(
          cx, cy,
          tx + Math.cos(angle + 0.6) * 5,
          ty + Math.sin(angle + 0.6) * 5,
          tx + Math.cos(angle - 0.6) * 5,
          ty + Math.sin(angle - 0.6) * 5
        );
      }

      // 中心圆（更亮）
      g.fillStyle(0xff88cc, 1);
      g.fillCircle(cx, cy, 5);

      // 核心高光（更亮）
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(cx, cy, 3);

      return { width: SIZE, height: SIZE };
    });
  }
}
