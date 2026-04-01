// 五子棋 AI：Minimax + Alpha-Beta 剪枝 + 模式评分

import { GOMOKU, GomokuDifficulty } from '../data/GomokuConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';
import { Position } from './GomokuBoard';

type Grid = (0 | 1 | 2)[][];

// 四个扫描方向
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export class GomokuAI {
  private depth: number;
  private topN: number;
  private aiPlayer: 1 | 2;
  // 增量候选缓存，避免每次 getBestMove 都全盘扫描
  private candidateCache = new Set<string>();

  constructor(difficulty: GomokuDifficulty, aiPlayer: 1 | 2 = 2) {
    const config = DIFFICULTY_CONFIGS[difficulty];
    this.depth = config.aiDepth;
    this.topN = config.aiTopN;
    this.aiPlayer = aiPlayer;
  }

  /** 棋盘上有新落子时调用，增量更新候选位置 */
  notifyMove(grid: Grid, row: number, col: number): void {
    const size = GOMOKU.GRID_SIZE;
    // 移除已落子的位置
    this.candidateCache.delete(`${row},${col}`);
    // 添加新落子周围 2 格的空位
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (grid[nr][nc] !== 0) continue;
        this.candidateCache.add(`${nr},${nc}`);
      }
    }
  }

  /** 重置候选缓存 */
  resetCache(): void {
    this.candidateCache.clear();
  }

  /** 获取 AI 最佳落子位置 */
  getBestMove(grid: Grid): Position {
    // 用缓存候选（如果有的话），否则回退到全扫描
    let candidates: Position[];
    if (this.candidateCache.size > 0) {
      candidates = [];
      for (const key of this.candidateCache) {
        const [r, c] = key.split(',').map(Number);
        if (grid[r][c] === 0) {
          candidates.push({ row: r, col: c });
        }
      }
    } else {
      candidates = this.getCandidates(grid);
    }

    // 空棋盘 → 下天元
    if (candidates.length === 0) {
      return { row: 7, col: 7 };
    }

    // 快速检查：能否一手获胜或必须堵对手
    const instant = this.findInstantMove(grid, candidates);
    if (instant) return instant;

    // Minimax 搜索（try/finally 保护棋盘状态）
    const scored: { pos: Position; score: number }[] = [];
    for (const pos of candidates) {
      grid[pos.row][pos.col] = this.aiPlayer;
      try {
        const score = this.minimax(
          grid,
          this.depth - 1,
          -Infinity,
          Infinity,
          false
        );
        scored.push({ pos, score });
      } finally {
        grid[pos.row][pos.col] = 0;
      }
    }

    // 按分数降序排序
    scored.sort((a, b) => b.score - a.score);

    // 根据 topN 引入随机性（Easy 模式）
    const pick = Math.min(this.topN, scored.length);
    const chosen = scored[Math.floor(Math.random() * pick)];
    return chosen.pos;
  }

  /** 快速检测：AI 能否直接五连 / 对手是否有四连必须堵 */
  private findInstantMove(grid: Grid, candidates: Position[]): Position | null {
    const opponent = this.aiPlayer === 1 ? 2 : 1;

    // 优先：AI 一手胜
    for (const pos of candidates) {
      grid[pos.row][pos.col] = this.aiPlayer;
      if (this.hasFive(grid, pos.row, pos.col, this.aiPlayer)) {
        grid[pos.row][pos.col] = 0;
        return pos;
      }
      grid[pos.row][pos.col] = 0;
    }

    // 其次：堵对手一手胜
    for (const pos of candidates) {
      grid[pos.row][pos.col] = opponent;
      if (this.hasFive(grid, pos.row, pos.col, opponent)) {
        grid[pos.row][pos.col] = 0;
        return pos;
      }
      grid[pos.row][pos.col] = 0;
    }

    return null;
  }

  /** 检查在 (row,col) 落子后是否形成五连 */
  private hasFive(grid: Grid, row: number, col: number, player: number): boolean {
    for (const [dr, dc] of DIRS) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= GOMOKU.GRID_SIZE || c < 0 || c >= GOMOKU.GRID_SIZE) break;
        if (grid[r][c] !== player) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= GOMOKU.GRID_SIZE || c < 0 || c >= GOMOKU.GRID_SIZE) break;
        if (grid[r][c] !== player) break;
        count++;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  /** Minimax + Alpha-Beta */
  private minimax(
    grid: Grid,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0) {
      return this.evaluate(grid);
    }

    const candidates = this.getCandidates(grid);
    if (candidates.length === 0) return this.evaluate(grid);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const pos of candidates) {
        grid[pos.row][pos.col] = this.aiPlayer;
        // 如果直接五连，立刻返回极高分
        if (this.hasFive(grid, pos.row, pos.col, this.aiPlayer)) {
          grid[pos.row][pos.col] = 0;
          return 1000000;
        }
        const val = this.minimax(grid, depth - 1, alpha, beta, false);
        grid[pos.row][pos.col] = 0;
        maxEval = Math.max(maxEval, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      const opponent = this.aiPlayer === 1 ? 2 : 1;
      let minEval = Infinity;
      for (const pos of candidates) {
        grid[pos.row][pos.col] = opponent;
        if (this.hasFive(grid, pos.row, pos.col, opponent)) {
          grid[pos.row][pos.col] = 0;
          return -1000000;
        }
        const val = this.minimax(grid, depth - 1, alpha, beta, true);
        grid[pos.row][pos.col] = 0;
        minEval = Math.min(minEval, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /** 获取候选落子位置：已有棋子周围 2 格内的空位 */
  private getCandidates(grid: Grid): Position[] {
    const size = GOMOKU.GRID_SIZE;
    const candidates: Position[] = [];
    const visited = new Set<string>();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) continue;
        // 扫描周围 2 格
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            if (grid[nr][nc] !== 0) continue;
            const key = `${nr},${nc}`;
            if (visited.has(key)) continue;
            visited.add(key);
            candidates.push({ row: nr, col: nc });
          }
        }
      }
    }

    return candidates;
  }

  /** 全局棋面评估：AI 得分 - 对手得分 */
  private evaluate(grid: Grid): number {
    const opponent = this.aiPlayer === 1 ? 2 : 1;
    let aiScore = 0;
    let oppScore = 0;

    const size = GOMOKU.GRID_SIZE;

    // 遍历所有可能的五连线段
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        for (const [dr, dc] of DIRS) {
          // 检查是否有足够空间容纳五连
          const endR = r + dr * 4;
          const endC = c + dc * 4;
          if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

          // 收集这条线上的 5 个格子
          let aiCount = 0;
          let oppCount = 0;
          for (let i = 0; i < 5; i++) {
            const cell = grid[r + dr * i][c + dc * i];
            if (cell === this.aiPlayer) aiCount++;
            else if (cell === opponent) oppCount++;
          }

          // 只有纯色（没有对方棋子）的线段才有价值
          if (aiCount > 0 && oppCount === 0) {
            aiScore += this.lineScore(aiCount);
          }
          if (oppCount > 0 && aiCount === 0) {
            oppScore += this.lineScore(oppCount);
          }
        }
      }
    }

    return aiScore - oppScore * 1.1; // 稍微偏防守
  }

  /** 根据线段中棋子数量评分 */
  private lineScore(count: number): number {
    switch (count) {
      case 1: return 1;
      case 2: return 10;
      case 3: return 100;
      case 4: return 5000;
      case 5: return 100000;
      default: return 0;
    }
  }
}
