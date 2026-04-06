// 暂停场景基类：半透明遮罩 + 继续/退出按钮
import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
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
    this.buildUI();
    // 监听窗口尺寸变化，重建 UI
    this.scale.on('resize', this.onResize, this);
    // 场景关闭时注销 resize 监听，避免累积泄漏
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  /** 构建/重建暂停界面所有元素 */
  private buildUI(): void {
    const config = this.getConfig();
    const touch = isTouch(this);
    const quitLabel = config.quitLabel ?? 'Quit to Hub';
    const quitTarget = config.quitTargetKey ?? SceneKey.HUB;

    this.add.rectangle(
      layout.width / 2, layout.height / 2, layout.width, layout.height, 0x000000, 0.6
    );

    this.add.text(layout.width / 2, layout.height / 3, 'PAUSED', {
      fontSize: layout.fontSize(36), color: '#ffffff', fontFamily: 'monospace',
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
    createMenuButton(this, layout.width / 2, layout.height / 2, resumeLabel, '#aaffaa', layout.fontSize(20), resume);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(this, layout.width / 2, layout.height / 2 + layout.scale(45), quitText, '#ffaaaa', layout.fontSize(20), quit);

    // 先清除旧的键盘监听，防止 resize 重建时重复绑定
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-Q', quit);
  }

  /** 窗口 resize 时重建 UI（暂停场景元素少，重建成本低） */
  private onResize(): void {
    this.children.removeAll(true);
    this.buildUI();
  }
}
