// 五子棋标题场景：模式选择（单人/双人）+ 难度选择
// 支持 resize 时销毁并重建全部 UI

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { GomokuMode, GomokuDifficulty, GOMOKU_COLORS } from '../data/GomokuConstants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { fadeToScene } from '@shared/utils/SceneTransition';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

type SelectionPhase = 'mode' | 'difficulty';

export class GomokuTitleScene extends Phaser.Scene {
  private phase: SelectionPhase = 'mode';
  private modeTexts: Phaser.GameObjects.Text[] = [];
  private diffObjects: Phaser.GameObjects.GameObject[] = [];
  private subtitleText!: Phaser.GameObjects.Text;
  // 标题主体（浮动动画目标）
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.GOMOKU_TITLE });
  }

  create(): void {
    lockLandscape();
    this.phase = 'mode';
    this.modeTexts = [];
    this.diffObjects = [];

    this.cameras.main.setBackgroundColor(0x1a1410);
    this.cameras.main.fadeIn(500);

    this.buildUI();

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

    // resize 监听
    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  // ── UI 构建（create + resize 时调用） ─────────

  private buildUI(): void {
    const isTouch = this.sys.game.device.input.touch;

    // 装饰性迷你棋盘
    this.drawMiniBoardPreview();

    // 标题发光层
    this.add
      .text(layout.width / 2, layout.height / 4 - layout.scale(10), 'GOMOKU', {
        fontSize: layout.fontSize(48),
        color: '#deb887',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);

    // 标题主体
    this.titleText = this.add
      .text(layout.width / 2, layout.height / 4 - layout.scale(12), 'GOMOKU', {
        fontSize: layout.fontSize(48),
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.titleText,
      y: '-=6',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 副标题（动态显示当前选择阶段）
    const subLabel = this.phase === 'difficulty' ? '- Select Difficulty -' : '- Select Mode -';
    this.subtitleText = this.add
      .text(layout.width / 2, layout.height / 4 + layout.scale(25), subLabel, {
        fontSize: layout.fontSize(14),
        color: '#8b7355',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // 根据当前阶段创建按钮
    if (this.phase === 'mode') {
      this.createModeButtons(isTouch);
    } else {
      this.createDifficultyButtons(isTouch);
    }

    // 返回大厅
    const backLabel = isTouch ? '[ Back ]' : '[ ESC ] Back to Hub';
    const backText = this.add.text(layout.scale(20), layout.scale(20), backLabel, {
      fontSize: layout.fontSize(14),
      color: '#888888',
      fontFamily: 'monospace',
    });
    backText.setPadding(10, 8, 10, 8);
    backText.setInteractive();
    backText.on('pointerdown', () => this.goToHub());
  }

  // ── resize 处理 ───────────────────────────────

  private handleResize(): void {
    this.children.removeAll(true);
    this.tweens.killAll();
    this.modeTexts = [];
    this.diffObjects = [];
    this.buildUI();
  }

  // ── 模式选择 ──────────────────────────────────

  private createModeButtons(isTouch: boolean): void {
    const centerY = layout.height / 2 + layout.scale(20);

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
        .text(layout.width / 2, centerY + i * layout.scale(45), m.label, {
          fontSize: layout.fontSize(20),
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
    this.createDifficultyButtons(isTouch);
  }

  private createDifficultyButtons(isTouch: boolean): void {
    const centerY = layout.height / 2 + layout.scale(5);
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
          layout.width / 2,
          centerY + i * layout.scale(42),
          `${keyHint}${config.name}`,
          {
            fontSize: layout.fontSize(20),
            color: '#deb887',
            fontFamily: 'monospace',
          }
        )
        .setOrigin(0.5)
        .setPadding(40, 10, 40, 10)
        .setInteractive({ useHandCursor: true });

      // 难度颜色指示圆点
      const dotX = text.x - text.width / 2 - layout.scale(20);
      const dot = this.add.graphics();
      dot.fillStyle(config.boardColor, 1);
      dot.fillCircle(dotX, centerY + i * layout.scale(42), layout.scale(6, 3));
      dot.lineStyle(1, config.gridColor, 1);
      dot.strokeCircle(dotX, centerY + i * layout.scale(42), layout.scale(6, 3));

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#deb887'));
      text.on('pointerdown', () =>
        this.startGame(GomokuMode.SINGLE_PLAYER, diff)
      );

      this.diffObjects.push(text, dot);
    });

    // ESC 提示
    const backHint = this.add
      .text(layout.width / 2, centerY + layout.scale(140), 'ESC: Back', {
        fontSize: layout.fontSize(12),
        color: '#666655',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    this.diffObjects.push(backHint);
  }

  private showModeSelection(): void {
    this.phase = 'mode';
    this.subtitleText.setText('- Select Mode -');
    for (const t of this.diffObjects) t.destroy();
    this.diffObjects = [];
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
    const cellSize = layout.scale(24, 14);
    const gridCount = 9;
    const total = (gridCount - 1) * cellSize;
    const startX = layout.width / 2 - total / 2;
    const startY = layout.height / 2 - total / 2 + layout.scale(20);

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
    const stoneR = layout.scale(8, 4);
    g.fillStyle(GOMOKU_COLORS.STONE_BLACK, 1);
    g.fillCircle(startX + 3 * cellSize, startY + 3 * cellSize, stoneR);
    g.fillCircle(startX + 5 * cellSize, startY + 4 * cellSize, stoneR);
    g.fillCircle(startX + 4 * cellSize, startY + 5 * cellSize, stoneR);

    g.fillStyle(GOMOKU_COLORS.STONE_WHITE, 1);
    g.fillCircle(startX + 4 * cellSize, startY + 3 * cellSize, stoneR);
    g.fillCircle(startX + 4 * cellSize, startY + 4 * cellSize, stoneR);
    g.fillCircle(startX + 3 * cellSize, startY + 4 * cellSize, stoneR);
  }
}
