// 暂停菜单场景

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PAUSE });
  }

  create(): void {
    // 半透明背景
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.6
    );

    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 3,
      'PAUSED',
      {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0.5);

    const resumeText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      '[ ESC ] Resume',
      {
        fontSize: '18px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      }
    );
    resumeText.setOrigin(0.5);

    const quitText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      '[ Q ] Quit to Title',
      {
        fontSize: '18px',
        color: '#ffaaaa',
        fontFamily: 'monospace',
      }
    );
    quitText.setOrigin(0.5);

    // 按键
    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.resume(SceneKey.GAME);
      this.scene.stop();
    });

    this.input.keyboard!.once('keydown-Q', () => {
      this.scene.stop(SceneKey.GAME);
      this.scene.stop(SceneKey.HUD);
      // 先启动 Title 再停止自身，避免在被销毁的上下文中操作
      this.scene.start(SceneKey.TITLE);
      this.scene.stop();
    });
  }
}
