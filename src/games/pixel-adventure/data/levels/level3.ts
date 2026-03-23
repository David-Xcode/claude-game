// 关卡3：天空要塞（高难度 + Boss）
// 设计目标：浮空感强烈，多层次云朵，碎裂平台+金币引导，Boss竞技场有额外奖励

import { EnemyType, ItemType, TILE_SIZE } from '@shared/utils/Constants';
import { LevelConfig } from './types';

export const LEVEL_3: LevelConfig = {
  name: 'Sky Fortress',
  width: 5500,
  height: 600,
  skyColor: 0xc9e8ff,
  playerStart: { x: 80, y: 450 },
  flagPosition: { x: 5050, y: 280 },

  groundSegments: [
    // 只有起始段有地面，之后全是浮空平台
    { startX: 0, endX: 400, y: 516, color: 0x8899aa },
  ],

  platforms: [
    // 起始区
    { x: 200, y: 450, width: 96, height: TILE_SIZE, color: 0x8899aa },
    { x: 380, y: 400, width: 96, height: TILE_SIZE, color: 0x8899aa },

    // 浮空平台区1
    { x: 520, y: 350, width: 96, height: TILE_SIZE, color: 0x8899aa },
    { x: 680, y: 300, width: 80, height: TILE_SIZE, color: 0x8899aa },
    { x: 830, y: 350, width: 80, height: TILE_SIZE, color: 0x8899aa },
    { x: 970, y: 280, width: 96, height: TILE_SIZE, color: 0x8899aa },

    // 碎裂平台区（金币引导路线）
    { x: 1120, y: 320, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 1220, y: 280, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 1320, y: 240, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 1440, y: 300, width: 128, height: TILE_SIZE, color: 0x8899aa },

    // 移动平台 + 飞行敌人区
    {
      x: 1600, y: 320, width: 96, height: TILE_SIZE, color: 0x99aacc,
      moving: { axis: 'x', distance: 120, speed: 60 },
    },
    { x: 1800, y: 260, width: 80, height: TILE_SIZE, color: 0x8899aa },
    {
      x: 1960, y: 300, width: 96, height: TILE_SIZE, color: 0x99aacc,
      moving: { axis: 'y', distance: 100, speed: 50 },
    },
    { x: 2120, y: 250, width: 96, height: TILE_SIZE, color: 0x8899aa },

    // 碎裂 + 正常交替区
    { x: 2300, y: 300, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 2420, y: 260, width: 96, height: TILE_SIZE, color: 0x8899aa },
    { x: 2560, y: 300, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 2680, y: 250, width: 96, height: TILE_SIZE, color: 0x8899aa },

    // 高难度跳跃段（金币标记落点位置）
    { x: 2850, y: 320, width: 64, height: TILE_SIZE, color: 0x8899aa },
    { x: 2960, y: 260, width: 64, height: TILE_SIZE, color: 0x8899aa },
    { x: 3060, y: 200, width: 64, height: TILE_SIZE, color: 0x8899aa },
    { x: 3170, y: 260, width: 64, height: TILE_SIZE, color: 0x8899aa },
    { x: 3280, y: 320, width: 96, height: TILE_SIZE, color: 0x8899aa },

    // 移动平台走廊
    {
      x: 3450, y: 300, width: 96, height: TILE_SIZE, color: 0x99aacc,
      moving: { axis: 'x', distance: 100, speed: 70 },
    },
    {
      x: 3650, y: 260, width: 96, height: TILE_SIZE, color: 0x99aacc,
      moving: { axis: 'y', distance: 80, speed: 55 },
    },
    { x: 3850, y: 300, width: 128, height: TILE_SIZE, color: 0x8899aa },

    // 碎裂平台冲刺
    { x: 4020, y: 280, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 4120, y: 260, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },
    { x: 4220, y: 240, width: 64, height: TILE_SIZE, color: 0xaa8866, crumble: true },

    // Boss 竞技场 — 宽大平台
    { x: 4400, y: 320, width: 800, height: TILE_SIZE, color: 0x667788 },
    // Boss 竞技场上方平台（用于躲避 + 通往终点的跳板）
    { x: 4550, y: 260, width: 128, height: TILE_SIZE, color: 0x8899aa },
    { x: 4850, y: 260, width: 128, height: TILE_SIZE, color: 0x8899aa },

    // 终点平台
    { x: 5000, y: 320, width: 200, height: TILE_SIZE, color: 0x667788 },
  ],

  spikes: [
    // Boss 竞技场两侧
    { x: 4380, y: 304, width: 32 },
    { x: 4760, y: 304, width: 32 },
  ],

  enemies: [
    // 浮空区
    { type: EnemyType.SLIME, x: 1000, y: 250 },
    { type: EnemyType.FLYING_EYE, x: 800, y: 230 },
    { type: EnemyType.FLYING_EYE, x: 1500, y: 220 },

    // 移动平台区
    { type: EnemyType.FLYING_EYE, x: 1700, y: 240 },
    { type: EnemyType.SLIME, x: 2150, y: 220 },
    { type: EnemyType.FLYING_EYE, x: 2000, y: 200 },

    // 交替区
    { type: EnemyType.FLYING_EYE, x: 2500, y: 200 },
    { type: EnemyType.SLIME, x: 2710, y: 220 },

    // 高难度跳跃段
    { type: EnemyType.FLYING_EYE, x: 3000, y: 150 },
    { type: EnemyType.FLYING_EYE, x: 3200, y: 200 },

    // 移动平台走廊
    { type: EnemyType.FLYING_EYE, x: 3550, y: 200 },
    { type: EnemyType.SLIME, x: 3880, y: 270 },

    // Boss!
    { type: EnemyType.BOSS_SLIME, x: 4700, y: 260 },
  ],

  items: [
    { type: ItemType.COIN, x: 550, y: 320 },
    { type: ItemType.COIN, x: 710, y: 270 },
    { type: ItemType.COIN, x: 1000, y: 250 },

    // 碎裂平台区金币引导路线
    { type: ItemType.COIN, x: 1140, y: 290 },
    { type: ItemType.COIN, x: 1240, y: 250 },
    { type: ItemType.COIN, x: 1340, y: 210 },

    { type: ItemType.COIN, x: 1470, y: 270 },
    { type: ItemType.COIN, x: 1830, y: 230 },
    { type: ItemType.COIN, x: 2150, y: 220 },

    // 碎裂+正常交替区金币
    { type: ItemType.COIN, x: 2320, y: 270 },
    { type: ItemType.COIN, x: 2450, y: 230 },
    { type: ItemType.COIN, x: 2580, y: 270 },
    { type: ItemType.COIN, x: 2710, y: 220 },

    // 高难度跳跃段金币标记落点
    { type: ItemType.COIN, x: 2870, y: 290 },
    { type: ItemType.COIN, x: 2980, y: 230 },
    { type: ItemType.COIN, x: 3060, y: 170 },
    { type: ItemType.COIN, x: 3190, y: 230 },
    { type: ItemType.COIN, x: 3310, y: 290 },

    { type: ItemType.COIN, x: 3880, y: 270 },

    // Boss 竞技场额外金币奖励
    { type: ItemType.COIN, x: 4570, y: 230 },
    { type: ItemType.COIN, x: 4700, y: 290 },
    { type: ItemType.COIN, x: 4870, y: 230 },

    // 终点金币
    { type: ItemType.COIN, x: 5050, y: 290 },

    // 血量恢复
    { type: ItemType.HEALTH, x: 1470, y: 270 },
    { type: ItemType.HEALTH, x: 2710, y: 220 },
    { type: ItemType.HEALTH, x: 3880, y: 270 },
    // Boss 前血量
    { type: ItemType.HEALTH, x: 4350, y: 290 },
  ],

  decorations: [
    // 多层次云朵（不同大小和高度，增强浮空感）
    { type: 'cloud', x: 100, y: 120, scale: 0.6 },
    { type: 'cloud', x: 200, y: 50 },
    { type: 'cloud', x: 450, y: 140, scale: 0.5 },
    { type: 'cloud', x: 700, y: 80, scale: 1.5 },
    { type: 'cloud', x: 900, y: 150, scale: 0.7 },
    { type: 'cloud', x: 1100, y: 40, scale: 0.8 },
    { type: 'cloud', x: 1300, y: 40 },
    { type: 'cloud', x: 1550, y: 130, scale: 0.6 },
    { type: 'cloud', x: 1900, y: 70, scale: 1.2 },
    { type: 'cloud', x: 2200, y: 140, scale: 0.5 },
    { type: 'cloud', x: 2500, y: 50 },
    { type: 'cloud', x: 2800, y: 120, scale: 0.7 },
    { type: 'cloud', x: 3100, y: 90 },
    { type: 'cloud', x: 3400, y: 150, scale: 0.6 },
    { type: 'cloud', x: 3800, y: 60, scale: 1.3 },
    { type: 'cloud', x: 4100, y: 130, scale: 0.5 },
    { type: 'cloud', x: 4500, y: 40 },
    { type: 'cloud', x: 4800, y: 110, scale: 0.7 },
    { type: 'cloud', x: 5000, y: 80 },
  ],
};
