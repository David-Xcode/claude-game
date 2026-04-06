// 游戏结束/胜利场景基类
import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { fadeToScene } from '@shared/utils/SceneTransition';
import { isTouch, createMenuButton, addBlinkAnimation, addFloatAnimation } from '@shared/ui/UIHelpers';
import { createCelebrationParticles } from '@shared/ui/CelebrationEffect';

export interface StatLine {
  text: string;
  color?: string;       // 默认 '#ffffff'
  bold?: boolean;        // 默认 false
  blink?: boolean;       // 默认 false（如 "NEW HIGH SCORE!" 闪烁）
}

export interface GameOverSceneConfig {
  backgroundColor: number;
  title: string;
  titleColor: string;
  subtitle?: string;
  subtitleColor?: string;   // 默认 '#aaccff'
  stats?: (string | StatLine)[];  // 字符串或富文本行
  showCelebration: boolean;
  floatTitle: boolean;
  replaySceneKey: string;
  replayData: object;
  replayLabel?: string;     // 默认 'Play Again'
  quitSceneKey?: string;
  quitLabel?: string;
}

export abstract class BaseGameOverScene extends Phaser.Scene {
  protected abstract getConfig(data: any): GameOverSceneConfig;

  /** 保存 create() 传入的 data，resize 时用于重建 */
  private createData: any;

  create(data: any): void {
    this.createData = data;
    this.buildUI(data);
    // 首次进入时播放渐入动画
    this.cameras.main.fadeIn(800);
    // 监听窗口尺寸变化，重建 UI
    this.scale.on('resize', this.onResize, this);
    // 场景关闭时注销 resize 监听，避免累积泄漏
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  /** 构建/重建结算界面所有元素 */
  private buildUI(data: any): void {
    const config = this.getConfig(data);
    const touch = isTouch(this);
    const quitTarget = config.quitSceneKey ?? SceneKey.HUB;
    const quitLabel = config.quitLabel ?? 'Back to Hub';

    this.cameras.main.setBackgroundColor(config.backgroundColor);

    const title = this.add.text(layout.width / 2, layout.height / 4 - 10, config.title, {
      fontSize: layout.fontSize(40), color: config.titleColor, fontFamily: 'monospace',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    if (config.floatTitle) addFloatAnimation(this, title);

    let nextY = layout.height / 2 - layout.scale(40);
    if (config.subtitle) {
      this.add.text(layout.width / 2, nextY, config.subtitle, {
        fontSize: layout.fontSize(18), color: config.subtitleColor ?? '#aaccff',
        fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5);
      nextY += layout.scale(35);
    }

    if (config.stats) {
      for (const entry of config.stats) {
        const isRich = typeof entry !== 'string';
        const text = isRich ? entry.text : entry;
        const color = isRich && entry.color ? entry.color : '#ffffff';
        const bold = isRich && entry.bold;

        const statText = this.add.text(layout.width / 2, nextY, text, {
          fontSize: layout.fontSize(16), color, fontFamily: 'monospace',
          fontStyle: bold ? 'bold' : 'normal',
        }).setOrigin(0.5);

        if (isRich && entry.blink) {
          addBlinkAnimation(this, statText, 0.4, 500);
        }

        nextY += layout.scale(28);
      }
    }

    if (config.showCelebration) createCelebrationParticles(this);

    const btnY = Math.max(nextY + layout.scale(30), layout.height / 2 + layout.scale(50));

    const btnLabel = config.replayLabel ?? 'Play Again';
    const replayLabel = touch ? btnLabel : `[ ENTER ] ${btnLabel}`;
    const replayBtn = createMenuButton(
      this, layout.width / 2, btnY, replayLabel, '#aaffaa', layout.fontSize(20),
      () => fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    addBlinkAnimation(this, replayBtn);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(
      this, layout.width / 2, btnY + layout.scale(45), quitText, '#aaaaaa', layout.fontSize(18),
      () => fadeToScene(this, quitTarget)
    );

    // 先清除旧的键盘监听，防止 resize 重建时重复绑定
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.once('keydown-ENTER', () =>
      fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    this.input.keyboard?.once('keydown-Q', () => fadeToScene(this, quitTarget));
  }

  /** 窗口 resize 时重建 UI（结算场景元素不多，重建成本低） */
  private onResize(): void {
    this.children.removeAll(true);
    this.buildUI(this.createData);
  }
}
