// Space Shooter 专用常量

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

// 事件名称常量
export const SHOOTER_EVENTS = {
  HEALTH_CHANGED: 'healthChanged',
  SCORE_CHANGED: 'scoreChanged',
  BOMBS_CHANGED: 'bombsChanged',
  WEAPON_CHANGED: 'weaponChanged',
  COMBO_CHANGED: 'comboChanged',
  LIVES_CHANGED: 'livesChanged',
  STAGE_NAME: 'stageName',
} as const;
