// 暂停菜单场景

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PAUSE });
  }

  create(): void {
    // 检测是否为触屏设备
    const isTouch = this.sys.game.device.input.touch;

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

    // 继续游戏按钮
    const resumeLabel = isTouch ? 'Resume' : '[ ESC ] Resume';
    const resumeText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      resumeLabel,
      {
        fontSize: '20px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      }
    );
    resumeText.setOrigin(0.5);

    // 退出按钮
    const quitLabel = isTouch ? 'Quit to Title' : '[ Q ] Quit to Title';
    const quitText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      quitLabel,
      {
        fontSize: '20px',
        color: '#ffaaaa',
        fontFamily: 'monospace',
      }
    );
    quitText.setOrigin(0.5);

    // 继续游戏逻辑
    const resumeGame = () => {
      this.scene.resume(SceneKey.GAME);
      this.scene.stop();
    };

    // 退出到标题逻辑
    const quitToTitle = () => {
      this.scene.stop(SceneKey.GAME);
      this.scene.stop(SceneKey.HUD);
      // 先启动 Title 再停止自身，避免在被销毁的上下文中操作
      this.scene.start(SceneKey.TITLE);
      this.scene.stop();
    };

    // 按键
    this.input.keyboard?.once('keydown-ESC', resumeGame);
    this.input.keyboard?.once('keydown-Q', quitToTitle);

    // 触屏/指针支持：加大内边距扩展触控热区
    resumeText.setPadding(40, 15, 40, 15);
    resumeText.setInteractive();
    resumeText.once('pointerdown', resumeGame);

    quitText.setPadding(40, 15, 40, 15);
    quitText.setInteractive();
    quitText.once('pointerdown', quitToTitle);
  }
}
