// 玩家飞船：Claude 吉祥物坐在太空战机上，8 方向移动、武器射击、受伤无敌

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';
import { SHOOTER, SHOOTER_COLORS, SHOOTER_DEPTH, WeaponType } from '../data/ShooterConstants';
import { BulletPool } from '../systems/BulletPool';
import { ShooterWeaponSystem } from '../systems/ShooterWeaponSystem';
import type { ShooterInputState } from '../systems/ShooterInputManager';

// ═══════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════

const TEXTURE_SIZE = 48;
const ENGINE_TOGGLE_INTERVAL = 100; // 引擎火焰切换间隔（毫秒）
const HALF_WIDTH = 20;   // 碰撞体半宽（略小于纹理，更公平）
const HALF_HEIGHT = 20;  // 碰撞体半高

export class ShooterPlayer extends Phaser.Physics.Arcade.Sprite {
  /** WaveManager 用此标记定位玩家精灵 */
  public readonly isShooterPlayer = true;

  // 状态属性
  public health: number = SHOOTER.MAX_HEALTH;
  public bombs: number = SHOOTER.MAX_BOMBS;

  private _isAlive = true;
  private _isInvincible = false;
  private isDying = false;

  // 系统引用
  public weaponSystem: ShooterWeaponSystem;
  private bulletPool: BulletPool;

  // 引擎火焰动画
  private engineFlame!: Phaser.GameObjects.Sprite;
  private lastEngineToggle = 0;
  private engineFrame = 1; // 1 或 2

