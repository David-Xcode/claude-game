// 敌人工厂：根据类型创建对应敌人实例
// 自动确保纹理已生成，集中管理创建逻辑

import Phaser from 'phaser';
import { ShooterEnemyType } from '@shared/utils/Constants';
import { ShooterEnemy } from '../ShooterEnemy';
import { BulletPool } from '../../systems/BulletPool';
import { Drone } from './Drone';
import { Zigzag } from './Zigzag';
import { Turret } from './Turret';
import { Bomber } from './Bomber';
import { ShieldEnemy } from './ShieldEnemy';
import { Spinner } from './Spinner';
import { Carrier } from './Carrier';

// ═══════════════════════════════════════════════
// 工厂配置接口
// ═══════════════════════════════════════════════

export interface EnemyCreateConfig {
  /** 玩家精灵引用（Turret / Spinner 瞄准用） */
  playerRef?: Phaser.GameObjects.Sprite;
  /** 敌方子弹池（Turret / Bomber 开火用） */
  bulletPool?: BulletPool;
  /** Bomber 是否从左侧进入 */
  fromLeft?: boolean;
  /** Carrier 无人机生成回调 */
  onSpawnDrones?: (x: number, y: number, count: number) => void;
}

// ═══════════════════════════════════════════════
// 工厂
// ═══════════════════════════════════════════════

export class EnemyFactory {
  /**
   * 创建指定类型的敌人
   * @param scene 当前场景
   * @param type 敌人类型枚举
   * @param x 生成 x 坐标
   * @param y 生成 y 坐标
   * @param config 额外配置（弹池、玩家引用等）
   */
  static create(
    scene: Phaser.Scene,
    type: ShooterEnemyType,
    x: number,
    y: number,
    config: EnemyCreateConfig = {}
  ): ShooterEnemy {
    switch (type) {
      case ShooterEnemyType.DRONE:
        return new Drone(scene, x, y);

      case ShooterEnemyType.ZIGZAG:
        return new Zigzag(scene, x, y);

      case ShooterEnemyType.TURRET: {
        if (!config.bulletPool || !config.playerRef) {
          // 缺少必要参数时降级为 Drone
          console.warn('[EnemyFactory] Turret 缺少 bulletPool/playerRef，降级为 Drone');
          return new Drone(scene, x, y);
        }
        return new Turret(scene, x, y, config.bulletPool, config.playerRef);
      }

      case ShooterEnemyType.BOMBER: {
        if (!config.bulletPool) {
          console.warn('[EnemyFactory] Bomber 缺少 bulletPool，降级为 Drone');
          return new Drone(scene, x, y);
        }
        return new Bomber(scene, x, y, config.bulletPool, config.fromLeft ?? true);
      }

      case ShooterEnemyType.SHIELD:
        return new ShieldEnemy(scene, x, y);

      case ShooterEnemyType.SPINNER: {
        if (!config.playerRef) {
          console.warn('[EnemyFactory] Spinner 缺少 playerRef，降级为 Drone');
          return new Drone(scene, x, y);
        }
        return new Spinner(scene, x, y, config.playerRef);
      }

      case ShooterEnemyType.CARRIER: {
        const carrier = new Carrier(scene, x, y);
        if (config.onSpawnDrones) {
          carrier.onSpawnDrones = config.onSpawnDrones;
        }
        return carrier;
      }

      default:
        console.warn(`[EnemyFactory] 未知敌人类型: ${type}，降级为 Drone`);
        return new Drone(scene, x, y);
    }
  }

  /**
   * 预创建所有纹理（可在场景 preload/create 时调用一次）
   */
  static preloadTextures(scene: Phaser.Scene): void {
    Drone.ensureTexture(scene);
    Zigzag.ensureTexture(scene);
    Turret.ensureTexture(scene);
    Bomber.ensureTexture(scene);
    ShieldEnemy.ensureTexture(scene);
    Spinner.ensureTexture(scene);
    Carrier.ensureTexture(scene);
  }
}
