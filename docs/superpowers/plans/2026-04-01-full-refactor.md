# Full Project Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~700 lines of redundant code across 3 games, extract shared base scenes and utilities, make the hub data-driven, split bloated constants, and add typed scene data — reducing the cost of adding future games from "edit 3 global files + create 10 scenes" to "add 2 config entries + create game-specific files."

**Architecture:** Extract universal patterns (pause overlay, game-over screen, scene transitions, UI buttons, celebration particles) into shared base classes and utilities. Make HubScene and main.ts data-driven via a game registry. Split the 321-line Constants.ts into per-game constant files. Add a SceneDataMap for compile-time type safety.

**Tech Stack:** Phaser 3.80.1, TypeScript 5.4, Vite 5.4

**Spec:** `docs/superpowers/specs/2026-04-01-full-refactor-design.md`

---

## Task 1: Create SceneTransition utility

**Files:**
- Create: `src/shared/utils/SceneTransition.ts`

- [ ] **Step 1: Create the utility file**

```typescript
// src/shared/utils/SceneTransition.ts
// 场景过渡工具：统一处理防重复点击 + 淡出 + 切换

import Phaser from 'phaser';

const TRANSITION_KEY = '__transitioning';

/**
 * 淡出当前场景并切换到目标场景（自动防重复调用）
 */
export function fadeToScene(
  scene: Phaser.Scene,
  targetKey: string,
  data?: object,
  duration = 500
): void {
  if (scene.data.get(TRANSITION_KEY)) return;
  scene.data.set(TRANSITION_KEY, true);

  scene.cameras.main.fadeOut(duration, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(targetKey, data);
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/SceneTransition.ts
git commit -m "feat: add fadeToScene transition utility"
```

---

## Task 2: Create UIHelpers and CelebrationEffect utilities

**Files:**
- Create: `src/shared/ui/UIHelpers.ts`
- Create: `src/shared/ui/CelebrationEffect.ts`

- [ ] **Step 1: Create UIHelpers**

```typescript
// src/shared/ui/UIHelpers.ts
// 共享 UI 工具：按钮创建、动画、触屏检测

import Phaser from 'phaser';

const UI_FONT = 'monospace';

/** 检查是否为触屏设备 */
export function isTouch(scene: Phaser.Scene): boolean {
  return !!scene.sys.game.device.input.touch;
}

/** 创建带触控热区的菜单按钮，返回 Text 对象 */
export function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color: string,
  fontSize: string,
  handler: () => void
): Phaser.GameObjects.Text {
  const text = scene.add
    .text(x, y, label, {
      fontSize,
      color,
      fontFamily: UI_FONT,
    })
    .setOrigin(0.5)
    .setPadding(40, 15, 40, 15)
    .setInteractive({ useHandCursor: true });
  text.once('pointerdown', handler);
  return text;
}

/** 闪烁动画（用于 "Press Enter" 等提示文字） */
export function addBlinkAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  minAlpha = 0.3,
  duration = 800
): void {
  scene.tweens.add({
    targets: target,
    alpha: minAlpha,
    duration,
    yoyo: true,
    repeat: -1,
  });
}

/** 浮动动画（用于标题文字） */
export function addFloatAnimation(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  amplitude = 8,
  duration = 1500
): void {
  scene.tweens.add({
    targets: target,
    y: `-=${amplitude}`,
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
```

- [ ] **Step 2: Create CelebrationEffect**

```typescript
// src/shared/ui/CelebrationEffect.ts
// 共享撒花粒子特效

import Phaser from 'phaser';
import { GAME_WIDTH } from '@shared/utils/Constants';

const DEFAULT_COLORS = [0xffdd44, 0xff4444, 0x44ff44, 0x4488ff, 0xff44ff, 0x44ffff];

/** 创建撒花粒子庆祝特效 */
export function createCelebrationParticles(
  scene: Phaser.Scene,
  colors: number[] = DEFAULT_COLORS
): void {
  for (const color of colors) {
    const key = `confetti_${color}`;
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      g.fillStyle(color);
      g.fillRect(0, 0, 5, 5);
      g.generateTexture(key, 5, 5);
      g.destroy();
    }

    scene.add.particles(GAME_WIDTH / 2, -10, key, {
      x: { min: -GAME_WIDTH / 2, max: GAME_WIDTH / 2 },
      speed: { min: 40, max: 130 },
      angle: { min: 75, max: 105 },
      lifespan: 5000,
      scale: { start: 1, end: 0.2 },
      rotate: { min: 0, max: 360 },
      gravityY: 40,
      frequency: 120,
    });
  }
}
```

