# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start Vite dev server on localhost:3000 (auto-opens browser)
npm run build        # TypeScript check + Vite production build to dist/
npm run preview      # Preview production build locally
```

No test framework is configured.

## Architecture Overview

**Multi-game HTML5 arcade** built on Phaser 3 + TypeScript + Vite. All graphics are programmatically drawn (no image assets). The app is a PWA with service worker and manifest.

### Game Registry

4 games share a common framework, registered in `src/GameRegistry.ts`. Hub scene (`src/hub/`) is the game selection screen.

| Game | Path | Type |
|------|------|------|
| Pixel Adventure | `src/games/pixel-adventure/` | Platformer (3 levels) |
| Space Shooter | `src/games/space-shooter/` | Vertical shmup (3 stages + bosses) |
| Gomoku | `src/games/gomoku/` | Five-in-a-row board game |
| Xiangqi | `src/games/xiangqi/` | Chinese Chess |

### Scene Pattern (all games follow this)

Every game has 5-6 scenes with a consistent flow:
```
TitleScene → GameScene + HUDScene (parallel overlay) → [PauseScene] → GameOverScene/VictoryScene → Hub
```

GameScene handles gameplay logic; HUDScene runs as a parallel overlay for UI. Scene keys are centralized in `src/shared/utils/Constants.ts` (`SceneKey` enum).

### Shared Systems (`src/shared/`)

- **ResponsiveLayout** (`utils/ResponsiveLayout.ts`) — Singleton (`layout`) with design resolution 800x480. All UI sizing must go through `layout.fontSize()`, `layout.scale()`, `layout.boardLayout()`. Never hardcode pixel values.
- **Base Scenes** (`scenes/BaseGameOverScene.ts`, `scenes/BasePauseScene.ts`) — Abstract templates extended by each game's pause/game-over scenes.
- **InputManager** (`systems/InputManager.ts`) — Unified keyboard + touch input. TouchControls provides virtual on-screen buttons for mobile.
- **SceneTransition** (`utils/SceneTransition.ts`) — `fadeToScene()` utility with double-click prevention.
- **OrientationManager** (`utils/OrientationManager.ts`) — `lockLandscape()` for board games, `unlockOrientation()` for hub.

### Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:
```
@shared/* → src/shared/*
@games/*  → src/games/*
@hub/*    → src/hub/*
```

### Per-Game Internal Structure

Each game follows the same directory convention:
- `scenes/` — Phaser scenes (Title, Game, HUD, Pause, GameOver, Victory)
- `entities/` — Game objects (Player, Enemy, Bullet, etc.)
- `systems/` — Game logic managers (collision, waves, AI, rendering)
- `data/` — Constants, configs, level/wave definitions

### Key Patterns

- **Resize handling**: Every scene with UI listens to `this.scale.on('resize')` and cleans up via `this.events.once('shutdown')` to prevent listener leaks.
- **Cross-scene communication**: GameScene emits events (e.g., `scoreChanged`), HUDScene listens via `this.scene.get(key).events.on(...)`.
- **Object pooling**: Space Shooter uses `BulletPool` for bullet recycling (60 player / 80 enemy).
- **AI**: Board games (Gomoku, Xiangqi) use minimax with alpha-beta pruning. Difficulty controls search depth.
- **Data-driven config**: Each game centralizes tunable parameters in its `data/` folder (colors, speeds, health, wave patterns, difficulty).

### Phaser Config (`src/config.ts`)

- Scale mode: `RESIZE` (adaptive canvas, min 320x180, max 1920x1080)
- Physics: Arcade (gravity configured per-game)
- Rendering: `pixelArt: true` (nearest-neighbor)
- Input: 4 active pointers (multi-touch)
