// 武器配置数据：定义 4 种武器 × 3 级的弹幕模式、射速、伤害

import { WeaponType } from '../data/ShooterConstants';

// ═══════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════

export interface BulletPattern {
  dx: number;  // 相对玩家中心的 x 偏移
  dy: number;  // 相对玩家中心的 y 偏移
  vx: number;  // x 方向速度
  vy: number;  // y 方向速度
}

export interface WeaponLevelConfig {
  fireRate: number;     // 射击间隔（毫秒）
  damage: number;       // 每颗子弹伤害
  bulletSpeed: number;  // 基础弹速（用于计算 pattern 内的 vy）
  pattern: BulletPattern[];  // 弹幕模式
  bulletKey: string;    // 子弹纹理 key
  isHoming?: boolean;   // 追踪弹标记
  isPiercing?: boolean; // 穿透弹标记
}

// ═══════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════

/**
 * 根据角度和速度计算 vx/vy
 * angle = 0 表示正上方，正值向右偏
 */
function fanBullet(
  angleDeg: number,
  speed: number,
  dx: number = 0,
  dy: number = 0
): BulletPattern {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    dx,
    dy,
    vx: Math.sin(rad) * speed,
    vy: -Math.cos(rad) * speed,
  };
}

// ═══════════════════════════════════════════════
// 武器配置表
// ═══════════════════════════════════════════════

export const WEAPON_CONFIGS: Record<WeaponType, Record<number, WeaponLevelConfig>> = {
  // ─── 火神炮（VULCAN）：高射速、直线弹 ───
  [WeaponType.VULCAN]: {
    1: {
      fireRate: 150,
      damage: 1,
      bulletSpeed: 500,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(0, 500),  // 单发正前方
      ],
    },
    2: {
      fireRate: 120,
      damage: 1,
      bulletSpeed: 500,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(0, 500, -6, 0),  // 左侧平行弹
        fanBullet(0, 500, 6, 0),   // 右侧平行弹
      ],
    },
    3: {
      fireRate: 100,
      damage: 1,
      bulletSpeed: 500,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(-15, 500),  // 左扇
        fanBullet(0, 500),    // 中央
        fanBullet(15, 500),   // 右扇
      ],
    },
  },

  // ─── 散弹（SPREAD）：宽扇形弹幕 ───
  [WeaponType.SPREAD]: {
    1: {
      fireRate: 250,
      damage: 1,
      bulletSpeed: 450,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(-30, 450),
        fanBullet(0, 450),
        fanBullet(30, 450),
      ],
    },
    2: {
      fireRate: 200,
      damage: 1,
      bulletSpeed: 450,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(-30, 450),
        fanBullet(-15, 450),
        fanBullet(0, 450),
        fanBullet(15, 450),
        fanBullet(30, 450),
      ],
    },
    3: {
      fireRate: 180,
      damage: 1,
      bulletSpeed: 450,
      bulletKey: 'bullet_player',
      pattern: [
        fanBullet(-45, 450),
        fanBullet(-30, 450),
        fanBullet(-15, 450),
        fanBullet(0, 450),
        fanBullet(15, 450),
        fanBullet(30, 450),
        fanBullet(45, 450),
      ],
    },
  },

  // ─── 激光（LASER）：高射速窄弹，可穿透 ───
  [WeaponType.LASER]: {
    1: {
      fireRate: 50,
      damage: 0.5,
      bulletSpeed: 700,
      bulletKey: 'bullet_laser',
      pattern: [
        fanBullet(0, 700),
      ],
    },
    2: {
      fireRate: 40,
      damage: 0.75,
      bulletSpeed: 700,
      bulletKey: 'bullet_laser',
      pattern: [
        fanBullet(0, 700, -3, 0),
        fanBullet(0, 700, 3, 0),
      ],
    },
    3: {
      fireRate: 30,
      damage: 1,
      bulletSpeed: 700,
      bulletKey: 'bullet_laser',
      isPiercing: true,
      pattern: [
        fanBullet(0, 700, -5, 0),
        fanBullet(0, 700),
        fanBullet(0, 700, 5, 0),
      ],
    },
  },

  // ─── 追踪弹（HOMING）：低射速、高伤害、自动追踪 ───
  [WeaponType.HOMING]: {
    1: {
      fireRate: 500,
      damage: 2,
      bulletSpeed: 400,
      bulletKey: 'bullet_homing',
      isHoming: true,
      pattern: [
        fanBullet(0, 400),
      ],
    },
    2: {
      fireRate: 400,
      damage: 2,
      bulletSpeed: 400,
      bulletKey: 'bullet_homing',
      isHoming: true,
      pattern: [
        fanBullet(-10, 400),
        fanBullet(10, 400),
      ],
    },
    3: {
      fireRate: 350,
      damage: 2,
      bulletSpeed: 400,
      bulletKey: 'bullet_homing',
      isHoming: true,
      pattern: [
        fanBullet(-15, 400),
        fanBullet(0, 400),
        fanBullet(15, 400),
      ],
    },
  },
};
