// Boss 2 — 天空要塞：宽体飞艇，蓝灰色
// HP 80 / 得分 8000 / 三阶段
// Phase 1: 固定顶部中央，侧炮交替瞄准射击 + 中央环形弹幕
// Phase 2: 8 字移动，全炮台开火 + 释放护盾敌人
// Phase 3: 蓄力闪烁 → 多层环形爆发 → 短暂虚弱窗口

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS, GAME_WIDTH } from '@shared/utils/Constants';
import { BulletPool } from '../../systems/BulletPool';
import { BossBase } from './BossBase';

const TEXTURE_KEY = 'boss2_skyfortress';
const W = 160;
const H = 100;
const BULLET_SPEED = 200;

export class Boss2SkyFortress extends BossBase {
  /** 释放护盾敌人的回调 */
  onSpawnShields: ((x: number, y: number, count: number) => void) | null = null;

  /** 开火计时（Boss2 特有的双计时器） */
  private lastSideFireTime = 0;
  private lastCenterFireTime = 0;
  /** 左右交替标记 */
  private fireFromLeft = true;

  /** Phase 3 蓄力状态 */
  private charging = false;
  private chargeStartTime = 0;
  private chargeInterval = 3000;
  private vulnerableUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite
  ) {
    Boss2SkyFortress.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 80, 8000, [
      { type: PowerUpType.WEAPON_LASER, weight: 0.30 },
      { type: PowerUpType.BOMB, weight: 0.25 },
      { type: PowerUpType.HEALTH, weight: 0.20 },
    ], bulletPool, playerRef, 50, 30);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(W - 20, H - 20);
  }

  // ═══════════════════════════════════════════════
  // 入场完成
  // ═══════════════════════════════════════════════

  protected onEntryComplete(time: number): void {
    this.lastSideFireTime = time;
    this.lastCenterFireTime = time;
    this.lastSpawnTime = time;
  }

  // ═══════════════════════════════════════════════
  // 阶段行为
  // ═══════════════════════════════════════════════

  protected updatePhase(time: number, delta: number): void {
    switch (this.phase) {
      case 1:
        this.phase1Behavior(time);
        break;
      case 2:
        this.phase2Behavior(time, delta);
        break;
      case 3:
        this.phase3Behavior(time, delta);
        break;
    }
  }

  /** Phase 1：固定位置，侧炮交替 + 中央环形 */
  private phase1Behavior(time: number): void {
    // 侧炮交替瞄准射击
    if (time - this.lastSideFireTime >= 600) {
      this.lastSideFireTime = time;
      this.fireSideAimed();
    }

    // 中央环形 4 秒一次
    if (time - this.lastCenterFireTime >= 4000) {
      this.lastCenterFireTime = time;
      this.fireRing(16);
    }
  }

  /** Phase 2：8 字移动 + 全炮台 + 释放护盾兵 */
  private phase2Behavior(time: number, delta: number): void {
    // 8 字移动
    const t = this.moveTime * 0.001;
    this.x = GAME_WIDTH / 2 + Math.sin(t) * (GAME_WIDTH / 2 - W / 2 - 20);
    this.y = this.targetY + Math.sin(t * 2) * 20;

    // 侧炮
    if (time - this.lastSideFireTime >= 500) {
      this.lastSideFireTime = time;
      this.fireSideAimed();
    }

    // 中央环形 3 秒一次
    if (time - this.lastCenterFireTime >= 3000) {
      this.lastCenterFireTime = time;
      this.fireRing(20);
    }

    // 释放护盾敌人 8 秒一次
    if (time - this.lastSpawnTime >= 8000) {
      this.lastSpawnTime = time;
      if (this.onSpawnShields) {
        this.onSpawnShields(this.x, this.y + H / 2, 2);
      }
    }
  }

  /** Phase 3：蓄力 → 爆发 → 虚弱窗口循环 */
  private phase3Behavior(time: number, delta: number): void {
    // 缓慢移动
    const t = this.moveTime * 0.0008;
    this.x = GAME_WIDTH / 2 + Math.sin(t) * (GAME_WIDTH / 2 - W / 2 - 30);

    // 虚弱窗口内不攻击
    if (time < this.vulnerableUntil) {
      // 闪烁表示虚弱
      this.setAlpha(0.5 + Math.sin(time * 0.02) * 0.3);
      return;
    }
    this.setAlpha(1);

    // 蓄力阶段
    if (!this.charging) {
      // 正常射击
      if (time - this.lastSideFireTime >= 400) {
        this.lastSideFireTime = time;
        this.fireSideAimed();
      }

      // 检查是否开始蓄力
      if (time - this.lastCenterFireTime >= this.chargeInterval) {
        this.charging = true;
        this.chargeStartTime = time;
        // 蓄力闪烁
        this.scene.tweens.add({
          targets: this,
          alpha: { from: 1, to: 0.4 },
          duration: 100,
          yoyo: true,
          repeat: 7,
        });
      }
    } else {
      // 蓄力 800ms 后爆发
      if (time - this.chargeStartTime >= 800) {
        this.charging = false;
        this.lastCenterFireTime = time;
        // 多层环形爆发
        this.fireMultiRing();
        // 进入虚弱窗口 1.5 秒
        this.vulnerableUntil = time + 1500;
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 攻击模式
  // ═══════════════════════════════════════════════

  /** 侧炮交替瞄准射击 */
  private fireSideAimed(): void {
    if (!this.playerRef.active) return;

    const gunX = this.fireFromLeft ? this.x - W / 2 + 15 : this.x + W / 2 - 15;
    this.fireFromLeft = !this.fireFromLeft;

    const dx = this.playerRef.x - gunX;
    const dy = this.playerRef.y - (this.y + 20);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.bulletPool.fire(
      gunX, this.y + 20,
      (dx / dist) * BULLET_SPEED,
      (dy / dist) * BULLET_SPEED,
      1
    );
  }

  /** 环形弹幕 */
  private fireRing(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.bulletPool.fire(
        this.x, this.y + H / 3,
        Math.cos(angle) * BULLET_SPEED * 0.7,
        Math.sin(angle) * BULLET_SPEED * 0.7,
        1
      );
    }
  }

  /** 多层环形爆发 */
  private fireMultiRing(): void {
    for (let ring = 0; ring < 3; ring++) {
      this.scene.time.delayedCall(ring * 150, () => {
        if (!this.active) return;
        const count = 20 + ring * 4;
        const offset = ring * 0.1; // 每层旋转偏移
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i + offset;
          const speed = BULLET_SPEED * (0.6 + ring * 0.15);
          this.bulletPool.fire(
            this.x, this.y + H / 3,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1
          );
        }
      });
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
      g.strokeEllipse(cx, cy, W - 10, H - 20);

      // 飞艇主体（椭圆形）
      g.fillStyle(SHOOTER_COLORS.BOSS2, 1);
      g.fillEllipse(cx, cy, W - 10, H - 20);

      // 上层甲板
      g.fillStyle(0x667799, 1);
      g.fillRoundedRect(20, 15, W - 40, 30, 8);

      // 侧翼（梯形）
      g.fillStyle(0x556677, 1);
      // 左翼
      g.fillPoints([
        new Phaser.Geom.Point(5, cy),
        new Phaser.Geom.Point(20, cy - 15),
        new Phaser.Geom.Point(20, cy + 15),
      ], true);
      // 右翼
      g.fillPoints([
        new Phaser.Geom.Point(W - 5, cy),
        new Phaser.Geom.Point(W - 20, cy - 15),
        new Phaser.Geom.Point(W - 20, cy + 15),
      ], true);

      // 炮台（三个）
      g.fillStyle(0x666677, 1);
      g.fillCircle(25, cy + 10, 6);  // 左炮
      g.fillCircle(cx, cy + 15, 8);  // 中炮
      g.fillCircle(W - 25, cy + 10, 6); // 右炮

      // 炮管
      g.fillStyle(0x555566, 1);
      g.fillRect(23, cy + 14, 4, 12);
      g.fillRect(cx - 2, cy + 20, 4, 14);
      g.fillRect(W - 27, cy + 14, 4, 12);

      // 指挥桥窗户（更亮）
      g.fillStyle(0xaaddff, 0.9);
      g.fillRoundedRect(cx - 15, 20, 30, 10, 3);

      // 引擎光（底部，更亮）
      g.fillStyle(0xff8800, 0.8);
      g.fillEllipse(cx - 30, H - 8, 15, 6);
      g.fillEllipse(cx + 30, H - 8, 15, 6);

      // 装甲线条
      g.lineStyle(1, 0xffffff, 0.15);
      g.strokeEllipse(cx, cy, W - 20, H - 25);

      return { width: W, height: H };
    });
  }
}
