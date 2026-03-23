// 射击游戏结束场景：显示分数、保存最高分、重试/退出

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

const HIGH_SCORE_KEY = 'spaceShooterHighScore';

export class ShooterGameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.SHOOTER_GAME_OVER });
  }

  create(data: { score: number; stage: number }): void {
    this.cameras.main.setBackgroundColor(0x0a0508);
    this.cameras.main.fadeIn(500);

    const isTouch = this.sys.game.device.input.touch;
    const score = data.score ?? 0;

    // 保存最高分
    const prevHigh = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10);
    const isNewHigh = score > prevHigh;
    if (isNewHigh) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    }

    // "GAME OVER" 标题
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4, 'GAME OVER', {
      fontSize: '42px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    });
    title.setOrigin(0.5);

    // 分数显示
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `Final Score: ${score}`, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 最高分
    const highScore = Math.max(score, prevHigh);
    const highColor = isNewHigh ? '#ffdd44' : '#888888';
    const highLabel = isNewHigh ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`;
    const highText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, highLabel, {
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

    // 重试按钮
    const retryLabel = isTouch ? 'Retry' : '[ ENTER ] Retry';
    const retryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, retryLabel, {
      fontSize: '20px',
      color: '#aaffaa',
      fontFamily: 'monospace',
    });
    retryText.setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 退出按钮
    const quitLabel = isTouch ? 'Back to Hub' : '[ Q ] Back to Hub';
    const quitText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, quitLabel, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    });
    quitText.setOrigin(0.5);

    // 重试逻辑（从第一关重新开始）
    let retryStarted = false;
    const retryGame = () => {
      if (retryStarted) return;
      retryStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.SHOOTER_GAME, {
          stage: 0,
          score: 0,
          lives: 3,
        });
      });
    };

    // 退出逻辑
    let quitStarted = false;
    const quitToHub = () => {
      if (quitStarted) return;
      quitStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.HUB);
      });
    };

    // 键盘
    this.input.keyboard?.once('keydown-ENTER', retryGame);
    this.input.keyboard?.once('keydown-Q', quitToHub);

    // 触屏/指针
    retryText.setPadding(40, 15, 40, 15);
    retryText.setInteractive();
    retryText.once('pointerdown', retryGame);

    quitText.setPadding(40, 15, 40, 15);
    quitText.setInteractive();
    quitText.once('pointerdown', quitToHub);
  }
}
