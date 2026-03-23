// 敌人工厂：根据关卡数据生成敌人实例

import Phaser from 'phaser';
import { EnemyType } from '@shared/utils/Constants';
import { EnemySpawnEntry } from '@games/pixel-adventure/data/levels';
import { Enemy } from '../Enemy';
import { Slime, BossSlime } from './Slime';
import { FlyingEye } from './FlyingEye';

export class EnemyFactory {
  static create(
    scene: Phaser.Scene,
    data: EnemySpawnEntry
  ): Enemy {
    switch (data.type) {
      case EnemyType.SLIME:
        return new Slime(scene, data.x, data.y);
      case EnemyType.FLYING_EYE:
        return new FlyingEye(scene, data.x, data.y);
      case EnemyType.BOSS_SLIME:
        return new BossSlime(scene, data.x, data.y);
      default:
        throw new Error(`Unknown enemy type: ${data.type}`);
    }
  }

  static createGroup(
    scene: Phaser.Scene,
    spawns: EnemySpawnEntry[]
  ): Enemy[] {
    return spawns.map((data) => EnemyFactory.create(scene, data));
  }
}
