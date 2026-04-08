// 五子棋主游戏场景：棋盘交互、回合管理、AI 调度

import Phaser from 'phaser';
import { SceneKey } from '@shared/utils/Constants';
import { GomokuMode, GomokuDifficulty, GOMOKU } from '../data/GomokuConstants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { GomokuBoard } from '../systems/GomokuBoard';
import { GomokuRenderer } from '../systems/GomokuRenderer';
import { GomokuAI } from '../systems/GomokuAI';

interface GomokuGameData {
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
}

export class GomokuGameScene extends Phaser.Scene {
  private board!: GomokuBoard;
  private boardRenderer!: GomokuRenderer;
  private ai: GomokuAI | null = null;
  private mode!: GomokuMode;
  private difficulty!: GomokuDifficulty;
  private isAIThinking = false;
  private gameEnded = false;
  private moveCount = 0;
  // 跟踪当前悬停位置，避免重复绘制
  private lastHoverRow = -1;
  private lastHoverCol = -1;

  constructor() {
    super({ key: SceneKey.GOMOKU_GAME });
  }

  init(data: GomokuGameData): void {
    this.mode = data.mode;
    this.difficulty = data.difficulty;
  }

  create(): void {
    this.gameEnded = false;
    this.isAIThinking = false;
    this.moveCount = 0;
    this.lastHoverRow = -1;
    this.lastHoverCol = -1;

    lockLandscape();
    this.cameras.main.setBackgroundColor(0x1a1410);
    this.cameras.main.fadeIn(400);

    // 初始化系统
    this.board = new GomokuBoard();
    this.boardRenderer = new GomokuRenderer(this);
    this.boardRenderer.drawBoard(this.difficulty);

    if (this.mode === GomokuMode.SINGLE_PLAYER) {
      this.ai = new GomokuAI(this.difficulty);
    } else {
      this.ai = null;
    }

    // 启动 HUD 场景
    this.scene.launch(SceneKey.GOMOKU_HUD, {
      mode: this.mode,
      difficulty: this.difficulty,
    });

    // 发送初始状态
    this.events.emit('turnChanged', this.board.currentPlayer);
    this.events.emit('moveCountChanged', this.moveCount);

    // 指针输入
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    // 键盘：暂停
    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.gameEnded) {
        this.scene.pause();
        this.scene.launch(SceneKey.GOMOKU_PAUSE);
      }
    });

    // 注册 resize 监听器，棋盘动态适配
    this.boardRenderer.registerResizeHandler();

    // 注册 shutdown 回调，确保事件监听器被清理
    this.events.on('shutdown', this.shutdown, this);
  }

  // ── 指针事件 ──────────────────────────────────

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.isAIThinking) {
      this.boardRenderer.clearHoverPreview();
      return;
    }

    const pos = this.boardRenderer.screenToGrid(pointer.x, pointer.y);
    if (!pos || !this.board.isValidMove(pos.row, pos.col)) {
      if (this.lastHoverRow !== -1) {
        this.boardRenderer.clearHoverPreview();
        this.lastHoverRow = -1;
        this.lastHoverCol = -1;
      }
      return;
    }

    if (pos.row !== this.lastHoverRow || pos.col !== this.lastHoverCol) {
      this.lastHoverRow = pos.row;
      this.lastHoverCol = pos.col;
      this.boardRenderer.drawHoverPreview(
        pos.row,
        pos.col,
        this.board.currentPlayer
      );
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.isAIThinking) return;

    // 单人模式下只允许人类玩家（黑棋 = 1）落子
    if (this.mode === GomokuMode.SINGLE_PLAYER && this.board.currentPlayer !== 1) {
      return;
    }

    const pos = this.boardRenderer.screenToGrid(pointer.x, pointer.y);
    if (!pos) return;

    this.placeStone(pos.row, pos.col);
  }

  // ── 落子逻辑 ──────────────────────────────────

  private placeStone(row: number, col: number): void {
    const player = this.board.currentPlayer;
    if (!this.board.placeStone(row, col)) return;

    // 增量更新 AI 候选缓存
    this.ai?.notifyMove(this.board.grid, row, col);

    this.moveCount++;
    this.boardRenderer.drawStone(row, col, player);
    this.boardRenderer.drawLastMoveMarker(row, col);
    this.boardRenderer.clearHoverPreview();
    this.lastHoverRow = -1;
    this.lastHoverCol = -1;

    // 通知 HUD
    this.events.emit('movePlaced', { row, col, player });
    this.events.emit('moveCountChanged', this.moveCount);

    // 检查游戏结束
    if (this.board.isGameOver()) {
      this.handleGameEnd();
      return;
    }

    // 通知 HUD 换手
    this.events.emit('turnChanged', this.board.currentPlayer);

    // AI 回合
    if (
      this.mode === GomokuMode.SINGLE_PLAYER &&
      this.board.currentPlayer === 2
    ) {
      this.scheduleAIMove();
    }
  }

  // ── AI 回合 ───────────────────────────────────

  private scheduleAIMove(): void {
    this.isAIThinking = true;

    const delay = Phaser.Math.Between(GOMOKU.AI_DELAY_MIN, GOMOKU.AI_DELAY_MAX);
    this.time.delayedCall(delay, () => {
      if (this.gameEnded || !this.ai || !this.sys.isActive()) {
        this.isAIThinking = false;
        return;
      }

      const move = this.ai.getBestMove(this.board.grid);
      this.isAIThinking = false;
      this.placeStone(move.row, move.col);
    });
  }

  // ── 游戏结束 ──────────────────────────────────

  private handleGameEnd(): void {
    this.gameEnded = true;

    // 胜利高亮
    if (this.board.winLine) {
      this.boardRenderer.highlightWinLine(this.board.winLine);
    }

    // 延迟后切换到结算场景
    this.time.delayedCall(GOMOKU.WIN_DELAY, () => {
      if (!this.sys.isActive()) return;
      this.scene.stop(SceneKey.GOMOKU_HUD);
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GOMOKU_GAME_OVER, {
          winner: this.board.winner,
          isDraw: this.board.isDraw,
          mode: this.mode,
          difficulty: this.difficulty,
          moveCount: this.moveCount,
        });
      });
    });
  }

  private shutdown(): void {
    this.boardRenderer.removeResizeHandler();
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
    // HUD 依赖本场景存在，本场景关闭时同步关闭
    if (this.scene.isActive(SceneKey.GOMOKU_HUD) || this.scene.isPaused(SceneKey.GOMOKU_HUD)) {
      this.scene.stop(SceneKey.GOMOKU_HUD);
    }
    this.events.off('shutdown', this.shutdown, this);
  }
}