- [ ] **Step 3: Create directories and verify**

```bash
mkdir -p src/shared/ui
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui/
git commit -m "feat: add shared UI helpers and celebration effect"
```

---

## Task 3: Create BasePauseScene

**Files:**
- Create: `src/shared/scenes/BasePauseScene.ts`

- [ ] **Step 1: Create BasePauseScene**

```typescript
// src/shared/scenes/BasePauseScene.ts
// 暂停场景基类：半透明遮罩 + 继续/退出按钮

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { isTouch, createMenuButton } from '@shared/ui/UIHelpers';

export interface PauseSceneConfig {
  gameSceneKey: string;
  hudSceneKey: string;
  /** 退出后跳转的场景，默认 HUB */
  quitTargetKey?: string;
  /** 退出按钮文案，默认 "Quit to Hub" */
  quitLabel?: string;
}

export abstract class BasePauseScene extends Phaser.Scene {
  protected abstract getConfig(): PauseSceneConfig;

  create(): void {
    const config = this.getConfig();
    const touch = isTouch(this);
    const quitLabel = config.quitLabel ?? 'Quit to Hub';
    const quitTarget = config.quitTargetKey ?? SceneKey.HUB;

    // 半透明遮罩
    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.6
    );

    // "PAUSED" 标题
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'PAUSED', {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 继续
    const resume = () => {
      this.scene.resume(config.gameSceneKey);
      this.scene.stop();
    };

    // 退出
    const quit = () => {
      this.scene.stop(config.gameSceneKey);
      this.scene.stop(config.hudSceneKey);
      this.scene.start(quitTarget);
      this.scene.stop();
    };

    const resumeLabel = touch ? 'Resume' : '[ ESC ] Resume';
    createMenuButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, resumeLabel, '#aaffaa', '20px', resume);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, quitText, '#ffaaaa', '20px', quit);

    // 键盘绑定
    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-Q', quit);
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/shared/scenes/BasePauseScene.ts
git commit -m "feat: add BasePauseScene abstract class"
```

---

## Task 4: Create BaseGameOverScene

**Files:**
- Create: `src/shared/scenes/BaseGameOverScene.ts`

- [ ] **Step 1: Create BaseGameOverScene**

