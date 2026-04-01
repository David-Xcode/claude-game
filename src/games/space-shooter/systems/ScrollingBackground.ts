// 视差滚动背景系统：根据关卡索引生成不同主题的多层 TileSprite 背景
// 每层以不同速度向下滚动，产生纵深感

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { SHOOTER, SHOOTER_COLORS, SHOOTER_DEPTH } from '../data/ShooterConstants';

/** 单个滚动层的配置 */
interface ScrollLayer {
  tileSprite: Phaser.GameObjects.TileSprite;
  speed: number; // 像素/秒
}

/** 纹理尺寸常量 */
const TEX_W = 800;
const TEX_H = 480;

export class ScrollingBackground {
  private scene: Phaser.Scene;
  private layers: ScrollLayer[] = [];

  constructor(scene: Phaser.Scene, stageIndex: number) {
    this.scene = scene;

    switch (stageIndex) {
      case 0:
        this.createCityStage();
        break;
      case 1:
        this.createSkyStage();
        break;
      case 2:
        this.createSpaceStage();
        break;
      default:
        this.createCityStage();
        break;
    }
  }

  /** 每帧更新滚动位置 */
  update(delta: number): void {
    const dt = delta / 1000;
    for (const layer of this.layers) {
      layer.tileSprite.tilePositionY -= layer.speed * dt;
    }
  }

  /** 销毁所有层 */
  destroy(): void {
    for (const layer of this.layers) {
      layer.tileSprite.destroy();
    }
    this.layers = [];
  }

  // ═══════════════════════════════════════════════
  // 关卡 0：城市天际线
  // ═══════════════════════════════════════════════

