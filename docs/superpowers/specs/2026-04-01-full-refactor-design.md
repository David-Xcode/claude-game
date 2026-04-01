# Full Project Refactoring Design Spec

## Context

The game-test project is a Phaser 3 arcade hub with 3 games (Pixel Adventure, Space Shooter, Gomoku). After multiple iterations, ~700+ lines of redundant code have accumulated across menu scenes, UI patterns, and constants. This refactoring aims to eliminate redundancy, improve extensibility, and reduce the cost of adding future games.

## Scope

All 3 phases from the code review are covered:
- **Phase 1**: Eliminate extension barriers (base scenes, utilities, hub layout, dead code)
- **Phase 2**: Improve code quality (split constants, UI styles, unified particles/events, high score fix)
- **Phase 3**: Polish (game registry, typed scene data, AI optimization)

---

## Phase 1: Eliminate Extension Barriers

### 1.1 Shared Scene Transition Utility

**File**: `src/shared/utils/SceneTransition.ts`

Extract the "guard + fadeOut + scene.start" pattern into a reusable function:

```typescript
export function fadeToScene(
  scene: Phaser.Scene,
  targetKey: string,
  data?: object,
  duration?: number // default 500
): void;
```

Internally manages a per-scene `transitioning` flag via scene data to prevent double-clicks. All 21+ transition callsites refactored to one-liners.

### 1.2 BasePauseScene

**File**: `src/shared/scenes/BasePauseScene.ts`

Abstract base class that encapsulates the universal pause pattern:

```typescript
export abstract class BasePauseScene extends Phaser.Scene {
  protected abstract getGameSceneKey(): string;
  protected abstract getHUDSceneKey(): string;
  // create() handles: overlay, PAUSED title, Resume/Quit buttons,
  // ESC/Q keyboard bindings, touch support
}
```

Each game's PauseScene becomes ~10 lines:
```typescript
export class GomokuPauseScene extends BasePauseScene {
  constructor() { super({ key: SceneKey.GOMOKU_PAUSE }); }
  protected getGameSceneKey() { return SceneKey.GOMOKU_GAME; }
  protected getHUDSceneKey() { return SceneKey.GOMOKU_HUD; }
}
```

### 1.3 BaseGameOverScene

**File**: `src/shared/scenes/BaseGameOverScene.ts`

Abstract base class for win/loss/draw result screens:

```typescript
export interface GameOverConfig {
  title: string;           // "BLACK WINS!" or "GAME OVER"
  titleColor: string;      // "#ffdd44" or "#ff4444"
  subtitle?: string;       // "You Win!" or "All stages cleared!"
  stats?: string[];        // ["Final Score: 12000", "Total Moves: 42"]
  showCelebration: boolean;
  replaySceneKey: string;
  replayData: object;
}

export abstract class BaseGameOverScene extends Phaser.Scene {
  protected abstract getConfig(data: any): GameOverConfig;
  // create() handles: background, title with float animation,
  // subtitle, stats lines, celebration particles,
  // Play Again / Back to Hub buttons with keyboard bindings
}
```

Each game's GameOver/Victory scene becomes ~20-30 lines of config.

This also absorbs VictoryScene logic — Pixel Adventure's separate VictoryScene and ShooterVictoryScene can both extend this base class. The distinction between "game over" and "victory" becomes a config difference (title text, color, celebration flag), not a separate class hierarchy.

### 1.4 HubScene Data-Driven Layout

**Current problem**: Hardcoded 3-column layout breaks at 4+ games.

**Solution**: Refactor `createGameCards()` to accept a `GameCardDef[]` array and calculate layout dynamically:

```typescript
interface GameCardDef {
  title: string;
  sceneKey: SceneKey;
  keyboardKey: string;    // "ONE", "TWO", "THREE", etc.
  drawPreview: (g: Phaser.GameObjects.Graphics) => void;
}
```

Layout algorithm:
- If cards fit in one row: single-row centered layout
- Card size auto-calculated: `cardW = Math.min(220, (GAME_WIDTH - margins - gaps) / count)`
- If card would be < 160px, switch to 2-row grid layout
- This supports up to ~8 games without scrolling

The `GAME_CARDS` array lives in `src/hub/GameCards.ts`, making adding a new game a single array entry.

### 1.5 Delete Dead Code

Remove these files entirely:
- `src/shared/systems/CharacterSystem.ts` (~45 lines, all empty stubs)
- `src/shared/systems/WeaponSystem.ts` (~43 lines, all empty stubs)
- `src/shared/utils/AnimationHelper.ts` (~15 lines, all empty stubs)

---

## Phase 2: Improve Code Quality

