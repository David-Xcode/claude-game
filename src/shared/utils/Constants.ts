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
  HUB = 'HubScene',
  // Pixel Adventure
  TITLE = 'TitleScene',
  GAME = 'GameScene',
  HUD = 'HUDScene',
  PAUSE = 'PauseScene',
  GAME_OVER = 'GameOverScene',
  VICTORY = 'VictoryScene',
  // Space Shooter
  SHOOTER_TITLE = 'ShooterTitleScene',
  SHOOTER_GAME = 'ShooterGameScene',
  SHOOTER_HUD = 'ShooterHUDScene',
  SHOOTER_PAUSE = 'ShooterPauseScene',
  SHOOTER_GAME_OVER = 'ShooterGameOverScene',
  SHOOTER_VICTORY = 'ShooterVictoryScene',
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

// 深度层（z-order）— Pixel Adventure 用
export const DEPTH = {
  BACKGROUND: 0,
  PLATFORMS: 10,
  ITEMS: 20,
  ENEMIES: 30,
  PLAYER: 40,
  EFFECTS: 50,
  UI: 100,
} as const;

// ═══════════════════════════════════════════════
// Space Shooter 常量
// ═══════════════════════════════════════════════

// 射击游戏玩家常量
export const SHOOTER = {
  PLAYER_SPEED: 250,
  SCROLL_SPEED: 60,
  MAX_HEALTH: 5,
  MAX_LIVES: 3,
  MAX_BOMBS: 3,
  INVINCIBLE_DURATION: 2000,
  COMBO_WINDOW: 2000,
  MAX_COMBO_MULTIPLIER: 3.0,
} as const;

// 射击游戏颜色
export const SHOOTER_COLORS = {
  // 玩家飞船
  SHIP_HULL: 0x4466aa,
  SHIP_WING: 0x335599,
  SHIP_ENGINE: 0xff6600,
  PLAYER_BODY: 0xc27462,

  // 子弹
  PLAYER_BULLET: 0x00ffff,
  ENEMY_BULLET: 0xff4444,

  // 敌人（高饱和亮色，确保在任何背景下可见）
  DRONE: 0xff4444,
  ZIGZAG: 0x44ff44,
  TURRET: 0xff8800,
  BOMBER: 0xffcc00,
  SHIELD: 0x00ddff,
  SPINNER: 0xff44ff,
  CARRIER: 0xaa66ff,

  // Boss（鲜艳大型）
  BOSS1: 0xcc4400,
  BOSS2: 0x2266cc,
  BOSS3: 0x9922cc,

  // 道具
  POWERUP_VULCAN: 0x00ccff,
  POWERUP_SPREAD: 0xff8800,
  POWERUP_LASER: 0xff0044,
  POWERUP_HOMING: 0x44ff44,
  POWERUP_BOMB: 0xffcc00,
  POWERUP_HEALTH: 0xff4466,

  // 特效
  EXPLOSION: 0xff8800,
  MUZZLE_FLASH: 0xffffff,

  // 关卡背景
  STAGE1_SKY: 0x87ceeb,
  STAGE1_BUILDING: 0x334455,
  STAGE2_SKY: 0x1a3366,
  STAGE2_CLOUD: 0xddeeff,
  STAGE3_SPACE: 0x0a0a1a,
  STAGE3_NEBULA: 0x331155,
} as const;

// 射击游戏深度层
export const SHOOTER_DEPTH = {
  BACKGROUND_FAR: 0,
  BACKGROUND_NEAR: 5,
  POWERUPS: 10,
  ENEMY_BULLETS: 15,
  ENEMIES: 20,
  PLAYER_BULLETS: 25,
  PLAYER: 30,
  EFFECTS: 50,
  UI: 100,
} as const;

// 射击游戏武器类型
export enum WeaponType {
  VULCAN = 'vulcan',
  SPREAD = 'spread',
  LASER = 'laser',
  HOMING = 'homing',
}

// 射击游戏道具类型
export enum PowerUpType {
  WEAPON_VULCAN = 'weapon_vulcan',
  WEAPON_SPREAD = 'weapon_spread',
  WEAPON_LASER = 'weapon_laser',
  WEAPON_HOMING = 'weapon_homing',
  BOMB = 'bomb',
  HEALTH = 'health',
  SCORE_BONUS = 'score_bonus',
}

// 射击游戏敌人类型
export enum ShooterEnemyType {
  DRONE = 'drone',
  ZIGZAG = 'zigzag',
  TURRET = 'turret',
  BOMBER = 'bomber',
  SHIELD = 'shield',
  SPINNER = 'spinner',
  CARRIER = 'carrier',
}

// 射击游戏编队类型
export enum FormationType {
  LINE_HORIZONTAL = 'line_horizontal',
  LINE_VERTICAL = 'line_vertical',
  V_FORMATION = 'v_formation',
  CIRCLE_IN = 'circle_in',
  RANDOM = 'random',
  SIDES = 'sides',
}
