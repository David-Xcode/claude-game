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

    const retryText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 60,
      '[ ENTER ] Retry',
      {
        fontSize: '18px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      }
    );
    retryText.setOrigin(0.5);

    const quitText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 95,
      '[ Q ] Title Screen',
      {
        fontSize: '18px',
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

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
      });
    });

    this.input.keyboard!.once('keydown-Q', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.TITLE);
      });
    });
  }
}
