// 五子棋专用常量

import { layout, BoardLayout } from '@shared/utils/ResponsiveLayout';

// 五子棋游戏模式
export enum GomokuMode {
  SINGLE_PLAYER = 'singlePlayer',
  TWO_PLAYER = 'twoPlayer',
}

// 五子棋难度
export enum GomokuDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// 五子棋棋盘常量（仅保留非空间类常量）
export const GOMOKU = {
  GRID_SIZE: 15,
  // AI 延迟（毫秒），让落子有自然感
  AI_DELAY_MIN: 300,
  AI_DELAY_MAX: 800,
  // 胜利后等待时间
  WIN_DELAY: 1500,
} as const;

/** 根据当前屏幕尺寸计算五子棋棋盘布局 */
export function getGomokuBoardLayout(): BoardLayout {
  return layout.boardLayout(15, 15, 50, 0.42);
}

// 五子棋颜色
export const GOMOKU_COLORS = {
  // 棋子
  STONE_BLACK: 0x222222,
  STONE_BLACK_HIGHLIGHT: 0x444444,
  STONE_WHITE: 0xeeeeee,
  STONE_WHITE_HIGHLIGHT: 0xffffff,

  // 最后一手标记
  LAST_MOVE: 0xff4444,

  // 简单难度 — 暖色木质桌面
  EASY_BOARD: 0xdeb887,
  EASY_GRID: 0x8b6914,
  EASY_TABLE: 0xc49a6c,

  // 中等难度 — 绿色毛毡桌面
  MEDIUM_BOARD: 0x2d6a2d,
  MEDIUM_GRID: 0x1a4a1a,
  MEDIUM_TABLE: 0x245a24,

  // 困难难度 — 深色石板桌面
  HARD_BOARD: 0x3a3a5e,
  HARD_GRID: 0x22223a,
  HARD_TABLE: 0x2a2a4e,

  // 胜利连线高亮
  WIN_LINE: 0xffdd44,

  // UI 元素
  PLAYER_ACTIVE: 0x44ccff,
} as const;

// 五子棋深度层
export const GOMOKU_DEPTH = {
  TABLE: 0,
  BOARD: 5,
  GRID: 10,
  STAR_POINTS: 12,
  HOVER: 15,
  STONES: 20,
  LAST_MOVE: 25,
  WIN_LINE: 30,
  UI: 100,
} as const;
