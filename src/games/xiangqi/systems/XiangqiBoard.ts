// 中国象棋棋盘逻辑（纯逻辑层，零 Phaser 依赖）

import { PieceType, Side, XIANGQI } from '../data/XiangqiConstants';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  side: Side;
}

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
}

export class XiangqiBoard {
  readonly rows = XIANGQI.ROWS; // 10
  readonly cols = XIANGQI.COLS; // 9
  grid: (Piece | null)[][];
  currentPlayer: Side = Side.RED;
  moveHistory: MoveRecord[] = [];
  isInCheck = false;
  gameResult: 'none' | 'red_wins' | 'black_wins' = 'none';

  constructor() {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
    this.setupInitialPosition();
  }

  // ── 初始布局 ──────────────────────────────────

  private setupInitialPosition(): void {
    const p = (type: PieceType, side: Side): Piece => ({ type, side });
    const B = Side.BLACK;
    const R = Side.RED;

    // 黑方底线（row 0）
    this.grid[0][0] = p(PieceType.ROOK, B);
    this.grid[0][1] = p(PieceType.HORSE, B);
    this.grid[0][2] = p(PieceType.ELEPHANT, B);
    this.grid[0][3] = p(PieceType.ADVISOR, B);
    this.grid[0][4] = p(PieceType.GENERAL, B);
    this.grid[0][5] = p(PieceType.ADVISOR, B);
    this.grid[0][6] = p(PieceType.ELEPHANT, B);
    this.grid[0][7] = p(PieceType.HORSE, B);
    this.grid[0][8] = p(PieceType.ROOK, B);

    // 黑方炮（row 2）
    this.grid[2][1] = p(PieceType.CANNON, B);
    this.grid[2][7] = p(PieceType.CANNON, B);

    // 黑方卒（row 3）
    for (let c = 0; c <= 8; c += 2) {
      this.grid[3][c] = p(PieceType.SOLDIER, B);
    }

    // 红方底线（row 9）
    this.grid[9][0] = p(PieceType.ROOK, R);
    this.grid[9][1] = p(PieceType.HORSE, R);
    this.grid[9][2] = p(PieceType.ELEPHANT, R);
    this.grid[9][3] = p(PieceType.ADVISOR, R);
    this.grid[9][4] = p(PieceType.GENERAL, R);
    this.grid[9][5] = p(PieceType.ADVISOR, R);
    this.grid[9][6] = p(PieceType.ELEPHANT, R);
    this.grid[9][7] = p(PieceType.HORSE, R);
    this.grid[9][8] = p(PieceType.ROOK, R);

    // 红方炮（row 7）
    this.grid[7][1] = p(PieceType.CANNON, R);
    this.grid[7][7] = p(PieceType.CANNON, R);

    // 红方兵（row 6）
    for (let c = 0; c <= 8; c += 2) {
      this.grid[6][c] = p(PieceType.SOLDIER, R);
    }
  }

  // ── 走棋 ──────────────────────────────────────

  makeMove(from: Position, to: Position): boolean {
    const piece = this.grid[from.row][from.col];
    if (!piece || piece.side !== this.currentPlayer) return false;

    const validMoves = this.getValidMoves(from.row, from.col);
    if (!validMoves.some(m => m.row === to.row && m.col === to.col)) return false;

    const captured = this.grid[to.row][to.col];
    this.moveHistory.push({ from, to, piece, captured });

    // 执行移动
    this.grid[to.row][to.col] = piece;
    this.grid[from.row][from.col] = null;

    // 切换玩家
    this.currentPlayer = this.currentPlayer === Side.RED ? Side.BLACK : Side.RED;

    // 检测将军状态
    this.isInCheck = this.isCheck(this.currentPlayer);

    // 检测游戏结束（绝杀或困毙）
    if (this.hasNoLegalMoves(this.currentPlayer)) {
      // 无论是被将后无法解除（绝杀）还是没被将但无子可动（困毙），都判负
      this.gameResult = this.currentPlayer === Side.RED ? 'black_wins' : 'red_wins';
    }

    return true;
  }

