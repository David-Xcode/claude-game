// 游戏入口：初始化 Phaser.Game 并注册所有场景

import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from '@games/pixel-adventure/scenes/BootScene';
import { HubScene } from '@hub/HubScene';
import { TitleScene } from '@games/pixel-adventure/scenes/TitleScene';
import { GameScene } from '@games/pixel-adventure/scenes/GameScene';
import { HUDScene } from '@games/pixel-adventure/scenes/HUDScene';
import { PauseScene } from '@games/pixel-adventure/scenes/PauseScene';
import { GameOverScene } from '@games/pixel-adventure/scenes/GameOverScene';
import { VictoryScene } from '@games/pixel-adventure/scenes/VictoryScene';
// Space Shooter 场景
import { ShooterTitleScene } from '@games/space-shooter/scenes/ShooterTitleScene';
import { ShooterGameScene } from '@games/space-shooter/scenes/ShooterGameScene';
import { ShooterHUDScene } from '@games/space-shooter/scenes/ShooterHUDScene';
import { ShooterPauseScene } from '@games/space-shooter/scenes/ShooterPauseScene';
import { ShooterGameOverScene } from '@games/space-shooter/scenes/ShooterGameOverScene';
import { ShooterVictoryScene } from '@games/space-shooter/scenes/ShooterVictoryScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    HubScene,
    // Pixel Adventure
    TitleScene,
    GameScene,
    HUDScene,
    PauseScene,
    GameOverScene,
    VictoryScene,
    // Space Shooter
    ShooterTitleScene,
    ShooterGameScene,
    ShooterHUDScene,
    ShooterPauseScene,
    ShooterGameOverScene,
    ShooterVictoryScene,
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
