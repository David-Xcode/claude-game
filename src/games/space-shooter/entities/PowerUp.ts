// 道具掉落：武器升级、炸弹、回血、分数奖励
// 缓慢下落 + 水平摆动 + 脉冲发光效果

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';
import { PowerUpType, SHOOTER_COLORS, SHOOTER_DEPTH } from '../data/ShooterConstants';

// ═══════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════

const POWERUP_SIZE = 16;
const DRIFT_SPEED = 60;          // 下落速度
const WOBBLE_AMPLITUDE = 20;     // 水平摆动幅度
const WOBBLE_SPEED = 0.003;      // 水平摆动速度
// 注意：不能在模块级用 layout.height 初始化常量，因为 layout 是动态值
// DESPAWN_Y 改为在 preUpdate 里直接使用 layout.height + 30

/** 每种道具的颜色映射 */
const TYPE_COLORS: Record<PowerUpType, number> = {
  [PowerUpType.WEAPON_VULCAN]: SHOOTER_COLORS.POWERUP_VULCAN,
  [PowerUpType.WEAPON_SPREAD]: SHOOTER_COLORS.POWERUP_SPREAD,
  [PowerUpType.WEAPON_LASER]: SHOOTER_COLORS.POWERUP_LASER,
  [PowerUpType.WEAPON_HOMING]: SHOOTER_COLORS.POWERUP_HOMING,
  [PowerUpType.BOMB]: SHOOTER_COLORS.POWERUP_BOMB,
  [PowerUpType.HEALTH]: SHOOTER_COLORS.POWERUP_HEALTH,
  [PowerUpType.SCORE_BONUS]: 0xffdd44,
};

/** 每种道具的标识字符 */
const TYPE_LABELS: Record<PowerUpType, string> = {
  [PowerUpType.WEAPON_VULCAN]: 'V',
  [PowerUpType.WEAPON_SPREAD]: 'S',
  [PowerUpType.WEAPON_LASER]: 'L',
  [PowerUpType.WEAPON_HOMING]: 'H',
  [PowerUpType.BOMB]: 'B',
  [PowerUpType.HEALTH]: '+',
  [PowerUpType.SCORE_BONUS]: '$',
};

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  /** 道具类型标识（供碰撞回调读取） */
  public powerUpType: PowerUpType;

  // 摆动计算
  private spawnX: number;
  private wobbleOffset: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    // 确保纹理已创建
    const textureKey = `powerup_${type}`;
    if (!scene.textures.exists(textureKey)) {
      PowerUp.createTextures(scene);
    }

    super(scene, x, y, textureKey);

    this.powerUpType = type;
    this.spawnX = x;
    this.wobbleOffset = Math.random() * Math.PI * 2; // 随机初始相位

    // 加入场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(SHOOTER_DEPTH.POWERUPS);

    // 物理设置
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, DRIFT_SPEED);
    body.setSize(POWERUP_SIZE, POWERUP_SIZE);

    // 脉冲发光动画（alpha 缓慢波动）
    scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.6 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ═══════════════════════════════════════════════
  // 纹理生成
  // ═══════════════════════════════════════════════

  /** 为所有道具类型生成纹理 */
  static createTextures(scene: Phaser.Scene): void {
    const allTypes = Object.values(PowerUpType) as PowerUpType[];

    for (const type of allTypes) {
      const key = `powerup_${type}`;
      if (scene.textures.exists(key)) continue;

      const color = TYPE_COLORS[type];
      const label = TYPE_LABELS[type];
      PowerUp.generateCapsuleTexture(scene, key, color, label);
    }
  }

  /**
   * 绘制胶囊形道具纹理
   * 背景胶囊 + 中心像素图标
   */
  private static generateCapsuleTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    label: string
  ): void {
    const size = POWERUP_SIZE;
    const padding = 2;
    const totalSize = size + padding * 2; // 20x20 含辉光边距
    const cx = totalSize / 2;
    const cy = totalSize / 2;

    const g = scene.add.graphics();

    // 外层辉光
    g.fillStyle(color, 0.3);
    g.fillRoundedRect(0, 0, totalSize, totalSize, 6);

    // 胶囊主体
    g.fillStyle(color, 1);
    g.fillRoundedRect(padding, padding, size, size, 4);

    // 内部暗色底色（增加对比度）
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(padding + 2, padding + 2, size - 4, size - 4, 3);

    // 高光（顶部弧形）
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(padding + 3, padding + 2, size - 6, 5, 2);

    // 中心图标（像素画，白色）
    g.fillStyle(0xffffff, 0.9);
    PowerUp.drawPixelIcon(g, cx, cy, label);

    g.generateTexture(key, totalSize, totalSize);
    g.destroy();
  }

  /** 用像素块绘制道具类型图标 */
  private static drawPixelIcon(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    label: string
  ): void {
    // 所有图标用 2x2 像素块组成，居中于 (cx, cy)
    const p = (dx: number, dy: number) => g.fillRect(cx + dx, cy + dy, 2, 2);

    switch (label) {
      case 'V': // 火神炮：V 形箭头
        p(-4, -3); p(4, -3);
        p(-3, -1); p(3, -1);
        p(-2, 1); p(2, 1);
        p(0, 3);
        break;
      case 'S': // 散弹：三条扇形线
        p(0, -4);
        p(-3, -2); p(0, -2); p(3, -2);
        p(-4, 0); p(0, 0); p(4, 0);
        break;
      case 'L': // 激光：竖线光束
        p(0, -4); p(0, -2); p(0, 0); p(0, 2);
        p(-2, 0); p(2, 0); // 中心横杠表示能量
        break;
      case 'H': // 追踪：十字准星
        p(0, -4); p(0, -2);
        p(-4, 0); p(-2, 0); p(2, 0); p(4, 0);
        p(0, 2); p(0, 4);
        break;
      case 'B': // 炸弹：圆形 + 引线
        p(-2, -1); p(0, -1); p(2, -1);
        p(-3, 1); p(3, 1);
        p(-2, 3); p(0, 3); p(2, 3);
        p(2, -3); // 引线
        break;
      case '+': // 回血：十字
        p(0, -3); p(0, -1); p(0, 1); p(0, 3);
        p(-3, 0); p(-1, 0); p(1, 0); p(3, 0);
        break;
      case '$': // 分数：星形
        p(0, -3);
        p(-2, -1); p(2, -1);
        p(-4, 0); p(4, 0);
        p(-2, 1); p(2, 1);
        p(0, 3);
        break;
    }
  }

  // ═══════════════════════════════════════════════
  // 每帧更新（Arcade Group 的 runChildUpdate 会调用）
  // ═══════════════════════════════════════════════

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // 水平摆动（正弦波）
    const wobble = Math.sin(time * WOBBLE_SPEED + this.wobbleOffset) * WOBBLE_AMPLITUDE;
    this.x = this.spawnX + wobble;

    // 超出屏幕底部回收（layout.height 是动态值，不能缓存为模块级常量）
    if (this.y > layout.height + 30) {
      this.destroy();
    }
  }
}
