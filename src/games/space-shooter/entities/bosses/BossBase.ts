// Boss 共享抽象基类：入场动画、阶段切换、通用属性
// 所有 Boss 共用的骨架逻辑提取到此处，子类只需实现攻击模式

import Phaser from 'phaser';
import { ShooterEnemy, DropEntry } from '../ShooterEnemy';
import { BulletPool } from '../../systems/BulletPool';

export abstract class BossBase extends ShooterEnemy {
  protected bulletPool: BulletPool;
  protected playerRef: Phaser.GameObjects.Sprite;

  // 阶段系统
  protected phase = 1;
  protected entered = false;
  protected targetY: number;
  protected moveTime = 0;

  // 计时器
  protected lastFireTime = 0;
  protected lastSpawnTime = 0;

  // 回调
  onPhaseChange: ((phase: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    hp: number,
    scoreValue: number,
    dropTable: DropEntry[],
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite,
    targetY: number,
    entrySpeed: number
  ) {
    super(scene, x, y, textureKey, hp, scoreValue, dropTable);
    this.bulletPool = bulletPool;
    this.playerRef = playerRef;
    this.targetY = targetY;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(entrySpeed);
  }

  // ═══════════════════════════════════════════════
  // 阶段管理（60% / 30% 阈值）
  // ═══════════════════════════════════════════════

  protected checkPhaseTransition(): void {
    const hpPercent = this.hp / this.maxHp;
    let newPhase = 1;

    if (hpPercent <= 0.30) {
      newPhase = 3;
    } else if (hpPercent <= 0.60) {
      newPhase = 2;
    }

    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.onPhaseChange?.(this.phase);
    }
  }

  // ═══════════════════════════════════════════════
  // 入场 + 阶段分发
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 入场阶段
    if (!this.entered) {
      if (this.y >= this.targetY) {
        this.entered = true;
        body.setVelocityY(0);
        this.onEntryComplete(time);
      }
      return;
    }

    this.checkPhaseTransition();
    this.moveTime += delta;
    this.updatePhase(time, delta);
  }

  // Boss 永不自动回收
  isOffScreen(): boolean {
    return false;
  }

  // 子类实现：入场完成后的初始化
  protected abstract onEntryComplete(time: number): void;
  // 子类实现：阶段行为分发
  protected abstract updatePhase(time: number, delta: number): void;
}