  // AI 搜索用：撤销上一步
  undoMove(): void {
    const record = this.moveHistory.pop();
    if (!record) return;

    this.grid[record.from.row][record.from.col] = record.piece;
    this.grid[record.to.row][record.to.col] = record.captured;

    this.currentPlayer = this.currentPlayer === Side.RED ? Side.BLACK : Side.RED;
    this.gameResult = 'none';
    this.isInCheck = this.isCheck(this.currentPlayer);
  }

  isGameOver(): boolean {
    return this.gameResult !== 'none';
  }

  getLastMove(): MoveRecord | null {
    return this.moveHistory.length > 0
      ? this.moveHistory[this.moveHistory.length - 1]
      : null;
  }

  // ── 合法走法生成 ──────────────────────────────

  getValidMoves(row: number, col: number): Position[] {
    const piece = this.grid[row][col];
    if (!piece) return [];

    const rawMoves = this.getRawMoves(row, col, piece);

    // 过滤掉走后自己被将的走法
    return rawMoves.filter(to => {
      const captured = this.grid[to.row][to.col];
      // 模拟走棋
      this.grid[to.row][to.col] = piece;
      this.grid[row][col] = null;

      const legal = !this.isCheck(piece.side) && !this.generalsAreFacing();

      // 还原
      this.grid[row][col] = piece;
      this.grid[to.row][to.col] = captured;

      return legal;
    });
  }