### 2.1 Split Constants.ts

Current `Constants.ts` is 321 lines mixing shared and game-specific constants.

**New structure**:
- `src/shared/utils/Constants.ts` — Only truly shared: `GAME_WIDTH`, `GAME_HEIGHT`, `TILE_SIZE`, `SceneKey` enum
- `src/games/pixel-adventure/data/PAConstants.ts` — `PLAYER`, `ENEMY`, `ITEMS`, `COLORS`, `DEPTH`, `EnemyType`, `ItemType`
- `src/games/space-shooter/data/ShooterConstants.ts` — `SHOOTER`, `SHOOTER_COLORS`, `SHOOTER_DEPTH`, `WeaponType`, `PowerUpType`, `ShooterEnemyType`, `FormationType`
- `src/games/gomoku/data/GomokuConstants.ts` — `GOMOKU`, `GOMOKU_COLORS`, `GOMOKU_DEPTH`, `GomokuMode`, `GomokuDifficulty`

Each game file re-exports from shared as needed. Existing imports updated via path aliases.

### 2.2 Shared UI Style Constants and Button Helper

**File**: `src/shared/ui/UIStyles.ts`

```typescript
export const UI_FONT = 'monospace';

export const TEXT_STYLES = {
  TITLE: { fontSize: '42px', fontFamily: UI_FONT, fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 },
  SUBTITLE: { fontSize: '16px', fontFamily: UI_FONT },
  BUTTON_PRIMARY: { fontSize: '20px', fontFamily: UI_FONT, color: '#aaffaa' },
  BUTTON_SECONDARY: { fontSize: '18px', fontFamily: UI_FONT, color: '#aaaaaa' },
  HUD_LABEL: { fontSize: '14px', fontFamily: UI_FONT, color: '#888888' },
  HINT: { fontSize: '12px', fontFamily: UI_FONT, color: '#667788' },
} as const;
```

**File**: `src/shared/ui/UIHelpers.ts`

```typescript
// One-liner menu button creation
export function createMenuButton(
  scene: Phaser.Scene,
  x: number, y: number,
  label: string,
  style: object,
  handler: () => void
): Phaser.GameObjects.Text;

// Blinking text animation
export function addBlinkAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  minAlpha?: number,  // default 0.3
  duration?: number   // default 800
): void;

// Floating title animation
export function addFloatAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  amplitude?: number, // default 8
  duration?: number   // default 1500
): void;

// Touch device check
export function isTouch(scene: Phaser.Scene): boolean;
```

### 2.3 Shared Celebration Particles

**File**: `src/shared/ui/CelebrationEffect.ts`

```typescript
export function createCelebrationParticles(
  scene: Phaser.Scene,
  colors?: number[]  // defaults to standard 6-color palette
): void;
```

Replaces 3 separate implementations (~75 lines removed). Default colors are the 6-color palette already used by Shooter and Gomoku.

### 2.4 Unified Event Constants Pattern

Each game defines its own events object in its constants file:

```typescript
// In PAConstants.ts
export const PA_EVENTS = {
  HEALTH_CHANGED: 'healthChanged',
  SCORE_CHANGED: 'scoreChanged',
  LIVES_CHANGED: 'livesChanged',
} as const;

// SHOOTER_EVENTS already exists in ShooterGameScene.ts — move to ShooterConstants.ts

// In GomokuConstants.ts
export const GOMOKU_EVENTS = {
  TURN_CHANGED: 'turnChanged',
  MOVE_COUNT_CHANGED: 'moveCountChanged',
  MOVE_PLACED: 'movePlaced',
} as const;
```

Replace string literals with constant references throughout.

### 2.5 Fix High Score Persistence Duplication

`ShooterGameOverScene.ts` and `ShooterVictoryScene.ts` both manually implement high score comparison. `ScoreManager` already has `getHighScore()` and `saveHighScore()`.

Fix: Both scenes should import and use `ScoreManager`'s methods instead of raw localStorage calls. Remove the duplicated `HIGH_SCORE_KEY` constant from both scene files.

---

## Phase 3: Polish

### 3.1 Game Registry Pattern for main.ts

**File**: `src/GameRegistry.ts`

```typescript
interface GameRegistration {
  name: string;
  scenes: (typeof Phaser.Scene)[];
}

export const GAME_REGISTRY: GameRegistration[] = [
  {
    name: 'pixel-adventure',
    scenes: [TitleScene, GameScene, HUDScene, PauseScene, GameOverScene, VictoryScene],
  },
  // ... space-shooter, gomoku
];
```

