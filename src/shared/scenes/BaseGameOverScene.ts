// 游戏结束/胜利场景基类
import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
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

  create(data: any): void {
    const config = this.getConfig(data);
    const touch = isTouch(this);
    const quitTarget = config.quitSceneKey ?? SceneKey.HUB;
    const quitLabel = config.quitLabel ?? 'Back to Hub';

    this.cameras.main.setBackgroundColor(config.backgroundColor);
    this.cameras.main.fadeIn(800);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 10, config.title, {
      fontSize: '40px', color: config.titleColor, fontFamily: 'monospace',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    if (config.floatTitle) addFloatAnimation(this, title);

    let nextY = GAME_HEIGHT / 2 - 40;
    if (config.subtitle) {
      this.add.text(GAME_WIDTH / 2, nextY, config.subtitle, {
        fontSize: '18px', color: config.subtitleColor ?? '#aaccff',
        fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5);
      nextY += 35;
    }

    if (config.stats) {
      for (const entry of config.stats) {
        const isRich = typeof entry !== 'string';
        const text = isRich ? entry.text : entry;
        const color = isRich && entry.color ? entry.color : '#ffffff';
        const bold = isRich && entry.bold;

        const statText = this.add.text(GAME_WIDTH / 2, nextY, text, {
          fontSize: '16px', color, fontFamily: 'monospace',
          fontStyle: bold ? 'bold' : 'normal',
        }).setOrigin(0.5);

        if (isRich && entry.blink) {
          addBlinkAnimation(this, statText, 0.4, 500);
        }

        nextY += 28;
      }
    }

    if (config.showCelebration) createCelebrationParticles(this);

    const btnY = Math.max(nextY + 30, GAME_HEIGHT / 2 + 50);

    const btnLabel = config.replayLabel ?? 'Play Again';
    const replayLabel = touch ? btnLabel : `[ ENTER ] ${btnLabel}`;
    const replayBtn = createMenuButton(
      this, GAME_WIDTH / 2, btnY, replayLabel, '#aaffaa', '20px',
      () => fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    addBlinkAnimation(this, replayBtn);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(
      this, GAME_WIDTH / 2, btnY + 45, quitText, '#aaaaaa', '18px',
      () => fadeToScene(this, quitTarget)
    );

    this.input.keyboard?.once('keydown-ENTER', () =>
      fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    this.input.keyboard?.once('keydown-Q', () => fadeToScene(this, quitTarget));
  }
}
