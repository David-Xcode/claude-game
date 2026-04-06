// 游戏入口

import Phaser from 'phaser';
import { gameConfig } from './config';
import { ALL_SCENES } from './GameRegistry';
import { layout } from '@shared/utils/ResponsiveLayout';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: ALL_SCENES,
};

const game = new Phaser.Game(config);

// RESIZE 模式下 Phaser 自动管理 canvas 尺寸，通过 resize 事件同步到 layout 单例
game.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
  layout.update(gameSize.width, gameSize.height);
});

// 初始化 layout（首次可能在 resize 事件前需要值）
layout.update(game.scale.width, game.scale.height);

// 注册 Service Worker（仅生产环境）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js');
}
