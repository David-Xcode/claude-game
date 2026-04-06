// 全局共享常量（各游戏通用）

// 设计参考尺寸（仅用于缩放计算，运行时尺寸请用 layout.width / layout.height）
export { DESIGN_WIDTH, DESIGN_HEIGHT, layout } from './ResponsiveLayout';

export const TILE_SIZE = 32;

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
  // Gomoku（五子棋）
  GOMOKU_TITLE = 'GomokuTitleScene',
  GOMOKU_GAME = 'GomokuGameScene',
  GOMOKU_HUD = 'GomokuHUDScene',
  GOMOKU_PAUSE = 'GomokuPauseScene',
  GOMOKU_GAME_OVER = 'GomokuGameOverScene',
  // Xiangqi（中国象棋）
  XIANGQI_TITLE = 'XiangqiTitleScene',
  XIANGQI_GAME = 'XiangqiGameScene',
  XIANGQI_HUD = 'XiangqiHUDScene',
  XIANGQI_PAUSE = 'XiangqiPauseScene',
  XIANGQI_GAME_OVER = 'XiangqiGameOverScene',
}
