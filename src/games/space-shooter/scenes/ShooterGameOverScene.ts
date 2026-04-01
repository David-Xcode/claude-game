// Space Shooter 游戏结束场景（含最高分逻辑）
import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';
import { ScoreManager } from '../systems/ScoreManager';

export class ShooterGameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.SHOOTER_GAME_OVER });
  }

  protected getConfig(data: { score: number; stage: number }): GameOverSceneConfig {
    const score = data.score ?? 0;
    const scoreMgr = new ScoreManager(this, score);
    const prevHigh = scoreMgr.getHighScore();
    const isNewHigh = score > prevHigh;
    scoreMgr.saveHighScore();

    const highScore = Math.max(score, prevHigh);
    const highLabel = isNewHigh ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`;

    return {
      backgroundColor: 0x0a0508,
      title: 'GAME OVER',
      titleColor: '#ff4444',
      stats: [
        `Final Score: ${score}`,
        {
          text: highLabel,
          color: isNewHigh ? '#ffdd44' : '#888888',
          bold: isNewHigh,
          blink: isNewHigh,
        },
      ],
      showCelebration: false,
      floatTitle: false,
      replayLabel: 'Retry',
      replaySceneKey: SceneKey.SHOOTER_GAME,
      replayData: { stage: 0, score: 0, lives: 3 },
    };
  }
}
