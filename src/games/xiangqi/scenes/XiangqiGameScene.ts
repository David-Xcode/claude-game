// 中国象棋主游戏场景：选子交互、回合管理、AI 调度

import Phaser from 'phaser';
import { SceneKey } from '@shared/utils/Constants';
import { XiangqiMode, XiangqiDifficulty, Side, XIANGQI, XIANGQI_COLORS } from '../data/XiangqiConstants';
import { lockLandscape } from '@shared/utils/OrientationManager';
import { XiangqiBoard, Position } from '../systems/XiangqiBoard';
import { XiangqiRenderer } from '../systems/XiangqiRenderer';
import { XiangqiAI } from '../systems/XiangqiAI';

interface XiangqiGameData {
  mode: XiangqiMode;
  difficulty: XiangqiDifficulty;
}

export class XiangqiGameScene extends Phaser.Scene {
  private board!: XiangqiBoard;
  private boardRenderer!: XiangqiRenderer;
  private ai: XiangqiAI | null = null;
  private mode!: XiangqiMode;
  private difficulty!: XiangqiDifficulty;
  private selectedPos: Position | null = null;
  private validMoves: Position[] = [];
  private isAIThinking = false;
  private gameEnded = false;
  private moveCount = 0;

  constructor() {
    super({ key: SceneKey.XIANGQI_GAME });
  }

  init(data: XiangqiGameData): void {
    this.mode = data.mode;
    this.difficulty = data.difficulty;
  }

  create(): void {
    this.gameEnded = false;
    this.isAIThinking = false;
    this.moveCount = 0;
    this.selectedPos = null;
    this.validMoves = [];

    lockLandscape();
    this.cameras.main.setBackgroundColor(XIANGQI_COLORS.BG);
    this.cameras.main.fadeIn(400);

    // 初始化系统
    this.board = new XiangqiBoard();
    this.boardRenderer = new XiangqiRenderer(this);
    this.boardRenderer.drawBoard(this.difficulty);
    this.boardRenderer.drawAllPieces(this.board.grid);

    if (this.mode === XiangqiMode.SINGLE_PLAYER) {
      this.ai = new XiangqiAI(this.difficulty);
    } else {
      this.ai = null;
    }

    // 启动 HUD
    this.scene.launch(SceneKey.XIANGQI_HUD, {
      mode: this.mode,
      difficulty: this.difficulty,
    });

    // 初始状态事件
    this.events.emit('turnChanged', this.board.currentPlayer);
    this.events.emit('moveCountChanged', this.moveCount);

    // 指针输入
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    // 键盘：暂停
    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.gameEnded) {
        this.scene.pause();
        this.scene.launch(SceneKey.XIANGQI_PAUSE);
      }
    });

    this.events.on('shutdown', this.shutdown, this);
  }

  // ── 点击处理（选子→走子两步交互） ────────────

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameEnded || this.isAIThinking) return;

    // 单人模式下只允许红方操作
    if (this.mode === XiangqiMode.SINGLE_PLAYER && this.board.currentPlayer !== Side.RED) {
      return;
    }

    const pos = this.boardRenderer.screenToGrid(pointer.x, pointer.y);
    if (!pos) {
      this.deselectPiece();
      return;
    }

    const clickedPiece = this.board.grid[pos.row][pos.col];

    if (this.selectedPos) {
      // 已有选中棋子
      if (this.validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
        // 点击合法目标：执行走棋
        this.executeMove(this.selectedPos, pos);
      } else if (clickedPiece && clickedPiece.side === this.board.currentPlayer) {
        // 点击另一个己方棋子：切换选中
        this.selectPiece(pos);
      } else {
        // 点击其他位置：取消选中
        this.deselectPiece();
      }
    } else {
      // 未选中状态
      if (clickedPiece && clickedPiece.side === this.board.currentPlayer) {
        this.selectPiece(pos);
      }
    }
  }

  private selectPiece(pos: Position): void {
    this.selectedPos = pos;
    this.validMoves = this.board.getValidMoves(pos.row, pos.col);
    this.boardRenderer.clearSelection();
    this.boardRenderer.clearValidMoves();
    this.boardRenderer.highlightSelected(pos.row, pos.col);
    this.boardRenderer.showValidMoves(this.validMoves, this.board.grid);
  }

  private deselectPiece(): void {
    this.selectedPos = null;
    this.validMoves = [];
    this.boardRenderer.clearSelection();
    this.boardRenderer.clearValidMoves();
  }

  // ── 走棋逻辑 ──────────────────────────────────

  private executeMove(from: Position, to: Position): void {
    const piece = this.board.grid[from.row][from.col];
    if (!piece) return;

    if (!this.board.makeMove(from, to)) return;

    this.moveCount++;
    this.deselectPiece();
    this.boardRenderer.clearCheckWarning();

    // 更新显示
    this.boardRenderer.drawAllPieces(this.board.grid);
    this.boardRenderer.showLastMove(from, to);

    this.events.emit('moveCountChanged', this.moveCount);

    // 检查游戏结束
    if (this.board.isGameOver()) {
      this.handleGameEnd();
      return;
    }

    // 将军警告
    if (this.board.isInCheck) {
      const generalPos = this.board.findGeneral(this.board.currentPlayer);
      if (generalPos) {
        this.boardRenderer.showCheckWarning(generalPos.row, generalPos.col);
      }
      this.events.emit('checkStatusChanged', true, this.board.currentPlayer);
    } else {
      this.events.emit('checkStatusChanged', false, this.board.currentPlayer);
    }

    this.events.emit('turnChanged', this.board.currentPlayer);

    // AI 回合
    if (
      this.mode === XiangqiMode.SINGLE_PLAYER &&
      this.board.currentPlayer === Side.BLACK
    ) {
      this.scheduleAIMove();
    }
  }

  // ── AI 回合 ───────────────────────────────────

  private scheduleAIMove(): void {
    this.isAIThinking = true;

    const delay = Phaser.Math.Between(XIANGQI.AI_DELAY_MIN, XIANGQI.AI_DELAY_MAX);
    this.time.delayedCall(delay, () => {
      if (this.gameEnded || !this.ai) {
        this.isAIThinking = false;
        return;
      }

      const move = this.ai.getBestMove(this.board);
      this.isAIThinking = false;
      if (move) {
        this.executeMove(move.from, move.to);
      }
    });
  }

  // ── 游戏结束 ──────────────────────────────────

  private handleGameEnd(): void {
    this.gameEnded = true;

    this.time.delayedCall(XIANGQI.WIN_DELAY, () => {
      this.scene.stop(SceneKey.XIANGQI_HUD);
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.XIANGQI_GAME_OVER, {
          winner: this.board.gameResult === 'red_wins' ? Side.RED : Side.BLACK,
          mode: this.mode,
          difficulty: this.difficulty,
          moveCount: this.moveCount,
        });
      });
    });
  }

  private shutdown(): void {
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
    if (this.scene.isActive(SceneKey.XIANGQI_HUD) || this.scene.isPaused(SceneKey.XIANGQI_HUD)) {
      this.scene.stop(SceneKey.XIANGQI_HUD);
    }
    this.events.off('shutdown', this.shutdown, this);
  }
}
