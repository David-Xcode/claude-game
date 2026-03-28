// Boss 3 — 母舰：有机外星飞船，紫色/暗色
// HP 120 / 得分 15000 / 三阶段
// Phase 1: 悬停 + 瞄准激光扫射 + 触手螺旋弹
// Phase 2: 核心暴露 + 追踪弹 + 释放旋转追踪器
// Phase 3: 高速移动 + 瞄准连射 + 环形 + 螺旋全开

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { PowerUpType, SHOOTER_COLORS, GAME_WIDTH } from '@shared/utils/Constants';
import { BulletPool } from '../../systems/BulletPool';
import { BossBase } from './BossBase';

const TEXTURE_KEY = 'boss3_mothership';
const W = 200;
const H = 120;
const BULLET_SPEED = 180;

export class Boss3Mothership extends BossBase {
  /** 释放旋转追踪器的回调 */
  onSpawnSpinners: ((x: number, y: number, count: number) => void) | null = null;

  /** 各武器计时器（Boss3 特有） */
  private lastAimedTime = 0;
  private lastSpiralTime = 0;
  private lastRingTime = 0;
  /** 螺旋弹角度偏移 */
  private spiralAngle = 0;

  /** 死亡动画进行中 */
  private dying = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite
  ) {
    Boss3Mothership.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 120, 15000, [
      { type: PowerUpType.WEAPON_HOMING, weight: 0.30 },
      { type: PowerUpType.BOMB, weight: 0.25 },
      { type: PowerUpType.HEALTH, weight: 0.25 },
      { type: PowerUpType.SCORE_BONUS, weight: 0.20 },
    ], bulletPool, playerRef, 60, 25);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(W - 30, H - 30);
  }

  // ═══════════════════════════════════════════════
  // 入场完成
  // ═══════════════════════════════════════════════

  protected onEntryComplete(time: number): void {
    this.lastAimedTime = time;
    this.lastSpiralTime = time;
    this.lastRingTime = time;
    this.lastSpawnTime = time;
  }

  // ═══════════════════════════════════════════════
  // 行为（覆盖基类以处理 dying 标志）
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, delta: number): void {
    if (this.dying) return;
    super.updateBehavior(time, delta);
  }

  // ═══════════════════════════════════════════════
  // 阶段行为
  // ═══════════════════════════════════════════════

  protected updatePhase(time: number, delta: number): void {
    switch (this.phase) {
      case 1:
        this.phase1Behavior(time, delta);
        break;
      case 2:
        this.phase2Behavior(time, delta);
        break;
      case 3:
        this.phase3Behavior(time, delta);
        break;
    }
  }

  /** Phase 1：悬停 + 瞄准扫射 + 触手螺旋弹 */
  private phase1Behavior(time: number, delta: number): void {
    // 微小悬浮
    this.y = this.targetY + Math.sin(time * 0.001) * 8;

    // 瞄准扫射 1200ms
    if (time - this.lastAimedTime >= 1200) {
      this.lastAimedTime = time;
      this.fireAimedSweep();
    }

    // 螺旋弹 2000ms
    if (time - this.lastSpiralTime >= 2000) {
      this.lastSpiralTime = time;
      this.fireSpiralBurst(8);
    }
  }

  /** Phase 2：核心暴露 + 追踪弹 + 释放 Spinner */
  private phase2Behavior(time: number, delta: number): void {
    // 缓慢左右
    const t = this.moveTime * 0.0006;
    this.x = GAME_WIDTH / 2 + Math.sin(t) * (GAME_WIDTH / 2 - W / 2 - 20);

    // 追踪弹（瞄准快速射击）
    if (time - this.lastAimedTime >= 800) {
      this.lastAimedTime = time;
      this.fireHomingBurst();
    }

    // 螺旋弹
    if (time - this.lastSpiralTime >= 2500) {
      this.lastSpiralTime = time;
      this.fireSpiralBurst(12);
    }

    // 释放旋转追踪器 7 秒
    if (time - this.lastSpawnTime >= 7000) {
      this.lastSpawnTime = time;
      if (this.onSpawnSpinners) {
        this.onSpawnSpinners(this.x, this.y + H / 2, 2);
      }
    }
  }

  /** Phase 3：高速移动 + 全开火力 */
  private phase3Behavior(time: number, delta: number): void {
    // 快速移动
    const t = this.moveTime * 0.0012;
    this.x = GAME_WIDTH / 2 + Math.sin(t) * (GAME_WIDTH / 2 - W / 2 - 15);
    this.y = this.targetY + Math.sin(t * 1.7) * 25;

    // 瞄准连射 500ms
    if (time - this.lastAimedTime >= 500) {
      this.lastAimedTime = time;
      this.fireAimedSweep();
    }

    // 环形弹幕 2500ms
    if (time - this.lastRingTime >= 2500) {
      this.lastRingTime = time;
      this.fireRing(24);
    }

    // 螺旋弹 1800ms
    if (time - this.lastSpiralTime >= 1800) {
      this.lastSpiralTime = time;
      this.fireSpiralBurst(16);
    }

    // 释放 Spinner 6 秒
    if (time - this.lastSpawnTime >= 6000) {
      this.lastSpawnTime = time;
      if (this.onSpawnSpinners) {
        this.onSpawnSpinners(this.x, this.y + H / 2, 3);
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 攻击模式
  // ═══════════════════════════════════════════════

  /** 瞄准扫射：向玩家方向发射 3 颗略微扩散的子弹 */
  private fireAimedSweep(): void {
    if (!this.playerRef.active) return;

    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const baseAngle = Math.atan2(dy, dx);

    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.15;
      this.bulletPool.fire(
        this.x, this.y + H / 2 - 10,
        Math.cos(angle) * BULLET_SPEED,
        Math.sin(angle) * BULLET_SPEED,
        1
      );
    }
  }

  /** 螺旋弹幕：从触手位置发射旋转子弹 */
  private fireSpiralBurst(count: number): void {
    this.spiralAngle += 0.3;

    for (let i = 0; i < count; i++) {
      const angle = this.spiralAngle + (Math.PI * 2 / count) * i;
      this.bulletPool.fire(
        this.x, this.y + 20,
        Math.cos(angle) * BULLET_SPEED * 0.6,
        Math.sin(angle) * BULLET_SPEED * 0.6,
        1
      );
    }
  }

  /** 追踪连射：快速 4 发瞄准弹 */
  private fireHomingBurst(): void {
    if (!this.playerRef.active) return;

    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (!this.active || !this.playerRef.active) return;
        const dx = this.playerRef.x - this.x;
        const dy = this.playerRef.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.bulletPool.fire(
          this.x, this.y + H / 3,
          (dx / dist) * BULLET_SPEED * 1.1,
          (dy / dist) * BULLET_SPEED * 1.1,
          1
        );
      });
    }
  }

  /** 环形弹幕 */
  private fireRing(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.bulletPool.fire(
        this.x, this.y,
        Math.cos(angle) * BULLET_SPEED * 0.7,
        Math.sin(angle) * BULLET_SPEED * 0.7,
        1
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 多阶段死亡动画
  // ═══════════════════════════════════════════════

  die(): void {
    if (this.dying) return;
    this.dying = true;

    // 先调用基类 die()，处理掉落逻辑 + setActive(false) + setVisible(false) + body.enable = false
    super.die();

    // 重新显示，用于死亡动画
    this.setVisible(true);

    // 3 秒内多次爆炸
    const explosionCount = 8;
    for (let i = 0; i < explosionCount; i++) {
      this.scene.time.delayedCall(i * 350, () => {
        if (!this.scene?.sys?.isActive()) return;

        // 随机位置爆炸闪烁
        const ox = Phaser.Math.Between(-W / 2 + 10, W / 2 - 10);
        const oy = Phaser.Math.Between(-H / 2 + 10, H / 2 - 10);

        // 白色闪烁
        this.setTint(0xffffff);
        this.scene.time.delayedCall(80, () => {
          if (this.visible) this.clearTint();
        });

        // 发射爆炸效果事件（由 ExplosionManager 处理）
        this.scene.events.emit('bossExplosion', this.x + ox, this.y + oy);
      });
    }

    // 最终销毁
    this.scene.time.delayedCall(explosionCount * 350 + 200, () => {
      this.setActive(false);
      this.setVisible(false);
    });
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = W / 2;
      const cy = H / 2;

      // 白色轮廓，提升可见度
      g.lineStyle(2, 0xffffff, 0.7);
      g.strokeEllipse(cx, cy, W - 20, H - 15);

      // 有机外形主体（椭圆 + 曲线）
      g.fillStyle(SHOOTER_COLORS.BOSS3, 1);
      g.fillEllipse(cx, cy, W - 20, H - 15);

      // 外壳纹理层
      g.fillStyle(0x552244, 0.6);
      g.fillEllipse(cx, cy, W - 40, H - 25);

      // 触手（左右下方延伸）
      g.fillStyle(0x553366, 1);
      // 左触手
      g.fillPoints([
        new Phaser.Geom.Point(30, cy + 10),
        new Phaser.Geom.Point(10, H - 5),
        new Phaser.Geom.Point(20, cy + 20),
        new Phaser.Geom.Point(40, cy + 15),
      ], true);
      // 右触手
      g.fillPoints([
        new Phaser.Geom.Point(W - 30, cy + 10),
        new Phaser.Geom.Point(W - 10, H - 5),
        new Phaser.Geom.Point(W - 20, cy + 20),
        new Phaser.Geom.Point(W - 40, cy + 15),
      ], true);
      // 中触手
      g.fillPoints([
        new Phaser.Geom.Point(cx - 10, cy + 20),
        new Phaser.Geom.Point(cx, H),
        new Phaser.Geom.Point(cx + 10, cy + 20),
      ], true);

      // 核心（发光球，更亮）
      g.fillStyle(0xdd66ff, 1);
      g.fillCircle(cx, cy - 5, 15);
      g.fillStyle(0xff99ff, 0.7);
      g.fillCircle(cx, cy - 5, 8);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx - 3, cy - 8, 4);

      // 侧眼（明亮黄色）
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx - 40, cy - 5, 7);
      g.fillCircle(cx + 40, cy - 5, 7);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx - 42, cy - 7, 3);
      g.fillCircle(cx + 38, cy - 7, 3);

      // 有机纹路（略亮）
      g.lineStyle(1, 0xaa6688, 0.4);
      g.strokeEllipse(cx, cy, W - 50, H - 30);
      g.strokeEllipse(cx, cy, W - 70, H - 45);

      return { width: W, height: H };
    });
  }
}
