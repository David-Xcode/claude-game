// 暂停场景基类：半透明遮罩 + 继续/退出按钮
import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { isTouch, createMenuButton } from '@shared/ui/UIHelpers';

export interface PauseSceneConfig {
  gameSceneKey: string;
  hudSceneKey: string;
  quitTargetKey?: string;
  quitLabel?: string;
}

export abstract class BasePauseScene extends Phaser.Scene {
  protected abstract getConfig(): PauseSceneConfig;

  create(): void {
    const config = this.getConfig();
    const touch = isTouch(this);
    const quitLabel = config.quitLabel ?? 'Quit to Hub';
    const quitTarget = config.quitTargetKey ?? SceneKey.HUB;

    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6
    );

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'PAUSED', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'monospace',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const resume = () => {
      this.scene.resume(config.gameSceneKey);
      this.scene.stop();
    };

    const quit = () => {
      this.scene.stop(config.gameSceneKey);
      this.scene.stop(config.hudSceneKey);
      this.scene.start(quitTarget);
      this.scene.stop();
    };

    const resumeLabel = touch ? 'Resume' : '[ ESC ] Resume';
    createMenuButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, resumeLabel, '#aaffaa', '20px', resume);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, quitText, '#ffaaaa', '20px', quit);

    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-Q', quit);
  }
}
