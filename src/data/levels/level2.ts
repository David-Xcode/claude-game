// 关卡2：地下洞穴（中等难度）
// 设计目标：洞穴氛围感，尖刺陷阱高低交替，移动平台配合金币引导节奏

import { EnemyType, ItemType, TILE_SIZE } from '../../utils/Constants';
import { LevelConfig } from './types';

export const LEVEL_2: LevelConfig = {
  name: 'Underground Cave',
  width: 4500,
  height: 480,
  skyColor: 0x1a1a2e,
  playerStart: { x: 80, y: 350 },
  flagPosition: { x: 4300, y: 310 },

  groundSegments: [
    { startX: 0, endX: 600, y: 416, color: 0x4a4a5e },
    // 大坑 + 尖刺
    { startX: 750, endX: 1300, y: 416, color: 0x4a4a5e },
    { startX: 1450, endX: 2000, y: 416, color: 0x4a4a5e },
    // 垂直跳跃段（地面中断多）
    { startX: 2150, endX: 2500, y: 416, color: 0x4a4a5e },
    { startX: 2650, endX: 3200, y: 416, color: 0x4a4a5e },
    { startX: 3350, endX: 4500, y: 416, color: 0x4a4a5e },
  ],

  platforms: [
    // 开头区域
    { x: 250, y: 340, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 430, y: 280, width: 96, height: TILE_SIZE, color: 0x5a5a6e },

    // 跨坑1
    { x: 640, y: 350, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 700, y: 300, width: 64, height: TILE_SIZE, color: 0x5a5a6e },

    // 移动平台区
    {
      x: 900, y: 300, width: 96, height: TILE_SIZE, color: 0x7a7a9e,
      moving: { axis: 'y', distance: 80, speed: 60 },
    },
    { x: 1100, y: 260, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    {
      x: 1300, y: 320, width: 96, height: TILE_SIZE, color: 0x7a7a9e,
      moving: { axis: 'x', distance: 100, speed: 50 },
    },

    // 垂直跳跃段
    { x: 1500, y: 350, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 1580, y: 280, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 1660, y: 210, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 1750, y: 150, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 1870, y: 210, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 1950, y: 280, width: 64, height: TILE_SIZE, color: 0x5a5a6e },

    // 中段 + 碎裂平台区（增加紧张感）
    { x: 2200, y: 350, width: 128, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 2350, y: 310, width: 64, height: TILE_SIZE, color: 0x8a6a4e, crumble: true },
    {
      x: 2400, y: 280, width: 96, height: TILE_SIZE, color: 0x7a7a9e,
      moving: { axis: 'y', distance: 60, speed: 40 },
    },

    // 后段跨坑
    { x: 2560, y: 350, width: 64, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 2600, y: 280, width: 64, height: TILE_SIZE, color: 0x5a5a6e },

    // 尖刺区上方平台
    { x: 2800, y: 300, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 3000, y: 260, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 3200, y: 300, width: 96, height: TILE_SIZE, color: 0x5a5a6e },

    // 终点区域
    { x: 3500, y: 340, width: 128, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 3700, y: 280, width: 96, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 3900, y: 320, width: 128, height: TILE_SIZE, color: 0x5a5a6e },
    { x: 4100, y: 350, width: 256, height: TILE_SIZE, color: 0x5a5a6e },
  ],

  spikes: [
    // 坑底尖刺
    { x: 600, y: 448, width: 150 },
    { x: 1300, y: 448, width: 150 },
    // 地面尖刺（高低交替增加变化）
    { x: 2800, y: 400, width: 64 },
    { x: 2900, y: 400, width: 32 },   // 短尖刺
    { x: 2950, y: 400, width: 64 },
    { x: 3050, y: 400, width: 32 },   // 短尖刺
    { x: 3100, y: 400, width: 64 },
    { x: 3250, y: 400, width: 64 },
  ],

  enemies: [
    { type: EnemyType.SLIME, x: 400, y: 390 },
    { type: EnemyType.SLIME, x: 900, y: 390 },
    { type: EnemyType.FLYING_EYE, x: 1100, y: 200 },
    { type: EnemyType.SLIME, x: 1600, y: 390 },
    { type: EnemyType.FLYING_EYE, x: 1800, y: 160 },
    { type: EnemyType.SLIME, x: 2300, y: 390 },
    { type: EnemyType.FLYING_EYE, x: 2600, y: 220 },
    { type: EnemyType.SLIME, x: 3000, y: 390 },
    { type: EnemyType.SLIME, x: 3400, y: 390 },
    { type: EnemyType.FLYING_EYE, x: 3800, y: 200 },
    { type: EnemyType.SLIME, x: 4100, y: 390 },
  ],

  items: [
    { type: ItemType.COIN, x: 280, y: 310 },
    { type: ItemType.COIN, x: 460, y: 250 },
    { type: ItemType.COIN, x: 700, y: 270 },

    // 移动平台区金币引导节奏（跟随移动平台路径）
    { type: ItemType.COIN, x: 900, y: 260 },
    { type: ItemType.COIN, x: 930, y: 240 },
    { type: ItemType.COIN, x: 1130, y: 230 },
    { type: ItemType.COIN, x: 1300, y: 290 },
    { type: ItemType.COIN, x: 1330, y: 290 },

    // 垂直段顶部
    { type: ItemType.COIN, x: 1750, y: 120 },

    // 碎裂平台区金币引导
    { type: ItemType.COIN, x: 2360, y: 280 },

    { type: ItemType.COIN, x: 2830, y: 270 },
    { type: ItemType.COIN, x: 3030, y: 230 },
    { type: ItemType.COIN, x: 3530, y: 310 },
    { type: ItemType.COIN, x: 3730, y: 250 },
    { type: ItemType.COIN, x: 3930, y: 290 },

    // 血量恢复
    { type: ItemType.HEALTH, x: 1750, y: 120 },
    { type: ItemType.HEALTH, x: 3500, y: 310 },
  ],

  decorations: [
    // 钟乳石（密布增强洞穴感）
    { type: 'stalactite', x: 150, y: 0, scale: 0.8 },
    { type: 'stalactite', x: 300, y: 0 },
    { type: 'stalactite', x: 550, y: 0, scale: 1.2 },
    { type: 'stalactite', x: 800, y: 0 },
    { type: 'stalactite', x: 1050, y: 0, scale: 0.9 },
    { type: 'stalactite', x: 1400, y: 0 },
    { type: 'stalactite', x: 1700, y: 0, scale: 1.1 },
    { type: 'stalactite', x: 2100, y: 0 },
    { type: 'stalactite', x: 2500, y: 0, scale: 0.8 },
    { type: 'stalactite', x: 2900, y: 0 },
    { type: 'stalactite', x: 3300, y: 0, scale: 1.2 },
    { type: 'stalactite', x: 3600, y: 0 },
    { type: 'stalactite', x: 4000, y: 0, scale: 0.9 },
    { type: 'stalactite', x: 4300, y: 0 },

    // 水晶（增加更多分布）
    { type: 'crystal', x: 350, y: 390 },
    { type: 'crystal', x: 500, y: 390, scale: 0.8 },
    { type: 'crystal', x: 850, y: 390 },
    { type: 'crystal', x: 1200, y: 390, scale: 1.2 },
    { type: 'crystal', x: 1550, y: 390 },
    { type: 'crystal', x: 2000, y: 390, scale: 0.9 },
    { type: 'crystal', x: 2400, y: 390 },
    { type: 'crystal', x: 2750, y: 390, scale: 1.1 },
    { type: 'crystal', x: 3300, y: 390 },
    { type: 'crystal', x: 3800, y: 390, scale: 0.8 },
    { type: 'crystal', x: 4200, y: 390 },
  ],
};
