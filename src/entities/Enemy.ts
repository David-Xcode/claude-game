// 敌人基类：状态机驱动 (IDLE → PATROL → HIT → DEAD)

import Phaser from 'phaser';
import { DEPTH } from '../utils/Constants';

export enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  HIT = 'hit',
  DEAD = 'dead',
}

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected hp: number;
  protected speed: number;
  protected aiState: EnemyState = EnemyState.IDLE;
  protected direction = 1; // 1=右, -1=左
  protected scoreValue: number;
  public canBeStomp: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    health: number,
    speed: number,
    scoreValue: number,
    canBeStomp: boolean
  ) {
    super(scene, x, y, texture);
    this.hp = health;
    this.speed = speed;
    this.scoreValue = scoreValue;
    this.canBeStomp = canBeStomp;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENEMIES);
  }

  update(time: number, delta: number): void {
    if (this.aiState === EnemyState.DEAD) return;

    switch (this.aiState) {
      case EnemyState.IDLE:
        this.onIdle(time, delta);
        break;
      case EnemyState.PATROL:
        this.onPatrol(time, delta);
        break;
      case EnemyState.HIT:
        this.onHit(time, delta);
        break;
    }
  }

  protected abstract onIdle(time: number, delta: number): void;
  protected abstract onPatrol(time: number, delta: number): void;
  protected abstract onHit(time: number, delta: number): void;

  takeDamage(amount = 1): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    this.aiState = EnemyState.HIT;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (!this.active || !this.scene?.sys?.isActive()) return;
      this.clearTint();
      this.aiState = EnemyState.PATROL;
    });
    return false;
  }

  die(): void {
    this.aiState = EnemyState.DEAD;

    // 死亡动画：压扁后消失
    if (!this.scene?.sys?.isActive()) {
      this.destroy();
      return;
    }
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.1,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (this.active) this.destroy();
      },
    });
  }

  getScoreValue(): number {
    return this.scoreValue;
  }
}
