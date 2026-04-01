// 五子棋标题场景：模式选择（单人/双人）+ 难度选择

import Phaser from 'phaser';
import {
  SceneKey,
  GAME_WIDTH,
  GAME_HEIGHT,
  GomokuMode,
  GomokuDifficulty,
  GOMOKU_COLORS,
} from '@shared/utils/Constants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { fadeToScene } from '@shared/utils/SceneTransition';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

type SelectionPhase = 'mode' | 'difficulty';

export class GomokuTitleScene extends Phaser.Scene {
  private phase: SelectionPhase = 'mode';
  private modeTexts: Phaser.GameObjects.Text[] = [];
  private diffTexts: Phaser.GameObjects.Text[] = [];
  private subtitleText!: Phaser.GameObjects.Text;


  constructor() {
    super({ key: SceneKey.GOMOKU_TITLE });
  }

  create(): void {
    lockLandscape();
    this.phase = 'mode';
    this.modeTexts = [];
    this.diffTexts = [];

    this.cameras.main.setBackgroundColor(0x1a1410);
    this.cameras.main.fadeIn(500);

    const isTouch = this.sys.game.device.input.touch;

    // 装饰性迷你棋盘
    this.drawMiniBoardPreview();

    // 标题发光层
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 10, 'GOMOKU', {
        fontSize: '48px',
        color: '#deb887',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);

    // 标题主体
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 12, 'GOMOKU', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: '-=6',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 副标题（动态显示当前选择阶段）
    this.subtitleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 + 25, '- Select Mode -', {
        fontSize: '14px',
        color: '#8b7355',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // 模式选择按钮
    this.createModeButtons(isTouch);

    // 返回大厅
    const backLabel = isTouch ? '[ Back ]' : '[ ESC ] Back to Hub';
    const backText = this.add.text(20, 20, backLabel, {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    });
    backText.setPadding(10, 8, 10, 8);
    backText.setInteractive();
    backText.on('pointerdown', () => this.goToHub());

    // 键盘监听
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.phase === 'difficulty') {
        this.showModeSelection();
      } else {
        this.goToHub();
      }
    });

    this.input.keyboard?.on('keydown-ONE', () => this.handleKeyPress(0));
    this.input.keyboard?.on('keydown-TWO', () => this.handleKeyPress(1));
    this.input.keyboard?.on('keydown-THREE', () => this.handleKeyPress(2));
  }

  // ── 模式选择 ──────────────────────────────────

  private createModeButtons(isTouch: boolean): void {
    const centerY = GAME_HEIGHT / 2 + 20;

    const modes = [
      {
        label: isTouch ? '1 Player (vs AI)' : '[ 1 ] 1 Player (vs AI)',
        mode: GomokuMode.SINGLE_PLAYER,
      },
      {
        label: isTouch ? '2 Players (Local)' : '[ 2 ] 2 Players (Local)',
        mode: GomokuMode.TWO_PLAYER,
      },
    ];

    modes.forEach((m, i) => {
      const text = this.add
        .text(GAME_WIDTH / 2, centerY + i * 45, m.label, {
          fontSize: '20px',
          color: '#deb887',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setPadding(40, 12, 40, 12)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#deb887'));
      text.on('pointerdown', () => this.selectMode(m.mode));

      this.modeTexts.push(text);
    });
  }

  private selectMode(mode: GomokuMode): void {
    if (mode === GomokuMode.TWO_PLAYER) {
      this.startGame(mode, GomokuDifficulty.MEDIUM);
    } else {
      this.showDifficultySelection();
    }
  }

  // ── 难度选择 ──────────────────────────────────

  private showDifficultySelection(): void {
    this.phase = 'difficulty';
    this.subtitleText.setText('- Select Difficulty -');

    // 隐藏模式按钮
    for (const t of this.modeTexts) t.setVisible(false);

    const isTouch = this.sys.game.device.input.touch;
    const centerY = GAME_HEIGHT / 2 + 5;
    const difficulties = [
      GomokuDifficulty.EASY,
      GomokuDifficulty.MEDIUM,
      GomokuDifficulty.HARD,
    ];

    difficulties.forEach((diff, i) => {
      const config = DIFFICULTY_CONFIGS[diff];
      const keyHint = isTouch ? '' : `[ ${i + 1} ] `;
      const text = this.add
        .text(
          GAME_WIDTH / 2,
          centerY + i * 42,
          `${keyHint}${config.name}`,
          {
            fontSize: '20px',
            color: '#deb887',
            fontFamily: 'monospace',
          }
        )
        .setOrigin(0.5)
        .setPadding(40, 10, 40, 10)
        .setInteractive({ useHandCursor: true });

      // 难度颜色指示圆点
      const dotX = text.x - text.width / 2 - 20;
      const dot = this.add.graphics();
      dot.fillStyle(config.boardColor, 1);
      dot.fillCircle(dotX, centerY + i * 42, 6);
      dot.lineStyle(1, config.gridColor, 1);
      dot.strokeCircle(dotX, centerY + i * 42, 6);

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#deb887'));
      text.on('pointerdown', () =>
        this.startGame(GomokuMode.SINGLE_PLAYER, diff)
      );

      this.diffTexts.push(text);
    });

    // ESC 提示
    const backHint = this.add
      .text(GAME_WIDTH / 2, centerY + 140, 'ESC: Back', {
        fontSize: '12px',
        color: '#666655',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    this.diffTexts.push(backHint);
  }

  private showModeSelection(): void {
    this.phase = 'mode';
    this.subtitleText.setText('- Select Mode -');
    for (const t of this.diffTexts) t.destroy();
    this.diffTexts = [];
    for (const t of this.modeTexts) t.setVisible(true);
  }

  // ── 键盘处理 ──────────────────────────────────

  private handleKeyPress(index: number): void {
    if (this.phase === 'mode') {
      if (index === 0) this.selectMode(GomokuMode.SINGLE_PLAYER);
      else if (index === 1) this.selectMode(GomokuMode.TWO_PLAYER);
    } else {
      const difficulties = [
        GomokuDifficulty.EASY,
        GomokuDifficulty.MEDIUM,
        GomokuDifficulty.HARD,
      ];
      if (index < difficulties.length) {
        this.startGame(GomokuMode.SINGLE_PLAYER, difficulties[index]);
      }
    }
  }

  // ── 进入游戏 ──────────────────────────────────

  private startGame(mode: GomokuMode, difficulty: GomokuDifficulty): void {
    fadeToScene(this, SceneKey.GOMOKU_GAME, { mode, difficulty });
  }

  private goToHub(): void {
    fadeToScene(this, SceneKey.HUB, undefined, 400);
  }

  // ── 装饰棋盘预览 ──────────────────────────────

  private drawMiniBoardPreview(): void {
    const g = this.add.graphics();
    g.setAlpha(0.15);

    // 在背景画一个淡淡的棋盘网格
    const cellSize = 24;
    const gridCount = 9;
    const total = (gridCount - 1) * cellSize;
    const startX = GAME_WIDTH / 2 - total / 2;
    const startY = GAME_HEIGHT / 2 - total / 2 + 20;

    g.lineStyle(1, 0xdeb887, 1);
    for (let i = 0; i < gridCount; i++) {
      g.lineBetween(
        startX + i * cellSize,
        startY,
        startX + i * cellSize,
        startY + total
      );
      g.lineBetween(
        startX,
        startY + i * cellSize,
        startX + total,
        startY + i * cellSize
      );
    }

    // 几颗装饰棋子
    g.fillStyle(GOMOKU_COLORS.STONE_BLACK, 1);
    g.fillCircle(startX + 3 * cellSize, startY + 3 * cellSize, 8);
    g.fillCircle(startX + 5 * cellSize, startY + 4 * cellSize, 8);
    g.fillCircle(startX + 4 * cellSize, startY + 5 * cellSize, 8);

    g.fillStyle(GOMOKU_COLORS.STONE_WHITE, 1);
    g.fillCircle(startX + 4 * cellSize, startY + 3 * cellSize, 8);
    g.fillCircle(startX + 4 * cellSize, startY + 4 * cellSize, 8);
    g.fillCircle(startX + 3 * cellSize, startY + 4 * cellSize, 8);
  }
}
