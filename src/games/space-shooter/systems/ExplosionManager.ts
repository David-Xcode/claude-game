// 爆炸特效管理器：管理小/中/Boss 级别爆炸的粒子发射器
// 使用程序化生成的粒子纹理，一次性发射配置

import Phaser from 'phaser';
import { SHOOTER_DEPTH, SHOOTER_COLORS } from '../data/ShooterConstants';

/** 粒子纹理 key */
const TEX_PARTICLE_ORANGE = 'particle_orange';
const TEX_PARTICLE_WHITE = 'particle_white';
const TEX_PARTICLE_DEBRIS = 'particle_debris';

export class ExplosionManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
  }

  /**
   * 通用爆炸入口
   * @param x 爆炸中心 X
   * @param y 爆炸中心 Y
   * @param isBig 是否为大爆炸（玩家死亡 / Boss 级别）
   */
  explode(x: number, y: number, isBig: boolean = false): void {
    if (isBig) {
      this.spawnBoss(x, y);
    } else {
      this.spawnSmall(x, y);
    }
  }

  /** 小型爆炸：普通敌人被击毁 */
  spawnSmall(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, TEX_PARTICLE_ORANGE, {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 200,
      quantity: 8,
      emitting: false,
    });
    emitter.setDepth(SHOOTER_DEPTH.EFFECTS);

    emitter.explode(8);

    // 轻微镜头抖动
    this.scene.cameras.main.shake(80, 0.004);

    // 自动清理发射器
    this.scene.time.delayedCall(400, () => {
      emitter.destroy();
    });
  }

  /** 中型爆炸：较大敌人 */
  spawnMedium(x: number, y: number): void {
    // 白色核心粒子
    const coreEmitter = this.scene.add.particles(x, y, TEX_PARTICLE_WHITE, {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 250,
      quantity: 6,
      emitting: false,
    });
    coreEmitter.setDepth(SHOOTER_DEPTH.EFFECTS + 1);

    // 橙色外层粒子
    const outerEmitter = this.scene.add.particles(x, y, TEX_PARTICLE_ORANGE, {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 350,
      quantity: 10,
      emitting: false,
    });
    outerEmitter.setDepth(SHOOTER_DEPTH.EFFECTS);

    coreEmitter.explode(6);
    outerEmitter.explode(10);

    // 中等镜头抖动
    this.scene.cameras.main.shake(120, 0.008);

    this.scene.time.delayedCall(600, () => {
      coreEmitter.destroy();
      outerEmitter.destroy();
    });
  }

  /**
   * Boss 爆炸：多阶段爆炸序列
   * 阶段1：2 秒内随机位置产生小爆炸
   * 阶段2：白色闪屏 + 大量碎片粒子
   */
  spawnBoss(x: number, y: number): void {
    const duration = 2000;
    const interval = 150;

    // 阶段1：随机位置连续小爆炸
    this.scene.time.addEvent({
      delay: interval,
      repeat: Math.floor(duration / interval) - 1,
      callback: () => {
        const ox = Phaser.Math.Between(-40, 40);
        const oy = Phaser.Math.Between(-40, 40);
        this.spawnSmall(x + ox, y + oy);
      },
    });

    // 阶段2：大爆炸终结
    this.scene.time.delayedCall(duration, () => {
      // 白色闪屏
      this.scene.cameras.main.flash(400, 255, 255, 255);
      this.scene.cameras.main.shake(300, 0.02);

      // 白色核心爆裂
      const flashEmitter = this.scene.add.particles(x, y, TEX_PARTICLE_WHITE, {
        speed: { min: 40, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 3, end: 0 },
        lifespan: 500,
        quantity: 12,
        emitting: false,
      });
      flashEmitter.setDepth(SHOOTER_DEPTH.EFFECTS + 2);

      // 碎片四散
      const debrisEmitter = this.scene.add.particles(x, y, TEX_PARTICLE_DEBRIS, {
        speed: { min: 80, max: 250 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0.2 },
        rotate: { min: 0, max: 360 },
        lifespan: 800,
        quantity: 20,
        emitting: false,
      });
      debrisEmitter.setDepth(SHOOTER_DEPTH.EFFECTS + 1);

      // 外层火焰
      const fireEmitter = this.scene.add.particles(x, y, TEX_PARTICLE_ORANGE, {
        speed: { min: 60, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        lifespan: 600,
        quantity: 16,
        emitting: false,
      });
      fireEmitter.setDepth(SHOOTER_DEPTH.EFFECTS);

      flashEmitter.explode(12);
      debrisEmitter.explode(20);
      fireEmitter.explode(16);

      // 清理所有发射器
      this.scene.time.delayedCall(1200, () => {
        flashEmitter.destroy();
        debrisEmitter.destroy();
        fireEmitter.destroy();
      });
    });
  }

  // ═══════════════════════════════════════════════
  // 程序化粒子纹理生成
  // ═══════════════════════════════════════════════

  private createParticleTextures(): void {
    // 橙色圆形粒子
    if (!this.scene.textures.exists(TEX_PARTICLE_ORANGE)) {
      const g = this.scene.add.graphics();
      // 外层辉光
      g.fillStyle(SHOOTER_COLORS.EXPLOSION, 0.3);
      g.fillCircle(6, 6, 6);
      // 核心
      g.fillStyle(SHOOTER_COLORS.EXPLOSION, 1);
      g.fillCircle(6, 6, 4);
      // 亮点
      g.fillStyle(0xffdd44, 0.8);
      g.fillCircle(5, 5, 2);
      g.generateTexture(TEX_PARTICLE_ORANGE, 12, 12);
      g.destroy();
    }

    // 白色圆形粒子
    if (!this.scene.textures.exists(TEX_PARTICLE_WHITE)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(6, 6, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(6, 6, 3);
      g.generateTexture(TEX_PARTICLE_WHITE, 12, 12);
      g.destroy();
    }

    // 碎片粒子（小矩形）
    if (!this.scene.textures.exists(TEX_PARTICLE_DEBRIS)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x888888, 1);
      g.fillRect(0, 0, 6, 4);
      g.fillStyle(0x666666, 1);
      g.fillRect(1, 1, 4, 2);
      g.generateTexture(TEX_PARTICLE_DEBRIS, 6, 4);
      g.destroy();
    }
  }
}
