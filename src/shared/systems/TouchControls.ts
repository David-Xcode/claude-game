// 虚拟触控按钮系统：在 HUD 层创建半透明方向键和跳跃按钮
// 支持多点触控，暴露与 InputManager 相同的布尔接口
// 按钮尺寸/位置根据 layout.uiScale 和安全区动态缩放

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';

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

    // 窗口 resize 时重建按钮（安全区和缩放可能变化）
    this.scene.scale.on('resize', this.repositionControls, this);
  }

  get jumpPressed(): boolean {
    return this._jumpJustPressed;
  }

  /** 每帧结束时清除单帧标记 */
  update(): void {
    this._jumpJustPressed = false;
    this.pausePressed = false;
  }

  /** 销毁并重建所有按钮，适配新尺寸 */
  private repositionControls(): void {
    // 销毁旧的视觉和触控元素
    this.zones.forEach((z) => z.destroy());
    this.zones = [];
    this.leftGraphics?.destroy();
    this.rightGraphics?.destroy();
    this.jumpGraphics?.destroy();
    this.pauseGraphics?.destroy();
    this.pointerMap.clear();

    // 重置触控状态，避免残留按压
    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this._jumpJustPressed = false;

    // 以新尺寸重建
    this.createButtons();
  }

  private createButtons(): void {
    // 计算安全区偏移后的按钮位置
    const leftX = layout.safeLeft + layout.scale(70);
    const bottomY = layout.height - layout.safeBottom - layout.scale(60);
    const rightX = layout.safeLeft + layout.scale(170);
    const jumpX = layout.width - layout.safeRight - layout.scale(80);
    const jumpY = layout.height - layout.safeBottom - layout.scale(80);
    const pauseX = layout.width - layout.safeRight - layout.scale(30);
    const pauseY = layout.safeTop + layout.scale(30);

    // ← 左方向键
    this.leftGraphics = this.createArrowButton(leftX, bottomY, true);
    this.createZone(leftX, bottomY, layout.scale(90, 44), layout.scale(90, 44), 'left');

    // → 右方向键
    this.rightGraphics = this.createArrowButton(rightX, bottomY, false);
    this.createZone(rightX, bottomY, layout.scale(90, 44), layout.scale(90, 44), 'right');

    // 跳跃按钮（右下角圆形）
    this.jumpGraphics = this.createJumpButton(jumpX, jumpY);
    this.createZone(jumpX, jumpY, layout.scale(110, 44), layout.scale(110, 44), 'jump');

    // 暂停按钮（右上角，加大触控区域）
    this.pauseGraphics = this.createPauseButton(pauseX, pauseY);
    this.createZone(pauseX, pauseY, layout.scale(70, 44), layout.scale(70, 44), 'pause');
  }

  private createArrowButton(
    x: number,
    y: number,
    flipX: boolean
  ): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    const s = layout.uiScale;

    // 像素风箭头（按 uiScale 缩放图形尺寸）
    g.fillStyle(0xffffff);
    if (flipX) {
      // ← 箭头
      g.fillTriangle(-20 * s, 0, 10 * s, -18 * s, 10 * s, 18 * s);
      g.fillRect(10 * s, -8 * s, 10 * s, 16 * s);
    } else {
      // → 箭头
      g.fillTriangle(20 * s, 0, -10 * s, -18 * s, -10 * s, 18 * s);
      g.fillRect(-20 * s, -8 * s, 10 * s, 16 * s);
    }

    g.setDepth(1000);
    g.setScrollFactor(0);
    return g;
  }

  private createJumpButton(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    const s = layout.uiScale;

    // 圆形 + 向上箭头（按 uiScale 缩放）
    g.lineStyle(3 * s, 0xffffff);
    g.strokeCircle(0, 0, 40 * s);
    g.fillStyle(0xffffff);
    g.fillTriangle(0, -18 * s, -14 * s, 6 * s, 14 * s, 6 * s);
    g.fillRect(-5 * s, 4 * s, 10 * s, 14 * s);

    g.setDepth(1000);
    g.setScrollFactor(0);
    return g;
  }

  private createPauseButton(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.setPosition(x, y);
    g.setAlpha(0.3);

    const s = layout.uiScale;

    // 暂停图标（两条竖线，按 uiScale 缩放）
    g.fillStyle(0xffffff);
    g.fillRect(-8 * s, -10 * s, 5 * s, 20 * s);
    g.fillRect(3 * s, -10 * s, 5 * s, 20 * s);

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
    this.scene.scale.off('resize', this.repositionControls, this);
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
