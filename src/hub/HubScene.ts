// 游戏大厅场景：太空主题背景 + 游戏选择卡片

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

// 星星粒子数据
interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  graphic: Phaser.GameObjects.Arc;
}

// 卡片数据
interface GameCard {
  container: Phaser.GameObjects.Container;
  key: SceneKey;
  hovered: boolean;
}

export class HubScene extends Phaser.Scene {
  private stars: Star[] = [];
  private cards: GameCard[] = [];
  private transitioning = false;

  constructor() {
    super({ key: SceneKey.HUB });
  }

  create(): void {
    // 重置状态（场景可能被重新启动）
    this.stars = [];
    this.cards = [];
    this.transitioning = false;

    // 深色太空背景
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    this.cameras.main.fadeIn(400);

    // 创建星空
    this.createStarfield();

    // 标题
    this.createTitle();

    // 游戏卡片
    this.createGameCards();

    // 键盘输入
    this.setupInput();

    // 底部提示文字
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Select a game to play', {
        fontSize: '14px',
        color: '#667788',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    // 星星缓慢漂移
    for (const star of this.stars) {
      star.y += star.speed * (delta / 1000);
      if (star.y > GAME_HEIGHT + 2) {
        star.y = -2;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
      star.graphic.setPosition(star.x, star.y);
    }
  }

  // ── 星空背景 ──────────────────────────────────

  private createStarfield(): void {
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      const speed = Phaser.Math.FloatBetween(5, 20);

      const graphic = this.add.circle(x, y, size, 0xffffff, alpha);
      graphic.setDepth(0);

      this.stars.push({ x, y, speed, size, alpha, graphic });
    }
  }

  // ── 标题 ──────────────────────────────────────

  private createTitle(): void {
    // 标题发光效果（底层模糊文字）
    this.add
      .text(GAME_WIDTH / 2, 50, 'GAME ARCADE', {
        fontSize: '42px',
        color: '#4488ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setDepth(1);

    // 标题主体
    this.add
      .text(GAME_WIDTH / 2, 50, 'GAME ARCADE', {
        fontSize: '40px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);

    // 副标题
    this.add
      .text(GAME_WIDTH / 2, 85, '- Choose Your Game -', {
        fontSize: '14px',
        color: '#4488aa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── 游戏卡片 ──────────────────────────────────

  private createGameCards(): void {
    const cardW = 260;
    const cardH = 260;
    const gap = 40;
    const startX = GAME_WIDTH / 2 - cardW - gap / 2;
    const startY = (GAME_HEIGHT - cardH) / 2 + 15;

    // 卡片1：Pixel Adventure
    const card1 = this.createCard(
      startX,
      startY,
      cardW,
      cardH,
      'Pixel Adventure',
      'Press 1',
      SceneKey.TITLE,
      () => this.drawPixelAdventurePreview(0, 0, cardW, cardH)
    );

    // 卡片2：Space Shooter
    const card2 = this.createCard(
      startX + cardW + gap,
      startY,
      cardW,
      cardH,
      'Space Shooter',
      'Press 2',
      SceneKey.SHOOTER_TITLE,
      () => this.drawSpaceShooterPreview(0, 0, cardW, cardH)
    );

    this.cards = [card1, card2];
  }

  private createCard(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    hint: string,
    targetScene: SceneKey,
    drawPreview: () => Phaser.GameObjects.Graphics
  ): GameCard {
    const container = this.add.container(x + w / 2, y + h / 2);
    container.setDepth(10);

    // 卡片背景发光边框
    const glow = this.add.graphics();
    glow.lineStyle(3, 0x4488ff, 0.4);
    glow.strokeRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 12);
    container.add(glow);

    // 卡片背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141428, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(1, 0x334466, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(bg);

    // 预览图形（偏移到卡片内部中心位置）
    const preview = drawPreview();
    preview.setPosition(0, -20);
    container.add(preview);

    // 游戏标题
    const titleText = this.add
      .text(0, h / 2 - 65, title, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(titleText);

    // 按键提示
    const hintText = this.add
      .text(0, h / 2 - 40, hint, {
        fontSize: '14px',
        color: '#44ccff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    container.add(hintText);

    // 交互区域（用透明矩形做点击检测）
    const hitArea = this.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // 悬停效果
    hitArea.on('pointerover', () => {
      card.hovered = true;
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Sine.easeOut',
      });
      glow.clear();
      glow.lineStyle(3, 0x66aaff, 0.8);
      glow.strokeRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 12);
    });

    hitArea.on('pointerout', () => {
      card.hovered = false;
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Sine.easeOut',
      });
      glow.clear();
      glow.lineStyle(3, 0x4488ff, 0.4);
      glow.strokeRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 12);
    });

    // 点击选择
    hitArea.on('pointerdown', () => {
      this.selectGame(targetScene);
    });

    const card: GameCard = { container, key: targetScene, hovered: false };
    return card;
  }

  // ── 绘制 Pixel Adventure 预览（迷你 Claude 角色站在绿色平台上） ──

  private drawPixelAdventurePreview(
    _x: number,
    _y: number,
    _w: number,
    _h: number
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();

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
    const bodyX = -14;
    const bodyY = -12;
    const bodyW = 28;
    const bodyH = 40;
    g.fillStyle(0xc27462, 1);
    g.fillRoundedRect(bodyX, bodyY, bodyW, bodyH, 6);

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

    return g;
  }

  // ── 绘制 Space Shooter 预览（迷你 Claude 坐在蓝色飞船上） ──

  private drawSpaceShooterPreview(
    _x: number,
    _y: number,
    _w: number,
    _h: number
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();

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

    return g;
  }

  // ── 输入处理 ──────────────────────────────────

  private setupInput(): void {
    // 按键1 = Pixel Adventure
    this.input.keyboard?.on('keydown-ONE', () => {
      this.selectGame(SceneKey.TITLE);
    });

    // 按键2 = Space Shooter
    this.input.keyboard?.on('keydown-TWO', () => {
      this.selectGame(SceneKey.SHOOTER_TITLE);
    });
  }

  // ── 游戏切换（带淡出动画） ─────────────────────

  private selectGame(sceneKey: SceneKey): void {
    if (this.transitioning) return;
    this.transitioning = true;

    // 禁用输入，防止重复触发
    this.input.enabled = false;

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}