```typescript
// src/shared/scenes/BaseGameOverScene.ts
// 游戏结束/胜利场景基类：标题 + 统计信息 + 重玩/退出按钮 + 可选撒花

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { fadeToScene } from '@shared/utils/SceneTransition';
import { isTouch, createMenuButton, addBlinkAnimation, addFloatAnimation } from '@shared/ui/UIHelpers';
import { createCelebrationParticles } from '@shared/ui/CelebrationEffect';

export interface GameOverSceneConfig {
  /** 背景色 */
  backgroundColor: number;
  /** 大标题文字 */
  title: string;
  /** 标题颜色 */
  titleColor: string;
  /** 副标题（可选） */
  subtitle?: string;
  /** 统计信息行（可选） */
  stats?: string[];
  /** 是否显示撒花特效 */
  showCelebration: boolean;
  /** 是否启用标题浮动动画 */
  floatTitle: boolean;
  /** "再来一次"跳转的场景 */
  replaySceneKey: string;
  /** "再来一次"传递的数据 */
  replayData: object;
  /** 退出跳转的场景（默认 HUB） */
  quitSceneKey?: string;
  /** 退出按钮文案（默认 "Back to Hub"） */
  quitLabel?: string;
}

export abstract class BaseGameOverScene extends Phaser.Scene {
  protected abstract getConfig(data: any): GameOverSceneConfig;

  create(data: any): void {
    const config = this.getConfig(data);
    const touch = isTouch(this);
    const quitTarget = config.quitSceneKey ?? SceneKey.HUB;
    const quitLabel = config.quitLabel ?? 'Back to Hub';

    this.cameras.main.setBackgroundColor(config.backgroundColor);
    this.cameras.main.fadeIn(800);

    // 标题
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 10, config.title, {
        fontSize: '40px',
        color: config.titleColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    if (config.floatTitle) {
      addFloatAnimation(this, title);
    }

    // 副标题
    let nextY = GAME_HEIGHT / 2 - 40;
    if (config.subtitle) {
      this.add
        .text(GAME_WIDTH / 2, nextY, config.subtitle, {
          fontSize: '18px',
          color: '#aaccff',
          fontFamily: 'monospace',
          align: 'center',
        })
        .setOrigin(0.5);
      nextY += 35;
    }

    // 统计信息
    if (config.stats) {
      for (const line of config.stats) {
        this.add
          .text(GAME_WIDTH / 2, nextY, line, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        nextY += 28;
      }
    }

    // 撒花
    if (config.showCelebration) {
      createCelebrationParticles(this);
    }

    // 按钮区域
    const btnY = Math.max(nextY + 30, GAME_HEIGHT / 2 + 50);

    const replayLabel = touch ? 'Play Again' : '[ ENTER ] Play Again';
    const replayBtn = createMenuButton(
      this, GAME_WIDTH / 2, btnY, replayLabel, '#aaffaa', '20px',
      () => fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    addBlinkAnimation(this, replayBtn);

    const quitText = touch ? quitLabel : `[ Q ] ${quitLabel}`;
    createMenuButton(
      this, GAME_WIDTH / 2, btnY + 45, quitText, '#aaaaaa', '18px',
      () => fadeToScene(this, quitTarget)
    );

    // 键盘
    this.input.keyboard?.once('keydown-ENTER', () =>
      fadeToScene(this, config.replaySceneKey, config.replayData)
    );
    this.input.keyboard?.once('keydown-Q', () =>
      fadeToScene(this, quitTarget)
    );
  }
}
```

- [ ] **Step 2: Create directories and verify**

```bash
mkdir -p src/shared/scenes
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/scenes/BaseGameOverScene.ts
git commit -m "feat: add BaseGameOverScene abstract class"
```

---

## Task 5: Refactor all PauseScenes to use BasePauseScene

**Files:**
- Rewrite: `src/games/pixel-adventure/scenes/PauseScene.ts`
- Rewrite: `src/games/space-shooter/scenes/ShooterPauseScene.ts`
- Rewrite: `src/games/gomoku/scenes/GomokuPauseScene.ts`

- [ ] **Step 1: Rewrite Pixel Adventure PauseScene**

```typescript
// src/games/pixel-adventure/scenes/PauseScene.ts
// Pixel Adventure 暂停场景

import { SceneKey } from '@shared/utils/Constants';
import { BasePauseScene, PauseSceneConfig } from '@shared/scenes/BasePauseScene';

export class PauseScene extends BasePauseScene {
  constructor() {
    super({ key: SceneKey.PAUSE });
  }

  protected getConfig(): PauseSceneConfig {
    return {
      gameSceneKey: SceneKey.GAME,
      hudSceneKey: SceneKey.HUD,
      quitTargetKey: SceneKey.TITLE,
      quitLabel: 'Quit to Title',
    };
  }
}
```

- [ ] **Step 2: Rewrite Space Shooter PauseScene**

```typescript
// src/games/space-shooter/scenes/ShooterPauseScene.ts
// Space Shooter 暂停场景

import { SceneKey } from '@shared/utils/Constants';
import { BasePauseScene, PauseSceneConfig } from '@shared/scenes/BasePauseScene';

export class ShooterPauseScene extends BasePauseScene {
  constructor() {
    super({ key: SceneKey.SHOOTER_PAUSE });
  }

  protected getConfig(): PauseSceneConfig {
    return {
      gameSceneKey: SceneKey.SHOOTER_GAME,
      hudSceneKey: SceneKey.SHOOTER_HUD,
    };
  }
}
```

- [ ] **Step 3: Rewrite Gomoku PauseScene**

