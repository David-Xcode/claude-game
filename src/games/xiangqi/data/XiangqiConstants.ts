// 中国象棋专用常量

import { layout, BoardLayout } from '@shared/utils/ResponsiveLayout';

// 游戏模式
export enum XiangqiMode {
  SINGLE_PLAYER = 'singlePlayer',
  TWO_PLAYER = 'twoPlayer',
}

// 难度
export enum XiangqiDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// 棋子类型
export enum PieceType {
  GENERAL = 'general',
  ADVISOR = 'advisor',
  ELEPHANT = 'elephant',
  HORSE = 'horse',
  ROOK = 'rook',
  CANNON = 'cannon',
  SOLDIER = 'soldier',
}

// 阵营
export enum Side {
  RED = 1,
  BLACK = 2,
}

// 棋子显示汉字
export const PIECE_CHARS: Record<Side, Record<PieceType, string>> = {
  [Side.RED]: {
    [PieceType.GENERAL]: '帅',
    [PieceType.ADVISOR]: '仕',
    [PieceType.ELEPHANT]: '相',
    [PieceType.HORSE]: '马',
    [PieceType.ROOK]: '车',
    [PieceType.CANNON]: '炮',
    [PieceType.SOLDIER]: '兵',
  },
  [Side.BLACK]: {
    [PieceType.GENERAL]: '将',
    [PieceType.ADVISOR]: '士',
    [PieceType.ELEPHANT]: '象',
    [PieceType.HORSE]: '马',
    [PieceType.ROOK]: '车',
    [PieceType.CANNON]: '炮',
    [PieceType.SOLDIER]: '卒',
  },
};

// 棋盘尺寸与布局常量（仅保留非空间类常量）
export const XIANGQI = {
  COLS: 9,
  ROWS: 10,
  // AI 延迟（毫秒）
  AI_DELAY_MIN: 400,
  AI_DELAY_MAX: 1000,
  // 胜利后等待时间
  WIN_DELAY: 1500,
} as const;

/** 根据当前屏幕尺寸计算象棋棋盘布局 */
export function getXiangqiBoardLayout(): BoardLayout {
  return layout.boardLayout(9, 10, 50, 0.42);
}

// 颜色
export const XIANGQI_COLORS = {
  // 棋盘
  BOARD_BG: 0xd4a76a,
  BOARD_GRID: 0x5c3d1a,
  BOARD_TABLE: 0xb8915a,
  BOARD_SHADOW: 0x3a2a1a,
  RIVER_TEXT: 0x5c3d1a,

  // 红方棋子
  RED_FILL: 0xffeedd,
  RED_TEXT: 0xcc2222,
  RED_BORDER: 0xcc2222,

  // 黑方棋子
  BLACK_FILL: 0xeeeedd,
  BLACK_TEXT: 0x222222,
  BLACK_BORDER: 0x333333,

  // 高亮 & 指示
  SELECTED: 0x44ccff,
  VALID_MOVE: 0x44ff44,
  VALID_CAPTURE: 0xff4444,
  LAST_MOVE: 0xffaa00,
  CHECK_WARNING: 0xff4444,

  // UI
  PLAYER_ACTIVE: 0x44ccff,
  BG: 0x1a1410,
} as const;

// 深度层
export const XIANGQI_DEPTH = {
  TABLE: 0,
  BOARD: 5,
  GRID: 10,
  RIVER_TEXT: 12,
  VALID_MOVES: 14,
  LAST_MOVE: 15,
  PIECES: 20,
  SELECTED: 25,
  CHECK: 28,
  UI: 100,
} as const;

// 子力价值（AI 估值用）
export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.GENERAL]: 10000,
  [PieceType.ROOK]: 600,
  [PieceType.CANNON]: 285,
  [PieceType.HORSE]: 270,
  [PieceType.ELEPHANT]: 120,
  [PieceType.ADVISOR]: 120,
  [PieceType.SOLDIER]: 30,
};

// 过河兵/卒的额外价值
export const SOLDIER_CROSSED_RIVER_VALUE = 80;
