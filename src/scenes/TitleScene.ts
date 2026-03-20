// 标题场景：游戏主菜单

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.TITLE });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // 标题
    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 3 - 20,
      'PIXEL ADVENTURE',
      {
        fontSize: '48px',
        color: '#ffdd44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    title.setOrigin(0.5);

    // 标题浮动动画
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 开始按钮
    const startText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      '[ PRESS ENTER TO START ]',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    startText.setOrigin(0.5);

    // 闪烁提示
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 操作说明
    const controls = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 100,
      'Arrow Keys / WASD - Move    |    Up / W / Space - Jump\nESC - Pause    |    F1 - Debug',
      {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'monospace',
        align: 'center',
      }
    );
    controls.setOrigin(0.5);

    // 装饰：小角色预览
    this.createDecoCharacters();

    // 按键监听
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
      });
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
      });
    });

    this.cameras.main.fadeIn(500);
  }

  private createDecoCharacters(): void {
    // 装饰用小史莱姆
    const g1 = this.add.graphics();
    g1.fillStyle(COLORS.SLIME);
    g1.fillEllipse(0, 0, 28, 18);
    g1.fillStyle(0xffffff);
    g1.fillCircle(-5, -2, 3);
    g1.fillCircle(5, -2, 3);
    g1.setPosition(200, GAME_HEIGHT - 60);

    this.tweens.add({
      targets: g1,
      x: 300,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 装饰用小飞行眼
    const g2 = this.add.graphics();
    g2.fillStyle(COLORS.FLYING_EYE);
    g2.fillCircle(0, 0, 12);
    g2.fillStyle(0xffffff);
    g2.fillCircle(0, 0, 6);
    g2.setPosition(550, GAME_HEIGHT - 100);

    this.tweens.add({
      targets: g2,
      y: GAME_HEIGHT - 130,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
