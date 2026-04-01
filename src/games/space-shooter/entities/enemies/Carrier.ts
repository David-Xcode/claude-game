// 航母：大型敌人，HP 降到 50% 和 25% 时各释放 3 架无人机
// HP 8 / 得分 500 / 30% 武器 + 15% 炸弹 + 10% 回血

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { GAME_WIDTH } from '@shared/utils/Constants';
import { PowerUpType, SHOOTER_COLORS } from '../../data/ShooterConstants';

const TEXTURE_KEY = 'enemy_carrier';
const W = 48;
const H = 36;
const DESCENT_SPEED = 40;
const HOVER_Y = 150;

export class Carrier extends ShooterEnemy {
  /** 无人机生成回调（由 WaveManager 注入） */
  onSpawnDrones: ((x: number, y: number, count: number) => void) | null = null;
  /** 是否已停驻 */
  private hovering = false;
  /** 50% 和 25% 阈值的释放标记 */
  private spawned50 = false;
  private spawned25 = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    Carrier.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 8, 500, [
      { type: PowerUpType.WEAPON_HOMING, weight: 0.15 },
      { type: PowerUpType.WEAPON_LASER, weight: 0.15 },
      { type: PowerUpType.BOMB, weight: 0.15 },
      { type: PowerUpType.HEALTH, weight: 0.10 },
    ]);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(W - 4, H - 4);
    body.setVelocityY(DESCENT_SPEED);
  }

  // ═══════════════════════════════════════════════
  // 行为：下降 → 悬停 → 根据 HP 释放无人机
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 进入阶段
    if (!this.hovering) {
      if (this.y >= HOVER_Y) {
        this.hovering = true;
        body.setVelocity(0, 0);
      }
      return;
    }

    // 缓慢水平漂移
    this.x += Math.sin(time * 0.0006) * 0.5;
    this.x = Phaser.Math.Clamp(this.x, 40, GAME_WIDTH - 40);

    // HP 阈值释放无人机
    const hpPercent = this.hp / this.maxHp;

    if (!this.spawned50 && hpPercent <= 0.5) {
      this.spawned50 = true;
      this.spawnDrones(3);
    }

    if (!this.spawned25 && hpPercent <= 0.25) {
      this.spawned25 = true;
      this.spawnDrones(3);
    }
  }

  /** 释放无人机 */
  private spawnDrones(count: number): void {
    if (this.onSpawnDrones) {
      this.onSpawnDrones(this.x, this.y + H / 2, count);
    }
  }

  // ═══════════════════════════════════════════════
  // 覆盖 isOffScreen
  // ═══════════════════════════════════════════════

  isOffScreen(): boolean {
    if (this.hovering) {
      return this.y > 500 || this.x < -60 || this.x > 860;
    }
    return super.isOffScreen();
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = W / 2;
      const cy = H / 2;

      // 白色轮廓，提升可见度
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeRoundedRect(2, 4, W - 4, H - 8, 4);

      // 大型机身
      g.fillStyle(SHOOTER_COLORS.CARRIER, 1);
      g.fillRoundedRect(2, 4, W - 4, H - 8, 4);

      // 侧翼突起
      g.fillStyle(SHOOTER_COLORS.CARRIER, 0.8);
      g.fillRect(0, cy - 5, 5, 10);
      g.fillRect(W - 5, cy - 5, 5, 10);

      // 机库舱门（暗色条纹）
      g.fillStyle(0x000000, 0.3);
      g.fillRect(8, H - 12, W - 16, 6);
      g.fillRect(8, 6, W - 16, 4);

      // 引擎灯（明亮橙色）
      g.fillStyle(0xffaa00, 1);
      g.fillCircle(12, cy, 3);
      g.fillCircle(W - 12, cy, 3);

      // 指挥舱（更亮）
      g.fillStyle(0xaa88cc, 1);
      g.fillRoundedRect(cx - 6, 6, 12, 10, 2);

      return { width: W, height: H };
    });
  }
}