  private createCityStage(): void {
    // 层1：浅蓝天空渐变（最远，最慢）
    this.createTextureIfMissing('bg_city_sky', (g) => {
      // 从顶部浅蓝到底部稍深蓝的渐变
      for (let y = 0; y < TEX_H; y++) {
        const t = y / TEX_H;
        const r = Phaser.Math.Linear(0x87, 0x55, t);
        const gv = Phaser.Math.Linear(0xce, 0x99, t);
        const b = Phaser.Math.Linear(0xeb, 0xcc, t);
        const color = (r << 16) | (gv << 8) | b;
        g.fillStyle(color);
        g.fillRect(0, y, TEX_W, 1);
      }
    });
    this.addLayer('bg_city_sky', 10, SHOOTER_DEPTH.BACKGROUND_FAR);

    // 层2：远处建筑剪影（深灰色）
    this.createTextureIfMissing('bg_city_far', (g) => {
      // 透明底
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      // 随机建筑剪影
      const seed = 42;
      const rng = new Phaser.Math.RandomDataGenerator([seed.toString()]);

      for (let x = 0; x < TEX_W; x += rng.between(30, 60)) {
        const bw = rng.between(20, 50);
        const bh = rng.between(80, 220);
        const by = TEX_H - bh;

        g.fillStyle(SHOOTER_COLORS.STAGE1_BUILDING, 0.6);
        g.fillRect(x, by, bw, bh);

        // 楼顶小装饰
        if (rng.frac() > 0.5) {
          g.fillRect(x + bw / 2 - 2, by - 8, 4, 8);
        }
      }
    });
    this.addLayer('bg_city_far', 25, SHOOTER_DEPTH.BACKGROUND_FAR + 1);

    // 层3：近处建筑（带黄色窗户）
    this.createTextureIfMissing('bg_city_near', (g) => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      const rng = new Phaser.Math.RandomDataGenerator(['99']);

      for (let x = 0; x < TEX_W; x += rng.between(40, 80)) {
        const bw = rng.between(30, 60);
        const bh = rng.between(120, 300);
        const by = TEX_H - bh;

        // 建筑主体
        g.fillStyle(SHOOTER_COLORS.STAGE1_BUILDING, 0.85);
        g.fillRect(x, by, bw, bh);

        // 窗户（黄色小方块）
        g.fillStyle(0xffdd44, 0.8);
        const windowRows = Math.floor(bh / 18);
        const windowCols = Math.floor(bw / 14);
        for (let wy = 0; wy < windowRows; wy++) {
          for (let wx = 0; wx < windowCols; wx++) {
            if (rng.frac() > 0.35) {
              g.fillRect(
                x + 5 + wx * 14,
                by + 8 + wy * 18,
                6,
                8
              );
            }
          }
        }
      }
    });
    this.addLayer('bg_city_near', 50, SHOOTER_DEPTH.BACKGROUND_FAR + 2);
  }

  // ═══════════════════════════════════════════════
  // 关卡 1：平流层（天空）
  // ═══════════════════════════════════════════════

  private createSkyStage(): void {
    // 层1：深蓝天空渐变
    this.createTextureIfMissing('bg_sky_gradient', (g) => {
      for (let y = 0; y < TEX_H; y++) {
        const t = y / TEX_H;
        const r = Phaser.Math.Linear(0x1a, 0x44, t);
        const gv = Phaser.Math.Linear(0x33, 0x77, t);
        const b = Phaser.Math.Linear(0x66, 0xbb, t);
        const color = (r << 16) | (gv << 8) | b;
        g.fillStyle(color);
        g.fillRect(0, y, TEX_W, 1);
      }
    });
    this.addLayer('bg_sky_gradient', 15, SHOOTER_DEPTH.BACKGROUND_FAR);

    // 层2：白色云团
    this.createTextureIfMissing('bg_sky_clouds', (g) => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      const rng = new Phaser.Math.RandomDataGenerator(['clouds']);

      // 生成若干朵云
      for (let i = 0; i < 8; i++) {
        const cx = rng.between(50, TEX_W - 50);
        const cy = rng.between(50, TEX_H - 50);

        g.fillStyle(SHOOTER_COLORS.STAGE2_CLOUD, 0.25);

        // 云由多个椭圆叠加
        const numBlobs = rng.between(3, 6);
        for (let j = 0; j < numBlobs; j++) {
          const ox = rng.between(-40, 40);
          const oy = rng.between(-15, 15);
          const rw = rng.between(30, 70);
          const rh = rng.between(15, 30);
          g.fillEllipse(cx + ox, cy + oy, rw, rh);
        }
      }
    });
    this.addLayer('bg_sky_clouds', 30, SHOOTER_DEPTH.BACKGROUND_FAR + 1);

    // 层3：浮空岩石岛
    this.createTextureIfMissing('bg_sky_rocks', (g) => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      const rng = new Phaser.Math.RandomDataGenerator(['rocks']);

      for (let i = 0; i < 5; i++) {
        const rx = rng.between(40, TEX_W - 40);
        const ry = rng.between(60, TEX_H - 60);
        const rw = rng.between(30, 70);
        const rh = rng.between(20, 40);

        // 岩石主体（灰褐色）
        g.fillStyle(0x776655, 0.7);
        g.fillEllipse(rx, ry, rw, rh);

        // 顶部草地
        g.fillStyle(0x55aa44, 0.6);
        g.fillEllipse(rx, ry - rh * 0.2, rw * 0.8, rh * 0.3);
      }
    });
    this.addLayer('bg_sky_rocks', 50, SHOOTER_DEPTH.BACKGROUND_FAR + 2);
  }

  // ═══════════════════════════════════════════════
  // 关卡 2：深空
  // ═══════════════════════════════════════════════

  private createSpaceStage(): void {
    // 层1：纯黑底 + 星星
    this.createTextureIfMissing('bg_space_stars', (g) => {
      // 黑色背景
      g.fillStyle(SHOOTER_COLORS.STAGE3_SPACE);
      g.fillRect(0, 0, TEX_W, TEX_H);

      // 随机星星
      const rng = new Phaser.Math.RandomDataGenerator(['stars']);
      for (let i = 0; i < 150; i++) {
        const sx = rng.between(0, TEX_W);
        const sy = rng.between(0, TEX_H);
        const size = rng.frac() > 0.85 ? 2 : 1;
        const brightness = rng.realInRange(0.4, 1.0);
        g.fillStyle(0xffffff, brightness);
        g.fillRect(sx, sy, size, size);
      }
    });
    this.addLayer('bg_space_stars', 12, SHOOTER_DEPTH.BACKGROUND_FAR);

    // 层2：星云（紫蓝色团状）
    this.createTextureIfMissing('bg_space_nebula', (g) => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      const rng = new Phaser.Math.RandomDataGenerator(['nebula']);

      // 绘制多个星云团
      for (let i = 0; i < 4; i++) {
        const nx = rng.between(80, TEX_W - 80);
        const ny = rng.between(80, TEX_H - 80);

        // 多层渐变圆模拟星云
        for (let r = 80; r > 10; r -= 8) {
          const t = r / 80;
          const alpha = 0.03 + (1 - t) * 0.06;

          // 紫色和蓝色交替
          const color = i % 2 === 0 ? SHOOTER_COLORS.STAGE3_NEBULA : 0x223366;
          g.fillStyle(color, alpha);
          g.fillEllipse(
            nx + rng.between(-10, 10),
            ny + rng.between(-10, 10),
            r * 2 + rng.between(-20, 20),
            r * 1.5 + rng.between(-15, 15)
          );
        }
      }
    });
    this.addLayer('bg_space_nebula', 25, SHOOTER_DEPTH.BACKGROUND_FAR + 1);

    // 层3：小行星碎片
    this.createTextureIfMissing('bg_space_asteroids', (g) => {
      g.fillStyle(0x000000, 0);
      g.fillRect(0, 0, TEX_W, TEX_H);

      const rng = new Phaser.Math.RandomDataGenerator(['asteroids']);

      for (let i = 0; i < 6; i++) {
        const ax = rng.between(30, TEX_W - 30);
        const ay = rng.between(30, TEX_H - 30);
        const size = rng.between(8, 22);

        // 不规则多边形模拟小行星
        g.fillStyle(0x555544, 0.6);
        const points: { x: number; y: number }[] = [];
        const numPoints = rng.between(5, 8);
        for (let j = 0; j < numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const dist = size * rng.realInRange(0.6, 1.0);
          points.push({
            x: ax + Math.cos(angle) * dist,
            y: ay + Math.sin(angle) * dist,
          });
        }

        g.beginPath();
        g.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
          g.lineTo(points[j].x, points[j].y);
        }
        g.closePath();
        g.fillPath();

        // 高光
        g.fillStyle(0x888877, 0.4);
        g.fillCircle(ax - size * 0.2, ay - size * 0.2, size * 0.3);
      }
    });
    this.addLayer('bg_space_asteroids', 45, SHOOTER_DEPTH.BACKGROUND_FAR + 2);
  }

  // ═══════════════════════════════════════════════
  // 内部工具方法
  // ═══════════════════════════════════════════════

  /** 如果纹理尚未存在，通过回调绘制并生成 */
  private createTextureIfMissing(
    key: string,
    drawFn: (g: Phaser.GameObjects.Graphics) => void
  ): void {
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.add.graphics();
    drawFn(g);
    g.generateTexture(key, TEX_W, TEX_H);
    g.destroy();
  }

  /** 添加一个 TileSprite 滚动层 */
  private addLayer(textureKey: string, speed: number, depth: number): void {
    const tileSprite = this.scene.add.tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      textureKey
    );
    tileSprite.setDepth(depth);
    tileSprite.setScrollFactor(0);

    this.layers.push({ tileSprite, speed });
  }
}
