// 中国象棋难度配置

import { XiangqiDifficulty, XIANGQI_COLORS } from './XiangqiConstants';

export interface XiangqiDifficultyLevel {
  name: string;
  description: string;
  boardColor: number;
  gridColor: number;
  tableColor: number;
  aiDepth: number;
  aiTopN: number;
}

export const DIFFICULTY_CONFIGS: Record<XiangqiDifficulty, XiangqiDifficultyLevel> = {
  [XiangqiDifficulty.EASY]: {
    name: 'Easy',
    description: 'Shallow search, some randomness',
    boardColor: 0xdeb887,
    gridColor: 0x8b6914,
    tableColor: 0xc49a6c,
    aiDepth: 2,
    aiTopN: 3,
  },
  [XiangqiDifficulty.MEDIUM]: {
    name: 'Medium',
    description: 'Moderate search depth',
    boardColor: XIANGQI_COLORS.BOARD_BG,
    gridColor: XIANGQI_COLORS.BOARD_GRID,
    tableColor: XIANGQI_COLORS.BOARD_TABLE,
    aiDepth: 3,
    aiTopN: 2,
  },
  [XiangqiDifficulty.HARD]: {
    name: 'Hard',
    description: 'Deep search, always best move',
    boardColor: 0x8b7355,
    gridColor: 0x5a4a3a,
    tableColor: 0x6b5b4b,
    aiDepth: 4,
    aiTopN: 1,
  },
};