  // 获取所有己方棋子
  getAllPieces(side: Side): { pos: Position; piece: Piece }[] {
    const result: { pos: Position; piece: Piece }[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === side) {
          result.push({ pos: { row: r, col: c }, piece });
        }
      }
    }
    return result;
  }

  // ── 将军检测 ──────────────────────────────────

  findGeneral(side: Side): Position | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.type === PieceType.GENERAL && piece.side === side) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  isCheck(side: Side): boolean {
    const generalPos = this.findGeneral(side);
    if (!generalPos) return false;

    const opponent = side === Side.RED ? Side.BLACK : Side.RED;
    return this.isPositionUnderAttack(generalPos, opponent);
  }

  // 某位置是否被某方棋子攻击
  isPositionUnderAttack(pos: Position, bySide: Side): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = this.grid[r][c];
        if (!piece || piece.side !== bySide) continue;
        const moves = this.getRawMoves(r, c, piece);
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
    return false;
  }

  // 将帅对面检测：两将在同一列且中间无子
  generalsAreFacing(): boolean {
    const redGen = this.findGeneral(Side.RED);
    const blackGen = this.findGeneral(Side.BLACK);
    if (!redGen || !blackGen) return false;
    if (redGen.col !== blackGen.col) return false;

    const minRow = Math.min(redGen.row, blackGen.row);
    const maxRow = Math.max(redGen.row, blackGen.row);
    for (let r = minRow + 1; r < maxRow; r++) {
      if (this.grid[r][redGen.col]) return false;
    }
    return true;
  }

  // 当前玩家是否无合法走法
  private hasNoLegalMoves(side: Side): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const piece = this.grid[r][c];
        if (piece && piece.side === side) {
          if (this.getValidMoves(r, c).length > 0) return false;
        }
      }
    }
    return true;
  }

  // ── 原始走法生成（不考虑被将） ────────────────

  private getRawMoves(row: number, col: number, piece: Piece): Position[] {
    switch (piece.type) {
      case PieceType.GENERAL: return this.getGeneralMoves(row, col, piece.side);
      case PieceType.ADVISOR: return this.getAdvisorMoves(row, col, piece.side);
      case PieceType.ELEPHANT: return this.getElephantMoves(row, col, piece.side);
      case PieceType.HORSE: return this.getHorseMoves(row, col, piece.side);
      case PieceType.ROOK: return this.getRookMoves(row, col, piece.side);
      case PieceType.CANNON: return this.getCannonMoves(row, col, piece.side);
      case PieceType.SOLDIER: return this.getSoldierMoves(row, col, piece.side);
    }
  }

  // 将/帅：九宫内上下左右各1步
  private getGeneralMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const [minRow, maxRow] = side === Side.RED ? [7, 9] : [0, 2];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= minRow && nr <= maxRow && nc >= 3 && nc <= 5) {
        const target = this.grid[nr][nc];
        if (!target || target.side !== side) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
    return moves;
  }

  // 士/仕：九宫内斜走1步
  private getAdvisorMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const [minRow, maxRow] = side === Side.RED ? [7, 9] : [0, 2];
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= minRow && nr <= maxRow && nc >= 3 && nc <= 5) {
        const target = this.grid[nr][nc];
        if (!target || target.side !== side) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
    return moves;
  }

  // 象/相：田字斜走2步，塞象眼，不过河
  private getElephantMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const [minRow, maxRow] = side === Side.RED ? [5, 9] : [0, 4];
    const dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]];

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < minRow || nr > maxRow || nc < 0 || nc >= this.cols) continue;

      // 塞象眼：检查中间位置
      const blockRow = row + dr / 2;
      const blockCol = col + dc / 2;
      if (this.grid[blockRow][blockCol]) continue;

      const target = this.grid[nr][nc];
      if (!target || target.side !== side) {
        moves.push({ row: nr, col: nc });
      }
    }
    return moves;
  }

  // 马：日字走法，蹩马腿
  private getHorseMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    // 先直后斜：[直行方向dr1,dc1] -> [最终位移dr2,dc2]
    const steps: [number, number, number, number][] = [
      [-1, 0, -2, -1], [-1, 0, -2, 1],  // 上方
      [1, 0, 2, -1],   [1, 0, 2, 1],    // 下方
      [0, -1, -1, -2], [0, -1, 1, -2],  // 左方
      [0, 1, -1, 2],   [0, 1, 1, 2],    // 右方
    ];

    for (const [dr1, dc1, dr2, dc2] of steps) {
      // 检查蹩马腿
      const blockRow = row + dr1;
      const blockCol = col + dc1;
      if (blockRow < 0 || blockRow >= this.rows || blockCol < 0 || blockCol >= this.cols) continue;
      if (this.grid[blockRow][blockCol]) continue;

      const nr = row + dr2;
      const nc = col + dc2;
      if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;

      const target = this.grid[nr][nc];
      if (!target || target.side !== side) {
        moves.push({ row: nr, col: nc });
      }
    }
    return moves;
  }

  // 车：直线任意距离，遇子停
  private getRookMoves(row: number, col: number, side: Side): Position[] {
    return this.getSlidingMoves(row, col, side);
  }

  // 炮：移动同车（不吃子），吃子需隔一子跳吃
  private getCannonMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of dirs) {
      let jumped = false;
      let nr = row + dr;
      let nc = col + dc;

      while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
        const target = this.grid[nr][nc];

        if (!jumped) {
          if (!target) {
            // 空位可以移动（不吃子）
            moves.push({ row: nr, col: nc });
          } else {
            // 遇到第一个子，标记为炮架
            jumped = true;
          }
        } else {
          // 已经跳过炮架，寻找吃子目标
          if (target) {
            if (target.side !== side) {
              moves.push({ row: nr, col: nc });
            }
            break; // 不管能不能吃，遇到子就停
          }
        }

        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  // 兵/卒：过河前只能前进，过河后可前进或左右
  private getSoldierMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const forward = side === Side.RED ? -1 : 1;
    const hasCrossedRiver = side === Side.RED ? row <= 4 : row >= 5;

    // 前进一步
    const fr = row + forward;
    if (fr >= 0 && fr < this.rows) {
      const target = this.grid[fr][col];
      if (!target || target.side !== side) {
        moves.push({ row: fr, col });
      }
    }

    // 过河后可以左右移动
    if (hasCrossedRiver) {
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (nc >= 0 && nc < this.cols) {
          const target = this.grid[row][nc];
          if (!target || target.side !== side) {
            moves.push({ row, col: nc });
          }
        }
      }
    }

    return moves;
  }

  // 直线滑动走法（车用）
  private getSlidingMoves(row: number, col: number, side: Side): Position[] {
    const moves: Position[] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;

      while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
        const target = this.grid[nr][nc];
        if (!target) {
          moves.push({ row: nr, col: nc });
        } else {
          if (target.side !== side) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }

  // ── 重置 ──────────────────────────────────────

  reset(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = null;
      }
    }
    this.currentPlayer = Side.RED;
    this.moveHistory = [];
    this.isInCheck = false;
    this.gameResult = 'none';
    this.setupInitialPosition();
  }
}
