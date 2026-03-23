// 射击游戏通关场景：最终分数展示、最高分比较、撒花特效

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

const HIGH_SCORE_KEY = 'spaceShooterHighScore';

export class ShooterVictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.SHOOTER_VICTORY });
  }

  create(data: { score: number }): void {
    this.cameras.main.setBackgroundColor(0x050a15);
    this.cameras.main.fadeIn(800);

    const isTouch = this.sys.game.device.input.touch;
    const score = data.score ?? 0;

    // 保存/比较最高分
    const prevHigh = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10);
    const isNewHigh = score > prevHigh;
    if (isNewHigh) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    }

    // "MISSION COMPLETE" 标题
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 10, 'MISSION COMPLETE', {
      fontSize: '40px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // 标题浮动动画
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 祝贺文字
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'All stages cleared!\nThe galaxy is safe.', {
      fontSize: '16px',
      color: '#aaccff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);

    // 最终分数
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `Final Score: ${score}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 最高分信息
    const highScore = Math.max(score, prevHigh);
    const highColor = isNewHigh ? '#ffdd44' : '#888888';
    const highLabel = isNewHigh ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`;
    const highText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, highLabel, {
      fontSize: '16px',
      color: highColor,
      fontFamily: 'monospace',
      fontStyle: isNewHigh ? 'bold' : 'normal',
    });
    highText.setOrigin(0.5);

    if (isNewHigh) {
      this.tweens.add({
        targets: highText,
        alpha: 0.4,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // 再来一次按钮
    const replayLabel = isTouch ? 'Play Again' : '[ ENTER ] Play Again';
    const replayText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, replayLabel, {
      fontSize: '20px',
      color: '#aaffaa',
      fontFamily: 'monospace',
    });
    replayText.setOrigin(0.5);

    this.tweens.add({
      targets: replayText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 返回大厅按钮
    const hubLabel = isTouch ? 'Back to Hub' : '[ Q ] Back to Hub';
    const hubText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, hubLabel, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    });
    hubText.setOrigin(0.5);

    // 撒花特效
    this.createCelebrationParticles();

    // 再来一次
    let replayStarted = false;
    const replayGame = () => {
      if (replayStarted) return;
      replayStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.SHOOTER_GAME, {
          stage: 0,
          score: 0,
          lives: 3,
        });
      });
    };

    // 返回大厅
    let hubStarted = false;
    const goToHub = () => {
      if (hubStarted) return;
      hubStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.HUB);
      });
    };

    // 键盘
    this.input.keyboard?.once('keydown-ENTER', replayGame);
    this.input.keyboard?.once('keydown-Q', goToHub);

    // 触屏/指针
    replayText.setPadding(40, 15, 40, 15);
    replayText.setInteractive();
    replayText.once('pointerdown', replayGame);

    hubText.setPadding(40, 15, 40, 15);
    hubText.setInteractive();
    hubText.once('pointerdown', goToHub);
  }

  /** 创建彩色撒花粒子 */
  private createCelebrationParticles(): void {
    const colors = [0x4488ff, 0xff4444, 0x44ff44, 0xffdd44, 0xff44ff, 0x44ffff];

    for (const color of colors) {
      const key = `shooter_confetti_${color}`;
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        g.fillStyle(color);
        g.fillRect(0, 0, 5, 5);
        g.generateTexture(key, 5, 5);
        g.destroy();
      }

      this.add.particles(GAME_WIDTH / 2, -10, key, {
        x: { min: -GAME_WIDTH / 2, max: GAME_WIDTH / 2 },
        speed: { min: 40, max: 130 },
        angle: { min: 75, max: 105 },
        lifespan: 5000,
        scale: { start: 1, end: 0.2 },
        rotate: { min: 0, max: 360 },
        gravityY: 40,
        frequency: 120,
      });
    }
  }
}
