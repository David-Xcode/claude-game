// 游戏大厅场景：太空主题背景 + 游戏选择卡片

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { unlockOrientation } from '@shared/utils/OrientationManager';
import { isTouch } from '@shared/ui/UIHelpers';
import { GAME_CARDS } from './GameCards';

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
    // 返回 Hub 时解除横屏锁定，允许竖屏使用
    unlockOrientation();

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
      .text(layout.width / 2, layout.height - layout.scale(30), 'Select a game to play', {
        fontSize: layout.fontSize(14),
        color: '#667788',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // 监听窗口尺寸变化，重建布局
    this.scale.on('resize', this.onResize, this);

    // 场景关闭时移除 resize 监听，避免再次 create 时重复注册
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  update(_time: number, delta: number): void {
    // 星星缓慢漂移
    for (const star of this.stars) {
      star.y += star.speed * (delta / 1000);
      if (star.y > layout.height + 2) {
        star.y = -2;
        star.x = Phaser.Math.Between(0, layout.width);
      }
      star.graphic.setPosition(star.x, star.y);
    }
  }

  // ── 星空背景 ──────────────────────────────────

  private createStarfield(): void {
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, layout.width);
      const y = Phaser.Math.Between(0, layout.height);
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
      .text(layout.width / 2, 50, 'GAME ARCADE', {
        fontSize: layout.fontSize(42),
        color: '#4488ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setDepth(1);

    // 标题主体
    this.add
      .text(layout.width / 2, 50, 'GAME ARCADE', {
        fontSize: layout.fontSize(40),
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(2);

    // 副标题
    this.add
      .text(layout.width / 2, 85, '- Choose Your Game -', {
        fontSize: layout.fontSize(14),
        color: '#4488aa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  // ── 游戏卡片（数据驱动） ──────────────────────

  private createGameCards(): void {
    const touch = isTouch(this);
    const count = GAME_CARDS.length;
    const gap = layout.scale(30);
    const maxCardW = layout.scale(220);
    const cardW = Math.min(maxCardW, Math.floor((layout.width - layout.scale(80) - gap * (count - 1)) / count));
    const cardH = cardW;
    const totalW = cardW * count + gap * (count - 1);
    const startX = (layout.width - totalW) / 2;
    const startY = (layout.height - cardH) / 2 + 15;

    GAME_CARDS.forEach((def, i) => {
      const card = this.createCard(
        startX + i * (cardW + gap), startY, cardW, cardH,
        def.title,
        touch ? 'Tap to play' : `Press ${i + 1}`,
        def.sceneKey,
        () => {
          const g = this.add.graphics();
          def.drawPreview(g);
          return g;
        }
      );
      this.cards.push(card);
    });
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
        fontSize: layout.fontSize(18),
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(titleText);

    // 按键提示
    const hintText = this.add
      .text(0, h / 2 - 40, hint, {
        fontSize: layout.fontSize(14),
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

  // ── 输入处理（数据驱动） ──────────────────────

  private setupInput(): void {
    // 先移除旧监听，防止 resize 重建时重复注册
    this.input.keyboard?.removeAllListeners();

    for (const def of GAME_CARDS) {
      this.input.keyboard?.on(`keydown-${def.keyboardKey}`, () => {
        this.selectGame(def.sceneKey);
      });
    }
  }

  // ── 窗口尺寸变化时重建全部 UI ─────────────────

  private onResize(): void {
    // 防止过渡动画期间重建
    if (this.transitioning) return;

    // 销毁所有游戏对象，重新创建
    this.children.removeAll(true);
    this.stars = [];
    this.cards = [];

    this.createStarfield();
    this.createTitle();
    this.createGameCards();
    this.setupInput();

    // 重新创建底部提示
    this.add
      .text(layout.width / 2, layout.height - layout.scale(30), 'Select a game to play', {
        fontSize: layout.fontSize(14),
        color: '#667788',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
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