  // 事件回调
  public onDamage?: () => void;
  public onDeath?: () => void;
  public onHeal?: () => void;
  public onBombChange?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool
  ) {
    // 确保纹理已生成
    if (!scene.textures.exists('shooter_player')) {
      ShooterPlayer.createTextures(scene);
    }

    super(scene, x, y, 'shooter_player');

    this.bulletPool = bulletPool;
    this.weaponSystem = new ShooterWeaponSystem(scene);

    // 加入场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(SHOOTER_DEPTH.PLAYER);

    // 物理体设置
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(HALF_WIDTH * 2, HALF_HEIGHT * 2);
    body.setOffset(
      (TEXTURE_SIZE - HALF_WIDTH * 2) / 2,
      (TEXTURE_SIZE - HALF_HEIGHT * 2) / 2
    );
    body.setCollideWorldBounds(false);
    body.setAllowGravity(false);

    // 创建引擎火焰精灵（跟随玩家脚下）
    this.engineFlame = scene.add.sprite(x, y + 22, 'shooter_engine_1');
    this.engineFlame.setDepth(SHOOTER_DEPTH.PLAYER - 1);
  }

  // ═══════════════════════════════════════════════
  // 纹理生成
  // ═══════════════════════════════════════════════

  /** 生成玩家飞船所有纹理 */
  static createTextures(scene: Phaser.Scene): void {
    // 正面纹理
    ShooterPlayer.generateShipTexture(scene, 'shooter_player', 0);
    // 左倾纹理
    ShooterPlayer.generateShipTexture(scene, 'shooter_player_left', -2);
    // 右倾纹理
    ShooterPlayer.generateShipTexture(scene, 'shooter_player_right', 2);
    // 引擎火焰帧 1
    ShooterPlayer.generateEngineTexture(scene, 'shooter_engine_1', false);
    // 引擎火焰帧 2
    ShooterPlayer.generateEngineTexture(scene, 'shooter_engine_2', true);
  }

  /**
   * 绘制飞船纹理：Claude 身体 + 机体
   * @param tiltOffset 倾斜像素偏移（负 = 左倾，正 = 右倾）
   */
  private static generateShipTexture(
    scene: Phaser.Scene,
    key: string,
    tiltOffset: number
  ): void {
    const g = scene.add.graphics();
    const cx = TEXTURE_SIZE / 2; // 中心 x = 24
    const tilt = tiltOffset;

    // ═══ 飞船机体 ═══

    // 主机翼（梯形，从中间展开）
    g.fillStyle(SHOOTER_COLORS.SHIP_WING);
    g.fillTriangle(
      cx - 22 + tilt, 36,   // 左翼尖
      cx - 8 + tilt, 20,    // 左翼根
      cx - 8 + tilt, 36     // 左下
    );
    g.fillTriangle(
      cx + 22 + tilt, 36,   // 右翼尖
      cx + 8 + tilt, 20,    // 右翼根
      cx + 8 + tilt, 36     // 右下
    );

    // 机身主体（梯形 → 圆角矩形模拟）
    g.fillStyle(SHOOTER_COLORS.SHIP_HULL);
    g.fillRoundedRect(cx - 10 + tilt, 14, 20, 28, 4);

    // 机头（三角形尖端）
    g.fillStyle(SHOOTER_COLORS.SHIP_HULL);
    g.fillTriangle(
      cx + tilt, 6,         // 尖端
      cx - 8 + tilt, 18,    // 左肩
      cx + 8 + tilt, 18     // 右肩
    );

    // 机身高光线（中央金属质感）
    g.fillStyle(0x6688cc, 0.4);
    g.fillRect(cx - 1 + tilt, 10, 2, 26);

    // 机翼末端引擎口（小方块）
    g.fillStyle(0x333344);
    g.fillRect(cx - 22 + tilt, 34, 5, 4);
    g.fillRect(cx + 17 + tilt, 34, 5, 4);

    // ═══ Claude 身体（坐在驾驶舱上方）═══

    const bodyColor = SHOOTER_COLORS.PLAYER_BODY; // 0xc27462 珊瑚色
    const bodyDark = 0xaa6455;
    const eyeColor = 0x5c3a36;

    // 身体（圆角矩形，缩小版）
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 7 + tilt, 10, 14, 11, 3);

    // 身体底部暗面
    g.fillStyle(bodyDark);
    g.fillRoundedRect(cx - 7 + tilt, 16, 14, 5, { tl: 0, tr: 0, bl: 3, br: 3 });

    // 眼睛（两个小竖条）
    g.fillStyle(eyeColor);
    g.fillRect(cx - 4 + tilt, 12, 2, 4);  // 左眼
    g.fillRect(cx + 3 + tilt, 12, 2, 4);  // 右眼

    // 嘴巴
    g.fillRect(cx - 3 + tilt, 18, 6, 1);

    // 驾驶舱玻璃罩（半透明弧形覆盖在 Claude 前方）
    g.fillStyle(0x88bbff, 0.25);
    g.fillRoundedRect(cx - 8 + tilt, 8, 16, 14, 5);

    g.generateTexture(key, TEXTURE_SIZE, TEXTURE_SIZE);
    g.destroy();
  }

  /** 生成引擎火焰纹理（两帧交替产生闪烁效果） */
  private static generateEngineTexture(
    scene: Phaser.Scene,
    key: string,
    isAlt: boolean
  ): void {
    const g = scene.add.graphics();
    const w = 24;
    const h = 14;
    const cx = w / 2;

    // 外焰（橙黄色）
    const outerColor = isAlt ? 0xff8800 : 0xff6600;
    g.fillStyle(outerColor, 0.8);
    const flameHeight = isAlt ? 12 : 10;
    g.fillTriangle(cx - 8, 0, cx, flameHeight, cx + 8, 0);

    // 内焰（亮黄/白色）
    const innerColor = isAlt ? 0xffcc44 : 0xffdd66;
    g.fillStyle(innerColor, 0.9);
    const innerHeight = isAlt ? 7 : 6;
    g.fillTriangle(cx - 4, 0, cx, innerHeight, cx + 4, 0);

    // 核心白点
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, 2, isAlt ? 2 : 1.5);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ═══════════════════════════════════════════════
  // 输入处理
  // ═══════════════════════════════════════════════

  /** 处理输入状态，更新速度和射击 */
  handleInput(input: ShooterInputState): void {
    if (!this._isAlive || this.isDying) return;

    // 8 方向移动
    let vx = 0;
    let vy = 0;

    if (input.left) vx = -1;
    if (input.right) vx = 1;
    if (input.up) vy = -1;
    if (input.down) vy = 1;

    // 对角线归一化（防止斜向移动更快）
    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2; // 1 / sqrt(2) ≈ 0.7071
      vx *= norm;
      vy *= norm;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      vx * SHOOTER.PLAYER_SPEED,
      vy * SHOOTER.PLAYER_SPEED
    );

    // 视觉倾斜
    if (vx < 0) {
      this.setTexture('shooter_player_left');
    } else if (vx > 0) {
      this.setTexture('shooter_player_right');
    } else {
      this.setTexture('shooter_player');
    }

    // 射击（自动开火 — 按住即连射）
    if (input.fire) {
      this.weaponSystem.tryFire(
        this.scene.time.now,
        this.x,
        this.y - 16, // 从飞船头部发射
        this.bulletPool
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 每帧更新
  // ═══════════════════════════════════════════════

  update(time: number, delta: number): void {
    if (!this._isAlive) return;

    // 限制在屏幕范围内
    this.clampToScreen();

    // 引擎火焰动画
    this.updateEngineFlame(time);
  }

  /** 将玩家限制在可视区域内 */
  private clampToScreen(): void {
    const halfW = HALF_WIDTH;
    const halfH = HALF_HEIGHT;

    if (this.x < halfW) this.x = halfW;
    if (this.x > layout.width - halfW) this.x = layout.width - halfW;
    if (this.y < halfH) this.y = halfH;
    if (this.y > layout.height - halfH) this.y = layout.height - halfH;
  }

  /** 更新引擎火焰：交替切换两帧纹理 */
  private updateEngineFlame(time: number): void {
    // 同步引擎火焰位置
    this.engineFlame.setPosition(this.x, this.y + 22);
    this.engineFlame.setVisible(this.visible);

    // 帧切换
    if (time - this.lastEngineToggle >= ENGINE_TOGGLE_INTERVAL) {
      this.lastEngineToggle = time;
      this.engineFrame = this.engineFrame === 1 ? 2 : 1;
      this.engineFlame.setTexture(`shooter_engine_${this.engineFrame}`);
    }
  }

  // ═══════════════════════════════════════════════
  // 伤害 & 死亡
  // ═══════════════════════════════════════════════

  /** 受伤：扣血 + 无敌闪烁 */
  takeDamage(amount: number = 1): void {
    if (this._isInvincible || !this._isAlive) return;

    this.health -= amount;
    this._isInvincible = true;

    this.onDamage?.();

    // 受伤闪烁效果
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        if (this.scene?.sys?.isActive()) {
          this.alpha = 1;
        }
      },
    });

    // 无敌时间结束
    this.scene.time.delayedCall(SHOOTER.INVINCIBLE_DURATION, () => {
      if (this.scene?.sys?.isActive()) {
        this._isInvincible = false;
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  /** 死亡：播放爆炸动画，禁用物理 */
  die(): void {
    if (this.isDying || !this._isAlive) return;

    this._isAlive = false;
    this.isDying = true;

    // 停止移动
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    // 隐藏引擎火焰
    this.engineFlame.setVisible(false);

    // 死亡动画：闪烁 + 缩小
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // 场景已销毁时跳过回调，防止访问无效对象
        if (!this.scene?.sys?.isActive()) return;
        this.setVisible(false);
        this.onDeath?.();
      },
    });
  }

  /** 回复生命值 */
  heal(amount: number = 1): void {
    this.health = Math.min(this.health + amount, SHOOTER.MAX_HEALTH);
    this.onHeal?.();
  }

  // ═══════════════════════════════════════════════
  // 炸弹
  // ═══════════════════════════════════════════════

  /** 增加炸弹（上限 MAX_BOMBS） */
  addBomb(): void {
    this.bombs = Math.min(this.bombs + 1, SHOOTER.MAX_BOMBS);
    this.onBombChange?.();
  }

  /** 使用炸弹，返回是否成功消耗 */
  useBomb(): boolean {
    if (this.bombs <= 0) return false;

    this.bombs--;
    this.onBombChange?.();
    return true;
  }

  // ═══════════════════════════════════════════════
  // 武器系统
  // ═══════════════════════════════════════════════

  /** 设置武器类型（升级/切换） */
  setWeapon(type: WeaponType): void {
    this.weaponSystem.upgrade(type);
  }

  /** 设置武器系统实例 */
  setWeaponSystem(ws: ShooterWeaponSystem): void {
    this.weaponSystem = ws;
  }

  /** 当前武器类型 */
  get currentWeapon(): WeaponType {
    return this.weaponSystem.type;
  }

  /** 当前武器等级 */
  get weaponLevel(): number {
    return this.weaponSystem.level;
  }

  // ═══════════════════════════════════════════════
  // 重生
  // ═══════════════════════════════════════════════

  /** 重生：恢复状态、移动到指定位置 */
  respawn(x: number, y: number): void {
    this._isAlive = true;
    this.isDying = false;
    this._isInvincible = true;
    this.health = SHOOTER.MAX_HEALTH;

    this.setPosition(x, y);
    this.setVisible(true);
    this.setActive(true);
    this.setAlpha(1);
    this.setScale(1);

    // 恢复物理
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocity(0, 0);

    // 恢复引擎火焰
    this.engineFlame.setVisible(true);

    // 武器重置为默认
    this.weaponSystem.reset();

    // 重生无敌时间（带闪烁提示）
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 150,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        if (this.scene?.sys?.isActive()) {
          this.alpha = 1;
        }
      },
    });

    this.scene.time.delayedCall(SHOOTER.INVINCIBLE_DURATION, () => {
      if (this.scene?.sys?.isActive()) {
        this._isInvincible = false;
      }
    });
  }

  // ═══════════════════════════════════════════════
  // Getter
  // ═══════════════════════════════════════════════

  get isAlive(): boolean {
    return this._isAlive;
  }

  get isInvincible(): boolean {
    return this._isInvincible;
  }

  /** 销毁时清理引擎火焰 */
  destroy(fromScene?: boolean): void {
    if (this.engineFlame) {
      this.engineFlame.destroy();
    }
    super.destroy(fromScene);
  }
}
