// 射击游戏暂停场景：半透明覆盖层，恢复/退出选项

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

export class ShooterPauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.SHOOTER_PAUSE });
  }

  create(): void {
    const isTouch = this.sys.game.device.input.touch;

    // 半透明黑色背景
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.65
    );

    // "PAUSED" 标题
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'PAUSED', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // 继续按钮
    const resumeLabel = isTouch ? 'Resume' : '[ ESC ] Resume';
    const resumeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, resumeLabel, {
      fontSize: '20px',
      color: '#aaffaa',
      fontFamily: 'monospace',
    });
    resumeText.setOrigin(0.5);

    // 退出按钮
    const quitLabel = isTouch ? 'Quit to Hub' : '[ Q ] Quit to Hub';
    const quitText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, quitLabel, {
      fontSize: '20px',
      color: '#ffaaaa',
      fontFamily: 'monospace',
    });
    quitText.setOrigin(0.5);

    // 继续游戏
    const resumeGame = () => {
      this.scene.resume(SceneKey.SHOOTER_GAME);
      this.scene.stop();
    };

    // 退出到大厅
    const quitToHub = () => {
      this.scene.stop(SceneKey.SHOOTER_GAME);
      this.scene.stop(SceneKey.SHOOTER_HUD);
      this.scene.start(SceneKey.HUB);
      this.scene.stop();
    };

    // 键盘监听
    this.input.keyboard?.once('keydown-ESC', resumeGame);
    this.input.keyboard?.once('keydown-Q', quitToHub);

    // 触屏/指针支持
    resumeText.setPadding(40, 15, 40, 15);
    resumeText.setInteractive();
    resumeText.once('pointerdown', resumeGame);

    quitText.setPadding(40, 15, 40, 15);
    quitText.setInteractive();
    quitText.once('pointerdown', quitToHub);
  }
}
