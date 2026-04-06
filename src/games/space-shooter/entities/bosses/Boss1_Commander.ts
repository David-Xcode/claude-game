// Boss 1 — 指挥官：大型履带战车
// HP 50 / 得分 5000 / 三阶段攻击模式
// Phase 1: 左右移动 + 瞄准双发
// Phase 2: 加速 + 5路散射 + 召唤无人机
// Phase 3: 诡异移动 + 瞄准连射 + 环形弹幕

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { layout } from '@shared/utils/Constants';
import { PowerUpType, SHOOTER_COLORS } from '../../data/ShooterConstants';
import { BulletPool } from '../../systems/BulletPool';
import { BossBase } from './BossBase';

const TEXTURE_KEY = 'boss1_commander';
const W = 120;
const H = 80;
const BULLET_SPEED = 220;

export class Boss1Commander extends BossBase {
  /** 无人机生成回调 */
  onSpawnDrones: ((x: number, y: number, count: number) => void) | null = null;

  /** 左右移动方向（仅 Boss1 使用） */
  private moveDir = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite
  ) {
    Boss1Commander.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 50, 5000, [
      { type: PowerUpType.WEAPON_SPREAD, weight: 0.30 },
      { type: PowerUpType.BOMB, weight: 0.20 },
      { type: PowerUpType.HEALTH, weight: 0.20 },
    ], bulletPool, playerRef, 60, 40);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(W - 10, H - 10);
  }

  // ═══════════════════════════════════════════════
  // 入场完成
  // ═══════════════════════════════════════════════

  protected onEntryComplete(time: number): void {
    this.lastFireTime = time;
    this.lastSpawnTime = time;
  }

  // ═══════════════════════════════════════════════
  // 阶段行为
  // ═══════════════════════════════════════════════

  protected updatePhase(time: number, delta: number): void {
    // 左右移动
    const speed = this.phase === 1 ? 60 : this.phase === 2 ? 100 : 140;
    this.x += this.moveDir * speed * (delta / 1000);

    // 反弹
    if (this.x > layout.width - W / 2 - 10) {
      this.x = layout.width - W / 2 - 10;
      this.moveDir = -1;
    } else if (this.x < W / 2 + 10) {
      this.x = W / 2 + 10;
      this.moveDir = 1;
    }

    // Phase 3 诡异上下移动
    if (this.phase === 3) {
      this.y = this.targetY + Math.sin(time * 0.002) * 30;
    }

    // 开火逻辑
    this.handleFiring(time);

    // Phase 2/3 召唤无人机
    if (this.phase >= 2 && time - this.lastSpawnTime >= 5000) {
      this.lastSpawnTime = time;
      if (this.onSpawnDrones) {
        this.onSpawnDrones(this.x, this.y + H / 2, 2);
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 攻击模式
  // ═══════════════════════════════════════════════

  /** 各阶段开火模式 */
  private handleFiring(time: number): void {
    if (!this.playerRef.active) return;

    switch (this.phase) {
      case 1:
        // 瞄准双发 800ms
        if (time - this.lastFireTime >= 800) {
          this.lastFireTime = time;
          this.fireAimedDouble();
        }
        break;

      case 2:
        // 5路散射 600ms
        if (time - this.lastFireTime >= 600) {
          this.lastFireTime = time;
          this.fireSpread5();
        }
        break;

      case 3:
        // 交替：瞄准连射 + 环形弹幕
        if (time - this.lastFireTime >= 400) {
          this.lastFireTime = time;
          if (Math.random() < 0.5) {
            this.fireAimedBurst();
          } else {
            this.fireRing(12);
          }
        }
        break;
    }
  }

  /** 瞄准双发 */
  private fireAimedDouble(): void {
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    // 两颗子弹略微偏移
    this.bulletPool.fire(this.x - 15, this.y + H / 2, nx * BULLET_SPEED, ny * BULLET_SPEED, 1);
    this.bulletPool.fire(this.x + 15, this.y + H / 2, nx * BULLET_SPEED, ny * BULLET_SPEED, 1);
  }

  /** 5路散射 */
  private fireSpread5(): void {
    const baseAngle = Math.PI / 2; // 向下
    const spread = 0.25; // 约 14 度

    for (let i = -2; i <= 2; i++) {
      const angle = baseAngle + spread * i;
      const vx = Math.cos(angle) * BULLET_SPEED;
      const vy = Math.sin(angle) * BULLET_SPEED;
      this.bulletPool.fire(this.x, this.y + H / 2, vx, vy, 1);
    }
  }

  /** 瞄准连射（3 发快速） */
  private fireAimedBurst(): void {
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        if (!this.active) return;
        this.bulletPool.fire(this.x, this.y + H / 2, nx * BULLET_SPEED * 1.2, ny * BULLET_SPEED * 1.2, 1);
      });
    }
  }

  /** 环形弹幕 */
  private fireRing(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const vx = Math.cos(angle) * BULLET_SPEED * 0.8;
      const vy = Math.sin(angle) * BULLET_SPEED * 0.8;
      this.bulletPool.fire(this.x, this.y, vx, vy, 1);
    }
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
      g.strokeRoundedRect(10, 10, W - 20, H - 20, 6);

      // 主装甲车身
      g.fillStyle(SHOOTER_COLORS.BOSS1, 1);
      g.fillRoundedRect(10, 10, W - 20, H - 20, 6);

      // 履带（左右暗色条）
      g.fillStyle(0x333322, 1);
      g.fillRoundedRect(2, 15, 12, H - 30, 4);
      g.fillRoundedRect(W - 14, 15, 12, H - 30, 4);

      // 炮塔顶部
      g.fillStyle(0x556644, 1);
      g.fillRoundedRect(cx - 25, 8, 50, 30, 5);

      // 主炮管（更亮）
      g.fillStyle(0x888877, 1);
      g.fillRect(cx - 18, cy + 5, 8, 30);
      g.fillRect(cx + 10, cy + 5, 8, 30);

      // 装甲细节线
      g.lineStyle(1, 0xffffff, 0.2);
      g.strokeRect(15, 15, W - 30, H - 30);

      // 指挥舱观察窗（明亮黄色）
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx - 8, 20, 4);
      g.fillCircle(cx + 8, 20, 4);

      // 前方装甲板纹理
      g.fillStyle(0x000000, 0.15);
      for (let i = 0; i < 3; i++) {
        g.fillRect(20, 35 + i * 10, W - 40, 2);
      }

      return { width: W, height: H };
    });
  }
}
