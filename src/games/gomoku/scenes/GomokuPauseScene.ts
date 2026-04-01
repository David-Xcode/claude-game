// Gomoku 暂停场景
import { SceneKey } from '@shared/utils/Constants';
import { BasePauseScene, PauseSceneConfig } from '@shared/scenes/BasePauseScene';

export class GomokuPauseScene extends BasePauseScene {
  constructor() {
    super({ key: SceneKey.GOMOKU_PAUSE });
  }

  protected getConfig(): PauseSceneConfig {
    return {
      gameSceneKey: SceneKey.GOMOKU_GAME,
      hudSceneKey: SceneKey.GOMOKU_HUD,
    };
  }
}
