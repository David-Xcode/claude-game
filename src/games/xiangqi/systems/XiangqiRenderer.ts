// 中国象棋渲染器：程序化绘制棋盘、棋子（圆+汉字）、高亮效果
// 支持动态布局，resize 时重算并重绘

import Phaser from 'phaser';
import { BoardLayout } from '@shared/utils/ResponsiveLayout';
import {
  XIANGQI, XIANGQI_COLORS, XIANGQI_DEPTH,
  PIECE_CHARS, Side, XiangqiDifficulty, getXiangqiBoardLayout,
} from '../data/XiangqiConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';
import { Position, Piece } from './XiangqiBoard';

interface PieceDisplay {
  text: Phaser.GameObjects.Text;
}

export class XiangqiRenderer {
  private scene: Phaser.Scene;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private pieceGraphics!: Phaser.GameObjects.Graphics;
  private selectionGraphics!: Phaser.GameObjects.Graphics;
  private validMoveGraphics!: Phaser.GameObjects.Graphics;
  private lastMoveGraphics!: Phaser.GameObjects.Graphics;
  private checkGraphics!: Phaser.GameObjects.Graphics;

  // 动态棋盘布局（resize 时更新）
  boardLayout!: BoardLayout;

  // 缓存当前难度（resize 时重绘需要）
  private currentDifficulty!: XiangqiDifficulty;

  // 棋子显示对象缓存
  private pieceObjects = new Map<string, PieceDisplay>();
  // 河界文字对象（避免泄漏）
  private riverTexts: Phaser.GameObjects.Text[] = [];

