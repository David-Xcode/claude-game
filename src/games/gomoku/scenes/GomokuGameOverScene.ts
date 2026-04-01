// Gomoku 结算场景（胜负 + 平局）
import { SceneKey, GomokuMode, GomokuDifficulty } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

const STATS_KEY = 'gomokuStats';

interface GomokuStats {
  wins: number;
  losses: number;
  draws: number;
}

interface GomokuGameOverData {
  winner: 0 | 1 | 2;
  isDraw: boolean;
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
  moveCount: number;
}

export class GomokuGameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.GOMOKU_GAME_OVER });
  }

  protected getConfig(data: GomokuGameOverData): GameOverSceneConfig {
    const { winner, isDraw, mode, difficulty, moveCount } = data;
    this.saveStats(winner, isDraw, mode);

    if (isDraw) {
      return {
        backgroundColor: 0x0a0a10,
        title: 'DRAW!',
        titleColor: '#aaaaaa',
        subtitle: 'The board is full — no winner.',
        stats: [`Total Moves: ${moveCount}`],
        showCelebration: false,
        floatTitle: false,
        replaySceneKey: SceneKey.GOMOKU_GAME,
        replayData: { mode, difficulty },
      };
    }

    const winnerColor = winner === 1 ? 'BLACK' : 'WHITE';
    let subtitle = '';
    if (mode === GomokuMode.SINGLE_PLAYER) {
      subtitle = winner === 1 ? 'You Win!' : 'AI Wins!';
    } else {
      subtitle = `Player ${winner} Wins!`;
    }

    return {
      backgroundColor: 0x0a0a10,
      title: `${winnerColor} WINS!`,
      titleColor: '#ffdd44',
      subtitle,
      stats: [`Total Moves: ${moveCount}`],
      showCelebration: true,
      floatTitle: true,
      replaySceneKey: SceneKey.GOMOKU_GAME,
      replayData: { mode, difficulty },
    };
  }

  private saveStats(winner: 0 | 1 | 2, isDraw: boolean, mode: GomokuMode): void {
    if (mode !== GomokuMode.SINGLE_PLAYER) return;
    let stats: GomokuStats = { wins: 0, losses: 0, draws: 0 };
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.wins === 'number' && typeof parsed.losses === 'number' && typeof parsed.draws === 'number') {
          stats = parsed;
        }
      }
    } catch { /* 损坏数据使用默认值 */ }

    if (isDraw) stats.draws++;
    else if (winner === 1) stats.wins++;
    else stats.losses++;

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch { /* 存储空间不足 */ }
  }
}
