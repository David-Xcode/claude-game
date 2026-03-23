// 射击游戏移动端触控系统：虚拟摇杆 + 自动开火 + 炸弹按钮
// 下半屏拖拽控制方向，自动射击无需火力按钮
// 支持多点触控

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

/** 摇杆死区半径（低于此值不产生方向输入） */
const JOYSTICK_DEAD_ZONE = 12;
/** 摇杆最大半径（超过此值方向值仍为 1） */
const JOYSTICK_MAX_RADIUS = 60;
/** 摇杆指示器大小 */
const JOYSTICK_BASE_RADIUS = 40;
const JOYSTICK_KNOB_RADIUS = 18;

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
    this.joystickBase.setAlpha(0);

    this.joystickKnob = scene.add.graphics();
    this.joystickKnob.setDepth(1001);
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

  destroy(): void {
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

    // 底座：半透明圆环
    this.joystickBase.clear();
    this.joystickBase.lineStyle(2, 0xffffff, 0.4);
    this.joystickBase.strokeCircle(0, 0, JOYSTICK_BASE_RADIUS);
    this.joystickBase.fillStyle(0xffffff, 0.08);
    this.joystickBase.fillCircle(0, 0, JOYSTICK_BASE_RADIUS);

    // 摇杆头：实心小圆
    this.joystickKnob.clear();
    this.joystickKnob.fillStyle(0xffffff, 0.5);
    this.joystickKnob.fillCircle(0, 0, JOYSTICK_KNOB_RADIUS);
  }

  // ═══════════════════════════════════════════════
  // 炸弹按钮
  // ═══════════════════════════════════════════════

  private createBombButton(): void {
    const bx = GAME_WIDTH - 80;
    const by = 22;

    this.bombButton = this.scene.add.graphics();
    this.bombButton.setPosition(bx, by);
    this.bombButton.setDepth(1000);
    this.bombButton.setAlpha(0.4);

    // 炸弹图标：圆 + 引信
    this.bombButton.fillStyle(0xffcc00);
    this.bombButton.fillCircle(0, 2, 10);
    this.bombButton.lineStyle(2, 0xff6600);
    this.bombButton.lineBetween(0, -8, 3, -14);

    // "B" 文字标记
    this.bombButton.fillStyle(0x000000);
    this.bombButton.fillRect(-3, -2, 6, 8);

    // 触控热区
    this.bombZone = this.scene.add.zone(bx, by, 50, 50);
    this.bombZone.setInteractive();
    this.bombZone.setDepth(1001);

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
    if (pointer.y < GAME_HEIGHT * 0.4) return;

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

    const dx = pointer.x - this.joystickOriginX;
    const dy = pointer.y - this.joystickOriginY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 更新摇杆头位置（限制在最大半径内）
    if (this.joystickKnob) {
      const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
      const angle = Math.atan2(dy, dx);
      this.joystickKnob.setPosition(
        this.joystickOriginX + Math.cos(angle) * clampedDist,
        this.joystickOriginY + Math.sin(angle) * clampedDist
      );
    }

    // 判断方向
    if (dist < JOYSTICK_DEAD_ZONE) {
      this.left = false;
      this.right = false;
      this.up = false;
      this.down = false;
      return;
    }

    const angle = Math.atan2(dy, dx);

    // 水平方向
    this.left = dx < -JOYSTICK_DEAD_ZONE;
    this.right = dx > JOYSTICK_DEAD_ZONE;

    // 垂直方向
    this.up = dy < -JOYSTICK_DEAD_ZONE;
    this.down = dy > JOYSTICK_DEAD_ZONE;
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
