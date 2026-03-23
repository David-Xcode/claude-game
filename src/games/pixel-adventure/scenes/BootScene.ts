// 启动场景：生成所有纹理资源，显示加载进度

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.BOOT });
  }

  create(): void {
    // 显示加载文字
    const text = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Loading...',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    text.setOrigin(0.5);

    // 由于使用程序化纹理（无需加载外部资源），直接进入游戏大厅
    this.time.delayedCall(300, () => {
      this.scene.start(SceneKey.HUB);
    });
  }
}
