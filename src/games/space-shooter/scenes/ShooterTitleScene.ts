// 射击游戏标题场景：星空背景、动画飞船预览、按键/触屏开始

import Phaser from 'phaser';
import {
  SceneKey,
  GAME_WIDTH,
  GAME_HEIGHT,
  SHOOTER_COLORS,
} from '@shared/utils/Constants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { fadeToScene } from '@shared/utils/SceneTransition';

export class ShooterTitleScene extends Phaser.Scene {
  private stars: { x: number; y: number; speed: number; size: number }[] = [];
  private starGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SceneKey.SHOOTER_TITLE });
  }

  create(): void {
    // 进入游戏流程后锁定横屏
    lockLandscape();
    this.cameras.main.setBackgroundColor(0x050510);

    const isTouch = this.sys.game.device.input.touch;

    // 初始化星空
    this.initStarField();

    // 标题文字（带发光效果）
    const titleGlow = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 - 18, 'SPACE SHOOTER', {
      fontSize: '48px',
      color: '#4488ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    titleGlow.setOrigin(0.5);
    titleGlow.setAlpha(0.3);
    titleGlow.setBlendMode(Phaser.BlendModes.ADD);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 - 20, 'SPACE SHOOTER', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // 发光脉冲动画
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.6,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 标题浮动
    this.tweens.add({
      targets: [title, titleGlow],
      y: '-=6',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // "按键开始"闪烁文字
    const startLabel = isTouch
      ? '[ TAP TO START ]'
      : '[ PRESS ENTER TO START ]';
    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, startLabel, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    startText.setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 操作说明
    const controlsLabel = isTouch
      ? 'D-Pad: Move  |  Auto-fire enabled'
      : 'Arrow / WASD: Move  |  Space: Fire  |  B: Bomb  |  ESC: Pause';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, controlsLabel, {
      fontSize: '12px',
      color: '#666688',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);

    // 返回大厅提示
    const backLabel = isTouch ? '[ Back ]' : '[ ESC ] Back to Hub';
    const backText = this.add.text(20, 20, backLabel, {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    });
    backText.setPadding(10, 8, 10, 8);
    backText.setInteractive();
    backText.on('pointerdown', () => this.goToHub());

    // 装饰：Claude 骑飞船小动画
    this.createShipPreview();

    // 开始游戏（fadeToScene 内部已防重复触发）
    const startGame = () => fadeToScene(this, SceneKey.SHOOTER_GAME, { stage: 0, score: 0, lives: 3 });

    // 键盘监听
    this.input.keyboard?.on('keydown-ENTER', startGame);
    this.input.keyboard?.on('keydown-SPACE', startGame);
    this.input.keyboard?.on('keydown-ESC', () => this.goToHub());

    // 触屏/指针：点击任意位置开始（排除返回按钮区域）
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 排除左上角返回按钮区域（40x36 以内不触发开始）
      if (pointer.x < 150 && pointer.y < 50) return;
      startGame();
    });

    this.cameras.main.fadeIn(500);
  }

  update(): void {
    // 星空滚动
    this.starGraphics.clear();
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > GAME_HEIGHT + 2) {
        star.y = -2;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
      const alpha = Phaser.Math.Clamp(star.speed / 2, 0.2, 0.8);
      this.starGraphics.fillStyle(0xffffff, alpha);
      this.starGraphics.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  /** 初始化星空粒子（手动绘制） */
  private initStarField(): void {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(0, GAME_HEIGHT),
        speed: Phaser.Math.FloatBetween(0.3, 1.5),
        size: Phaser.Math.Between(1, 2),
      });
    }
    this.starGraphics = this.add.graphics();
  }

  /** 创建 Claude 骑飞船小动画预览 */
  private createShipPreview(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 5;
    const g = this.add.graphics();
    g.setPosition(cx, cy);

    // 飞船主体
    g.fillStyle(SHOOTER_COLORS.SHIP_HULL);
    g.fillTriangle(0, -16, -14, 12, 14, 12);

    // 机翼
    g.fillStyle(SHOOTER_COLORS.SHIP_WING);
    g.fillTriangle(-14, 12, -22, 18, -6, 6);
    g.fillTriangle(14, 12, 22, 18, 6, 6);

    // 引擎光焰
    const flame = this.add.graphics();
    flame.setPosition(cx, cy);
    flame.fillStyle(SHOOTER_COLORS.SHIP_ENGINE, 0.8);
    flame.fillTriangle(-5, 13, 5, 13, 0, 24);

    this.tweens.add({
      targets: flame,
      scaleY: 1.4,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    // Claude（飞船座舱上的小人）
    g.fillStyle(SHOOTER_COLORS.PLAYER_BODY);
    g.fillCircle(0, -2, 5);

    // 整体浮动
    this.tweens.add({
      targets: [g, flame],
      y: '-=8',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** 返回游戏大厅 */
  private goToHub(): void {
    fadeToScene(this, SceneKey.HUB, undefined, 400);
  }
}
