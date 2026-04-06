// 五子棋渲染器：程序化绘制棋盘、棋子、悬停预览、胜利高亮
// 支持动态布局，resize 时重算并重绘

import Phaser from 'phaser';
import { BoardLayout } from '@shared/utils/ResponsiveLayout';
import { GOMOKU, GOMOKU_COLORS, GOMOKU_DEPTH, GomokuDifficulty, getGomokuBoardLayout } from '../data/GomokuConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';
import { Position } from './GomokuBoard';

export class GomokuRenderer {
  private scene: Phaser.Scene;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private stoneGraphics!: Phaser.GameObjects.Graphics;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private winGraphics!: Phaser.GameObjects.Graphics;
  private lastMoveGraphics!: Phaser.GameObjects.Graphics;

  // 动态棋盘布局（resize 时更新）
  boardLayout!: BoardLayout;

  // 缓存当前难度（resize 时重绘需要）
  private currentDifficulty!: GomokuDifficulty;

  // 缓存当前棋盘状态（resize 时重绘棋子用）
  private placedStones: { row: number; col: number; player: 1 | 2 }[] = [];
  // 最后一手位置（resize 时重绘标记用）
  private lastMovePos: Position | null = null;
  // 胜利连线位置（resize 时重绘高亮用）
  private winLinePositions: Position[] | null = null;