```typescript
// src/games/gomoku/scenes/GomokuPauseScene.ts
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
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/games/pixel-adventure/scenes/PauseScene.ts src/games/space-shooter/scenes/ShooterPauseScene.ts src/games/gomoku/scenes/GomokuPauseScene.ts
git commit -m "refactor: all PauseScenes now extend BasePauseScene"
```

---

## Task 6: Refactor all GameOver/Victory scenes to use BaseGameOverScene

**Files:**
- Rewrite: `src/games/pixel-adventure/scenes/GameOverScene.ts`
- Rewrite: `src/games/pixel-adventure/scenes/VictoryScene.ts`
- Rewrite: `src/games/space-shooter/scenes/ShooterGameOverScene.ts`
- Rewrite: `src/games/space-shooter/scenes/ShooterVictoryScene.ts`
- Rewrite: `src/games/gomoku/scenes/GomokuGameOverScene.ts`

- [ ] **Step 1: Rewrite Pixel Adventure GameOverScene**

```typescript
// src/games/pixel-adventure/scenes/GameOverScene.ts
// Pixel Adventure 游戏结束场景

import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

export class GameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.GAME_OVER });
  }

  protected getConfig(data: { score: number }): GameOverSceneConfig {
    return {
      backgroundColor: 0x1a0a0a,
      title: 'GAME OVER',
      titleColor: '#ff4444',
      stats: [`Final Score: ${data.score ?? 0}`],
      showCelebration: false,
      floatTitle: false,
      replaySceneKey: SceneKey.GAME,
      replayData: { level: 0, score: 0, lives: 3 },
      quitSceneKey: SceneKey.TITLE,
      quitLabel: 'Title Screen',
    };
  }
}
```

- [ ] **Step 2: Rewrite Pixel Adventure VictoryScene**

```typescript
// src/games/pixel-adventure/scenes/VictoryScene.ts
// Pixel Adventure 通关场景

import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

export class VictoryScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.VICTORY });
  }

  protected getConfig(data: { score: number }): GameOverSceneConfig {
    return {
      backgroundColor: 0x0a1a0a,
      title: 'YOU WIN!',
      titleColor: '#ffdd44',
      subtitle: 'Congratulations!\nAll levels cleared!',
      stats: [`Final Score: ${data.score ?? 0}`],
      showCelebration: true,
      floatTitle: true,
      replaySceneKey: SceneKey.GAME,
      replayData: { level: 0, score: 0, lives: 3 },
      quitSceneKey: SceneKey.TITLE,
      quitLabel: 'Title Screen',
    };
  }
}
```

- [ ] **Step 3: Rewrite Space Shooter GameOverScene**

Note: This scene has high score logic. We keep it as a custom override of `create()` that calls `super.create()`.

```typescript
// src/games/space-shooter/scenes/ShooterGameOverScene.ts
// Space Shooter 游戏结束场景（含最高分逻辑）

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';
import { ScoreManager } from '../systems/ScoreManager';

export class ShooterGameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.SHOOTER_GAME_OVER });
  }

  protected getConfig(data: { score: number; stage: number }): GameOverSceneConfig {
    const score = data.score ?? 0;

    // 通过 ScoreManager 的静态方法处理高分
    const scoreMgr = new ScoreManager(this, score);
    const prevHigh = scoreMgr.getHighScore();
    const isNewHigh = score > prevHigh;
    scoreMgr.saveHighScore();

    const highScore = Math.max(score, prevHigh);
    const highLabel = isNewHigh ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`;

    return {
      backgroundColor: 0x0a0508,
      title: 'GAME OVER',
      titleColor: '#ff4444',
      stats: [
        `Final Score: ${score}`,
        highLabel,
      ],
      showCelebration: false,
      floatTitle: false,
      replaySceneKey: SceneKey.SHOOTER_GAME,
      replayData: { stage: 0, score: 0, lives: 3 },
    };
  }

  // 高分闪烁需要在 create 后追加
  create(data: { score: number; stage: number }): void {
    super.create(data);

    const score = data.score ?? 0;
    const scoreMgr = new ScoreManager(this, 0);
    const prevHigh = scoreMgr.getHighScore();
    if (score > prevHigh || score === Math.max(score, prevHigh)) {
      // 高分行已由 getConfig 中的 stats 输出
      // 此处可添加额外动画效果（如果需要）
    }
  }
}
```

- [ ] **Step 4: Rewrite Space Shooter VictoryScene**

```typescript
// src/games/space-shooter/scenes/ShooterVictoryScene.ts
// Space Shooter 通关场景（含最高分逻辑）