  // 缓存棋盘状态引用（resize 时重绘棋子用）
  private cachedGrid: (Piece | null)[][] | null = null;
  // 缓存最后一步（resize 时重绘用）
  private lastMoveFrom: Position | null = null;
  private lastMoveTo: Position | null = null;
  // 缓存选中状态（resize 时重绘用）
  private selectedRow = -1;
  private selectedCol = -1;
  // 缓存合法走法（resize 时重绘用）
  private cachedValidMoves: Position[] = [];
  // 缓存将军状态（resize 时重绘用）
  private checkRow = -1;
  private checkCol = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.boardLayout = getXiangqiBoardLayout();
    this.boardGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.BOARD);
    this.pieceGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.PIECES);
    this.selectionGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.SELECTED);
    this.validMoveGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.VALID_MOVES);
    this.lastMoveGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.LAST_MOVE);
    this.checkGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.CHECK);
  }

  // ── 布局重算与整体重绘 ────────────────────────

  /** 重算布局参数（resize 时调用） */
  recalculateLayout(): void {
    this.boardLayout = getXiangqiBoardLayout();
  }

  /** 整体重绘：棋盘 + 所有棋子 + 高亮状态 */
  redrawAll(): void {
    this.recalculateLayout();
    this.drawBoard(this.currentDifficulty);

    // 重绘所有棋子
    if (this.cachedGrid) {
      this.drawAllPieces(this.cachedGrid);
    }

    // 重绘最后一步标记
    if (this.lastMoveFrom && this.lastMoveTo) {
      this.renderLastMove(this.lastMoveFrom, this.lastMoveTo);
    }

    // 重绘选中高亮
    if (this.selectedRow >= 0) {
      this.renderSelected(this.selectedRow, this.selectedCol);
    }

    // 重绘合法走法
    if (this.cachedValidMoves.length > 0 && this.cachedGrid) {
      this.renderValidMoves(this.cachedValidMoves, this.cachedGrid);
    }

    // 重绘将军警告
    if (this.checkRow >= 0) {
      this.renderCheckWarning(this.checkRow, this.checkCol);
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

  drawBoard(difficulty: XiangqiDifficulty): void {
    this.currentDifficulty = difficulty;
    const config = DIFFICULTY_CONFIGS[difficulty];
    const g = this.boardGraphics;
    g.clear();

    // 清理旧的河界文字
    this.riverTexts.forEach(t => t.destroy());
    this.riverTexts = [];

    const { boardX, boardY, cellSize } = this.boardLayout;
    const gridW = (XIANGQI.COLS - 1) * cellSize;
    const gridH = (XIANGQI.ROWS - 1) * cellSize;
    const padding = Math.round(cellSize * 0.5);
    const boardLeft = boardX - padding;
    const boardTop = boardY - padding;
    const boardW = gridW + padding * 2;
    const boardH = gridH + padding * 2;

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

    // 横线（10条，row 0-9）
    g.lineStyle(1, config.gridColor, 0.9);
    for (let r = 0; r < XIANGQI.ROWS; r++) {
      const y = boardY + r * cellSize;
      g.lineBetween(boardX, y, boardX + gridW, y);
    }

    // 竖线（9条，col 0-8）
    // 河界区域（row 4-5之间）内线只画两侧边线
    for (let c = 0; c < XIANGQI.COLS; c++) {
      const x = boardX + c * cellSize;
      if (c === 0 || c === XIANGQI.COLS - 1) {
        // 边线贯穿
        g.lineBetween(x, boardY, x, boardY + gridH);
      } else {
        // 内线在河界断开
        const riverTop = boardY + 4 * cellSize;
        const riverBottom = boardY + 5 * cellSize;
        g.lineBetween(x, boardY, x, riverTop);
        g.lineBetween(x, riverBottom, x, boardY + gridH);
      }
    }

    // 九宫斜线
    this.drawPalaceDiagonals(g, config.gridColor);

    // 河界文字
    this.drawRiverText();
  }

  private drawPalaceDiagonals(g: Phaser.GameObjects.Graphics, color: number): void {
    g.lineStyle(1, color, 0.7);

    // 黑方九宫（row 0-2, col 3-5）
    const bt = this.gridToScreen(0, 3);
    const bb = this.gridToScreen(2, 5);
    const bt2 = this.gridToScreen(0, 5);
    const bb2 = this.gridToScreen(2, 3);
    g.lineBetween(bt.x, bt.y, bb.x, bb.y);
    g.lineBetween(bt2.x, bt2.y, bb2.x, bb2.y);

    // 红方九宫（row 7-9, col 3-5）
    const rt = this.gridToScreen(7, 3);
    const rb = this.gridToScreen(9, 5);
    const rt2 = this.gridToScreen(7, 5);
    const rb2 = this.gridToScreen(9, 3);
    g.lineBetween(rt.x, rt.y, rb.x, rb.y);
    g.lineBetween(rt2.x, rt2.y, rb2.x, rb2.y);
  }

  private drawRiverText(): void {
    const { boardX, boardY, cellSize } = this.boardLayout;
    const riverY = boardY + 4.5 * cellSize;
    const leftX = boardX + 1.5 * cellSize;
    const rightX = boardX + 6.5 * cellSize;
    const fontSize = `${Math.max(12, Math.round(cellSize * 0.45))}px`;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize,
      color: '#5c3d1a',
      fontFamily: 'serif',
      fontStyle: 'bold',
    };

    this.riverTexts.push(this.scene.add.text(leftX, riverY, '楚河', style)
      .setOrigin(0.5).setDepth(XIANGQI_DEPTH.RIVER_TEXT).setAlpha(0.6));
    this.riverTexts.push(this.scene.add.text(rightX, riverY, '汉界', style)
      .setOrigin(0.5).setDepth(XIANGQI_DEPTH.RIVER_TEXT).setAlpha(0.6));
  }

  // ── 棋子绘制 ──────────────────────────────────

  drawAllPieces(grid: (Piece | null)[][]): void {
    this.cachedGrid = grid;
    this.clearAllPieces();
    for (let r = 0; r < XIANGQI.ROWS; r++) {
      for (let c = 0; c < XIANGQI.COLS; c++) {
        const piece = grid[r][c];
        if (piece) this.drawPiece(r, c, piece);
      }
    }
  }

  drawPiece(row: number, col: number, piece: Piece): void {
    const { x, y } = this.gridToScreen(row, col);
    const r = this.boardLayout.pieceRadius;
    const isRed = piece.side === Side.RED;
    const char = PIECE_CHARS[piece.side][piece.type];
    const g = this.pieceGraphics;

    const fillColor = isRed ? XIANGQI_COLORS.RED_FILL : XIANGQI_COLORS.BLACK_FILL;
    const borderColor = isRed ? XIANGQI_COLORS.RED_BORDER : XIANGQI_COLORS.BLACK_BORDER;
    const textColor = isRed ? '#cc2222' : '#222222';

    // 棋子阴影
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(x + 1, y + 1, r);

    // 棋子底色
    g.fillStyle(fillColor, 1);
    g.fillCircle(x, y, r);

    // 外圈边框
    g.lineStyle(2, borderColor, 1);
    g.strokeCircle(x, y, r);

    // 内圈装饰线
    g.lineStyle(1, borderColor, 0.6);
    g.strokeCircle(x, y, r - Math.max(2, Math.round(r * 0.2)));

    // 汉字（大小按棋子半径缩放）
    const fontSize = `${Math.max(10, Math.round(r * 1.05))}px`;
    const text = this.scene.add.text(x, y, char, {
      fontSize,
      color: textColor,
      fontFamily: 'serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.PIECES + 1);

    this.pieceObjects.set(`${row},${col}`, { text });
  }

  // ── 高亮效果 ──────────────────────────────────

  highlightSelected(row: number, col: number): void {
    this.selectedRow = row;
    this.selectedCol = col;
    this.renderSelected(row, col);
  }

  private renderSelected(row: number, col: number): void {
    this.selectionGraphics.clear();
    const { x, y } = this.gridToScreen(row, col);
    this.selectionGraphics.lineStyle(3, XIANGQI_COLORS.SELECTED, 0.8);
    this.selectionGraphics.strokeCircle(x, y, this.boardLayout.pieceRadius + 3);
  }

  clearSelection(): void {
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.selectionGraphics.clear();
  }

  showValidMoves(positions: Position[], grid: (Piece | null)[][]): void {
    this.cachedValidMoves = positions;
    this.renderValidMoves(positions, grid);
  }

  private renderValidMoves(positions: Position[], grid: (Piece | null)[][]): void {
    const g = this.validMoveGraphics;
    g.clear();
    const r = this.boardLayout.pieceRadius;
    const dotR = Math.max(3, Math.round(r * 0.25));

    for (const pos of positions) {
      const { x, y } = this.gridToScreen(pos.row, pos.col);
      const isCapture = grid[pos.row][pos.col] !== null;

      if (isCapture) {
        // 吃子位置：红色环
        g.lineStyle(2, XIANGQI_COLORS.VALID_CAPTURE, 0.7);
        g.strokeCircle(x, y, r + 2);
      } else {
        // 空位：绿色小点
        g.fillStyle(XIANGQI_COLORS.VALID_MOVE, 0.6);
        g.fillCircle(x, y, dotR);
      }
    }
  }

  clearValidMoves(): void {
    this.cachedValidMoves = [];
    this.validMoveGraphics.clear();
  }

  showLastMove(from: Position, to: Position): void {
    this.lastMoveFrom = from;
    this.lastMoveTo = to;
    this.renderLastMove(from, to);
  }

  private renderLastMove(from: Position, to: Position): void {
    const g = this.lastMoveGraphics;
    g.clear();

    // 起点：橙色角标
    const f = this.gridToScreen(from.row, from.col);
    this.drawCornerMarks(g, f.x, f.y, XIANGQI_COLORS.LAST_MOVE, 0.5);

    // 终点：橙色角标
    const t = this.gridToScreen(to.row, to.col);
    this.drawCornerMarks(g, t.x, t.y, XIANGQI_COLORS.LAST_MOVE, 0.7);
  }

  // 在位置四角画 L 形标记
  private drawCornerMarks(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    color: number, alpha: number
  ): void {
    const s = this.boardLayout.pieceRadius + 2;
    const len = Math.max(4, Math.round(s * 0.4));
    g.lineStyle(2, color, alpha);

    // 左上
    g.lineBetween(cx - s, cy - s, cx - s + len, cy - s);
    g.lineBetween(cx - s, cy - s, cx - s, cy - s + len);
    // 右上
    g.lineBetween(cx + s, cy - s, cx + s - len, cy - s);
    g.lineBetween(cx + s, cy - s, cx + s, cy - s + len);
    // 左下
    g.lineBetween(cx - s, cy + s, cx - s + len, cy + s);
    g.lineBetween(cx - s, cy + s, cx - s, cy + s - len);
    // 右下
    g.lineBetween(cx + s, cy + s, cx + s - len, cy + s);
    g.lineBetween(cx + s, cy + s, cx + s, cy + s - len);
  }

  showCheckWarning(row: number, col: number): void {
    this.checkRow = row;
    this.checkCol = col;
    this.renderCheckWarning(row, col);
  }

  private renderCheckWarning(row: number, col: number): void {
    const { x, y } = this.gridToScreen(row, col);
    const g = this.checkGraphics;
    this.scene.tweens.killTweensOf(g);
    g.clear();
    g.setAlpha(1);
    g.lineStyle(3, XIANGQI_COLORS.CHECK_WARNING, 0.8);
    g.strokeCircle(x, y, this.boardLayout.pieceRadius + 5);

    // 闪烁效果
    this.scene.tweens.add({
      targets: g,
      alpha: { from: 1, to: 0.2 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  clearCheckWarning(): void {
    this.checkRow = -1;
    this.checkCol = -1;
    this.scene.tweens.killTweensOf(this.checkGraphics);
    this.checkGraphics.clear();
    this.checkGraphics.setAlpha(1);
  }

  // ── 坐标转换 ──────────────────────────────────

  screenToGrid(screenX: number, screenY: number): Position | null {
    const { boardX, boardY, cellSize } = this.boardLayout;
    const col = Math.round((screenX - boardX) / cellSize);
    const row = Math.round((screenY - boardY) / cellSize);

    if (row < 0 || row >= XIANGQI.ROWS || col < 0 || col >= XIANGQI.COLS) {
      return null;
    }

    const { x, y } = this.gridToScreen(row, col);
    const dist = Math.sqrt((screenX - x) ** 2 + (screenY - y) ** 2);
    if (dist > cellSize * 0.6) return null;

    return { row, col };
  }

  gridToScreen(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardLayout.boardX + col * this.boardLayout.cellSize,
      y: this.boardLayout.boardY + row * this.boardLayout.cellSize,
    };
  }

  // ── 清理 ──────────────────────────────────────

  clearAllPieces(): void {
    this.pieceGraphics.clear();
    for (const [, display] of this.pieceObjects) {
      display.text.destroy();
    }
    this.pieceObjects.clear();
  }

  clearAll(): void {
    this.clearAllPieces();
    this.selectionGraphics.clear();
    this.validMoveGraphics.clear();
    this.lastMoveGraphics.clear();
    this.clearCheckWarning();
    this.cachedGrid = null;
    this.lastMoveFrom = null;
    this.lastMoveTo = null;
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.cachedValidMoves = [];
  }
}
