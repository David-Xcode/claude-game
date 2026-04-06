// 中国象棋结算场景

import { SceneKey } from '@shared/utils/Constants';
import { XiangqiMode, XiangqiDifficulty, Side } from '../data/XiangqiConstants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

const STATS_KEY = 'xiangqiStats';

interface XiangqiStats {
  wins: number;
  losses: number;
}

interface XiangqiGameOverData {
  winner: Side;
  mode: XiangqiMode;
  difficulty: XiangqiDifficulty;
  moveCount: number;
}

export class XiangqiGameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.XIANGQI_GAME_OVER });
  }

  protected getConfig(data: XiangqiGameOverData): GameOverSceneConfig {
    const { winner, mode, difficulty, moveCount } = data;
    this.saveStats(winner, mode);

    const winnerColor = winner === Side.RED ? 'RED' : 'BLACK';
    let subtitle = '';
    if (mode === XiangqiMode.SINGLE_PLAYER) {
      subtitle = winner === Side.RED ? 'You Win!' : 'AI Wins!';
    } else {
      subtitle = `${winnerColor} Player Wins!`;
    }

    const isPlayerWin = mode === XiangqiMode.SINGLE_PLAYER && winner === Side.RED;

    return {
      backgroundColor: 0x0a0a10,
      title: `${winnerColor} WINS!`,
      titleColor: winner === Side.RED ? '#ff4444' : '#ffffff',
      subtitle,
      stats: [`Total Moves: ${moveCount}`],
      showCelebration: isPlayerWin || mode === XiangqiMode.TWO_PLAYER,
      floatTitle: true,
      replaySceneKey: SceneKey.XIANGQI_GAME,
      replayData: { mode, difficulty },
    };
  }

  private saveStats(winner: Side, mode: XiangqiMode): void {
    if (mode !== XiangqiMode.SINGLE_PLAYER) return;
    let stats: XiangqiStats = { wins: 0, losses: 0 };
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.wins === 'number' && typeof parsed.losses === 'number') {
          stats = parsed;
        }
      }
    } catch { /* 损坏数据使用默认值 */ }

    if (winner === Side.RED) stats.wins++;
    else stats.losses++;

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch { /* 存储空间不足 */ }
  }
}
