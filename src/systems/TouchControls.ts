// 虚拟触控按钮系统：在 HUD 层创建半透明方向键和跳跃按钮
// 支持多点触控，暴露与 InputManager 相同的布尔接口

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class TouchControls {
  private scene: Phaser.Scene;

  // 触控状态
  left = false;
  right = false;
  jumpHeld = false;
  pausePressed = false;

  // jumpPressed 仅在按下瞬间为 true，由 update() 清除
  private _jumpJustPressed = false;

  // 追踪每根手指绑定到哪个按钮，实现多点触控
  private pointerMap = new Map<number, string>();

  // 视觉元素（用于按压反馈）
  private leftGraphics!: Phaser.GameObjects.Graphics;
  private rightGraphics!: Phaser.GameObjects.Graphics;
  private jumpGraphics!: Phaser.GameObjects.Graphics;
  private pauseGraphics!: Phaser.GameObjects.Graphics;

  // Zone 引用（销毁时清理）
  private zones: Phaser.GameObjects.Zone[] = [];

  // pointercancel 回调引用（销毁时精确移除）
  private onPointerCancel: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createButtons();

    // 处理 touchcancel（来电、系统手势等导致触控中断）
    this.onPointerCancel = (pointer: Phaser.Input.Pointer) => {
      const name = this.pointerMap.get(pointer.id);
      if (name) {
        this.pointerMap.delete(pointer.id);
        this.activateButton(name, false);
      }
    };
    this.scene.input.on('pointercancel', this.onPointerCancel);
  }

  get jumpPressed(): boolean {
    return this._jumpJustPressed;
  }

  /** 每帧结束时清除单帧标记 */
  update(): void {
    this._jumpJustPressed = false;
    this.pausePressed = false;
  }

  private createButtons(): void {
    // ← 左方向键
    this.leftGraphics = this.createArrowButton(70, GAME_HEIGHT - 60, true);
    this.createZone(70, GAME_HEIGHT - 60, 90, 90, 'left');

    // → 右方向键
    this.rightGraphics = this.createArrowButton(170, GAME_HEIGHT - 60, false);
    this.createZone(170, GAME_HEIGHT - 60, 90, 90, 'right');

    // 跳跃按钮（右下角圆形）
    this.jumpGraphics = this.createJumpButton(GAME_WIDTH - 80, GAME_HEIGHT - 80);
    this.createZone(GAME_WIDTH - 80, GAME_HEIGHT - 80, 110, 110, 'jump');

    // 暂停按钮（右上角，加大触控区域）
    this.pauseGraphics = this.createPauseButton(GAME_WIDTH - 30, 30);
    this.createZone(GAME_WIDTH - 30, 30, 70, 70, 'pause');
  }

  private createArrowButton(
    x: number,
    y: number,
    flipX: boolean
  ): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    // 像素风箭头
    g.fillStyle(0xffffff);
    if (flipX) {
      // ← 箭头
      g.fillTriangle(-20, 0, 10, -18, 10, 18);
      g.fillRect(10, -8, 10, 16);
    } else {
      // → 箭头
      g.fillTriangle(20, 0, -10, -18, -10, 18);
      g.fillRect(-20, -8, 10, 16);
    }

    g.setDepth(1000);
    g.setScrollFactor(0);
    return g;
  }

  private createJumpButton(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    // 圆形 + 向上箭头
    g.lineStyle(3, 0xffffff);
    g.strokeCircle(0, 0, 40);
    g.fillStyle(0xffffff);
    g.fillTriangle(0, -18, -14, 6, 14, 6);
    g.fillRect(-5, 4, 10, 14);

    g.setDepth(1000);
    g.setScrollFactor(0);
    return g;
  }

  private createPauseButton(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    // 暂停图标（两条竖线）
    g.fillStyle(0xffffff);
    g.fillRect(-8, -10, 5, 20);
    g.fillRect(3, -10, 5, 20);

    g.setDepth(1000);
    g.setScrollFactor(0);
    return g;
  }

  private createZone(
    x: number,
    y: number,
    w: number,
    h: number,
    name: string
  ): void {
    const zone = this.scene.add.zone(x, y, w, h);
    zone.setInteractive();
    zone.setDepth(1001);
    zone.setScrollFactor(0);
    this.zones.push(zone);

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerMap.set(pointer.id, name);
      this.activateButton(name, true);
    });

    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerMap.get(pointer.id) === name) {
        this.pointerMap.delete(pointer.id);
        this.activateButton(name, false);
      }
    });

    zone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerMap.get(pointer.id) === name) {
        this.pointerMap.delete(pointer.id);
        this.activateButton(name, false);
      }
    });
  }

  private activateButton(name: string, active: boolean): void {
    switch (name) {
      case 'left':
        this.left = active;
        this.leftGraphics.setAlpha(active ? 0.6 : 0.3);
        break;
      case 'right':
        this.right = active;
        this.rightGraphics.setAlpha(active ? 0.6 : 0.3);
        break;
      case 'jump':
        this.jumpHeld = active;
        if (active) this._jumpJustPressed = true;
        this.jumpGraphics.setAlpha(active ? 0.6 : 0.3);
        break;
      case 'pause':
        if (active) this.pausePressed = true;
        this.pauseGraphics.setAlpha(active ? 0.6 : 0.3);
        break;
    }
  }

  destroy(): void {
    this.scene.input.off('pointercancel', this.onPointerCancel);
    this.zones.forEach((z) => z.destroy());
    this.zones = [];
    this.leftGraphics?.destroy();
    this.rightGraphics?.destroy();
    this.jumpGraphics?.destroy();
    this.pauseGraphics?.destroy();
    this.pointerMap.clear();
  }
}
