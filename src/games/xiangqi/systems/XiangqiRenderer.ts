// 中国象棋渲染器：程序化绘制棋盘、棋子（圆+汉字）、高亮效果

import Phaser from 'phaser';
import {
  XIANGQI, XIANGQI_COLORS, XIANGQI_DEPTH,
  PIECE_CHARS, Side, XiangqiDifficulty,
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

  // 棋子显示对象缓存
  private pieceObjects = new Map<string, PieceDisplay>();
  // 河界文字对象（避免泄漏）
  private riverTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.boardGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.BOARD);
    this.pieceGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.PIECES);
    this.selectionGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.SELECTED);
    this.validMoveGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.VALID_MOVES);
    this.lastMoveGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.LAST_MOVE);
    this.checkGraphics = scene.add.graphics().setDepth(XIANGQI_DEPTH.CHECK);
  }

  // ── 棋盘绘制 ──────────────────────────────────

  drawBoard(difficulty: XiangqiDifficulty): void {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const g = this.boardGraphics;
    g.clear();

    // 清理旧的河界文字
    this.riverTexts.forEach(t => t.destroy());
    this.riverTexts = [];

    const gridW = (XIANGQI.COLS - 1) * XIANGQI.CELL_SIZE; // 8×44 = 352
    const gridH = (XIANGQI.ROWS - 1) * XIANGQI.CELL_SIZE; // 9×44 = 396
    const padding = 22;
    const boardLeft = XIANGQI.BOARD_X - padding;
    const boardTop = XIANGQI.BOARD_Y - padding;
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
      const y = XIANGQI.BOARD_Y + r * XIANGQI.CELL_SIZE;
      g.lineBetween(XIANGQI.BOARD_X, y, XIANGQI.BOARD_X + gridW, y);
    }

    // 竖线（9条，col 0-8）
    // 河界区域（row 4-5之间）内线只画两侧边线
    for (let c = 0; c < XIANGQI.COLS; c++) {
      const x = XIANGQI.BOARD_X + c * XIANGQI.CELL_SIZE;
      if (c === 0 || c === XIANGQI.COLS - 1) {
        // 边线贯穿
        g.lineBetween(x, XIANGQI.BOARD_Y, x, XIANGQI.BOARD_Y + gridH);
      } else {
        // 内线在河界断开
        const riverTop = XIANGQI.BOARD_Y + 4 * XIANGQI.CELL_SIZE;
        const riverBottom = XIANGQI.BOARD_Y + 5 * XIANGQI.CELL_SIZE;
        g.lineBetween(x, XIANGQI.BOARD_Y, x, riverTop);
        g.lineBetween(x, riverBottom, x, XIANGQI.BOARD_Y + gridH);
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
    const riverY = XIANGQI.BOARD_Y + 4.5 * XIANGQI.CELL_SIZE;
    const leftX = XIANGQI.BOARD_X + 1.5 * XIANGQI.CELL_SIZE;
    const rightX = XIANGQI.BOARD_X + 6.5 * XIANGQI.CELL_SIZE;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '20px',
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
    const r = XIANGQI.PIECE_RADIUS;
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
    g.strokeCircle(x, y, r - 4);

    // 汉字
    const text = this.scene.add.text(x, y, char, {
      fontSize: '20px',
      color: textColor,
      fontFamily: 'serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.PIECES + 1);

    this.pieceObjects.set(`${row},${col}`, { text });
  }

  // ── 高亮效果 ──────────────────────────────────

  highlightSelected(row: number, col: number): void {
    this.selectionGraphics.clear();
    const { x, y } = this.gridToScreen(row, col);
    this.selectionGraphics.lineStyle(3, XIANGQI_COLORS.SELECTED, 0.8);
    this.selectionGraphics.strokeCircle(x, y, XIANGQI.PIECE_RADIUS + 3);
  }

  clearSelection(): void {
    this.selectionGraphics.clear();
  }

  showValidMoves(positions: Position[], grid: (Piece | null)[][]): void {
    const g = this.validMoveGraphics;
    g.clear();

    for (const pos of positions) {
      const { x, y } = this.gridToScreen(pos.row, pos.col);
      const isCapture = grid[pos.row][pos.col] !== null;

      if (isCapture) {
        // 吃子位置：红色环
        g.lineStyle(2, XIANGQI_COLORS.VALID_CAPTURE, 0.7);
        g.strokeCircle(x, y, XIANGQI.PIECE_RADIUS + 2);
      } else {
        // 空位：绿色小点
        g.fillStyle(XIANGQI_COLORS.VALID_MOVE, 0.6);
        g.fillCircle(x, y, 5);
      }
    }
  }

  clearValidMoves(): void {
    this.validMoveGraphics.clear();
  }

  showLastMove(from: Position, to: Position): void {
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
    const s = XIANGQI.PIECE_RADIUS + 2;
    const len = 8;
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
    const { x, y } = this.gridToScreen(row, col);
    const g = this.checkGraphics;
    g.clear();
    g.lineStyle(3, XIANGQI_COLORS.CHECK_WARNING, 0.8);
    g.strokeCircle(x, y, XIANGQI.PIECE_RADIUS + 5);

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
    this.scene.tweens.killTweensOf(this.checkGraphics);
    this.checkGraphics.clear();
    this.checkGraphics.setAlpha(1);
  }

  // ── 坐标转换 ──────────────────────────────────

  screenToGrid(screenX: number, screenY: number): Position | null {
    const col = Math.round((screenX - XIANGQI.BOARD_X) / XIANGQI.CELL_SIZE);
    const row = Math.round((screenY - XIANGQI.BOARD_Y) / XIANGQI.CELL_SIZE);

    if (row < 0 || row >= XIANGQI.ROWS || col < 0 || col >= XIANGQI.COLS) {
      return null;
    }

    const { x, y } = this.gridToScreen(row, col);
    const dist = Math.sqrt((screenX - x) ** 2 + (screenY - y) ** 2);
    if (dist > XIANGQI.CELL_SIZE * 0.6) return null;

    return { row, col };
  }

  gridToScreen(row: number, col: number): { x: number; y: number } {
    return {
      x: XIANGQI.BOARD_X + col * XIANGQI.CELL_SIZE,
      y: XIANGQI.BOARD_Y + row * XIANGQI.CELL_SIZE,
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
  }
}
