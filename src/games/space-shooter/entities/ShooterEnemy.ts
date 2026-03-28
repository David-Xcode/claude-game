// 射击敌人基类：所有敌人类型的抽象父类
// 处理 HP、受伤闪白、死亡回收、掉落计算、程序化纹理工具

import Phaser from 'phaser';
import { SHOOTER_DEPTH, PowerUpType, GAME_HEIGHT, GAME_WIDTH } from '@shared/utils/Constants';

// ═══════════════════════════════════════════════
// 掉落表条目
// ═══════════════════════════════════════════════

export interface DropEntry {
  type: PowerUpType;
  weight: number;
}

// ═══════════════════════════════════════════════
// 抽象基类
// ═══════════════════════════════════════════════

export abstract class ShooterEnemy extends Phaser.Physics.Arcade.Sprite {
  /** 当前生命值 */
  hp: number;
  /** 最大生命值 */
  maxHp: number;
  /** 击杀得分 */
  scoreValue: number;
  /** 掉落概率表 */
  dropTable: DropEntry[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    hp: number,
    scoreValue: number,
    dropTable: DropEntry[]
  ) {
    super(scene, x, y, textureKey);

    this.hp = hp;
    this.maxHp = hp;
    this.scoreValue = scoreValue;
    this.dropTable = dropTable;

    // 加入场景 & 物理系统
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(SHOOTER_DEPTH.ENEMIES);

    // 禁用重力
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  // ═══════════════════════════════════════════════
  // 伤害 & 死亡
  // ═══════════════════════════════════════════════

  /** 受到伤害，返回 true 表示已死亡 */
  takeDamage(amount: number): boolean {
    if (!this.active) return false;

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }

    // 闪白反馈
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    return false;
  }

  /** 死亡：在失活前发射掉落事件，然后禁用并隐藏 */
  die(): void {
    // 在失活前检查掉落并发射事件
    const dropType = this.rollDrop();
    if (dropType) {
      this.scene.events.emit('enemyDrop', this.x, this.y, dropType);
    }

    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
    }
  }

  /** 获取得分值（供碰撞回调调用） */
  getScoreValue(): number {
    return this.scoreValue;
  }

  // ═══════════════════════════════════════════════
  // 行为（子类实现）
  // ═══════════════════════════════════════════════

  /** 子类必须实现的行为逻辑 */
  abstract updateBehavior(time: number, delta: number): void;

  /** 由 Phaser 的 Group runChildUpdate 驱动 */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    this.updateBehavior(time, delta);

    // 超出屏幕自动回收
    if (this.isOffScreen()) {
      this.die();
    }
  }

  // ═══════════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════════

  /** 检测是否飞出屏幕缓冲区 */
  isOffScreen(): boolean {
    return (
      this.y > GAME_HEIGHT + 50 ||
      this.y < -50 ||
      this.x > GAME_WIDTH + 50 ||
      this.x < -50
    );
  }

  /** 加权随机掉落：返回道具类型或 null（不掉落） */
  rollDrop(): PowerUpType | null {
    // 所有权重之和 + "不掉落"的剩余权重
    const totalWeight = this.dropTable.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) return null;

    // 把不掉落的权重设为 1 - totalWeight（若 totalWeight < 1）
    const nothingWeight = Math.max(0, 1 - totalWeight);
    const roll = Math.random();

    let cumulative = 0;
    for (const entry of this.dropTable) {
      cumulative += entry.weight;
      if (roll < cumulative) {
        return entry.type;
      }
    }

    // 超过所有条目权重 → 不掉落
    if (nothingWeight > 0) return null;

    // 安全兜底：返回最后一个
    return this.dropTable[this.dropTable.length - 1]?.type ?? null;
  }

  // ═══════════════════════════════════════════════
  // 纹理生成工具（静态）
  // ═══════════════════════════════════════════════

  /** 通用程序化纹理创建器 */
  static createTexture(
    scene: Phaser.Scene,
    key: string,
    drawFn: (g: Phaser.GameObjects.Graphics) => { width: number; height: number }
  ): void {
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const size = drawFn(g);
    g.generateTexture(key, size.width, size.height);
    g.destroy();
  }
}
