// 中国象棋标题场景：模式选择（单人/双人）+ 难度选择

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
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

    const isTouch = this.sys.game.device.input.touch;

    // 装饰性迷你棋盘
    this.drawMiniBoardPreview();

    // 标题发光层
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 20, 'XIANGQI', {
        fontSize: '48px',
        color: '#d4a76a',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);

    // 标题主体
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 - 22, 'XIANGQI', {
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

    // 中文副标题
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 + 15, '中国象棋', {
        fontSize: '16px',
        color: '#8b7355',
        fontFamily: 'serif',
      })
      .setOrigin(0.5);

    // 阶段提示
    this.subtitleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 4 + 38, '- Select Mode -', {
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
    const centerY = GAME_HEIGHT / 2 + 30;

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
        .text(GAME_WIDTH / 2, centerY + i * 45, m.label, {
          fontSize: '20px',
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
    const centerY = GAME_HEIGHT / 2 + 15;
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
          GAME_WIDTH / 2,
          centerY + i * 42,
          `${keyHint}${config.name}`,
          {
            fontSize: '20px',
            color: '#d4a76a',
            fontFamily: 'monospace',
          }
        )
        .setOrigin(0.5)
        .setPadding(40, 10, 40, 10)
        .setInteractive({ useHandCursor: true });

      // 难度颜色指示
      const dotX = text.x - text.width / 2 - 20;
      const dot = this.add.graphics();
      dot.fillStyle(config.boardColor, 1);
      dot.fillCircle(dotX, centerY + i * 42, 6);
      dot.lineStyle(1, config.gridColor, 1);
      dot.strokeCircle(dotX, centerY + i * 42, 6);

      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#d4a76a'));
      text.on('pointerdown', () =>
        this.startGame(XiangqiMode.SINGLE_PLAYER, diff)
      );

      this.diffObjects.push(text, dot);
    });

    const backHint = this.add
      .text(GAME_WIDTH / 2, centerY + 140, 'ESC: Back', {
        fontSize: '12px',
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

    const cellSize = 24;
    const cols = 9;
    const rows = 10;
    const gridW = (cols - 1) * cellSize;
    const gridH = (rows - 1) * cellSize;
    const startX = GAME_WIDTH / 2 - gridW / 2;
    const startY = GAME_HEIGHT / 2 - gridH / 2 + 20;

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
    const r = 8;
    // 红方
    g.fillStyle(0xcc2222, 0.8);
    g.fillCircle(startX + 4 * cellSize, startY + 9 * cellSize, r);
    g.fillCircle(startX + 0 * cellSize, startY + 9 * cellSize, r);
    g.fillCircle(startX + 8 * cellSize, startY + 9 * cellSize, r);

    // 黑方
    g.fillStyle(0x444444, 0.8);
    g.fillCircle(startX + 4 * cellSize, startY + 0 * cellSize, r);
    g.fillCircle(startX + 0 * cellSize, startY + 0 * cellSize, r);
    g.fillCircle(startX + 8 * cellSize, startY + 0 * cellSize, r);
  }
}
