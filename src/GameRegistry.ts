// 游戏注册表：集中管理所有游戏的场景列表

import { BootScene } from '@games/pixel-adventure/scenes/BootScene';
import { HubScene } from '@hub/HubScene';
// Pixel Adventure
import { TitleScene } from '@games/pixel-adventure/scenes/TitleScene';
import { GameScene } from '@games/pixel-adventure/scenes/GameScene';
import { HUDScene } from '@games/pixel-adventure/scenes/HUDScene';
import { PauseScene } from '@games/pixel-adventure/scenes/PauseScene';
import { GameOverScene } from '@games/pixel-adventure/scenes/GameOverScene';
import { VictoryScene } from '@games/pixel-adventure/scenes/VictoryScene';
// Space Shooter
import { ShooterTitleScene } from '@games/space-shooter/scenes/ShooterTitleScene';
import { ShooterGameScene } from '@games/space-shooter/scenes/ShooterGameScene';
import { ShooterHUDScene } from '@games/space-shooter/scenes/ShooterHUDScene';
import { ShooterPauseScene } from '@games/space-shooter/scenes/ShooterPauseScene';
import { ShooterGameOverScene } from '@games/space-shooter/scenes/ShooterGameOverScene';
import { ShooterVictoryScene } from '@games/space-shooter/scenes/ShooterVictoryScene';
// Gomoku
import { GomokuTitleScene } from '@games/gomoku/scenes/GomokuTitleScene';
import { GomokuGameScene } from '@games/gomoku/scenes/GomokuGameScene';
import { GomokuHUDScene } from '@games/gomoku/scenes/GomokuHUDScene';
import { GomokuPauseScene } from '@games/gomoku/scenes/GomokuPauseScene';
import { GomokuGameOverScene } from '@games/gomoku/scenes/GomokuGameOverScene';

export const CORE_SCENES = [BootScene, HubScene];

export const GAME_SCENES = [
  // Pixel Adventure
  TitleScene, GameScene, HUDScene, PauseScene, GameOverScene, VictoryScene,
  // Space Shooter
  ShooterTitleScene, ShooterGameScene, ShooterHUDScene, ShooterPauseScene, ShooterGameOverScene, ShooterVictoryScene,
  // Gomoku
  GomokuTitleScene, GomokuGameScene, GomokuHUDScene, GomokuPauseScene, GomokuGameOverScene,
];

export const ALL_SCENES = [...CORE_SCENES, ...GAME_SCENES];
