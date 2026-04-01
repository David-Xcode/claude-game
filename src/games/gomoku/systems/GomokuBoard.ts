// 五子棋棋盘逻辑：状态管理、落子、胜负判定

import { GOMOKU } from '../data/GomokuConstants';

export interface Position {
  row: number;
  col: number;
}

export interface MoveRecord {
  row: number;
  col: number;
  player: 1 | 2;
}

export interface WinResult {
  winner: 1 | 2;
  line: Position[];
}

// 四个扫描方向：水平、垂直、主对角线、反对角线
const DIRECTIONS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export class GomokuBoard {
  readonly size = GOMOKU.GRID_SIZE;
  // 0 = 空, 1 = 黑, 2 = 白
  grid: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2 = 1;
  moveHistory: MoveRecord[] = [];
  winner: 0 | 1 | 2 = 0;
  winLine: Position[] | null = null;
  isDraw = false;

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): (0 | 1 | 2)[][] {
    return Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => 0 as 0 | 1 | 2)
    );
  }

  /** 在指定位置落子，返回是否成功 */
  placeStone(row: number, col: number): boolean {
    if (!this.isValidMove(row, col)) return false;

    this.grid[row][col] = this.currentPlayer;
    this.moveHistory.push({ row, col, player: this.currentPlayer });

    // 检查胜负
    const winResult = this.checkWin(row, col);
    if (winResult) {
      this.winner = winResult.winner;
      this.winLine = winResult.line;
    } else if (this.checkDraw()) {
      this.isDraw = true;
    }

    // 切换玩家
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    return true;
  }

  /** 检查指定位置是否可以落子 */
  isValidMove(row: number, col: number): boolean {
    if (this.winner !== 0 || this.isDraw) return false;
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false;
    return this.grid[row][col] === 0;
  }

  /** 从最后一手检查是否有五连 */
  checkWin(row: number, col: number): WinResult | null {
    const player = this.grid[row][col];
    if (player === 0) return null;

    for (const [dr, dc] of DIRECTIONS) {
      const line: Position[] = [{ row, col }];

      // 正方向扫描
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) break;
        if (this.grid[r][c] !== player) break;
        line.push({ row: r, col: c });
      }

      // 反方向扫描
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) break;
        if (this.grid[r][c] !== player) break;
        line.push({ row: r, col: c });
      }

      if (line.length >= 5) {
        return { winner: player as 1 | 2, line };
      }
    }

    return null;
  }

  /** 检查平局（棋盘满且无赢家） */
  private checkDraw(): boolean {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }
    return true;
  }

  /** 获取最后一手棋 */
  getLastMove(): MoveRecord | null {
    return this.moveHistory.length > 0
      ? this.moveHistory[this.moveHistory.length - 1]
      : null;
  }

  /** 游戏是否结束 */
  isGameOver(): boolean {
    return this.winner !== 0 || this.isDraw;
  }

  /** 重置棋盘 */
  reset(): void {
    this.grid = this.createEmptyGrid();
    this.currentPlayer = 1;
    this.moveHistory = [];
    this.winner = 0;
    this.winLine = null;
    this.isDraw = false;
  }
}
