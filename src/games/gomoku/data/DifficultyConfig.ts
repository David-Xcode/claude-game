// 五子棋难度配置：颜色主题 + AI 参数

import { GomokuDifficulty, GOMOKU_COLORS } from './GomokuConstants';

export interface DifficultyLevel {
  name: string;
  description: string;
  boardColor: number;
  gridColor: number;
  tableColor: number;
  aiDepth: number;
  // 从评分最高的前 N 个候选中随机选一个（1 = 永远选最优）
  aiTopN: number;
}

export const DIFFICULTY_CONFIGS: Record<GomokuDifficulty, DifficultyLevel> = {
  [GomokuDifficulty.EASY]: {
    name: 'Easy',
    description: 'Warm Wood Board',
    boardColor: GOMOKU_COLORS.EASY_BOARD,
    gridColor: GOMOKU_COLORS.EASY_GRID,
    tableColor: GOMOKU_COLORS.EASY_TABLE,
    aiDepth: 1,
    aiTopN: 3,
  },
  [GomokuDifficulty.MEDIUM]: {
    name: 'Medium',
    description: 'Green Felt Board',
    boardColor: GOMOKU_COLORS.MEDIUM_BOARD,
    gridColor: GOMOKU_COLORS.MEDIUM_GRID,
    tableColor: GOMOKU_COLORS.MEDIUM_TABLE,
    aiDepth: 2,
    aiTopN: 1,
  },
  [GomokuDifficulty.HARD]: {
    name: 'Hard',
    description: 'Dark Slate Board',
    boardColor: GOMOKU_COLORS.HARD_BOARD,
    gridColor: GOMOKU_COLORS.HARD_GRID,
    tableColor: GOMOKU_COLORS.HARD_TABLE,
    aiDepth: 3,
    aiTopN: 1,
  },
};
