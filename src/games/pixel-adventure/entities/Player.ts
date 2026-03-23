// 玩家角色：核心移动、跳跃、受伤逻辑
// 实现了马里奥式的手感机制：可变跳跃高度、Coyote Time、Jump Buffer

import Phaser from 'phaser';
import { InputManager } from '@shared/systems/InputManager';
import { PLAYER, DEPTH } from '@shared/utils/Constants';
import { PlayerConfig, DEFAULT_PLAYER_CONFIG } from '@games/pixel-adventure/data/PlayerConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private config: PlayerConfig;
  private inputMgr: InputManager;

  // 状态
  public health: number;
  public lives: number;
  public score = 0;
  private isInvincible = false;
  private isDead = false;

  // 跳跃机制
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private isJumping = false;
  private wasGrounded = false;

  // 事件回调
  public onDamage?: () => void;
  public onDeath?: () => void;
  public onHeal?: () => void;
  public onScoreChange?: () => void;
  public onLivesChange?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    input: InputManager,
    config: PlayerConfig = DEFAULT_PLAYER_CONFIG
  ) {
    // 创建双纹理：idle（眼睛居中）和 moving（眼睛偏移）
    if (!scene.textures.exists('player_idle')) {
      Player.createPlayerTextures(scene);
    }
    super(scene, x, y, 'player_idle');

    this.config = config;
    this.inputMgr = input;
    this.health = config.maxHealth;
    this.lives = config.maxLives;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.PLAYER);

    // 物理属性设置（精确匹配可见区域：身体 y2~y22 + 腿 y22~y28）
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 26);
    body.setOffset(2, 2);
    body.setMaxVelocityX(config.speed);
    body.setCollideWorldBounds(false);

    // 创建闪烁动画（受伤无敌时使用）
  }

  // 生成 Claude Code 吉祥物双纹理：idle（眼睛居中）+ moving（眼睛偏右）
  static createPlayerTextures(scene: Phaser.Scene): void {
    // idle 纹理：眼睛居中
    const gIdle = scene.add.graphics();
    Player.drawClaudeBody(gIdle, 0);
    gIdle.generateTexture('player_idle', 32, 32);
    gIdle.destroy();

    // moving 纹理：眼睛向右偏移 2px（配合 setFlipX 实现左右看）
    const gMove = scene.add.graphics();
    Player.drawClaudeBody(gMove, 2);
    gMove.generateTexture('player_moving', 32, 32);
    gMove.destroy();
  }

  // 绘制 Claude 吉祥物身体（eyeOffsetX 控制眼睛水平偏移）
  private static drawClaudeBody(
    g: Phaser.GameObjects.Graphics,
    eyeOffsetX: number
  ): void {
    const bodyColor = 0xc27462;    // 珊瑚色主体
    const bodyDark = 0xaa6455;     // 身体暗面（腿 + 身体底部）
    const eyeMouth = 0x5c3a36;     // 眼睛和嘴巴

    // === 身体：宽扁圆角矩形 ===
    g.fillStyle(bodyColor);
    g.fillRoundedRect(2, 2, 28, 20, 5);

    // 身体底部暗色（渐变感）
    g.fillStyle(bodyDark);
    g.fillRoundedRect(2, 14, 28, 8, { tl: 0, tr: 0, bl: 5, br: 5 });

    // === 眼睛：两个竖长矩形（Claude 标志性特征）===
    g.fillStyle(eyeMouth);
    g.fillRect(9 + eyeOffsetX, 7, 3, 6);   // 左眼
    g.fillRect(20 + eyeOffsetX, 7, 3, 6);  // 右眼

    // === 嘴巴：宽横线 ===
    g.fillRect(10, 17, 12, 2);

    // === 4 条小短腿 ===
    g.fillStyle(bodyDark);
    g.fillRect(5, 22, 4, 6);   // 腿1
    g.fillRect(11, 22, 4, 6);  // 腿2
    g.fillRect(17, 22, 4, 6);  // 腿3
    g.fillRect(23, 22, 4, 6);  // 腿4

    // === 2 只手臂（身体两侧）===
    g.fillStyle(bodyColor);
    g.fillRect(0, 10, 3, 6);   // 左手臂
    g.fillRect(29, 10, 3, 6);  // 右手臂
  }

  update(delta: number): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    this.handleMovement(body);
    this.handleJump(body, onGround, delta);
    this.handleFacing(body);

    // 掉落检测
    if (this.y > (this.scene as any).levelHeight + 100) {
      this.die();
    }

    this.wasGrounded = onGround;
  }

  private handleMovement(body: Phaser.Physics.Arcade.Body): void {
    // 加速/减速移动（非瞬移），提供重量感
    if (this.inputMgr.left) {
      body.setAccelerationX(-PLAYER.ACCELERATION);
      body.setDragX(0); // 移动时清除拖拽，避免与加速冲突
    } else if (this.inputMgr.right) {
      body.setAccelerationX(PLAYER.ACCELERATION);
      body.setDragX(0);
    } else {
      // 减速停止
      body.setAccelerationX(0);
      body.setDragX(PLAYER.DECELERATION);
    }
  }

  private handleJump(
    body: Phaser.Physics.Arcade.Body,
    onGround: boolean,
    delta: number
  ): void {
    // Coyote Time：离开平台边缘后短时间内仍可跳跃
    if (onGround) {
      this.coyoteTimer = PLAYER.COYOTE_TIME;
      this.isJumping = false;
    } else {
      this.coyoteTimer -= delta;
    }

    // Jump Buffer：落地前按跳跃键会自动在落地时触发跳跃
    if (this.inputMgr.jumpPressed) {
      this.jumpBufferTimer = PLAYER.JUMP_BUFFER;
    } else {
      this.jumpBufferTimer -= delta;
    }

    // 执行跳跃（满足 Coyote Time 或 Jump Buffer 任一条件）
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(this.config.jumpForce);
      this.isJumping = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // 可变跳跃高度：松开跳跃键时截断上升速度
    if (this.isJumping && !this.inputMgr.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
      this.isJumping = false;
    }
  }

  private handleFacing(body: Phaser.Physics.Arcade.Body): void {
    const isMoving = Math.abs(body.velocity.x) > 10;

    // 翻转精灵朝向
    if (body.velocity.x < -10) {
      this.setFlipX(true);
    } else if (body.velocity.x > 10) {
      this.setFlipX(false);
    }

    // 切换纹理：移动时眼睛看向移动方向，静止时眼睛居中
    const target = isMoving ? 'player_moving' : 'player_idle';
    if (this.texture.key !== target) {
      this.setTexture(target);
    }
  }

  // 踩踏敌人后弹跳
  bounce(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(PLAYER.BOUNCE_FORCE);
  }

  takeDamage(amount = 1): void {
    if (this.isInvincible || this.isDead) return;

    this.health -= amount;
    this.isInvincible = true;
    this.onDamage?.();

    // 受伤闪烁效果（纯视觉，与无敌时间解耦）
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        this.alpha = 1;
      },
    });

    // 无敌时间由常量精确控制，与闪烁动画独立
    this.scene.time.delayedCall(PLAYER.INVINCIBLE_DURATION, () => {
      if (this.scene?.sys?.isActive()) {
        this.isInvincible = false;
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die(): void {
    if (this.isDead) return;
    this.isDead = true;

    this.lives--;
    this.onLivesChange?.();

    // 死亡动画：弹起后下落，禁用碰撞防止死后触发交互
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAcceleration(0);
    body.setVelocity(0, -300);
    body.checkCollision.none = true;
    this.setTint(0xff0000);

    this.scene.time.delayedCall(800, () => {
      if (this.scene?.sys?.isActive()) {
        this.onDeath?.();
      }
    });
  }

  heal(amount = 1): void {
    this.health = Math.min(this.health + amount, this.config.maxHealth);
    this.onHeal?.();
  }

  addScore(points: number): void {
    this.score += points;
    this.onScoreChange?.();
  }

  resetForNewLife(): void {
    this.isDead = false;
    this.isInvincible = false;
    this.health = this.config.maxHealth;
    this.alpha = 1;
    this.clearTint();
    // 恢复碰撞（die() 中禁用了）
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = false;
    }
  }

  get isAlive(): boolean {
    return !this.isDead;
  }

  get hasLives(): boolean {
    return this.lives > 0;
  }

  // V2 扩展点：武器系统
  // equipWeapon(weapon: WeaponConfig): void { }
  // fireWeapon(): void { }
}