`main.ts` becomes:
```typescript
const allScenes = [BootScene, HubScene, ...GAME_REGISTRY.flatMap(g => g.scenes)];
```

Adding Game #4: register one entry in `GAME_REGISTRY` + one entry in `GAME_CARDS` (for HubScene).

### 3.2 Typed Scene Data Map

**File**: `src/shared/utils/SceneDataMap.ts`

```typescript
export interface SceneDataMap {
  [SceneKey.GAME]: { level: number; score: number; lives: number };
  [SceneKey.SHOOTER_GAME]: { stage: number; score: number; lives: number };
  [SceneKey.GOMOKU_GAME]: { mode: GomokuMode; difficulty: GomokuDifficulty };
  [SceneKey.GOMOKU_GAME_OVER]: { winner: 0|1|2; isDraw: boolean; mode: GomokuMode; difficulty: GomokuDifficulty; moveCount: number };
  // ... etc
}
```

The `fadeToScene` utility can be typed against this map for compile-time safety on scene data.

### 3.3 GomokuAI Candidate Optimization

Currently `getCandidates()` does a full board scan every call. Optimize:
- Maintain a `candidateSet: Set<string>` as a class field
- After each move, incrementally add new neighbors within radius 2
- Remove the placed position from candidates
- Pass the set into `minimax` instead of recalculating

This reduces candidate generation from O(n^2) per evaluation to O(1) amortized per move.

---

## Files Changed Summary

### New Files (9)
| File | Purpose |
|------|---------|
| `src/shared/utils/SceneTransition.ts` | fadeToScene utility |
| `src/shared/scenes/BasePauseScene.ts` | Abstract pause scene |
| `src/shared/scenes/BaseGameOverScene.ts` | Abstract game over/victory scene |
| `src/shared/ui/UIStyles.ts` | Text style constants |
| `src/shared/ui/UIHelpers.ts` | Button, animation, touch helpers |
| `src/shared/ui/CelebrationEffect.ts` | Shared confetti particles |
| `src/hub/GameCards.ts` | Game card definitions for HubScene |
| `src/GameRegistry.ts` | Scene registration config |
| `src/shared/utils/SceneDataMap.ts` | Typed scene data interfaces |

### Deleted Files (3)
| File | Reason |
|------|--------|
| `src/shared/systems/CharacterSystem.ts` | Dead code (empty stubs) |
| `src/shared/systems/WeaponSystem.ts` | Dead code (empty stubs) |
| `src/shared/utils/AnimationHelper.ts` | Dead code (empty stubs) |

### Major Refactors (12+)
| File | Change |
|------|--------|
| `src/shared/utils/Constants.ts` | Strip to shared-only constants |
| `src/games/pixel-adventure/data/PAConstants.ts` | New: game-specific constants |
| `src/games/space-shooter/data/ShooterConstants.ts` | New: game-specific constants |
| `src/games/gomoku/data/GomokuConstants.ts` | New: game-specific constants |
| All PauseScenes (3) | Extend BasePauseScene (~10 lines each) |
| All GameOver/VictoryScenes (5) | Extend BaseGameOverScene (~20-30 lines each) |
| All TitleScenes (3) | Use UIHelpers, UIStyles, fadeToScene |
| All HUDScenes (3) | Use UIStyles, UIHelpers |
| `src/hub/HubScene.ts` | Data-driven card layout |
| `src/main.ts` | Use GameRegistry |
| `src/games/space-shooter/scenes/ShooterGameOverScene.ts` | Use ScoreManager for high scores |
| `src/games/space-shooter/scenes/ShooterVictoryScene.ts` | Use ScoreManager for high scores |
| `src/games/gomoku/systems/GomokuAI.ts` | Incremental candidate set |

### Import Updates (~30 files)
All files importing from `Constants.ts` need import path updates after the split.

---

## Verification Plan

1. `npx tsc --noEmit` — zero compile errors after each phase
2. `npm run dev` — dev server starts, no console errors
3. Hub: all 3 game cards visible, clickable, keyboard shortcuts work
4. Each game: title → game → pause (ESC) → resume → win/lose → game over screen → play again / hub
5. All fade transitions smooth, no double-click issues
6. Celebration particles appear on victory screens
7. High scores persist correctly in Space Shooter
8. Gomoku AI still responds correctly at all 3 difficulty levels

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Redundant lines | ~700+ | ~50 |
| Cost to add Game #4 | Edit 3 global files + create 10 scene files | Add 2 config entries + create 5 game-specific files |
| Constants.ts size | 321 lines | ~40 lines (shared only) |
| Pause scene code per game | ~80 lines | ~10 lines |
| GameOver scene code per game | ~150 lines | ~25 lines |