import { SceneKey } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';
import { ScoreManager } from '../systems/ScoreManager';

export class ShooterVictoryScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.SHOOTER_VICTORY });
  }

  protected getConfig(data: { score: number }): GameOverSceneConfig {
    const score = data.score ?? 0;

    const scoreMgr = new ScoreManager(this, score);
    const prevHigh = scoreMgr.getHighScore();
    const isNewHigh = score > prevHigh;
    scoreMgr.saveHighScore();

    const highScore = Math.max(score, prevHigh);
    const highLabel = isNewHigh ? 'NEW HIGH SCORE!' : `High Score: ${highScore}`;

    return {
      backgroundColor: 0x050a15,
      title: 'MISSION COMPLETE',
      titleColor: '#ffdd44',
      subtitle: 'All stages cleared!\nThe galaxy is safe.',
      stats: [
        `Final Score: ${score}`,
        highLabel,
      ],
      showCelebration: true,
      floatTitle: true,
      replaySceneKey: SceneKey.SHOOTER_GAME,
      replayData: { stage: 0, score: 0, lives: 3 },
    };
  }
}
```

- [ ] **Step 5: Rewrite Gomoku GameOverScene**

```typescript
// src/games/gomoku/scenes/GomokuGameOverScene.ts
// Gomoku 结算场景（胜负 + 平局）

import { SceneKey, GomokuMode, GomokuDifficulty } from '@shared/utils/Constants';
import { BaseGameOverScene, GameOverSceneConfig } from '@shared/scenes/BaseGameOverScene';

const STATS_KEY = 'gomokuStats';

interface GomokuStats {
  wins: number;
  losses: number;
  draws: number;
}

interface GomokuGameOverData {
  winner: 0 | 1 | 2;
  isDraw: boolean;
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
  moveCount: number;
}

export class GomokuGameOverScene extends BaseGameOverScene {
  constructor() {
    super({ key: SceneKey.GOMOKU_GAME_OVER });
  }

  protected getConfig(data: GomokuGameOverData): GameOverSceneConfig {
    const { winner, isDraw, mode, difficulty, moveCount } = data;

    this.saveStats(winner, isDraw, mode);

    if (isDraw) {
      return {
        backgroundColor: 0x0a0a10,
        title: 'DRAW!',
        titleColor: '#aaaaaa',
        subtitle: 'The board is full — no winner.',
        stats: [`Total Moves: ${moveCount}`],
        showCelebration: false,
        floatTitle: false,
        replaySceneKey: SceneKey.GOMOKU_GAME,
        replayData: { mode, difficulty },
      };
    }

    const winnerColor = winner === 1 ? 'BLACK' : 'WHITE';
    let subtitle = '';
    if (mode === GomokuMode.SINGLE_PLAYER) {
      subtitle = winner === 1 ? 'You Win!' : 'AI Wins!';
    } else {
      subtitle = `Player ${winner} Wins!`;
    }

    return {
      backgroundColor: 0x0a0a10,
      title: `${winnerColor} WINS!`,
      titleColor: '#ffdd44',
      subtitle,
      stats: [`Total Moves: ${moveCount}`],
      showCelebration: true,
      floatTitle: true,
      replaySceneKey: SceneKey.GOMOKU_GAME,
      replayData: { mode, difficulty },
    };
  }

  private saveStats(winner: 0 | 1 | 2, isDraw: boolean, mode: GomokuMode): void {
    if (mode !== GomokuMode.SINGLE_PLAYER) return;

    let stats: GomokuStats = { wins: 0, losses: 0, draws: 0 };
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed.wins === 'number' &&
          typeof parsed.losses === 'number' &&
          typeof parsed.draws === 'number'
        ) {
          stats = parsed;
        }
      }
    } catch {
      // 损坏数据使用默认值
    }

    if (isDraw) stats.draws++;
    else if (winner === 1) stats.wins++;
    else stats.losses++;

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // 存储空间不足
    }
  }
}
```

- [ ] **Step 6: Verify compilation and runtime**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/games/pixel-adventure/scenes/GameOverScene.ts src/games/pixel-adventure/scenes/VictoryScene.ts src/games/space-shooter/scenes/ShooterGameOverScene.ts src/games/space-shooter/scenes/ShooterVictoryScene.ts src/games/gomoku/scenes/GomokuGameOverScene.ts
git commit -m "refactor: all GameOver/Victory scenes now extend BaseGameOverScene"
```

