// 游戏卡片定义：数据驱动 Hub 布局

import Phaser from 'phaser';
import { SceneKey } from '@shared/utils/Constants';

export interface GameCardDef {
  title: string;
  sceneKey: SceneKey;
  keyboardKey: string;
  drawPreview: (g: Phaser.GameObjects.Graphics) => void;
}

export const GAME_CARDS: GameCardDef[] = [
  {
    title: 'Pixel Adventure',
    sceneKey: SceneKey.TITLE,
    keyboardKey: 'ONE',
    drawPreview: drawPixelAdventurePreview,
  },
  {
    title: 'Space Shooter',
    sceneKey: SceneKey.SHOOTER_TITLE,
    keyboardKey: 'TWO',
    drawPreview: drawSpaceShooterPreview,
  },
  {
    title: 'Gomoku',
    sceneKey: SceneKey.GOMOKU_TITLE,
    keyboardKey: 'THREE',
    drawPreview: drawGomokuPreview,
  },
  {
    title: 'Xiangqi',
    sceneKey: SceneKey.XIANGQI_TITLE,
    keyboardKey: 'FOUR',
    drawPreview: drawXiangqiPreview,
  },
];

// ── 绘制 Pixel Adventure 预览（迷你 Claude 角色站在绿色平台上） ──

function drawPixelAdventurePreview(g: Phaser.GameObjects.Graphics): void {
  // 绿色平台
  g.fillStyle(0x4a7c2f, 1);
  g.fillRoundedRect(-60, 30, 120, 16, 4);

  // 草地装饰
  g.fillStyle(0x5a9c3f, 1);
  g.fillRect(-55, 28, 10, 4);
  g.fillRect(-30, 28, 8, 4);
  g.fillRect(10, 28, 12, 4);
  g.fillRect(40, 28, 8, 4);

  // 迷你 Claude 角色 — 身体（珊瑚色圆角矩形）
  g.fillStyle(0xc27462, 1);
  g.fillRoundedRect(-14, -12, 28, 40, 6);

  // 眼睛
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-4, 4, 4);
  g.fillCircle(4, 4, 4);
  g.fillStyle(0x222222, 1);
  g.fillCircle(-3, 4, 2);
  g.fillCircle(5, 4, 2);

  // 小脚
  g.fillStyle(0xa85e4e, 1);
  g.fillRoundedRect(-10, 28, 8, 4, 2);
  g.fillRoundedRect(2, 28, 8, 4, 2);

  // 背景小金币装饰
  g.fillStyle(0xffd700, 0.8);
  g.fillCircle(-45, -10, 6);
  g.fillCircle(45, -20, 6);
  g.fillCircle(35, 10, 6);

  // 金币内部 $ 符号效果（简单线条）
  g.lineStyle(1, 0xcc9900, 0.8);
  g.lineBetween(-45, -13, -45, -7);
  g.lineBetween(45, -23, 45, -17);
  g.lineBetween(35, 7, 35, 13);
}

// ── 绘制 Space Shooter 预览（迷你 Claude 坐在蓝色飞船上） ──

function drawSpaceShooterPreview(g: Phaser.GameObjects.Graphics): void {
  // 飞船主体（蓝色）
  g.fillStyle(0x4466aa, 1);
  g.beginPath();
  g.moveTo(0, -30);
  g.lineTo(25, 15);
  g.lineTo(20, 25);
  g.lineTo(-20, 25);
  g.lineTo(-25, 15);
  g.closePath();
  g.fillPath();

  // 飞船机翼
  g.fillStyle(0x335599, 1);
  // 左翼
  g.beginPath();
  g.moveTo(-15, 5);
  g.lineTo(-45, 25);
  g.lineTo(-40, 30);
  g.lineTo(-10, 20);
  g.closePath();
  g.fillPath();
  // 右翼
  g.beginPath();
  g.moveTo(15, 5);
  g.lineTo(45, 25);
  g.lineTo(40, 30);
  g.lineTo(10, 20);
  g.closePath();
  g.fillPath();

  // 引擎火焰
  g.fillStyle(0xff6600, 0.8);
  g.fillTriangle(-8, 25, 8, 25, 0, 40);
  g.fillStyle(0xffcc00, 0.6);
  g.fillTriangle(-4, 25, 4, 25, 0, 35);

  // 迷你 Claude 在驾驶舱（珊瑚色小人）
  g.fillStyle(0xc27462, 1);
  g.fillRoundedRect(-8, -12, 16, 22, 4);

  // 眼睛
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-3, -4, 3);
  g.fillCircle(3, -4, 3);
  g.fillStyle(0x222222, 1);
  g.fillCircle(-2, -4, 1.5);
  g.fillCircle(4, -4, 1.5);

  // 驾驶舱玻璃罩
  g.lineStyle(2, 0x88bbee, 0.6);
  g.strokeRoundedRect(-12, -18, 24, 30, 6);

  // 背景小星星装饰
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(-50, -20, 1.5);
  g.fillCircle(50, -10, 1);
  g.fillCircle(-35, 30, 1);
  g.fillCircle(40, 35, 1.5);
  g.fillCircle(55, 20, 1);

  // 子弹效果
  g.fillStyle(0x00ffff, 0.7);
  g.fillRect(-2, -45, 4, 10);
  g.fillRect(-2, -60, 4, 8);
}

// ── 绘制 Gomoku 预览（迷你棋盘 + 黑白棋子） ──

