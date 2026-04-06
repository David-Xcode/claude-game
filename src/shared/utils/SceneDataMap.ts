// 类型化场景数据：编译期校验场景间传递的数据

import { SceneKey } from './Constants';
import { GomokuMode, GomokuDifficulty } from '@games/gomoku/data/GomokuConstants';
import { XiangqiMode, XiangqiDifficulty, Side as XiangqiSide } from '@games/xiangqi/data/XiangqiConstants';

export interface SceneDataMap {
  [SceneKey.GAME]: { level: number; score: number; lives: number };
  [SceneKey.GAME_OVER]: { score: number };
  [SceneKey.VICTORY]: { score: number };
  [SceneKey.SHOOTER_GAME]: { stage: number; score: number; lives: number };
  [SceneKey.SHOOTER_GAME_OVER]: { score: number; stage: number };
  [SceneKey.SHOOTER_VICTORY]: { score: number };
  [SceneKey.GOMOKU_GAME]: { mode: GomokuMode; difficulty: GomokuDifficulty };
  [SceneKey.GOMOKU_GAME_OVER]: {
    winner: 0 | 1 | 2;
    isDraw: boolean;
    mode: GomokuMode;
    difficulty: GomokuDifficulty;
    moveCount: number;
  };
  [SceneKey.XIANGQI_GAME]: { mode: XiangqiMode; difficulty: XiangqiDifficulty };
  [SceneKey.XIANGQI_GAME_OVER]: {
    winner: XiangqiSide;
    mode: XiangqiMode;
    difficulty: XiangqiDifficulty;
    moveCount: number;
  };
}
