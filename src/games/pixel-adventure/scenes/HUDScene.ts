// HUD 场景：与 GameScene 并行运行，显示血量、分数、生命数

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { PLAYER } from '../data/PAConstants';
import { TouchControls } from '@shared/systems/TouchControls';

export class HUDScene extends Phaser.Scene {
  private healthIcons: Phaser.GameObjects.Graphics[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private currentHealth: number = PLAYER.MAX_HEALTH;
  public touchControls?: TouchControls;

  constructor() {
    super({ key: SceneKey.HUD });
  }

  create(): void {
    // 触控设备上创建虚拟按钮
    if (this.sys.game.device.input.touch) {
      this.touchControls = new TouchControls(this);
    }

    // 注册 shutdown 事件清理触控资源（Phaser 3 不自动调用 shutdown 方法）
    this.events.on('shutdown', this.shutdown, this);

    // 血量图标（心形）
    this.createHealthBar(PLAYER.MAX_HEALTH);

    // 分数
    // 触控设备上右上角有暂停按钮，分数文字左移避免重叠
    const pauseOffset = this.touchControls ? layout.scale(80) : layout.scale(20);
    const scoreX = layout.width - layout.safeRight - pauseOffset;
    this.scoreText = this.add.text(scoreX, layout.safeTop + layout.scale(15), 'Score: 0', {
      fontSize: layout.fontSize(16),
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setOrigin(1, 0);

    // 生命数
    this.livesText = this.add.text(layout.width / 2, layout.safeTop + layout.scale(15), '', {
      fontSize: layout.fontSize(16),
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.livesText.setOrigin(0.5, 0);
    this.updateLives(PLAYER.MAX_LIVES);

    // 关卡名（显示后淡出）
    this.levelText = this.add.text(layout.width / 2, layout.safeTop + layout.scale(60), '', {
      fontSize: layout.fontSize(24),
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.levelText.setOrigin(0.5);
    this.levelText.setAlpha(0);

    // 窗口尺寸变化时重排 HUD 元素
    this.scale.on('resize', this.handleResize, this);
  }

  private createHealthBar(maxHealth: number): void {
    // 清除旧图标
    this.healthIcons.forEach((icon) => icon.destroy());
    this.healthIcons = [];

    const s = layout.uiScale;
    const gap = layout.scale(25);
    const baseX = layout.safeLeft + gap;
    const baseY = layout.safeTop + layout.scale(22);

    for (let i = 0; i < maxHealth; i++) {
      const heart = this.add.graphics();
      heart.fillStyle(0xff4466);
      // 简易心形（按 uiScale 缩放）
      heart.fillCircle(-4 * s, 0, 5 * s);
      heart.fillCircle(4 * s, 0, 5 * s);
      heart.fillTriangle(-9 * s, 2 * s, 9 * s, 2 * s, 0, 10 * s);
      heart.setPosition(baseX + i * gap, baseY);
      this.healthIcons.push(heart);
    }
  }

  updateHealth(health: number): void {
    this.currentHealth = health;
    this.healthIcons.forEach((icon, i) => {
      if (i < health) {
        icon.setAlpha(1);
      } else {
        icon.setAlpha(0.2);
      }
    });
  }

  updateScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);

    // 分数变化弹跳效果
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.3,
      duration: 100,
      yoyo: true,
    });
  }

  updateLives(lives: number): void {
    this.livesText.setText(`x ${lives}`);
  }

  showLevelName(name: string): void {
    this.levelText.setText(name);
    this.levelText.setAlpha(1);
    this.tweens.add({
      targets: this.levelText,
      alpha: 0,
      delay: 2000,
      duration: 1000,
    });
  }

  /** 窗口尺寸变化时重排所有 HUD 元素 */
  private handleResize(): void {
    // 重建血量图标（图形对象需要重绘），并恢复当前血量状态
    this.createHealthBar(PLAYER.MAX_HEALTH);
    this.updateHealth(this.currentHealth);

    // 分数位置与字号
    const pauseOffset = this.touchControls ? layout.scale(80) : layout.scale(20);
    this.scoreText.setPosition(
      layout.width - layout.safeRight - pauseOffset,
      layout.safeTop + layout.scale(15),
    );
    this.scoreText.setFontSize(layout.fontSizeNum(16));

    // 生命数位置与字号
    this.livesText.setPosition(layout.width / 2, layout.safeTop + layout.scale(15));
    this.livesText.setFontSize(layout.fontSizeNum(16));

    // 关卡名位置与字号
    this.levelText.setPosition(layout.width / 2, layout.safeTop + layout.scale(60));
    this.levelText.setFontSize(layout.fontSizeNum(24));
  }

  // 场景停止时清理触控资源和 resize 监听，防止事件监听器泄漏
  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.touchControls?.destroy();
    this.touchControls = undefined;
  }
}
