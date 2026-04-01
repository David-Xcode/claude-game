// 游戏入口

import Phaser from 'phaser';
import { gameConfig } from './config';
import { ALL_SCENES } from './GameRegistry';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: ALL_SCENES,
};

const game = new Phaser.Game(config);

// 视口变化时（URL 栏出现/隐藏、屏幕旋转）重新计算缩放，防抖避免移动端高频触发
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => game.scale.refresh(), 100);
});

// 注册 Service Worker（仅生产环境）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js');
}
