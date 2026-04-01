// Pixel Adventure 通关场景
import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

export class VictoryScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.VICTORY });
  }

  protected getConfig(data: { score: number }): GameOverSceneConfig {
    return {
      backgroundColor: 0x0a1a0a,
      title: 'YOU WIN!',
      titleColor: '#ffdd44',
      subtitle: 'Congratulations!\nAll levels cleared!',
      stats: [`Final Score: ${data.score ?? 0}`],
      showCelebration: true,
      floatTitle: true,
      replaySceneKey: SceneKey.GAME,
      replayData: { level: 0, score: 0, lives: 3 },
      quitSceneKey: SceneKey.TITLE,
      quitLabel: 'Title Screen',
    };
  }
}
