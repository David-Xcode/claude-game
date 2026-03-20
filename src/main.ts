// 游戏入口：初始化 Phaser.Game 并注册所有场景

import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    TitleScene,
    GameScene,
    HUDScene,
    PauseScene,
    GameOverScene,
    VictoryScene,
  ],
};

const game = new Phaser.Game(config);

// 视口变化时（URL 栏出现/隐藏、屏幕旋转）强制 Phaser 重新计算缩放
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// 注册 Service Worker（仅生产环境）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js');
}

// 尝试锁定横屏方向（lock 在 iOS Safari 不存在，需要 ?.catch 防止 undefined.catch 崩溃）
screen.orientation?.lock?.('landscape')?.catch(() => {});
