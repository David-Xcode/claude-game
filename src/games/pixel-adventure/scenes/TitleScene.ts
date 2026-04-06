// 标题场景：游戏主菜单

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { COLORS } from '../data/PAConstants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { fadeToScene } from '@shared/utils/SceneTransition';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.TITLE });
  }

  create(): void {
    // 进入游戏流程后锁定横屏
    lockLandscape();

    this.buildUI();

    // 窗口尺寸变化时销毁所有子对象并重建 UI
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  /** 尺寸变化时销毁全部子对象并重建 */
  private onResize(): void {
    // 停止所有补间动画，移除输入监听，再销毁子对象
    this.tweens.killAll();
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
    this.children.removeAll(true);
    this.buildUI();
  }

  /** 构建所有 UI 元素 */
  private buildUI(): void {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // 检测是否为触屏设备
    const isTouch = this.sys.game.device.input.touch;

    // 标题
    const title = this.add.text(
      layout.centerX,
      layout.height / 3 - layout.scale(20),
      'PIXEL ADVENTURE',
      {
        fontSize: layout.fontSize(48),
        color: '#ffdd44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: layout.scale(6, 2),
      },
    );
    title.setOrigin(0.5);

    // 标题浮动动画
    this.tweens.add({
      targets: title,
      y: title.y - layout.scale(8),
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 开始按钮（触屏/非触屏文案不同）
    const startLabel = isTouch
      ? '[ TAP TO START ]'
      : '[ PRESS ENTER / TAP TO START ]';
    const startText = this.add.text(
      layout.centerX,
      layout.centerY + layout.scale(40),
      startLabel,
      {
        fontSize: layout.fontSize(20),
        color: '#ffffff',
        fontFamily: 'monospace',
      },
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

    // 操作说明（触屏/非触屏文案不同）
    const controlsLabel = isTouch
      ? 'D-Pad: Move  |  Button: Jump\nPause button: top right'
      : 'Arrow Keys / WASD - Move    |    Up / W / Space - Jump\nESC - Pause    |    F1 - Debug';
    const controls = this.add.text(
      layout.centerX,
      layout.centerY + layout.scale(100),
      controlsLabel,
      {
        fontSize: layout.fontSize(14),
        color: '#888888',
        fontFamily: 'monospace',
        align: 'center',
      },
    );
    controls.setOrigin(0.5);

    // 装饰：小角色预览
    this.createDecoCharacters();

    // 开始游戏（fadeToScene 内部已防重复触发）
    const startGame = () => fadeToScene(this, SceneKey.GAME, { level: 0, score: 0, lives: 3 });

    // 按键监听
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);

    // 触屏/指针支持：点击屏幕任意位置即可开始
    this.input.once('pointerdown', startGame);

    this.cameras.main.fadeIn(500);
  }

  private createDecoCharacters(): void {
    const s = layout.uiScale;

    // 装饰用小史莱姆
    const slime = this.add.graphics();
    slime.fillStyle(COLORS.SLIME);
    slime.fillEllipse(0, 0, 28 * s, 18 * s);
    slime.fillStyle(0xffffff);
    slime.fillCircle(-5 * s, -2 * s, 3 * s);
    slime.fillCircle(5 * s, -2 * s, 3 * s);
    const slimeX = layout.width * 0.25;
    slime.setPosition(slimeX, layout.height - layout.scale(60));

    this.tweens.add({
      targets: slime,
      x: slimeX + layout.scale(100),
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 装饰用小飞行眼
    const eye = this.add.graphics();
    eye.fillStyle(COLORS.FLYING_EYE);
    eye.fillCircle(0, 0, 12 * s);
    eye.fillStyle(0xffffff);
    eye.fillCircle(0, 0, 6 * s);
    const eyeY = layout.height - layout.scale(100);
    eye.setPosition(layout.width * 0.69, eyeY);

    this.tweens.add({
      targets: eye,
      y: eyeY - layout.scale(30),
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