---

## Task 7: Apply fadeToScene to TitleScenes

**Files:**
- Modify: `src/games/pixel-adventure/scenes/TitleScene.ts`
- Modify: `src/games/space-shooter/scenes/ShooterTitleScene.ts`
- Modify: `src/games/gomoku/scenes/GomokuTitleScene.ts`

- [ ] **Step 1: Update each TitleScene to use `fadeToScene` instead of manual fade+guard pattern**

In each file, replace the manual `let started = false; const startGame = () => { ... fadeOut ... }` pattern with a call to `fadeToScene(this, targetKey, data)`.

For example in `TitleScene.ts`, replace lines 91-99:
```typescript
// OLD:
let started = false;
const startGame = () => {
  if (started) return;
  started = true;
  this.cameras.main.fadeOut(500);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
  });
};

// NEW:
import { fadeToScene } from '@shared/utils/SceneTransition';
const startGame = () => fadeToScene(this, SceneKey.GAME, { level: 0, score: 0, lives: 3 });
```

Apply same pattern to `ShooterTitleScene.ts` (lines 118-130) and `GomokuTitleScene.ts` (lines 149-153, 157-161).

Also update the `goToHub()` methods in ShooterTitleScene and GomokuTitleScene to use `fadeToScene`.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/games/pixel-adventure/scenes/TitleScene.ts src/games/space-shooter/scenes/ShooterTitleScene.ts src/games/gomoku/scenes/GomokuTitleScene.ts
git commit -m "refactor: TitleScenes use fadeToScene utility"
```

---

## Task 8: Delete dead code files

**Files:**
- Delete: `src/shared/systems/CharacterSystem.ts`
- Delete: `src/shared/systems/WeaponSystem.ts`
- Delete: `src/shared/utils/AnimationHelper.ts`

- [ ] **Step 1: Verify no imports reference these files**

```bash
grep -r "CharacterSystem\|WeaponSystem\|AnimationHelper" src/ --include="*.ts" -l
```
Expected: Only the files themselves (no other consumers).

- [ ] **Step 2: Delete and commit**

```bash
rm src/shared/systems/CharacterSystem.ts src/shared/systems/WeaponSystem.ts src/shared/utils/AnimationHelper.ts
npx tsc --noEmit
git add -A
git commit -m "chore: remove dead code stubs (CharacterSystem, WeaponSystem, AnimationHelper)"
```

---

## Task 9: Split Constants.ts into per-game constant files

**Files:**
- Modify: `src/shared/utils/Constants.ts` (strip to shared-only)
- Create: `src/games/pixel-adventure/data/PAConstants.ts`
- Create: `src/games/space-shooter/data/ShooterConstants.ts`
- Create: `src/games/gomoku/data/GomokuConstants.ts`
- Modify: ~30 files to update imports

- [ ] **Step 1: Create PAConstants.ts**

Move `GRAVITY`, `PLAYER`, `ENEMY`, `ITEMS`, `COLORS`, `EnemyType`, `ItemType`, `DEPTH` from Constants.ts into this file. Re-export `GAME_WIDTH`, `GAME_HEIGHT`, `TILE_SIZE` from shared Constants.

- [ ] **Step 2: Create ShooterConstants.ts**

Move `SHOOTER`, `SHOOTER_COLORS`, `SHOOTER_DEPTH`, `WeaponType`, `PowerUpType`, `ShooterEnemyType`, `FormationType` from Constants.ts. Move `SHOOTER_EVENTS` from `ShooterGameScene.ts` into this file.

- [ ] **Step 3: Create GomokuConstants.ts**

Move `GOMOKU`, `GOMOKU_COLORS`, `GOMOKU_DEPTH`, `GomokuMode`, `GomokuDifficulty` from Constants.ts. Add `GOMOKU_EVENTS` constant.

- [ ] **Step 4: Strip Constants.ts to shared-only**

Keep only: `GAME_WIDTH`, `GAME_HEIGHT`, `TILE_SIZE`, `SceneKey` enum.

- [ ] **Step 5: Update all imports across the project**

Use find-and-replace to update import paths. Each game's files import from their own constants file instead of shared.

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "refactor: split Constants.ts into per-game constant files"
```

