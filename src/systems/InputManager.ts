// 输入抽象层，统一处理键盘输入

import Phaser from 'phaser';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private jumpKey: Phaser.Input.Keyboard.Key;
  private pauseKey: Phaser.Input.Keyboard.Key;
  private debugKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.jumpKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pauseKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
  }

  get left(): boolean {
    return this.cursors.left.isDown || this.wasd.left.isDown;
  }

  get right(): boolean {
    return this.cursors.right.isDown || this.wasd.right.isDown;
  }

  get up(): boolean {
    return this.cursors.up.isDown || this.wasd.up.isDown;
  }

  get jumpPressed(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKey)
    );
  }

  get jumpHeld(): boolean {
    return this.cursors.up.isDown || this.wasd.up.isDown || this.jumpKey.isDown;
  }

  get pausePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.pauseKey);
  }

  get debugPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.debugKey);
  }
}
