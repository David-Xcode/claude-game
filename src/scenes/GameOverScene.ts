// 游戏结束场景：显示最终分数，重试/返回标题

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.GAME_OVER });
  }

  create(data: { score: number }): void {
    this.cameras.main.setBackgroundColor(0x1a0a0a);
    this.cameras.main.fadeIn(500);

    // 检测是否为触屏设备
    const isTouch = this.sys.game.device.input.touch;

    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 3 - 20,
      'GAME OVER',
      {
        fontSize: '42px',
        color: '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    title.setOrigin(0.5);

    const score = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      `Final Score: ${data.score ?? 0}`,
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    score.setOrigin(0.5);

    // 重试按钮
    const retryLabel = isTouch ? 'Retry' : '[ ENTER ] Retry';
    const retryText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 60,
      retryLabel,
      {
        fontSize: '20px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      }
    );
    retryText.setOrigin(0.5);

    // 返回标题按钮
    const quitLabel = isTouch ? 'Title Screen' : '[ Q ] Title Screen';
    const quitText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 95,
      quitLabel,
      {
        fontSize: '20px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }
    );
    quitText.setOrigin(0.5);

    // 闪烁
    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 防止重复触发的重试逻辑
    let retryStarted = false;
    const retryGame = () => {
      if (retryStarted) return;
      retryStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
      });
    };

    // 防止重复触发的退出逻辑
    let quitStarted = false;
    const quitToTitle = () => {
      if (quitStarted) return;
      quitStarted = true;
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.TITLE);
      });
    };

    this.input.keyboard?.once('keydown-ENTER', retryGame);
    this.input.keyboard?.once('keydown-Q', quitToTitle);

    // 触屏/指针支持
    retryText.setInteractive();
    retryText.once('pointerdown', retryGame);

    quitText.setInteractive();
    quitText.once('pointerdown', quitToTitle);
  }
}