  // 星位坐标（标准五子棋 15 路棋盘的 5 个星位）
  private static readonly STAR_POINTS: Position[] = [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 7, col: 7 },  // 天元
    { row: 11, col: 3 },
    { row: 11, col: 11 },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.boardLayout = getGomokuBoardLayout();
    this.boardGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.BOARD);
    this.stoneGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.STONES);
    this.hoverGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.HOVER);
    this.winGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.WIN_LINE);
    this.lastMoveGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.LAST_MOVE);
  }

  // ── 布局重算与整体重绘 ────────────────────────

  /** 重算布局参数（resize 时调用） */
  recalculateLayout(): void {
    this.boardLayout = getGomokuBoardLayout();
  }

  /** 整体重绘：棋盘 + 所有已落棋子 + 标记 + 胜利高亮 */
  redrawAll(): void {
    this.recalculateLayout();
    this.drawBoard(this.currentDifficulty);

    // 清除悬停预览（位置已失效）
    this.hoverGraphics.clear();

    // 重绘所有已落棋子
    this.stoneGraphics.clear();
    for (const s of this.placedStones) {
      this.renderStone(s.row, s.col, s.player);
    }

    // 重绘最后一手标记
    if (this.lastMovePos) {
      this.renderLastMoveMarker(this.lastMovePos.row, this.lastMovePos.col);
    }

    // 重绘胜利连线
    if (this.winLinePositions) {
      this.renderWinLine(this.winLinePositions);
    }
  }

  /** 注册 resize 监听器（由 GameScene 调用一次） */
  registerResizeHandler(): void {
    this.scene.scale.on('resize', this.onResize, this);
  }

  /** 移除 resize 监听器（由 GameScene shutdown 时调用） */
  removeResizeHandler(): void {
    this.scene.scale.off('resize', this.onResize, this);
  }

  private onResize(): void {
    this.redrawAll();
  }

  // ── 棋盘绘制 ──────────────────────────────────

  /** 绘制棋盘（桌面 + 棋盘面 + 网格线 + 星位） */
  drawBoard(difficulty: GomokuDifficulty): void {
    this.currentDifficulty = difficulty;
    const config = DIFFICULTY_CONFIGS[difficulty];
    const g = this.boardGraphics;
    g.clear();

    const { boardX, boardY, cellSize } = this.boardLayout;
    const gridTotal = (GOMOKU.GRID_SIZE - 1) * cellSize;
    const padding = Math.round(cellSize * 0.7);
    const boardLeft = boardX - padding;
    const boardTop = boardY - padding;
    const boardW = gridTotal + padding * 2;
    const boardH = gridTotal + padding * 2;

    // 桌面阴影
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(boardLeft + 4, boardTop + 4, boardW, boardH, 8);

    // 桌面背景
    g.fillStyle(config.tableColor, 1);
    g.fillRoundedRect(boardLeft - 6, boardTop - 6, boardW + 12, boardH + 12, 10);

    // 棋盘面
    g.fillStyle(config.boardColor, 1);
    g.fillRoundedRect(boardLeft, boardTop, boardW, boardH, 6);

    // 棋盘边框
    g.lineStyle(2, config.gridColor, 0.6);
    g.strokeRoundedRect(boardLeft, boardTop, boardW, boardH, 6);

    // 网格线
    g.lineStyle(1, config.gridColor, 0.9);
    for (let i = 0; i < GOMOKU.GRID_SIZE; i++) {
      const x = boardX + i * cellSize;
      const y = boardY + i * cellSize;
      // 竖线
      g.lineBetween(x, boardY, x, boardY + gridTotal);
      // 横线
      g.lineBetween(boardX, y, boardX + gridTotal, y);
    }

    // 星位（小圆点）
    const starRadius = Math.max(2, Math.round(cellSize * 0.08));
    g.fillStyle(config.gridColor, 1);
    for (const sp of GomokuRenderer.STAR_POINTS) {
      const { x, y } = this.gridToScreen(sp.row, sp.col);
      g.fillCircle(x, y, starRadius);
    }
  }

  // ── 棋子绘制 ──────────────────────────────────

  /** 绘制一颗棋子（对外接口，同时缓存落子记录） */
  drawStone(row: number, col: number, player: 1 | 2): void {
    this.placedStones.push({ row, col, player });
    this.renderStone(row, col, player);
  }

  /** 内部棋子渲染（不修改缓存） */
  private renderStone(row: number, col: number, player: 1 | 2): void {
    const { x, y } = this.gridToScreen(row, col);
    const g = this.stoneGraphics;
    const r = this.boardLayout.pieceRadius;
    const hlOffset = Math.max(1, Math.round(r * 0.2));

    if (player === 1) {
      // 黑棋：深色主体 + 高光
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK_HIGHLIGHT, 0.4);
      g.fillCircle(x - hlOffset, y - hlOffset, r * 0.4);
    } else {
      // 白棋：浅色主体 + 阴影边缘 + 高光
      g.fillStyle(0x999999, 0.3);
      g.fillCircle(x + 1, y + 1, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE_HIGHLIGHT, 0.5);
      g.fillCircle(x - hlOffset, y - hlOffset, r * 0.35);
    }
  }

  // ── 最后一手标记 ──────────────────────────────

  /** 绘制最后一手标记（对外接口，缓存位置） */
  drawLastMoveMarker(row: number, col: number): void {
    this.lastMovePos = { row, col };
    this.renderLastMoveMarker(row, col);
  }

  /** 内部渲染最后一手标记 */
  private renderLastMoveMarker(row: number, col: number): void {
    const { x, y } = this.gridToScreen(row, col);
    const markerR = Math.max(2, Math.round(this.boardLayout.pieceRadius * 0.22));
    this.lastMoveGraphics.clear();
    this.lastMoveGraphics.fillStyle(GOMOKU_COLORS.LAST_MOVE, 1);
    this.lastMoveGraphics.fillCircle(x, y, markerR);
  }

  // ── 悬停预览 ──────────────────────────────────

  /** 绘制悬停预览（半透明棋子） */
  drawHoverPreview(row: number, col: number, player: 1 | 2): void {
    const { x, y } = this.gridToScreen(row, col);
    const g = this.hoverGraphics;
    g.clear();

    const color = player === 1 ? GOMOKU_COLORS.STONE_BLACK : GOMOKU_COLORS.STONE_WHITE;
    g.fillStyle(color, 0.3);
    g.fillCircle(x, y, this.boardLayout.pieceRadius);
  }

  /** 清除悬停预览 */
  clearHoverPreview(): void {
    this.hoverGraphics.clear();
  }

  // ── 胜利高亮 ──────────────────────────────────

  /** 高亮胜利连线（对外接口，缓存位置） */
  highlightWinLine(positions: Position[]): void {
    this.winLinePositions = positions;
    this.renderWinLine(positions);
  }

  /** 内部渲染胜利连线 */
  private renderWinLine(positions: Position[]): void {
    const g = this.winGraphics;
    g.clear();
    const r = this.boardLayout.pieceRadius;

    // 每颗获胜棋子画金色光环
    for (const pos of positions) {
      const { x, y } = this.gridToScreen(pos.row, pos.col);
      g.lineStyle(3, GOMOKU_COLORS.WIN_LINE, 0.9);
      g.strokeCircle(x, y, r + 2);
    }

    // 在首尾棋子之间画连线
    if (positions.length >= 2) {
      const sorted = [...positions].sort(
        (a, b) => a.row - b.row || a.col - b.col
      );
      const first = this.gridToScreen(sorted[0].row, sorted[0].col);
      const last = this.gridToScreen(
        sorted[sorted.length - 1].row,
        sorted[sorted.length - 1].col
      );
      g.lineStyle(2, GOMOKU_COLORS.WIN_LINE, 0.6);
      g.lineBetween(first.x, first.y, last.x, last.y);
    }
  }

  // ── 坐标转换 ──────────────────────────────────

  /** 屏幕坐标转网格坐标（吸附到最近交叉点） */
  screenToGrid(
    screenX: number,
    screenY: number
  ): Position | null {
    const { boardX, boardY, cellSize } = this.boardLayout;
    const col = Math.round((screenX - boardX) / cellSize);
    const row = Math.round((screenY - boardY) / cellSize);

    if (row < 0 || row >= GOMOKU.GRID_SIZE || col < 0 || col >= GOMOKU.GRID_SIZE) {
      return null;
    }

    // 检查是否在吸附半径内
    const { x, y } = this.gridToScreen(row, col);
    const dist = Math.sqrt((screenX - x) ** 2 + (screenY - y) ** 2);
    if (dist > cellSize * 0.6) return null;

    return { row, col };
  }

  /** 网格坐标转屏幕坐标 */
  gridToScreen(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardLayout.boardX + col * this.boardLayout.cellSize,
      y: this.boardLayout.boardY + row * this.boardLayout.cellSize,
    };
  }

  // ── 清理 ──────────────────────────────────────

  /** 清除所有棋子和标记（用于重开） */
  clearAll(): void {
    this.stoneGraphics.clear();
    this.hoverGraphics.clear();
    this.winGraphics.clear();
    this.lastMoveGraphics.clear();
    this.placedStones = [];
    this.lastMovePos = null;
    this.winLinePositions = null;
  }
}
