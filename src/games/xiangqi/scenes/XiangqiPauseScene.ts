// 中国象棋暂停场景
import { SceneKey } from '@shared/utils/Constants';
import { BasePauseScene, PauseSceneConfig } from '@shared/scenes/BasePauseScene';

export class XiangqiPauseScene extends BasePauseScene {
  constructor() {
    super({ key: SceneKey.XIANGQI_PAUSE });
  }

  protected getConfig(): PauseSceneConfig {
    return {
      gameSceneKey: SceneKey.XIANGQI_GAME,
      hudSceneKey: SceneKey.XIANGQI_HUD,
    };
  }
}
