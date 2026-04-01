// 关卡波次数据：纯数据文件，定义每个关卡的敌人波次配置
// 每个关卡包含多个波次，每个波次定义触发时间、敌人类型和编队方式

import { ShooterEnemyType, FormationType } from './ShooterConstants';

// ═══════════════════════════════════════════════
// 波次定义接口
// ═══════════════════════════════════════════════

export interface WaveEnemy {
  type: ShooterEnemyType;
  count: number;
  /** 编队内每个敌人之间的生成延迟（ms） */
  spawnDelay: number;
}

export interface WaveDefinition {
  /** 相对于关卡开始的触发时间（ms） */
  triggerTime: number;
  enemies: WaveEnemy[];
  formation: FormationType;
}

// ═══════════════════════════════════════════════
// 关卡波次数据
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// Stage 0 — City Skyline（~85 秒）
// ─────────────────────────────────────────────

const STAGE_0_WAVES: WaveDefinition[] = [
  // 0-15s: 教学无人机波次
  {
    triggerTime: 1000,
    enemies: [{ type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 400 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 5000,
    enemies: [{ type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 300 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 10000,
    enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 250 }],
    formation: FormationType.V_FORMATION,
  },

  // 15-30s: 引入 Zigzag + 混合 Drone
  {
    triggerTime: 16000,
    enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 500 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 21000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 300 },
      { type: ShooterEnemyType.ZIGZAG, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 27000,
    enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 350 }],
    formation: FormationType.LINE_HORIZONTAL,
  },

  // 30-50s: 引入 Turret + V 编队 Drone
  {
    triggerTime: 31000,
    enemies: [{ type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 800 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 36000,
    enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 200 }],
    formation: FormationType.V_FORMATION,
  },
  {
    triggerTime: 41000,
    enemies: [
      { type: ShooterEnemyType.TURRET, count: 1, spawnDelay: 0 },
      { type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 400 },
    ],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 46000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 300 },
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 600 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },

  // 50-70s: 混合编队，密度增加
  {
    triggerTime: 52000,
    enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 250 }],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 57000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 200 },
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
    ],
    formation: FormationType.V_FORMATION,
  },
  {
    triggerTime: 62000,
    enemies: [
      { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 300 },
      { type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 250 },
    ],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 67000,
    enemies: [{ type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 600 }],
    formation: FormationType.LINE_HORIZONTAL,
  },

  // 70-85s: 高强度最终推进
  {
    triggerTime: 71000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 8, spawnDelay: 150 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 75000,
    enemies: [
      { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 80000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
      { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
    ],
    formation: FormationType.V_FORMATION,
  },
];

// ─────────────────────────────────────────────
// Stage 1 — Stratosphere（~100 秒）
// ─────────────────────────────────────────────

const STAGE_1_WAVES: WaveDefinition[] = [
  // 0-15s: 快速 Drone 热身
  {
    triggerTime: 1000,
    enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 250 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 7000,
    enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 300 }],
    formation: FormationType.V_FORMATION,
  },

  // 15-30s: 引入 Bomber
  {
    triggerTime: 16000,
    enemies: [{ type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 1000 }],
    formation: FormationType.SIDES,
  },
  {
    triggerTime: 22000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 200 },
      { type: ShooterEnemyType.BOMBER, count: 1, spawnDelay: 0 },
    ],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 28000,
    enemies: [{ type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 800 }],
    formation: FormationType.SIDES,
  },

  // 30-50s: 引入 ShieldEnemy + 复杂编队
  {
    triggerTime: 32000,
    enemies: [{ type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 600 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 38000,
    enemies: [
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 44000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 800 },
      { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 250 },
    ],
    formation: FormationType.SIDES,
  },

  // 50s: 中段高强度时刻
  {
    triggerTime: 50000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 8, spawnDelay: 120 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
    ],
    formation: FormationType.V_FORMATION,
  },
  {
    triggerTime: 55000,
    enemies: [
      { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
      { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 700 },
    ],
    formation: FormationType.CIRCLE_IN,
  },

  // 60-80s: 全敌人类型混战
  {
    triggerTime: 62000,
    enemies: [
      { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 68000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 600 },
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
    ],
    formation: FormationType.SIDES,
  },
  {
    triggerTime: 74000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
      { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.RANDOM,
  },

  // 80-95s: 最终推进
  {
    triggerTime: 82000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 500 },
      { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
    ],
    formation: FormationType.SIDES,
  },
  {
    triggerTime: 88000,
    enemies: [
      { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
      { type: ShooterEnemyType.ZIGZAG, count: 6, spawnDelay: 150 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 93000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 10, spawnDelay: 100 },
    ],
    formation: FormationType.V_FORMATION,
  },
];

// ─────────────────────────────────────────────
// Stage 2 — Deep Space（~120 秒）
// ─────────────────────────────────────────────

const STAGE_2_WAVES: WaveDefinition[] = [
  // 0-15s: 快速混合热身
  {
    triggerTime: 1000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 200 },
      { type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 300 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 8000,
    enemies: [
      { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
      { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 600 },
    ],
    formation: FormationType.SIDES,
  },

  // 15-30s: 引入 Spinner
  {
    triggerTime: 16000,
    enemies: [{ type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 600 }],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 22000,
    enemies: [
      { type: ShooterEnemyType.SPINNER, count: 2, spawnDelay: 500 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 28000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
      { type: ShooterEnemyType.SPINNER, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.V_FORMATION,
  },

  // 30-50s: 引入 Carrier + 高密度
  {
    triggerTime: 32000,
    enemies: [{ type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 38000,
    enemies: [
      { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
      { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
    ],
    formation: FormationType.RANDOM,
  },
  {
    triggerTime: 44000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 600 },
      { type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 400 },
    ],
    formation: FormationType.SIDES,
  },

  // 50-70s: 密集弹幕阶段
  {
    triggerTime: 52000,
    enemies: [
      { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
      { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 58000,
    enemies: [{ type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 60000,
    enemies: [
      { type: ShooterEnemyType.SPINNER, count: 4, spawnDelay: 300 },
      { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 66000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 500 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
    ],
    formation: FormationType.SIDES,
  },

  // 70-90s: 超高密度
  {
    triggerTime: 72000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 10, spawnDelay: 100 },
      { type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 300 },
    ],
    formation: FormationType.V_FORMATION,
  },
  {
    triggerTime: 78000,
    enemies: [{ type: ShooterEnemyType.CARRIER, count: 2, spawnDelay: 2000 }],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 84000,
    enemies: [
      { type: ShooterEnemyType.TURRET, count: 4, spawnDelay: 300 },
      { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 400 },
      { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
    ],
    formation: FormationType.RANDOM,
  },

  // 90-110s: 最终疯狂
  {
    triggerTime: 92000,
    enemies: [
      { type: ShooterEnemyType.SPINNER, count: 5, spawnDelay: 250 },
      { type: ShooterEnemyType.ZIGZAG, count: 6, spawnDelay: 150 },
    ],
    formation: FormationType.CIRCLE_IN,
  },
  {
    triggerTime: 98000,
    enemies: [
      { type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 },
      { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
    ],
    formation: FormationType.LINE_HORIZONTAL,
  },
  {
    triggerTime: 104000,
    enemies: [
      { type: ShooterEnemyType.DRONE, count: 12, spawnDelay: 80 },
      { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
    ],
    formation: FormationType.V_FORMATION,
  },
  {
    triggerTime: 110000,
    enemies: [
      { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 400 },
      { type: ShooterEnemyType.SPINNER, count: 4, spawnDelay: 300 },
      { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
    ],
    formation: FormationType.RANDOM,
  },
];

// ═══════════════════════════════════════════════
// 所有关卡波次数据，按关卡索引排列
// ═══════════════════════════════════════════════

export const STAGE_WAVES: WaveDefinition[][] = [
  STAGE_0_WAVES,
  STAGE_1_WAVES,
  STAGE_2_WAVES,
];
