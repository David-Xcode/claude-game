// 射击游戏移动端触控系统：虚拟摇杆 + 自动开火 + 炸弹按钮
// 下半屏拖拽控制方向，自动射击无需火力按钮
// 支持多点触控；摇杆参数和按钮位置随 uiScale 缩放

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';

export class ShooterTouchControls {
  private scene: Phaser.Scene;

  // 方向状态
  left = false;
  right = false;
  up = false;
  down = false;

  // 动作状态（单帧标记，需要 update() 清除）
  private _bombJustPressed = false;
  private _pauseJustPressed = false;

  // 摇杆追踪
  private joystickPointerId: number = -1;
  private joystickOriginX = 0;
  private joystickOriginY = 0;

  // 视觉元素
  private joystickBase: Phaser.GameObjects.Graphics | null = null;
  private joystickKnob: Phaser.GameObjects.Graphics | null = null;
  private bombButton: Phaser.GameObjects.Graphics | null = null;
  private bombZone: Phaser.GameObjects.Zone | null = null;

  // 事件回调引用（用于销毁时精确解绑）
  private onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private onPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private onPointerUp: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 创建炸弹按钮（HUD 暂停按钮左边）
    this.createBombButton();

    // 创建摇杆底座（初始隐藏，触摸时显示）
    this.joystickBase = scene.add.graphics();
    this.joystickBase.setDepth(1000);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setAlpha(0);

    this.joystickKnob = scene.add.graphics();
    this.joystickKnob.setDepth(1001);
    this.joystickKnob.setScrollFactor(0);
    this.joystickKnob.setAlpha(0);

    this.drawJoystickVisuals();

