// 射击游戏输入管理器：扩展基础 InputManager，添加射击和炸弹键位
// 整合键盘 + ShooterTouchControls 两套输入源

import Phaser from 'phaser';
import { InputManager } from '@shared/systems/InputManager';
import { ShooterTouchControls } from './ShooterTouchControls';

/** 射击游戏每帧输入快照 */
export interface ShooterInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  bomb: boolean;
  pause: boolean;
}

export class ShooterInputManager extends InputManager {
  private fireKey: Phaser.Input.Keyboard.Key;
  private bombKey: Phaser.Input.Keyboard.Key;
  private shooterTouch?: ShooterTouchControls;

  constructor(scene: Phaser.Scene) {
    super(scene);

    const kb = scene.input.keyboard!;
    this.fireKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.bombKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.B);
  }

  /** 注入射击游戏专用触控控制（从 HUD 场景获取） */
  setShooterTouchControls(tc: ShooterTouchControls): void {
    this.shooterTouch = tc;
  }

  /** 射击始终自动开火（雷电风格标准操作） */
  get fireHeld(): boolean {
    return true;
  }

  /** 炸弹键是否刚按下 */
  get bombPressed(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.bombKey) ||
      (this.shooterTouch?.bombPressed ?? false)
    );
  }

  /**
   * 获取当前帧输入快照
   * 供 ShooterGameScene.update() 使用
   */
  getState(): ShooterInputState {
    return {
      left: this.left || (this.shooterTouch?.left ?? false),
      right: this.right || (this.shooterTouch?.right ?? false),
      up: this.up || (this.shooterTouch?.up ?? false),
      down: this.down || (this.shooterTouch?.down ?? false),
      fire: this.fireHeld,
      bomb: this.bombPressed,
      pause: this.pausePressed || (this.shooterTouch?.pausePressed ?? false),
    };
  }

  /** 每帧结束时清除单帧标记 */
  override update(): void {
    super.update();
    this.shooterTouch?.update();
  }
}
