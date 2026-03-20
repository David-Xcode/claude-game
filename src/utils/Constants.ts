// 游戏常量和枚举定义

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const TILE_SIZE = 32;

// 物理常量
export const GRAVITY = 900;

// 玩家常量
export const PLAYER = {
  SPEED: 200,
  JUMP_FORCE: -430,
  JUMP_CUT_MULTIPLIER: 0.4,
  ACCELERATION: 1200,
  DECELERATION: 1500,
  MAX_HEALTH: 3,
  MAX_LIVES: 3,
  COYOTE_TIME: 80,
  JUMP_BUFFER: 100,
  INVINCIBLE_DURATION: 1500,
  BOUNCE_FORCE: -250,
} as const;

// 敌人常量
export const ENEMY = {
  SLIME_SPEED: 60,
  SLIME_HEALTH: 1,
  FLYING_EYE_SPEED: 80,
  FLYING_EYE_AMPLITUDE: 40,
  FLYING_EYE_FREQUENCY: 0.002,
  BOSS_HEALTH: 5,
  BOSS_SPEED: 40,
  BOSS_SCALE: 2,
} as const;

// 道具常量
export const ITEMS = {
  COIN_SCORE: 100,
  HEALTH_RESTORE: 1,
} as const;

// 颜色常量（用于程序化渲染）
export const COLORS = {
  // 关卡1 - 绿色平原
  LEVEL1_SKY: 0x87ceeb,
  LEVEL1_GROUND: 0x4a7c2f,
  LEVEL1_PLATFORM: 0x6b8e3d,
  LEVEL1_DIRT: 0x8b6914,

  // 关卡2 - 地下洞穴
  LEVEL2_SKY: 0x1a1a2e,
  LEVEL2_GROUND: 0x4a4a5e,
  LEVEL2_PLATFORM: 0x5a5a6e,
  LEVEL2_ROCK: 0x3a3a4e,

  // 关卡3 - 天空要塞
  LEVEL3_SKY: 0xc9e8ff,
  LEVEL3_PLATFORM: 0x8899aa,
  LEVEL3_STONE: 0x667788,
  LEVEL3_CLOUD: 0xffffff,

  // 通用
  SPIKE: 0xcc3333,
  COIN: 0xffd700,
  HEALTH: 0xff4466,
  FLAG: 0x00ff88,
  PLAYER: 0xc27462, // Claude toy
  PLAYER_HURT: 0xff4444,
  SLIME: 0x44cc44,
  FLYING_EYE: 0x9944cc,
  BOSS: 0x228822,
  LAVA: 0xff4400,
  CRUMBLE: 0xaa8866,
} as const;

// 场景键
export enum SceneKey {
  BOOT = 'BootScene',
  TITLE = 'TitleScene',
  GAME = 'GameScene',
  HUD = 'HUDScene',
  PAUSE = 'PauseScene',
  GAME_OVER = 'GameOverScene',
  VICTORY = 'VictoryScene',
}

// 敌人类型
export enum EnemyType {
  SLIME = 'slime',
  FLYING_EYE = 'flyingEye',
  BOSS_SLIME = 'bossSlime',
}

// 道具类型
export enum ItemType {
  COIN = 'coin',
  HEALTH = 'health',
}

// 深度层（z-order）
export const DEPTH = {
  BACKGROUND: 0,
  PLATFORMS: 10,
  ITEMS: 20,
  ENEMIES: 30,
  PLAYER: 40,
  EFFECTS: 50,
  UI: 100,
} as const;
