// 史莱姆：地面巡逻敌人，可被踩杀

import Phaser from 'phaser';
import { Enemy, EnemyState } from '../Enemy';
import { ENEMY, COLORS } from '../../data/PAConstants';

export class Slime extends Enemy {
  private patrolRange: number;
  private startX: number;
  private wasOnGround = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = 'slime_sprite';
    if (!scene.textures.exists(key)) {
      Slime.createTexture(scene, key);
    }
    super(scene, x, y, key, ENEMY.SLIME_HEALTH, ENEMY.SLIME_SPEED, 200, true);

    this.startX = x;
    this.patrolRange = 100;
    this.aiState = EnemyState.PATROL;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 18);
    body.setOffset(4, 14);
    body.setBounceX(1);
  }

  static createTexture(scene: Phaser.Scene, key: string): void {
    const g = scene.add.graphics();
    // 身体（椭圆形）
    g.fillStyle(COLORS.SLIME);
    g.fillEllipse(16, 22, 28, 18);
    // 高光
    g.fillStyle(0x66ee66);
    g.fillEllipse(12, 18, 8, 6);
    // 眼睛
    g.fillStyle(0xffffff);
    g.fillCircle(11, 18, 3);
    g.fillCircle(21, 18, 3);
    g.fillStyle(0x000000);
    g.fillCircle(12, 19, 1.5);
    g.fillCircle(22, 19, 1.5);

    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  protected onIdle(): void {
    this.aiState = EnemyState.PATROL;
  }

  protected onPatrol(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // 边缘检测：只在刚离开地面的第一帧转向，防止空中每帧反复翻转
    if (this.wasOnGround && !onGround) {
      this.direction *= -1;
      body.setVelocityX(this.speed * this.direction);
      this.setFlipX(this.direction < 0);
    }
    this.wasOnGround = onGround;

    if (!onGround) return;

    // 遇到墙壁或到达巡逻范围边缘时转向
    if (body.blocked.left || this.x <= this.startX - this.patrolRange) {
      this.direction = 1;
    } else if (body.blocked.right || this.x >= this.startX + this.patrolRange) {
      this.direction = -1;
    }

    body.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
  }

  protected onHit(): void {
    // 受击暂停移动
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }
}

// Boss 史莱姆：关卡3最终 Boss，体型更大、血量更高
export class BossSlime extends Enemy {
  private patrolRange: number;
  private startX: number;
  private jumpTimer = 2000;
  private wasOnGround = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = 'boss_slime_sprite';
    if (!scene.textures.exists(key)) {
      BossSlime.createTexture(scene, key);
    }
    super(
      scene, x, y, key,
      ENEMY.BOSS_HEALTH,
      ENEMY.BOSS_SPEED,
      1000,
      true
    );

    this.startX = x;
    this.patrolRange = 150;
    this.aiState = EnemyState.PATROL;
    this.setScale(ENEMY.BOSS_SCALE);

    // setScale 后 setSize 在未缩放空间操作，Phaser 会自动乘以 scale
    // 所以保持与普通 Slime 一致的 body 尺寸即可
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 18);
    body.setOffset(4, 14);
  }

  static createTexture(scene: Phaser.Scene, key: string): void {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.BOSS);
    g.fillEllipse(16, 22, 28, 18);
    g.fillStyle(0x33aa33);
    g.fillEllipse(12, 18, 8, 6);
    // 怒目
    g.fillStyle(0xff0000);
    g.fillCircle(11, 18, 3);
    g.fillCircle(21, 18, 3);
    g.fillStyle(0x000000);
    g.fillCircle(12, 19, 2);
    g.fillCircle(22, 19, 2);

    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  protected onIdle(): void {
    this.aiState = EnemyState.PATROL;
  }

  protected onPatrol(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // 边缘检测：只在刚离开地面的第一帧转向（跳跃中不触发）
    if (this.wasOnGround && !onGround && body.velocity.y >= 0) {
      this.direction *= -1;
    }
    this.wasOnGround = onGround;

    if (body.blocked.left || this.x <= this.startX - this.patrolRange) {
      this.direction = 1;
    } else if (body.blocked.right || this.x >= this.startX + this.patrolRange) {
      this.direction = -1;
    }

    body.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);

    // Boss 定期跳跃
    if (time > this.jumpTimer && body.blocked.down) {
      body.setVelocityY(-300);
      this.jumpTimer = time + 2000;
    }
  }

  protected onHit(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }
}
