// 关卡1：绿色平原（教学关）
// 设计目标：引导新手学习基础操作，节奏舒缓，有安全小坑练习跳跃

import { TILE_SIZE } from '@shared/utils/Constants';
import { EnemyType, ItemType } from '../PAConstants';
import { LevelConfig } from './types';

export const LEVEL_1: LevelConfig = {
  name: 'Green Plains',
  width: 3200,
  height: 480,
  skyColor: 0x87ceeb,
  playerStart: { x: 80, y: 350 },
  flagPosition: { x: 3050, y: 310 },

  groundSegments: [
    { startX: 0, endX: 800, y: 416, color: 0x4a7c2f },
    // 教学小坑（64px 宽，可轻松跳过）
    { startX: 864, endX: 1500, y: 416, color: 0x4a7c2f },
    // 第二个小坑
    { startX: 1564, endX: 2200, y: 416, color: 0x4a7c2f },
    { startX: 2200, endX: 3200, y: 416, color: 0x4a7c2f },
  ],

  platforms: [
    // 教学区：简单跳跃阶梯
    { x: 300, y: 340, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 480, y: 280, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 650, y: 240, width: 128, height: TILE_SIZE, color: 0x6b8e3d },

    // 跨坑平台
    { x: 820, y: 360, width: 64, height: TILE_SIZE, color: 0x6b8e3d },

    // 中段
    { x: 1000, y: 320, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 1180, y: 260, width: 128, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 1350, y: 300, width: 96, height: TILE_SIZE, color: 0x6b8e3d },

    // 跨坑2
    { x: 1520, y: 350, width: 64, height: TILE_SIZE, color: 0x6b8e3d },

    // 后段：增加一个隐藏高台（藏金币）
    { x: 1700, y: 320, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 1900, y: 280, width: 128, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 1900, y: 180, width: 64, height: TILE_SIZE, color: 0x5a7e2d },  // 隐藏高台
    { x: 2100, y: 240, width: 96, height: TILE_SIZE, color: 0x6b8e3d },

    // 终点前台阶
    { x: 2500, y: 370, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 2650, y: 330, width: 96, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 2800, y: 290, width: 128, height: TILE_SIZE, color: 0x6b8e3d },
    { x: 2980, y: 350, width: 128, height: TILE_SIZE, color: 0x6b8e3d },
  ],

  spikes: [],

  enemies: [
    { type: EnemyType.SLIME, x: 600, y: 390 },
    { type: EnemyType.SLIME, x: 1050, y: 390 },
    { type: EnemyType.SLIME, x: 1400, y: 390 },
    { type: EnemyType.SLIME, x: 1800, y: 390 },
    { type: EnemyType.SLIME, x: 2300, y: 390 },
    { type: EnemyType.SLIME, x: 2700, y: 390 },
  ],

  items: [
    // 教学区：金币排成弧线引导跳跃路径
    { type: ItemType.COIN, x: 330, y: 310 },
    { type: ItemType.COIN, x: 400, y: 280 },  // 弧线中点
    { type: ItemType.COIN, x: 510, y: 250 },
    { type: ItemType.COIN, x: 580, y: 240 },  // 弧线引导到高平台
    { type: ItemType.COIN, x: 690, y: 210 },

    // 中段金币
    { type: ItemType.COIN, x: 1030, y: 290 },
    { type: ItemType.COIN, x: 1210, y: 230 },
    { type: ItemType.COIN, x: 1380, y: 270 },

    // 后段金币
    { type: ItemType.COIN, x: 1730, y: 290 },
    { type: ItemType.COIN, x: 1930, y: 250 },
    { type: ItemType.COIN, x: 2130, y: 210 },

    // 隐藏高台金币（奖励探索）
    { type: ItemType.COIN, x: 1910, y: 150 },
    { type: ItemType.COIN, x: 1940, y: 150 },

    // 终点前
    { type: ItemType.COIN, x: 2830, y: 260 },

    // 血量恢复
    { type: ItemType.HEALTH, x: 1210, y: 230 },
  ],

  decorations: [
    // 云朵（多层次）
    { type: 'cloud', x: 150, y: 80, scale: 1.2 },
    { type: 'cloud', x: 600, y: 60 },
    { type: 'cloud', x: 1100, y: 90 },
    { type: 'cloud', x: 1500, y: 50, scale: 0.8 },
    { type: 'cloud', x: 1800, y: 70 },
    { type: 'cloud', x: 2400, y: 85 },
    { type: 'cloud', x: 2900, y: 55, scale: 1.1 },

    // 灌木（密布让场景丰满）
    { type: 'bush', x: 120, y: 400 },
    { type: 'bush', x: 200, y: 400 },
    { type: 'bush', x: 500, y: 400, scale: 0.8 },
    { type: 'bush', x: 900, y: 400 },
    { type: 'bush', x: 1100, y: 400, scale: 0.7 },
    { type: 'bush', x: 1600, y: 400 },
    { type: 'bush', x: 1850, y: 400, scale: 0.9 },
    { type: 'bush', x: 2400, y: 400 },
    { type: 'bush', x: 2600, y: 400, scale: 0.8 },
    { type: 'bush', x: 3000, y: 400 },

    // 石头点缀
    { type: 'rock', x: 350, y: 400 },
    { type: 'rock', x: 750, y: 400, scale: 0.7 },
    { type: 'rock', x: 1300, y: 400 },
    { type: 'rock', x: 2050, y: 400, scale: 0.8 },
    { type: 'rock', x: 2750, y: 400 },
  ],
};
