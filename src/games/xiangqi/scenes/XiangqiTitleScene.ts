// 中国象棋标题场景：模式选择（单人/双人）+ 难度选择
// 支持 resize 时销毁并重建全部 UI

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { XiangqiMode, XiangqiDifficulty, XIANGQI_COLORS } from '../data/XiangqiConstants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { fadeToScene } from '@shared/utils/SceneTransition';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

type SelectionPhase = 'mode' | 'difficulty';

export class XiangqiTitleScene extends Phaser.Scene {
  private phase: SelectionPhase = 'mode';
  private modeTexts: Phaser.GameObjects.Text[] = [];
  private diffObjects: Phaser.GameObjects.GameObject[] = [];
  private subtitleText!: Phaser.GameObjects.Text;
  // 标题主体（浮动动画目标）
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.XIANGQI_TITLE });
  }

  create(): void {
    lockLandscape();
    this.phase = 'mode';
    this.modeTexts = [];
    this.diffObjects = [];

    this.cameras.main.setBackgroundColor(XIANGQI_COLORS.BG);
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
      .text(layout.width / 2, layout.height / 4 - layout.scale(20), 'XIANGQI', {
        fontSize: layout.fontSize(48),
        color: '#d4a76a',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);

    // 标题主体
    this.titleText = this.add
      .text(layout.width / 2, layout.height / 4 - layout.scale(22), 'XIANGQI', {
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

    // 中文副标题
    this.add
      .text(layout.width / 2, layout.height / 4 + layout.scale(15), '中国象棋', {
        fontSize: layout.fontSize(16),
        color: '#8b7355',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    // 阶段提示
    const subLabel = this.phase === 'difficulty' ? '- Select Difficulty -' : '- Select Mode -';
    this.subtitleText = this.add
      .text(layout.width / 2, layout.height / 4 + layout.scale(38), subLabel, {
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
    const backText = this.add.text(layout.safeLeft + layout.scale(20), layout.safeTop + layout.scale(20), backLabel, {
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
    const centerY = layout.height / 2 + layout.scale(30);

    const modes = [
      {
        label: isTouch ? '1 Player (vs AI)' : '[ 1 ] 1 Player (vs AI)',
        mode: XiangqiMode.SINGLE_PLAYER,
      },
      {
        label: isTouch ? '2 Players (Local)' : '[ 2 ] 2 Players (Local)',
        mode: XiangqiMode.TWO_PLAYER,
      },
    ];

    modes.forEach((m, i) => {
      const text = this.add
        .text(layout.width / 2, centerY + i * layout.scale(45), m.label, {
          fontSize: layout.fontSize(20),
          color: '#d4a76a',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setPadding(40, 12, 40, 12)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#d4a76a'));
      text.on('pointerdown', () => this.selectMode(m.mode));

      this.modeTexts.push(text);
    });
  }

  private selectMode(mode: XiangqiMode): void {
    if (mode === XiangqiMode.TWO_PLAYER) {
      this.startGame(mode, XiangqiDifficulty.MEDIUM);
    } else {
      this.showDifficultySelection();
    }
  }

  // ── 难度选择 ──────────────────────────────────

  private showDifficultySelection(): void {
    this.phase = 'difficulty';
    this.subtitleText.setText('- Select Difficulty -');

    for (const t of this.modeTexts) t.setVisible(false);

    const isTouch = this.sys.game.device.input.touch;
    this.createDifficultyButtons(isTouch);
  }

  private createDifficultyButtons(isTouch: boolean): void {
    const centerY = layout.height / 2 + layout.scale(15);
    const difficulties = [
      XiangqiDifficulty.EASY,
      XiangqiDifficulty.MEDIUM,
      XiangqiDifficulty.HARD,
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
            color: '#d4a76a',
            fontFamily: 'monospace',
          }
        )
        .setOrigin(0.5)
        .setPadding(40, 10, 40, 10)
        .setInteractive({ useHandCursor: true });

      // 难度颜色指示
      const dotX = text.x - text.width / 2 - layout.scale(20);
      const dot = this.add.graphics();
      dot.fillStyle(config.boardColor, 1);
      dot.fillCircle(dotX, centerY + i * layout.scale(42), layout.scale(6, 3));
      dot.lineStyle(1, config.gridColor, 1);
      dot.strokeCircle(dotX, centerY + i * layout.scale(42), layout.scale(6, 3));

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#d4a76a'));
      text.on('pointerdown', () =>
        this.startGame(XiangqiMode.SINGLE_PLAYER, diff)
      );

      this.diffObjects.push(text, dot);
    });

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
      if (index === 0) this.selectMode(XiangqiMode.SINGLE_PLAYER);
      else if (index === 1) this.selectMode(XiangqiMode.TWO_PLAYER);
    } else {
      const difficulties = [
        XiangqiDifficulty.EASY,
        XiangqiDifficulty.MEDIUM,
        XiangqiDifficulty.HARD,
      ];
      if (index < difficulties.length) {
        this.startGame(XiangqiMode.SINGLE_PLAYER, difficulties[index]);
      }
    }
  }

  // ── 进入游戏 ──────────────────────────────────

  private startGame(mode: XiangqiMode, difficulty: XiangqiDifficulty): void {
    fadeToScene(this, SceneKey.XIANGQI_GAME, { mode, difficulty });
  }

  private goToHub(): void {
    fadeToScene(this, SceneKey.HUB, undefined, 400);
  }

  // ── 装饰棋盘预览 ──────────────────────────────

  private drawMiniBoardPreview(): void {
    const g = this.add.graphics();
    g.setAlpha(0.12);

    const cellSize = layout.scale(24, 14);
    const cols = 9;
    const rows = 10;
    const gridW = (cols - 1) * cellSize;
    const gridH = (rows - 1) * cellSize;
    const startX = layout.width / 2 - gridW / 2;
    const startY = layout.height / 2 - gridH / 2 + layout.scale(20);

    // 横线
    g.lineStyle(1, 0xd4a76a, 1);
    for (let r = 0; r < rows; r++) {
      g.lineBetween(startX, startY + r * cellSize, startX + gridW, startY + r * cellSize);
    }

    // 竖线（河界断开）
    for (let c = 0; c < cols; c++) {
      const x = startX + c * cellSize;
      if (c === 0 || c === cols - 1) {
        g.lineBetween(x, startY, x, startY + gridH);
      } else {
        g.lineBetween(x, startY, x, startY + 4 * cellSize);
        g.lineBetween(x, startY + 5 * cellSize, x, startY + gridH);
      }
    }

    // 几个装饰棋子
    const stoneR = layout.scale(8, 4);
    // 红方
    g.fillStyle(0xcc2222, 0.8);
    g.fillCircle(startX + 4 * cellSize, startY + 9 * cellSize, stoneR);
    g.fillCircle(startX + 0 * cellSize, startY + 9 * cellSize, stoneR);
    g.fillCircle(startX + 8 * cellSize, startY + 9 * cellSize, stoneR);

    // 黑方
    g.fillStyle(0x444444, 0.8);
    g.fillCircle(startX + 4 * cellSize, startY + 0 * cellSize, stoneR);
    g.fillCircle(startX + 0 * cellSize, startY + 0 * cellSize, stoneR);
    g.fillCircle(startX + 8 * cellSize, startY + 0 * cellSize, stoneR);
  }
}
