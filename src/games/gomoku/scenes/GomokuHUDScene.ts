// 五子棋 HUD 场景：玩家指示器、回合数、暂停按钮
// 支持 resize 时销毁并重建全部 UI

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { GomokuMode, GomokuDifficulty, GOMOKU_COLORS, GOMOKU_DEPTH } from '../data/GomokuConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

interface HUDData {
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
}

export class GomokuHUDScene extends Phaser.Scene {
  private player1Label!: Phaser.GameObjects.Text;
  private player2Label!: Phaser.GameObjects.Text;
  private player1Dot!: Phaser.GameObjects.Graphics;
  private player2Dot!: Phaser.GameObjects.Graphics;
  private moveText!: Phaser.GameObjects.Text;
  private mode!: GomokuMode;
  private difficulty!: GomokuDifficulty;

  // 运行时状态（resize 后还原）
  private currentPlayer: 1 | 2 = 1;
  private currentMoveCount = 0;

  // 保存事件回调引用，以便 shutdown 时取消订阅
  private onTurnChanged!: (player: 1 | 2) => void;
  private onMoveCountChanged!: (count: number) => void;

  constructor() {
    super({ key: SceneKey.GOMOKU_HUD });
  }

  create(data: HUDData): void {
    this.mode = data.mode;
    this.difficulty = data.difficulty;

    this.buildUI();

    // ── 监听 GameScene 事件 ──
    this.onTurnChanged = (player: 1 | 2) => {
      this.currentPlayer = player;
      this.updateActivePlayer(player);
    };
    this.onMoveCountChanged = (count: number) => {
      this.currentMoveCount = count;
      this.moveText.setText(`Move: ${count}`);
    };

    const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
    gameScene.events.on('turnChanged', this.onTurnChanged);
    gameScene.events.on('moveCountChanged', this.onMoveCountChanged);

    // resize 监听
    this.scale.on('resize', this.handleResize, this);

    // 注册 shutdown 回调清理事件监听
    this.events.on('shutdown', this.shutdown, this);
  }

  // ── UI 构建（create + resize 时调用） ─────────

  private buildUI(): void {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const margin = layout.scale(70, 40);

    // ── 左侧：Player 1（黑棋）指示器 ──
    const p1X = margin;
    const p1Y = layout.height / 2 - layout.scale(40);

    this.player1Dot = this.add.graphics().setDepth(GOMOKU_DEPTH.UI);
    this.drawPlayerDot(this.player1Dot, p1X, p1Y, 1, this.currentPlayer === 1);

    this.player1Label = this.add
      .text(p1X, p1Y + layout.scale(22), this.mode === GomokuMode.SINGLE_PLAYER ? 'You' : 'Player 1', {
        fontSize: layout.fontSize(13),
        color: this.currentPlayer === 1 ? '#ffffff' : '#666666',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    this.add
      .text(p1X, p1Y + layout.scale(38), 'BLACK', {
        fontSize: layout.fontSize(10),
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 右侧：Player 2（白棋）指示器 ──
    const p2X = layout.width - margin;
    const p2Y = layout.height / 2 - layout.scale(40);

    this.player2Dot = this.add.graphics().setDepth(GOMOKU_DEPTH.UI);
    this.drawPlayerDot(this.player2Dot, p2X, p2Y, 2, this.currentPlayer === 2);

    const p2Name =
      this.mode === GomokuMode.SINGLE_PLAYER
        ? `AI (${config.name})`
        : 'Player 2';
    this.player2Label = this.add
      .text(p2X, p2Y + layout.scale(22), p2Name, {
        fontSize: layout.fontSize(13),
        color: this.currentPlayer === 2 ? '#ffffff' : '#aaaaaa',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    this.add
      .text(p2X, p2Y + layout.scale(38), 'WHITE', {
        fontSize: layout.fontSize(10),
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 顶部中央：回合数 ──
    this.moveText = this.add
      .text(layout.width / 2, layout.safeTop + layout.scale(16), `Move: ${this.currentMoveCount}`, {
        fontSize: layout.fontSize(14),
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 暂停按钮 ──
    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      const pauseBtn = this.add
        .text(layout.width - layout.scale(30), layout.safeTop + layout.scale(16), '❚❚', {
          fontSize: layout.fontSize(18),
          color: '#888888',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setDepth(GOMOKU_DEPTH.UI)
        .setPadding(15, 10, 15, 10)
        .setInteractive();

      pauseBtn.on('pointerdown', () => {
        const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
        gameScene.scene.pause();
        this.scene.launch(SceneKey.GOMOKU_PAUSE);
      });
    }
  }

  // ── resize 处理 ───────────────────────────────

  private handleResize(): void {
    // 销毁所有 UI 对象并重建
    this.children.removeAll(true);
    this.buildUI();
  }

  private shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
    if (gameScene) {
      gameScene.events.off('turnChanged', this.onTurnChanged);
      gameScene.events.off('moveCountChanged', this.onMoveCountChanged);
    }
    this.events.off('shutdown', this.shutdown, this);
  }

  /** 更新当前活跃玩家的视觉指示 */
  private updateActivePlayer(activePlayer: 1 | 2): void {
    const margin = layout.scale(70, 40);
    const p1X = margin;
    const p1Y = layout.height / 2 - layout.scale(40);
    const p2X = layout.width - margin;
    const p2Y = layout.height / 2 - layout.scale(40);

    this.player1Dot.clear();
    this.drawPlayerDot(this.player1Dot, p1X, p1Y, 1, activePlayer === 1);
    this.player1Label.setColor(activePlayer === 1 ? '#ffffff' : '#666666');

    this.player2Dot.clear();
    this.drawPlayerDot(this.player2Dot, p2X, p2Y, 2, activePlayer === 2);
    this.player2Label.setColor(activePlayer === 2 ? '#ffffff' : '#666666');
  }

  /** 绘制玩家棋子指示圆点 */
  private drawPlayerDot(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    player: 1 | 2,
    active: boolean
  ): void {
    const r = layout.scale(14, 8);
    const hlOffset = Math.max(1, Math.round(r * 0.2));

    // 活跃指示光环
    if (active) {
      g.lineStyle(2, GOMOKU_COLORS.PLAYER_ACTIVE, 0.8);
      g.strokeCircle(x, y, r + 4);
    }

    // 棋子
    if (player === 1) {
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK, active ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK_HIGHLIGHT, 0.3);
      g.fillCircle(x - hlOffset, y - hlOffset, r * 0.4);
    } else {
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE, active ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE_HIGHLIGHT, 0.4);
      g.fillCircle(x - hlOffset, y - hlOffset, r * 0.35);
    }
  }
}
