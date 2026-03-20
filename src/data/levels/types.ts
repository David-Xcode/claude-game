// 关卡数据类型定义：所有关卡共享的接口

import { EnemyType, ItemType } from '../../utils/Constants';

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  // 移动平台参数
  moving?: {
    axis: 'x' | 'y';
    distance: number;
    speed: number;
  };
  // 碎裂平台（踩后消失）
  crumble?: boolean;
}

export interface SpikeData {
  x: number;
  y: number;
  width: number;
}

export interface ItemSpawnData {
  type: ItemType;
  x: number;
  y: number;
}

export interface EnemySpawnEntry {
  type: EnemyType;
  x: number;
  y: number;
}

export interface DecorationData {
  type: 'cloud' | 'bush' | 'rock' | 'stalactite' | 'crystal';
  x: number;
  y: number;
  scale?: number;
}

export interface LevelConfig {
  name: string;
  width: number;
  height: number;
  skyColor: number;
  // 地面定义（可以有间隙形成深坑）
  groundSegments: { startX: number; endX: number; y: number; color: number }[];
  platforms: PlatformData[];
  spikes: SpikeData[];
  enemies: EnemySpawnEntry[];
  items: ItemSpawnData[];
  decorations: DecorationData[];
  playerStart: { x: number; y: number };
  flagPosition: { x: number; y: number };
}
