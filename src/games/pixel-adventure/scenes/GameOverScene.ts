// Pixel Adventure 游戏结束场景
import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

export class GameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.GAME_OVER });
  }

  protected getConfig(data: { score: number }): GameOverSceneConfig {
    return {
      backgroundColor: 0x1a0a0a,
      title: 'GAME OVER',
      titleColor: '#ff4444',
      stats: [`Final Score: ${data.score ?? 0}`],
      showCelebration: false,
      floatTitle: false,
      replaySceneKey: SceneKey.GAME,
      replayData: { level: 0, score: 0, lives: 3 },
      quitSceneKey: SceneKey.TITLE,
      quitLabel: 'Title Screen',
    };
  }
}
