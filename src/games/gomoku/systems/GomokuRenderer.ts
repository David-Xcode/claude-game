// 五子棋渲染器：程序化绘制棋盘、棋子、悬停预览、胜利高亮

import Phaser from 'phaser';
import { GOMOKU, GOMOKU_COLORS, GOMOKU_DEPTH, GomokuDifficulty } from '../data/GomokuConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';
import { Position } from './GomokuBoard';

export class GomokuRenderer {
  private scene: Phaser.Scene;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private stoneGraphics!: Phaser.GameObjects.Graphics;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private winGraphics!: Phaser.GameObjects.Graphics;
  private lastMoveGraphics!: Phaser.GameObjects.Graphics;

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
    this.boardGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.BOARD);
    this.stoneGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.STONES);
    this.hoverGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.HOVER);
    this.winGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.WIN_LINE);
    this.lastMoveGraphics = scene.add.graphics().setDepth(GOMOKU_DEPTH.LAST_MOVE);
  }

  /** 绘制棋盘（桌面 + 棋盘面 + 网格线 + 星位） */
  drawBoard(difficulty: GomokuDifficulty): void {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const g = this.boardGraphics;
    g.clear();

    const gridTotal = (GOMOKU.GRID_SIZE - 1) * GOMOKU.CELL_SIZE;
    const padding = 20;
    const boardLeft = GOMOKU.BOARD_X - padding;
    const boardTop = GOMOKU.BOARD_Y - padding;
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
      const x = GOMOKU.BOARD_X + i * GOMOKU.CELL_SIZE;
      const y = GOMOKU.BOARD_Y + i * GOMOKU.CELL_SIZE;
      // 竖线
      g.lineBetween(x, GOMOKU.BOARD_Y, x, GOMOKU.BOARD_Y + gridTotal);
      // 横线
      g.lineBetween(GOMOKU.BOARD_X, y, GOMOKU.BOARD_X + gridTotal, y);
    }

    // 星位（小圆点）
    g.fillStyle(config.gridColor, 1);
    for (const sp of GomokuRenderer.STAR_POINTS) {
      const { x, y } = this.gridToScreen(sp.row, sp.col);
      g.fillCircle(x, y, 3);
    }
  }

  /** 绘制一颗棋子 */
  drawStone(row: number, col: number, player: 1 | 2): void {
    const { x, y } = this.gridToScreen(row, col);
    const g = this.stoneGraphics;
    const r = GOMOKU.STONE_RADIUS;

    if (player === 1) {
      // 黑棋：深色主体 + 高光
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK_HIGHLIGHT, 0.4);
      g.fillCircle(x - 3, y - 3, r * 0.4);
    } else {
      // 白棋：浅色主体 + 阴影边缘 + 高光
      g.fillStyle(0x999999, 0.3);
      g.fillCircle(x + 1, y + 1, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE_HIGHLIGHT, 0.5);
      g.fillCircle(x - 3, y - 3, r * 0.35);
    }
  }

  /** 绘制最后一手标记（红色小点） */
  drawLastMoveMarker(row: number, col: number): void {
    const { x, y } = this.gridToScreen(row, col);
    this.lastMoveGraphics.clear();
    this.lastMoveGraphics.fillStyle(GOMOKU_COLORS.LAST_MOVE, 1);
    this.lastMoveGraphics.fillCircle(x, y, 3);
  }

  /** 绘制悬停预览（半透明棋子） */
  drawHoverPreview(row: number, col: number, player: 1 | 2): void {
    const { x, y } = this.gridToScreen(row, col);
    const g = this.hoverGraphics;
    g.clear();

    const color = player === 1 ? GOMOKU_COLORS.STONE_BLACK : GOMOKU_COLORS.STONE_WHITE;
    g.fillStyle(color, 0.3);
    g.fillCircle(x, y, GOMOKU.STONE_RADIUS);
  }

  /** 清除悬停预览 */
  clearHoverPreview(): void {
    this.hoverGraphics.clear();
  }

  /** 高亮胜利连线 */
  highlightWinLine(positions: Position[]): void {
    const g = this.winGraphics;
    g.clear();

    // 每颗获胜棋子画金色光环
    for (const pos of positions) {
      const { x, y } = this.gridToScreen(pos.row, pos.col);
      g.lineStyle(3, GOMOKU_COLORS.WIN_LINE, 0.9);
      g.strokeCircle(x, y, GOMOKU.STONE_RADIUS + 2);
    }

    // 在首尾棋子之间画连线
    if (positions.length >= 2) {
      // 按行列排序，确保线段方向一致
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

  /** 屏幕坐标转网格坐标（吸附到最近交叉点） */
  screenToGrid(
    screenX: number,
    screenY: number
  ): Position | null {
    const col = Math.round((screenX - GOMOKU.BOARD_X) / GOMOKU.CELL_SIZE);
    const row = Math.round((screenY - GOMOKU.BOARD_Y) / GOMOKU.CELL_SIZE);

    if (row < 0 || row >= GOMOKU.GRID_SIZE || col < 0 || col >= GOMOKU.GRID_SIZE) {
      return null;
    }

    // 检查是否在吸附半径内
    const { x, y } = this.gridToScreen(row, col);
    const dist = Math.sqrt((screenX - x) ** 2 + (screenY - y) ** 2);
    if (dist > GOMOKU.CELL_SIZE * 0.6) return null;

    return { row, col };
  }

  /** 网格坐标转屏幕坐标 */
  gridToScreen(row: number, col: number): { x: number; y: number } {
    return {
      x: GOMOKU.BOARD_X + col * GOMOKU.CELL_SIZE,
      y: GOMOKU.BOARD_Y + row * GOMOKU.CELL_SIZE,
    };
  }

  /** 清除所有棋子和标记（用于重开） */
  clearAll(): void {
    this.stoneGraphics.clear();
    this.hoverGraphics.clear();
    this.winGraphics.clear();
    this.lastMoveGraphics.clear();
  }
}