    // 绑定全局触控事件（在 input 层级处理，不干扰其他 UI）
    this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    };
    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    };
    this.onPointerUp = (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    };

    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointercancel', this.onPointerUp);

    // 窗口 resize 时重建炸弹按钮（摇杆在触摸时动态创建，无需重建）
    this.scene.scale.on('resize', this.repositionControls, this);
  }

  get bombPressed(): boolean {
    return this._bombJustPressed;
  }

  get pausePressed(): boolean {
    return this._pauseJustPressed;
  }

  /** 每帧结束时清除单帧标记 */
  update(): void {
    this._bombJustPressed = false;
    this._pauseJustPressed = false;
  }

  /** 销毁并重建炸弹按钮 + 摇杆视觉，适配新尺寸 */
  private repositionControls(): void {
    // 销毁旧的炸弹按钮
    this.bombButton?.destroy();
    this.bombZone?.destroy();
    this.bombButton = null;
    this.bombZone = null;

    // 重建炸弹按钮
    this.createBombButton();

    // 重绘摇杆视觉（尺寸可能变化）
    this.drawJoystickVisuals();
  }

  destroy(): void {
    this.scene.scale.off('resize', this.repositionControls, this);
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointercancel', this.onPointerUp);

    this.joystickBase?.destroy();
    this.joystickKnob?.destroy();
    this.bombButton?.destroy();
    this.bombZone?.destroy();

    this.joystickBase = null;
    this.joystickKnob = null;
    this.bombButton = null;
    this.bombZone = null;
  }

  // ═══════════════════════════════════════════════
  // 摇杆绘制
  // ═══════════════════════════════════════════════

  private drawJoystickVisuals(): void {
    if (!this.joystickBase || !this.joystickKnob) return;

    const s = layout.uiScale;

    // 底座：半透明圆环（按 uiScale 缩放半径）
    this.joystickBase.clear();
    this.joystickBase.lineStyle(2 * s, 0xffffff, 0.4);
    this.joystickBase.strokeCircle(0, 0, 40 * s);
    this.joystickBase.fillStyle(0xffffff, 0.08);
    this.joystickBase.fillCircle(0, 0, 40 * s);

    // 摇杆头：实心小圆（按 uiScale 缩放半径）
    this.joystickKnob.clear();
    this.joystickKnob.fillStyle(0xffffff, 0.5);
    this.joystickKnob.fillCircle(0, 0, 18 * s);
  }

  // ═══════════════════════════════════════════════
  // 炸弹按钮
  // ═══════════════════════════════════════════════

  private createBombButton(): void {
    const bx = layout.width - layout.safeRight - layout.scale(80);
    const by = layout.safeTop + layout.scale(22);

    const s = layout.uiScale;

    this.bombButton = this.scene.add.graphics();
    this.bombButton.setPosition(bx, by);
    this.bombButton.setDepth(1000);
    this.bombButton.setScrollFactor(0);
    this.bombButton.setAlpha(0.4);

    // 炸弹图标：圆 + 引信（按 uiScale 缩放）
    this.bombButton.fillStyle(0xffcc00);
    this.bombButton.fillCircle(0, 2 * s, 10 * s);
    this.bombButton.lineStyle(2 * s, 0xff6600);
    this.bombButton.lineBetween(0, -8 * s, 3 * s, -14 * s);

    // "B" 文字标记（按 uiScale 缩放）
    this.bombButton.fillStyle(0x000000);
    this.bombButton.fillRect(-3 * s, -2 * s, 6 * s, 8 * s);

    // 触控热区（最小 44px，符合 Apple HIG）
    const hitSize = layout.scale(50, 44);
    this.bombZone = this.scene.add.zone(bx, by, hitSize, hitSize);
    this.bombZone.setInteractive();
    this.bombZone.setDepth(1001);
    this.bombZone.setScrollFactor(0);

    this.bombZone.on('pointerdown', () => {
      this._bombJustPressed = true;
      this.bombButton?.setAlpha(0.8);
    });
    this.bombZone.on('pointerup', () => {
      this.bombButton?.setAlpha(0.4);
    });
    this.bombZone.on('pointerout', () => {
      this.bombButton?.setAlpha(0.4);
    });
  }

  // ═══════════════════════════════════════════════
  // 触控事件处理
  // ═══════════════════════════════════════════════

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // 只在屏幕下半部分启用摇杆（避免与 HUD 冲突）
    if (pointer.y < layout.height * 0.4) return;

    // 如果还没有摇杆绑定，绑定这根手指
    if (this.joystickPointerId === -1) {
      this.joystickPointerId = pointer.id;
      this.joystickOriginX = pointer.x;
      this.joystickOriginY = pointer.y;

      // 显示摇杆
      if (this.joystickBase && this.joystickKnob) {
        this.joystickBase.setPosition(pointer.x, pointer.y);
        this.joystickBase.setAlpha(1);
        this.joystickKnob.setPosition(pointer.x, pointer.y);
        this.joystickKnob.setAlpha(1);
      }
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) return;

    const s = layout.uiScale;
    const deadZone = 12 * s;
    const maxRadius = 60 * s;

    const dx = pointer.x - this.joystickOriginX;
    const dy = pointer.y - this.joystickOriginY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 更新摇杆头位置（限制在最大半径内）
    if (this.joystickKnob) {
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      this.joystickKnob.setPosition(
        this.joystickOriginX + Math.cos(angle) * clampedDist,
        this.joystickOriginY + Math.sin(angle) * clampedDist
      );
    }

    // 判断方向
    if (dist < deadZone) {
      this.left = false;
      this.right = false;
      this.up = false;
      this.down = false;
      return;
    }

    // 水平方向
    this.left = dx < -deadZone;
    this.right = dx > deadZone;

    // 垂直方向
    this.up = dy < -deadZone;
    this.down = dy > deadZone;
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) return;

    this.joystickPointerId = -1;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;

    // 隐藏摇杆
    if (this.joystickBase) this.joystickBase.setAlpha(0);
    if (this.joystickKnob) this.joystickKnob.setAlpha(0);
  }
}
