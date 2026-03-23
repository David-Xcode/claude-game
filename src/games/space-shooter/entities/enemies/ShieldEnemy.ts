// 护盾兵：前方有能量护盾，正面攻击被格挡
// HP 5 / 得分 300 / 25% 武器掉落 + 10% 炸弹

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS, GAME_WIDTH } from '@shared/utils/Constants';

const TEXTURE_KEY = 'enemy_shield';
const SIZE = 36;
const DESCENT_SPEED = 50;
const DRIFT_SPEED = 0.0008;
const DRIFT_AMPLITUDE = 40;

export class ShieldEnemy extends ShooterEnemy {
  /** 护盾是否激活 */
  shieldActive = true;
  /** 生成 x 坐标（漂移中心） */
  private spawnX: number;
  /** 漂移相位偏移 */
  private phaseOffset: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ShieldEnemy.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 5, 300, [
      { type: PowerUpType.WEAPON_HOMING, weight: 0.15 },
      { type: PowerUpType.WEAPON_VULCAN, weight: 0.10 },
      { type: PowerUpType.BOMB, weight: 0.10 },
    ]);

    this.spawnX = x;
    this.phaseOffset = Math.random() * Math.PI * 2;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SIZE - 4, SIZE - 4);
    body.setVelocityY(DESCENT_SPEED);
  }

  // ═══════════════════════════════════════════════
  // 覆盖 takeDamage：护盾激活时格挡正面攻击
  // ═══════════════════════════════════════════════

  takeDamage(amount: number): boolean {
    if (!this.active) return false;

    // 护盾激活时减免伤害（护盾吸收 1 点伤害后破碎）
    if (this.shieldActive) {
      this.shieldActive = false;
      // 护盾破碎闪烁
      this.setTint(0x00ffff);
      this.scene.time.delayedCall(100, () => {
        if (this.active) this.clearTint();
      });
      // 护盾吸收本次伤害
      return false;
    }

    return super.takeDamage(amount);
  }

  // ═══════════════════════════════════════════════
  // 行为：缓慢下降 + 水平漂移
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, _delta: number): void {
    // 水平漂移
    this.x = this.spawnX + Math.sin(time * DRIFT_SPEED + this.phaseOffset) * DRIFT_AMPLITUDE;
    this.x = Phaser.Math.Clamp(this.x, 20, GAME_WIDTH - 20);

    // 护盾激活时发出蓝色光泽
    if (this.shieldActive && Math.floor(time / 300) % 2 === 0) {
      this.setTint(0x88ddff);
    } else if (this.shieldActive) {
      this.clearTint();
    }
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      // 白色轮廓，提升可见度
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeRoundedRect(4, 6, SIZE - 8, SIZE - 8, 4);

      // 机体
      g.fillStyle(SHOOTER_COLORS.SHIELD, 1);
      g.fillRoundedRect(4, 6, SIZE - 8, SIZE - 8, 4);

      // 暗色内部
      g.fillStyle(0x000000, 0.2);
      g.fillRoundedRect(6, 8, SIZE - 12, SIZE - 12, 3);

      // 护盾弧线（前方 = 上方），更粗更亮
      g.lineStyle(4, 0x00ffff, 1);
      g.beginPath();
      g.arc(cx, cy - 2, SIZE / 2 - 1, Math.PI + 0.5, Math.PI * 2 - 0.5, false);
      g.strokePath();

      // 核心发光（更亮更大）
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(cx, cy + 2, 4);

      return { width: SIZE, height: SIZE };
    });
  }
}
