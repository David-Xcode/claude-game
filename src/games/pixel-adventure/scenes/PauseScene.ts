// Pixel Adventure 暂停场景
import { SceneKey } from '@shared/utils/Constants';
import { BasePauseScene, PauseSceneConfig } from '@shared/scenes/BasePauseScene';

export class PauseScene extends BasePauseScene {
  constructor() {
    super({ key: SceneKey.PAUSE });
  }

  protected getConfig(): PauseSceneConfig {
    return {
      gameSceneKey: SceneKey.GAME,
      hudSceneKey: SceneKey.HUD,
      quitTargetKey: SceneKey.TITLE,
      quitLabel: 'Quit to Title',
    };
  }
}