function drawGomokuPreview(g: Phaser.GameObjects.Graphics): void {
  // 迷你棋盘（5x5 网格）
  const cellSize = 18;
  const gridCount = 5;
  const total = (gridCount - 1) * cellSize;
  const ox = -total / 2;
  const oy = -total / 2 - 5;

  // 棋盘底色
  g.fillStyle(0xdeb887, 0.8);
  g.fillRoundedRect(ox - 12, oy - 12, total + 24, total + 24, 4);

  // 网格线
  g.lineStyle(1, 0x8b6914, 0.7);
  for (let i = 0; i < gridCount; i++) {
    g.lineBetween(ox + i * cellSize, oy, ox + i * cellSize, oy + total);
    g.lineBetween(ox, oy + i * cellSize, ox + total, oy + i * cellSize);
  }

  // 天元
  g.fillStyle(0x8b6914, 1);
  g.fillCircle(ox + 2 * cellSize, oy + 2 * cellSize, 2);

  // 黑棋
  g.fillStyle(0x222222, 1);
  g.fillCircle(ox + 2 * cellSize, oy + 2 * cellSize, 7); // 天元
  g.fillCircle(ox + 1 * cellSize, oy + 1 * cellSize, 7);
  g.fillCircle(ox + 3 * cellSize, oy + 2 * cellSize, 7);
  g.fillCircle(ox + 1 * cellSize, oy + 3 * cellSize, 7);

  // 白棋
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(ox + 2 * cellSize, oy + 1 * cellSize, 7);
  g.fillCircle(ox + 1 * cellSize, oy + 2 * cellSize, 7);
  g.fillCircle(ox + 3 * cellSize, oy + 3 * cellSize, 7);

  // 白棋高光
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(ox + 2 * cellSize - 2, oy + 1 * cellSize - 2, 2.5);
  g.fillCircle(ox + 1 * cellSize - 2, oy + 2 * cellSize - 2, 2.5);
  g.fillCircle(ox + 3 * cellSize - 2, oy + 3 * cellSize - 2, 2.5);
}

// ── 绘制 Xiangqi 预览（迷你象棋棋盘 + 红黑棋子） ──

function drawXiangqiPreview(g: Phaser.GameObjects.Graphics): void {
  const cellSize = 14;
  const cols = 5; // 简化的 5 列
  const rows = 6; // 简化的 6 行
  const gridW = (cols - 1) * cellSize;
  const gridH = (rows - 1) * cellSize;
  const ox = -gridW / 2;
  const oy = -gridH / 2 - 5;

  // 棋盘底色
  g.fillStyle(0xd4a76a, 0.8);
  g.fillRoundedRect(ox - 10, oy - 10, gridW + 20, gridH + 20, 4);

  // 网格线
  g.lineStyle(1, 0x5c3d1a, 0.7);
  for (let r = 0; r < rows; r++) {
    g.lineBetween(ox, oy + r * cellSize, ox + gridW, oy + r * cellSize);
  }
  for (let c = 0; c < cols; c++) {
    const x = ox + c * cellSize;
    if (c === 0 || c === cols - 1) {
      g.lineBetween(x, oy, x, oy + gridH);
    } else {
      // 河界断开
      g.lineBetween(x, oy, x, oy + 2 * cellSize);
      g.lineBetween(x, oy + 3 * cellSize, x, oy + gridH);
    }
  }

  // 九宫斜线（简化）
  g.lineStyle(1, 0x5c3d1a, 0.4);
  g.lineBetween(ox + 1 * cellSize, oy, ox + 3 * cellSize, oy + 2 * cellSize);
  g.lineBetween(ox + 3 * cellSize, oy, ox + 1 * cellSize, oy + 2 * cellSize);
  g.lineBetween(ox + 1 * cellSize, oy + 3 * cellSize, ox + 3 * cellSize, oy + 5 * cellSize);
  g.lineBetween(ox + 3 * cellSize, oy + 3 * cellSize, ox + 1 * cellSize, oy + 5 * cellSize);

  const pr = 6; // 棋子半径

  // 黑方棋子
  g.fillStyle(0xeeeedd, 1);
  g.fillCircle(ox + 2 * cellSize, oy, pr);
  g.fillCircle(ox + 0 * cellSize, oy, pr);
  g.fillCircle(ox + 4 * cellSize, oy, pr);
  // 黑方边框
  g.lineStyle(1, 0x333333, 0.8);
  g.strokeCircle(ox + 2 * cellSize, oy, pr);
  g.strokeCircle(ox + 0 * cellSize, oy, pr);
  g.strokeCircle(ox + 4 * cellSize, oy, pr);

  // 红方棋子
  g.fillStyle(0xffeedd, 1);
  g.fillCircle(ox + 2 * cellSize, oy + 5 * cellSize, pr);
  g.fillCircle(ox + 0 * cellSize, oy + 5 * cellSize, pr);
  g.fillCircle(ox + 4 * cellSize, oy + 5 * cellSize, pr);
  // 红方边框
  g.lineStyle(1, 0xcc2222, 0.8);
  g.strokeCircle(ox + 2 * cellSize, oy + 5 * cellSize, pr);
  g.strokeCircle(ox + 0 * cellSize, oy + 5 * cellSize, pr);
  g.strokeCircle(ox + 4 * cellSize, oy + 5 * cellSize, pr);

  // 中间散落几个棋子
  g.fillStyle(0xeeeedd, 1);
  g.fillCircle(ox + 1 * cellSize, oy + 2 * cellSize, pr);
  g.lineStyle(1, 0x333333, 0.8);
  g.strokeCircle(ox + 1 * cellSize, oy + 2 * cellSize, pr);

  g.fillStyle(0xffeedd, 1);
  g.fillCircle(ox + 3 * cellSize, oy + 3 * cellSize, pr);
  g.lineStyle(1, 0xcc2222, 0.8);
  g.strokeCircle(ox + 3 * cellSize, oy + 3 * cellSize, pr);
}
