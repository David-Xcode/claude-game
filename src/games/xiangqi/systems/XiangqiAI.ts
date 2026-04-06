// 中国象棋 AI：Minimax + Alpha-Beta 剪枝 + 子力/位置评估

import {
  XiangqiDifficulty, PieceType, Side,
  PIECE_VALUES, SOLDIER_CROSSED_RIVER_VALUE,
} from '../data/XiangqiConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';
import { XiangqiBoard, Position, Piece } from './XiangqiBoard';

interface Move {
  from: Position;
  to: Position;
}

// 位置加分表（10行×9列），从黑方视角（row 0 为黑方底线）
// 红方使用时上下翻转
const POSITION_BONUS: Record<PieceType, number[][]> = {
  [PieceType.GENERAL]: [
    [0,0,0, 1, 5, 1, 0,0,0],
    [0,0,0, -8,-8,-8, 0,0,0],
    [0,0,0, -9,-9,-9, 0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
  ],
  [PieceType.ADVISOR]: [
    [0,0,0, 10, 0, 10, 0,0,0],
    [0,0,0, 0, 15, 0, 0,0,0],
    [0,0,0, 10, 0, 10, 0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
  ],
  [PieceType.ELEPHANT]: [
    [0,0, 10, 0,0,0, 10, 0,0],
    [0,0,0,0,0,0,0,0,0],
    [5, 0, 0, 0, 15, 0, 0, 0, 5],
    [0,0,0,0,0,0,0,0,0],
    [0, 0, 10, 0, 0, 0, 10, 0, 0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
  ],
  [PieceType.HORSE]: [
    [-5, 5, 0, 5, 0, 5, 0, 5,-5],
    [ 0, 0, 10, 5, 0, 5, 10, 0, 0],
    [-5, 5, 15, 10, 15, 10, 15, 5, -5],
    [ 0, 5, 10, 15, 10, 15, 10, 5, 0],
    [-5, 5, 15, 15, 20, 15, 15, 5, -5],
    [ 0, 5, 10, 15, 10, 15, 10, 5, 0],
    [-5, 5, 15, 10, 15, 10, 15, 5, -5],
    [ 0, 0, 10, 5, 5, 5, 10, 0, 0],
    [-5, 5, 0, 5, 0, 5, 0, 5,-5],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [PieceType.ROOK]: [
    [ 5, 5, 5, 10, 15, 10, 5, 5, 5],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 5, 5, 5, 5, 10, 5, 5, 5, 5],
    [ 5, 5, 5, 5, 10, 5, 5, 5, 5],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 0, 5, 5, 5, 10, 5, 5, 5, 0],
    [ 5, 5, 5, 10, 15, 10, 5, 5, 5],
  ],
  [PieceType.CANNON]: [
    [ 5, 5, 5, 5, 15, 5, 5, 5, 5],
    [ 0, 5, 5, 10, 10, 10, 5, 5, 0],
    [ 0, 5, 10, 10, 15, 10, 10, 5, 0],
    [ 5, 5, 5, 10, 10, 10, 5, 5, 5],
    [ 5, 5, 5, 5, 5, 5, 5, 5, 5],
    [ 5, 5, 5, 5, 5, 5, 5, 5, 5],
    [ 5, 5, 5, 10, 10, 10, 5, 5, 5],
    [ 0, 5, 10, 10, 15, 10, 10, 5, 0],
    [ 0, 5, 5, 10, 10, 10, 5, 5, 0],
    [ 5, 5, 5, 5, 15, 5, 5, 5, 5],
  ],
  [PieceType.SOLDIER]: [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0, 5,0, 5, 0,0,0],
    [5, 0, 10, 0, 15, 0, 10, 0, 5],
    [10, 15, 20, 25, 30, 25, 20, 15, 10],
    [15, 20, 25, 35, 40, 35, 25, 20, 15],
    [10, 15, 20, 25, 30, 25, 20, 15, 10],
    [5, 5, 10, 10, 15, 10, 10, 5, 5],
    [0, 0, 5, 5, 5, 5, 5, 0, 0],
  ],
};

export class XiangqiAI {
  private depth: number;
  private topN: number;
  private aiSide: Side;

  constructor(difficulty: XiangqiDifficulty, aiSide: Side = Side.BLACK) {
    const config = DIFFICULTY_CONFIGS[difficulty];
    this.depth = config.aiDepth;
    this.topN = config.aiTopN;
    this.aiSide = aiSide;
  }

  getBestMove(board: XiangqiBoard): Move | null {
    const moves = this.generateOrderedMoves(board, this.aiSide);
    if (moves.length === 0) return null;

    // 一步杀检测
    for (const move of moves) {
      board.makeMove(move.from, move.to);
      const isGameOver = board.isGameOver();
      board.undoMove();
      if (isGameOver) return move;
    }

    // Minimax 搜索
    const scored: { move: Move; score: number }[] = [];
    for (const move of moves) {
      board.makeMove(move.from, move.to);
      const score = this.minimax(board, this.depth - 1, -Infinity, Infinity, false);
      board.undoMove();
      scored.push({ move, score });
    }

    scored.sort((a, b) => b.score - a.score);

    // topN 随机性（Easy 模式）
    const pick = Math.min(this.topN, scored.length);
    return scored[Math.floor(Math.random() * pick)].move;
  }

  private minimax(
    board: XiangqiBoard,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0 || board.isGameOver()) {
      return this.evaluate(board);
    }

    const side = isMaximizing ? this.aiSide : this.opponentSide();
    const moves = this.generateOrderedMoves(board, side);

    if (moves.length === 0) {
      // 无走法 = 当前方输了
      return isMaximizing ? -100000 : 100000;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        board.makeMove(move.from, move.to);
        const val = this.minimax(board, depth - 1, alpha, beta, false);
        board.undoMove();
        maxEval = Math.max(maxEval, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        board.makeMove(move.from, move.to);
        const val = this.minimax(board, depth - 1, alpha, beta, true);
        board.undoMove();
        minEval = Math.min(minEval, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // ── 走法生成 + MVV-LVA 排序 ──────────────────

  private generateOrderedMoves(board: XiangqiBoard, side: Side): Move[] {
    const moves: Move[] = [];
    const pieces = board.getAllPieces(side);

    for (const { pos, piece } of pieces) {
      const targets = board.getValidMoves(pos.row, pos.col);
      for (const to of targets) {
        moves.push({ from: pos, to });
      }
    }

    // MVV-LVA 排序：吃高价值子的走法优先
    moves.sort((a, b) => {
      const capA = board.grid[a.to.row][a.to.col];
      const capB = board.grid[b.to.row][b.to.col];
      const valA = capA ? this.getPieceValue(capA) : 0;
      const valB = capB ? this.getPieceValue(capB) : 0;
      return valB - valA;
    });

    return moves;
  }

  // ── 局面估值 ──────────────────────────────────

  private evaluate(board: XiangqiBoard): number {
    // 游戏结束时直接返回极端分
    if (board.gameResult === 'red_wins') {
      return this.aiSide === Side.RED ? 100000 : -100000;
    }
    if (board.gameResult === 'black_wins') {
      return this.aiSide === Side.BLACK ? 100000 : -100000;
    }

    let score = 0;
    const opponent = this.opponentSide();

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const piece = board.grid[r][c];
        if (!piece) continue;

        const value = this.getPieceValue(piece) + this.getPositionBonus(piece, r, c);
        if (piece.side === this.aiSide) {
          score += value;
        } else {
          score -= value;
        }
      }
    }

    // 将军加分：利用 board.isInCheck 缓存（当前玩家是否被将）
    if (board.isInCheck) {
      // 当前被将的一方处于劣势
      if (board.currentPlayer === this.aiSide) {
        score -= 30;
      } else {
        score += 30;
      }
    }

    return score;
  }

  private getPieceValue(piece: Piece): number {
    return PIECE_VALUES[piece.type];
  }

  private getPositionBonus(piece: Piece, row: number, col: number): number {
    const table = POSITION_BONUS[piece.type];
    if (!table) return 0;

    // 黑方直接用表，红方上下翻转
    const r = piece.side === Side.BLACK ? row : 9 - row;
    const bonus = table[r]?.[col] ?? 0;

    // 过河兵/卒额外加分
    if (piece.type === PieceType.SOLDIER) {
      const hasCrossed = piece.side === Side.RED ? row <= 4 : row >= 5;
      if (hasCrossed) {
        return bonus + (SOLDIER_CROSSED_RIVER_VALUE - PIECE_VALUES[PieceType.SOLDIER]);
      }
    }

    return bonus;
  }

  private opponentSide(): Side {
    return this.aiSide === Side.RED ? Side.BLACK : Side.RED;
  }
}
