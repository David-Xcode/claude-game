// 武器系统：管理 4 种武器类型 × 3 级升级，控制射击节奏和弹幕模式

import { WeaponType, SHOOTER_COLORS } from '../data/ShooterConstants';
import { BulletPool } from './BulletPool';
import { WEAPON_CONFIGS, WeaponLevelConfig } from '../data/WeaponConfigs';
import { Bullet } from '../entities/Bullet';

// ═══════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════

const MAX_LEVEL = 3;

export class ShooterWeaponSystem {
  private currentType: WeaponType = WeaponType.VULCAN;
  private currentLevel = 1;
  private lastFireTime = 0;

  constructor(private scene: Phaser.Scene) {
    // 确保特殊子弹纹理已创建
    ShooterWeaponSystem.createBulletTextures(scene);
  }

  // ═══════════════════════════════════════════════
  // 纹理生成
  // ═══════════════════════════════════════════════

  /** 生成激光和追踪弹的专用纹理 */
  static createBulletTextures(scene: Phaser.Scene): void {
    // 激光子弹：窄长红色光束
    if (!scene.textures.exists('bullet_laser')) {
      const gl = scene.add.graphics();
      // 外层辉光
      gl.fillStyle(SHOOTER_COLORS.POWERUP_LASER, 0.3);
      gl.fillRect(0, 0, 6, 16);
      // 核心
      gl.fillStyle(SHOOTER_COLORS.POWERUP_LASER, 0.8);
      gl.fillRect(1, 1, 4, 14);
      // 白色高亮中心线
      gl.fillStyle(0xffffff, 0.7);
      gl.fillRect(2, 2, 2, 12);
      gl.generateTexture('bullet_laser', 6, 16);
      gl.destroy();
    }

    // 追踪弹：小型导弹形状（绿色）
    if (!scene.textures.exists('bullet_homing')) {
      const gh = scene.add.graphics();
      // 弹体
      gh.fillStyle(SHOOTER_COLORS.POWERUP_HOMING, 1);
      gh.fillRoundedRect(1, 2, 6, 10, 2);
      // 弹头（三角）
      gh.fillStyle(0xffffff, 0.8);
      gh.fillTriangle(4, 0, 1, 4, 7, 4);
      // 尾焰
      gh.fillStyle(0xff8800, 0.8);
      gh.fillTriangle(2, 12, 4, 15, 6, 12);
      gh.generateTexture('bullet_homing', 8, 16);
      gh.destroy();
    }
  }

  // ═══════════════════════════════════════════════
  // 射击
  // ═══════════════════════════════════════════════

  /**
   * 尝试射击：检查射速限制，从弹池中取弹并发射
   * @returns 是否成功发射
   */
  tryFire(time: number, x: number, y: number, bulletPool: BulletPool): boolean {
    const config = this.getConfig();
    if (!config) return false;

    // 射速限制
    if (time - this.lastFireTime < config.fireRate) return false;
    this.lastFireTime = time;

    // 按弹幕模式发射每颗子弹
    for (const p of config.pattern) {
      const bullet = bulletPool.fire(
        x + p.dx,
        y + p.dy,
        p.vx,
        p.vy,
        config.damage
      );

      if (bullet) {
        // 设置纹理（如果与默认不同）
        if (bullet.texture.key !== config.bulletKey && this.scene.textures.exists(config.bulletKey)) {
          bullet.setTexture(config.bulletKey);
        }

        // 标记追踪弹
        if (config.isHoming) {
          (bullet as any).isHoming = true;
        }

        // 标记穿透弹（碰撞后不回收）
        if (config.isPiercing) {
          (bullet as any).isPiercing = true;
        }
      }
    }

    return true;
  }

  // ═══════════════════════════════════════════════
  // 武器切换 & 升级
  // ═══════════════════════════════════════════════

  /**
   * 升级武器：
   * - 同类型 → 等级 +1（最高 3 级）
   * - 不同类型 → 切换为该类型 1 级
   */
  upgrade(type: WeaponType): void {
    if (type === this.currentType) {
      this.currentLevel = Math.min(this.currentLevel + 1, MAX_LEVEL);
    } else {
      this.currentType = type;
      this.currentLevel = 1;
    }
  }

  /** 直接设置武器类型（保持升级逻辑统一入口） */
  setWeapon(type: WeaponType): void {
    this.upgrade(type);
  }

  /** 重置为默认武器 */
  reset(): void {
    this.currentType = WeaponType.VULCAN;
    this.currentLevel = 1;
    this.lastFireTime = 0;
  }

  // ═══════════════════════════════════════════════
  // Getter
  // ═══════════════════════════════════════════════

  getCurrentWeapon(): { type: WeaponType; level: number } {
    return { type: this.currentType, level: this.currentLevel };
  }

  get type(): WeaponType {
    return this.currentType;
  }

  get level(): number {
    return this.currentLevel;
  }

  /** 获取当前等级配置 */
  private getConfig(): WeaponLevelConfig | null {
    const weaponGroup = WEAPON_CONFIGS[this.currentType];
    if (!weaponGroup) return null;
    return weaponGroup[this.currentLevel] ?? null;
  }
}