---

## Task 10: Data-driven HubScene layout

**Files:**
- Create: `src/hub/GameCards.ts`
- Rewrite: `src/hub/HubScene.ts` (createGameCards method)

- [ ] **Step 1: Create GameCards.ts**

```typescript
// src/hub/GameCards.ts
// 游戏卡片定义：数据驱动 Hub 布局

import Phaser from 'phaser';
import { SceneKey, GOMOKU_COLORS } from '@shared/utils/Constants';

export interface GameCardDef {
  title: string;
  sceneKey: SceneKey;
  keyboardKey: string; // Phaser key name: "ONE", "TWO", etc.
  drawPreview: (g: Phaser.GameObjects.Graphics) => void;
}

export const GAME_CARDS: GameCardDef[] = [
  {
    title: 'Pixel Adventure',
    sceneKey: SceneKey.TITLE,
    keyboardKey: 'ONE',
    drawPreview: drawPixelAdventurePreview,
  },
  {
    title: 'Space Shooter',
    sceneKey: SceneKey.SHOOTER_TITLE,
    keyboardKey: 'TWO',
    drawPreview: drawSpaceShooterPreview,
  },
  {
    title: 'Gomoku',
    sceneKey: SceneKey.GOMOKU_TITLE,
    keyboardKey: 'THREE',
    drawPreview: drawGomokuPreview,
  },
];

// Preview functions moved from HubScene (keep existing drawing code)
function drawPixelAdventurePreview(g: Phaser.GameObjects.Graphics): void {
  // ... (move existing code from HubScene.drawPixelAdventurePreview)
}

function drawSpaceShooterPreview(g: Phaser.GameObjects.Graphics): void {
  // ... (move existing code from HubScene.drawSpaceShooterPreview)
}

function drawGomokuPreview(g: Phaser.GameObjects.Graphics): void {
  // ... (move existing code from HubScene.drawGomokuPreview)
}
```

- [ ] **Step 2: Refactor HubScene.createGameCards to be data-driven**

Replace hardcoded card creation with dynamic layout:
```typescript
private createGameCards(): void {
  const isTouch = this.sys.game.device.input.touch;
  const count = GAME_CARDS.length;
  const gap = 30;
  const maxCardW = 220;
  const cardW = Math.min(maxCardW, (GAME_WIDTH - 80 - gap * (count - 1)) / count);
  const cardH = cardW; // 正方形卡片
  const totalW = cardW * count + gap * (count - 1);
  const startX = (GAME_WIDTH - totalW) / 2;
  const startY = (GAME_HEIGHT - cardH) / 2 + 15;

  GAME_CARDS.forEach((def, i) => {
    const card = this.createCard(
      startX + i * (cardW + gap), startY, cardW, cardH,
      def.title,
      isTouch ? 'Tap to play' : `Press ${i + 1}`,
      def.sceneKey,
      (g) => { def.drawPreview(g); return g; }
    );
    this.cards.push(card);
  });
}
```

- [ ] **Step 3: Refactor setupInput to be data-driven**

```typescript
private setupInput(): void {
  GAME_CARDS.forEach((def) => {
    this.input.keyboard?.on(`keydown-${def.keyboardKey}`, () => {
      this.selectGame(def.sceneKey);
    });
  });
}
```

- [ ] **Step 4: Remove drawPixelAdventurePreview, drawSpaceShooterPreview, drawGomokuPreview from HubScene**

These methods are now in GameCards.ts.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add src/hub/GameCards.ts src/hub/HubScene.ts
git commit -m "refactor: HubScene uses data-driven card layout from GameCards"
```

---

## Task 11: Game Registry for main.ts

**Files:**
- Create: `src/GameRegistry.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create GameRegistry.ts**

