// HUD 场景：与 GameScene 并行运行，显示血量、分数、生命数

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, PLAYER } from '../utils/Constants';
import { TouchControls } from '../systems/TouchControls';

export class HUDScene extends Phaser.Scene {
  private healthIcons: Phaser.GameObjects.Graphics[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
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
    const scoreX = this.touchControls ? GAME_WIDTH - 80 : GAME_WIDTH - 20;
    this.scoreText = this.add.text(scoreX, 15, 'Score: 0', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setOrigin(1, 0);

    // 生命数
    this.livesText = this.add.text(GAME_WIDTH / 2, 15, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.livesText.setOrigin(0.5, 0);
    this.updateLives(PLAYER.MAX_LIVES);

    // 关卡名（显示后淡出）
    this.levelText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '24px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.levelText.setOrigin(0.5);
    this.levelText.setAlpha(0);
  }

  private createHealthBar(maxHealth: number): void {
    // 清除旧图标
    this.healthIcons.forEach((icon) => icon.destroy());
    this.healthIcons = [];

    for (let i = 0; i < maxHealth; i++) {
      const heart = this.add.graphics();
      heart.fillStyle(0xff4466);
      // 简易心形
      heart.fillCircle(-4, 0, 5);
      heart.fillCircle(4, 0, 5);
      heart.fillTriangle(-9, 2, 9, 2, 0, 10);
      heart.setPosition(25 + i * 25, 22);
      this.healthIcons.push(heart);
    }
  }

  updateHealth(health: number): void {
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

  // 场景停止时清理触控资源，防止事件监听器泄漏
  shutdown(): void {
    this.touchControls?.destroy();
    this.touchControls = undefined;
  }
}
