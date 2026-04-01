// 分数 + 连击系统：击杀叠加连击倍率，超时重置

import Phaser from 'phaser';
import { SHOOTER } from '../data/ShooterConstants';

const STORAGE_KEY = 'spaceShooterHighScore';

export class ScoreManager {
  private scene: Phaser.Scene;

  /** 当前总分 */
  score: number;

  /** 当前连击数 */
  combo = 0;

  /** 连击倒计时（毫秒） */
  private comboTimer = 0;

  /** 当前连击倍率（只读计算属性） */
  get multiplier(): number {
    return Math.min(1 + this.combo * 0.1, SHOOTER.MAX_COMBO_MULTIPLIER);
  }

  constructor(scene: Phaser.Scene, initialScore: number = 0) {
    this.scene = scene;
    this.score = initialScore;
  }

  /**
   * 击杀加分：叠加连击并应用倍率
   * @param baseScore 该敌人基础分值
   */
  addKill(baseScore: number): void {
    this.combo++;
    this.comboTimer = SHOOTER.COMBO_WINDOW;

    const earned = Math.round(baseScore * this.multiplier);
    this.score += earned;
  }

  /**
   * 直接加分（无连击效果）：用于道具奖励、关卡奖励等
   */
  addBonus(points: number): void {
    this.score += points;
  }

  /** 每帧更新：递减连击计时器，超时后自动归零连击 */
  update(delta: number): void {
    if (this.combo > 0 && this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
  }

  /** 手动重置连击（受伤时调用） */
  resetCombo(): void {
    this.combo = 0;
    this.comboTimer = 0;
  }

  /** 重置所有状态 */
  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
  }

  /** 从 localStorage 获取最高分 */
  getHighScore(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /** 将当前分数保存为最高分（仅当超过旧记录时） */
  saveHighScore(): void {
    try {
      const current = this.getHighScore();
      if (this.score > current) {
        localStorage.setItem(STORAGE_KEY, this.score.toString());
      }
    } catch {
      // localStorage 不可用时静默失败
    }
  }
}
