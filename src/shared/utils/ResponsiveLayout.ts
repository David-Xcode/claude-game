// 响应式布局单例 — 所有场景通过此模块获取动态尺寸和缩放因子
// 替代硬编码的 GAME_WIDTH / GAME_HEIGHT，支持 Phaser.Scale.RESIZE 模式

export const DESIGN_WIDTH = 800;
export const DESIGN_HEIGHT = 480;

// 棋盘布局计算结果
export interface BoardLayout {
  boardX: number;
  boardY: number;
  cellSize: number;
  pieceRadius: number;
}

class ResponsiveLayout {
  // 当前 canvas 实际尺寸
  width = DESIGN_WIDTH;
  height = DESIGN_HEIGHT;

  // 屏幕中心点
  centerX = DESIGN_WIDTH / 2;
  centerY = DESIGN_HEIGHT / 2;

  // 相对设计稿的缩放比
  scaleX = 1;
  scaleY = 1;

  // UI 统一缩放（取较小轴，避免拉伸）
  uiScale = 1;

  // 字号缩放（封顶 1.5，防止 PC 上文字过大）
  fontScale = 1;

  // 安全区内边距（notch / 圆角 / 状态栏）
  safeTop = 0;
  safeBottom = 0;
  safeLeft = 0;
  safeRight = 0;

  /** resize 时由 main.ts 调用，重算所有值 */
  update(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this.scaleX = w / DESIGN_WIDTH;
    this.scaleY = h / DESIGN_HEIGHT;
    this.uiScale = Math.min(this.scaleX, this.scaleY);
    this.fontScale = Math.min(this.uiScale, 1.5);

    this.readSafeAreaInsets();
  }

  /** 将设计稿字号缩放为当前屏幕适配字号 */
  fontSize(designPx: number): string {
    const scaled = Math.round(designPx * this.fontScale);
    return `${Math.max(scaled, 10)}px`;
  }

  /** 返回缩放后的数值字号（用于 Phaser 需要 number 的场景） */
  fontSizeNum(designPx: number): number {
    return Math.max(Math.round(designPx * this.fontScale), 10);
  }

  /** UI 元素尺寸缩放，带最小值保护 */
  scale(designPx: number, min = 0): number {
    return Math.max(Math.round(designPx * this.uiScale), min);
  }

  /**
   * 计算棋盘最优布局 — 居中且尽可能大
   * @param cols 列数（交叉点）
   * @param rows 行数（交叉点）
   * @param padding 四周留白（设计稿像素，会被缩放）
   * @param radiusRatio 棋子半径 / cellSize 的比例
   */
  boardLayout(
    cols: number,
    rows: number,
    padding = 50,
    radiusRatio = 0.42,
  ): BoardLayout {
    const pad = padding * this.uiScale;
    const availW = this.width - pad * 2;
    const availH = this.height - pad * 2;

    // cellSize 取宽高方向的较小值，确保棋盘完全可见
    const cellSize = Math.floor(
      Math.min(availW / (cols - 1), availH / (rows - 1)),
    );

    // 棋盘居中
    const boardW = (cols - 1) * cellSize;
    const boardH = (rows - 1) * cellSize;
    const boardX = this.centerX - boardW / 2;
    const boardY = this.centerY - boardH / 2;

    return {
      boardX,
      boardY,
      cellSize,
      pieceRadius: Math.floor(cellSize * radiusRatio),
    };
  }

  // 从 CSS env() 读取安全区 inset
  private readSafeAreaInsets(): void {
    const style = getComputedStyle(document.documentElement);
    this.safeTop = parseFloat(style.getPropertyValue('--sat')) || 0;
    this.safeBottom = parseFloat(style.getPropertyValue('--sab')) || 0;
    this.safeLeft = parseFloat(style.getPropertyValue('--sal')) || 0;
    this.safeRight = parseFloat(style.getPropertyValue('--sar')) || 0;
  }
}

/** 全局单例 — 所有场景共享 */
export const layout = new ResponsiveLayout();