```typescript
// src/GameRegistry.ts
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

/** 核心场景（始终加载） */
export const CORE_SCENES = [BootScene, HubScene];

/** 所有游戏的场景列表 */
export const GAME_SCENES = [
  // Pixel Adventure
  TitleScene, GameScene, HUDScene, PauseScene, GameOverScene, VictoryScene,
  // Space Shooter
  ShooterTitleScene, ShooterGameScene, ShooterHUDScene, ShooterPauseScene, ShooterGameOverScene, ShooterVictoryScene,
  // Gomoku
  GomokuTitleScene, GomokuGameScene, GomokuHUDScene, GomokuPauseScene, GomokuGameOverScene,
];

/** 所有场景（传给 Phaser config） */
export const ALL_SCENES = [...CORE_SCENES, ...GAME_SCENES];
```

- [ ] **Step 2: Simplify main.ts**

```typescript
// src/main.ts
// 游戏入口

import Phaser from 'phaser';
import { gameConfig } from './config';
import { ALL_SCENES } from './GameRegistry';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: ALL_SCENES,
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.refresh();
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js');
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/GameRegistry.ts src/main.ts
git commit -m "refactor: centralize scene registration in GameRegistry"
```

---

## Task 12: Typed Scene Data Map

**Files:**
- Create: `src/shared/utils/SceneDataMap.ts`

- [ ] **Step 1: Create SceneDataMap**

```typescript
// src/shared/utils/SceneDataMap.ts
// 类型化场景数据：编译期校验场景间传递的数据

import { SceneKey, GomokuMode, GomokuDifficulty } from '@shared/utils/Constants';

export interface SceneDataMap {
  [SceneKey.GAME]: { level: number; score: number; lives: number };
  [SceneKey.GAME_OVER]: { score: number };
  [SceneKey.VICTORY]: { score: number };
  [SceneKey.SHOOTER_GAME]: { stage: number; score: number; lives: number };
  [SceneKey.SHOOTER_GAME_OVER]: { score: number; stage: number };
  [SceneKey.SHOOTER_VICTORY]: { score: number };
  [SceneKey.GOMOKU_GAME]: { mode: GomokuMode; difficulty: GomokuDifficulty };
  [SceneKey.GOMOKU_GAME_OVER]: {
    winner: 0 | 1 | 2;
    isDraw: boolean;
    mode: GomokuMode;
    difficulty: GomokuDifficulty;
    moveCount: number;
  };
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add src/shared/utils/SceneDataMap.ts
git commit -m "feat: add SceneDataMap for typed scene data"
```

---

## Task 13: GomokuAI incremental candidate optimization

**Files:**
- Modify: `src/games/gomoku/systems/GomokuAI.ts`

- [ ] **Step 1: Add incremental candidate set to GomokuAI**

Add a `candidateCache` that updates incrementally when moves are made, instead of full-board scanning every `getCandidates()` call. The public API adds `notifyMove(row, col)` to update the cache, and `getBestMove` uses the cached set.

Key changes:
- Add `private candidateCache: Set<string>` field
- Add `initCandidates(grid)` that builds initial set
- Add `updateCandidates(grid, row, col)` that adds neighbors of new move
- Modify `getBestMove` to use cache, falling back to full scan if cache is empty
- Keep `getCandidates(grid)` as private fallback for minimax's internal simulation (which still needs full scan since it mutates grid temporarily)

- [ ] **Step 2: Update GomokuGameScene to call notifyMove**

After each `placeStone`, call `this.ai?.notifyMove(row, col)`.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/games/gomoku/systems/GomokuAI.ts src/games/gomoku/scenes/GomokuGameScene.ts
git commit -m "perf: GomokuAI uses incremental candidate set for top-level moves"
```

---

## Task 14: Final verification and cleanup

- [ ] **Step 1: Full compilation check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Start dev server and verify all games work**

```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null; npm run dev
```

Verify:
- Hub shows 3 cards, all clickable, keyboard 1/2/3 works
- Each game: title → gameplay → pause (ESC) → resume → win/lose → result screen → play again / hub
- Celebration particles on victory screens
- High scores in Space Shooter persist correctly
- Gomoku AI responds at all difficulty levels

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete 3-phase project refactoring"
```
