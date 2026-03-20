// 关卡管理器：加载关卡数据、创建平台/地形、生成敌人和道具

import Phaser from 'phaser';
import {
  LevelConfig,
  PlatformData,
  SpikeData,
  LEVELS,
} from '../data/levels';
import { TILE_SIZE, DEPTH, ItemType, COLORS } from '../utils/Constants';
import { EnemyFactory } from '../entities/enemies/EnemyFactory';
import { Enemy } from '../entities/Enemy';
import { Coin } from '../entities/items/Coin';
import { HealthPickup } from '../entities/items/HealthPickup';

export class LevelManager {
  private scene: Phaser.Scene;

  // 物理组
  public platforms!: Phaser.Physics.Arcade.StaticGroup;
  public movingPlatforms!: Phaser.GameObjects.Rectangle[];
  public spikes!: Phaser.Physics.Arcade.StaticGroup;
  public enemies: Enemy[] = [];
  public coins!: Phaser.Physics.Arcade.Group;
  public healthPickups!: Phaser.Physics.Arcade.Group;
  public flag!: Phaser.GameObjects.Rectangle;

  // 当前关卡配置
  public currentLevel!: LevelConfig;
  public levelIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadLevel(index: number): void {
    // #12: 关卡索引边界检查
    if (index < 0 || index >= LEVELS.length) {
      throw new Error(`Invalid level index: ${index}. Valid range: 0-${LEVELS.length - 1}`);
    }

    this.levelIndex = index;
    this.currentLevel = LEVELS[index];

    // 初始化物理组
    this.platforms = this.scene.physics.add.staticGroup();
    this.movingPlatforms = [];
    this.spikes = this.scene.physics.add.staticGroup();
    // #14: 道具使用动态物理组（allowGravity: false + immovable），让 tween 动画与碰撞盒同步
    this.coins = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.healthPickups = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.enemies = [];

    // 设置世界边界
    this.scene.physics.world.setBounds(
      0, 0,
      this.currentLevel.width,
      this.currentLevel.height
    );

    // 背景色
    this.scene.cameras.main.setBackgroundColor(this.currentLevel.skyColor);

    // 构建关卡
    this.createDecorations();
    this.createGround();
    this.createPlatforms();
    this.createSpikes();
    this.createItems();
    this.createEnemies();
    this.createFlag();
  }

  private createDecorations(): void {
    const level = this.currentLevel;

    for (const deco of level.decorations) {
      const scale = deco.scale ?? 1;
      switch (deco.type) {
        case 'cloud': {
          const g = this.scene.add.graphics();
          g.fillStyle(0xffffff, 0.6);
          g.fillEllipse(0, 0, 60 * scale, 25 * scale);
          g.fillEllipse(-15 * scale, -5 * scale, 30 * scale, 20 * scale);
          g.fillEllipse(15 * scale, -5 * scale, 35 * scale, 20 * scale);
          g.setPosition(deco.x, deco.y);
          g.setDepth(DEPTH.BACKGROUND);
          break;
        }
        case 'bush': {
          const g = this.scene.add.graphics();
          g.fillStyle(0x2d5a1e, 0.8);
          g.fillEllipse(0, 0, 40, 20);
          g.fillEllipse(-12, -3, 20, 16);
          g.fillEllipse(12, -3, 20, 16);
          g.setPosition(deco.x, deco.y);
          g.setDepth(DEPTH.BACKGROUND + 1);
          break;
        }
        case 'stalactite': {
          const g = this.scene.add.graphics();
          g.fillStyle(0x3a3a4e, 0.7);
          g.fillTriangle(-10, 0, 10, 0, 0, 40);
          g.setPosition(deco.x, deco.y);
          g.setDepth(DEPTH.BACKGROUND);
          break;
        }
        case 'crystal': {
          const g = this.scene.add.graphics();
          g.fillStyle(0x44aaff, 0.6);
          g.fillTriangle(-6, 0, 6, 0, 0, -20);
          g.setPosition(deco.x, deco.y);
          g.setDepth(DEPTH.BACKGROUND + 1);
          break;
        }
        case 'rock': {
          const g = this.scene.add.graphics();
          g.fillStyle(0x555555, 0.7);
          g.fillEllipse(0, 0, 30, 20);
          g.setPosition(deco.x, deco.y);
          g.setDepth(DEPTH.BACKGROUND);
          break;
        }
      }
    }
  }

  private createGround(): void {
    const level = this.currentLevel;

    for (const seg of level.groundSegments) {
      const width = seg.endX - seg.startX;
      const height = level.height - seg.y + TILE_SIZE;

      // 地面填充（视觉）
      const ground = this.scene.add.rectangle(
        seg.startX + width / 2,
        seg.y + height / 2,
        width,
        height,
        seg.color
      );
      ground.setDepth(DEPTH.PLATFORMS);

      // 添加土壤层
      this.scene.add.rectangle(
        seg.startX + width / 2,
        seg.y + 8,
        width,
        16,
        Phaser.Display.Color.ValueToColor(seg.color).darken(20).color
      ).setDepth(DEPTH.PLATFORMS + 1);

      // #7: 物理碰撞体 — 使用 updateFromGameObject 代替手动 offset
      const collider = this.scene.add.rectangle(
        seg.startX + width / 2,
        seg.y + TILE_SIZE / 2,
        width,
        TILE_SIZE
      );
      collider.setVisible(false);
      this.platforms.add(collider);
      (collider.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
  }

  private createPlatforms(): void {
    for (const plat of this.currentLevel.platforms) {
      if (plat.moving) {
        this.createMovingPlatform(plat);
      } else if (plat.crumble) {
        this.createCrumblePlatform(plat);
      } else {
        this.createStaticPlatform(plat);
      }
    }
  }

  private createStaticPlatform(plat: PlatformData): void {
    // 视觉层
    this.scene.add.rectangle(
      plat.x, plat.y, plat.width, plat.height, plat.color
    ).setDepth(DEPTH.PLATFORMS);

    // 顶部高光线
    this.scene.add.rectangle(
      plat.x, plat.y - plat.height / 2 + 2,
      plat.width, 4,
      Phaser.Display.Color.ValueToColor(plat.color).lighten(30).color
    ).setDepth(DEPTH.PLATFORMS + 1);

    // #7: 物理体 — 使用 updateFromGameObject
    const collider = this.scene.add.rectangle(plat.x, plat.y, plat.width, plat.height);
    collider.setVisible(false);
    this.platforms.add(collider);
    const body = collider.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
    // 单向碰撞：仅顶部有碰撞，允许玩家从下方穿过
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  // #3: 移动平台使用速度驱动而非 tween，确保玩家随平台移动
  private createMovingPlatform(plat: PlatformData): void {
    const visual = this.scene.add.rectangle(
      plat.x, plat.y, plat.width, plat.height, plat.color
    );
    visual.setDepth(DEPTH.PLATFORMS);

    this.scene.physics.add.existing(visual, false);
    const body = visual.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setFrictionX(1);
    // 单向碰撞
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;

    const moving = plat.moving!;
    // 存储移动参数，在 updateMovingPlatforms 中使用
    (visual as any)._moveOriginX = plat.x;
    (visual as any)._moveOriginY = plat.y;
    (visual as any)._moveAxis = moving.axis;
    (visual as any)._moveDistance = moving.distance;
    (visual as any)._moveSpeed = moving.speed;

    this.movingPlatforms.push(visual);
  }

  // 每帧更新移动平台（由 GameScene.update 调用）
  updateMovingPlatforms(time: number): void {
    for (const visual of this.movingPlatforms) {
      const data = visual as any;
      const body = visual.body as Phaser.Physics.Arcade.Body;
      const t = Math.sin(time * 0.001 * data._moveSpeed / data._moveDistance);

      if (data._moveAxis === 'x') {
        const targetX = data._moveOriginX + t * data._moveDistance;
        body.setVelocityX((targetX - visual.x) * 5);
        body.setVelocityY(0);
      } else {
        const targetY = data._moveOriginY + t * data._moveDistance;
        body.setVelocityX(0);
        body.setVelocityY((targetY - visual.y) * 5);
      }
    }
  }

  private createCrumblePlatform(plat: PlatformData): void {
    const color = plat.color ?? COLORS.CRUMBLE;
    const visual = this.scene.add.rectangle(
      plat.x, plat.y, plat.width, plat.height, color
    );
    visual.setDepth(DEPTH.PLATFORMS);

    const dash = this.scene.add.rectangle(
      plat.x, plat.y, plat.width - 8, 2, 0xccaa88
    );
    dash.setDepth(DEPTH.PLATFORMS + 1);

    const physBody = this.scene.add.rectangle(plat.x, plat.y, plat.width, plat.height);
    physBody.setVisible(false);
    this.platforms.add(physBody);
    // #7: 使用 updateFromGameObject
    const crumbleBody = physBody.body as Phaser.Physics.Arcade.StaticBody;
    crumbleBody.updateFromGameObject();
    // 单向碰撞
    crumbleBody.checkCollision.down = false;
    crumbleBody.checkCollision.left = false;
    crumbleBody.checkCollision.right = false;

    // 碎裂元数据
    (physBody as any)._crumbleVisual = visual;
    (physBody as any)._crumbleDash = dash;
    (physBody as any)._isCrumble = true;
    (physBody as any)._crumbled = false;
    // #8: 保存原始尺寸和颜色用于恢复
    (physBody as any)._crumbleWidth = plat.width;
    (physBody as any)._crumbleHeight = plat.height;
    (physBody as any)._crumbleColor = color;
  }

  // 触发碎裂平台
  triggerCrumble(platform: Phaser.GameObjects.GameObject): void {
    const plat = platform as any;
    if (!plat._isCrumble || plat._crumbled) return;
    plat._crumbled = true;

    const visual = plat._crumbleVisual as Phaser.GameObjects.Rectangle;
    const dash = plat._crumbleDash as Phaser.GameObjects.Rectangle;
    const originalWidth = plat._crumbleWidth as number;
    const originalHeight = plat._crumbleHeight as number;
    const originalColor = plat._crumbleColor as number;

    // 震动效果
    this.scene.tweens.add({
      targets: [visual, dash],
      x: visual.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 10,
      onComplete: () => {
        if (!this.scene?.sys?.isActive()) return;
        // 平台消失
        this.scene.tweens.add({
          targets: [visual, dash],
          alpha: 0,
          duration: 200,
          onComplete: () => {
            visual.destroy();
            dash.destroy();
            (platform.body as Phaser.Physics.Arcade.StaticBody).enable = false;
          },
        });
      },
    });

    // 4秒后恢复
    this.scene.time.delayedCall(4000, () => {
      if (!this.scene?.sys?.isActive() || !platform.active) return;
      plat._crumbled = false;

      // #8: 使用保存的原始宽度而非硬编码
      const newVisual = this.scene.add.rectangle(
        plat.x, plat.y, originalWidth, originalHeight, originalColor
      );
      newVisual.setDepth(DEPTH.PLATFORMS);
      newVisual.setAlpha(0);

      const newDash = this.scene.add.rectangle(
        plat.x, plat.y, originalWidth - 8, 2, 0xccaa88
      );
      newDash.setDepth(DEPTH.PLATFORMS + 1);
      newDash.setAlpha(0);

      plat._crumbleVisual = newVisual;
      plat._crumbleDash = newDash;

      (platform.body as Phaser.Physics.Arcade.StaticBody).enable = true;

      this.scene.tweens.add({
        targets: [newVisual, newDash],
        alpha: 1,
        duration: 500,
      });
    });
  }

  private createSpikes(): void {
    for (const spike of this.currentLevel.spikes) {
      this.createSpikeRow(spike);
    }
  }

  private createSpikeRow(spike: SpikeData): void {
    const count = Math.floor(spike.width / 16);
    for (let i = 0; i < count; i++) {
      const x = spike.x + i * 16 + 8;

      const g = this.scene.add.graphics();
      g.fillStyle(COLORS.SPIKE);
      g.fillTriangle(-7, 8, 7, 8, 0, -8);
      g.setPosition(x, spike.y);
      g.setDepth(DEPTH.PLATFORMS + 2);

      const collider = this.scene.add.rectangle(x, spike.y, 12, 12);
      collider.setVisible(false);
      this.spikes.add(collider);
      (collider.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
  }

  private createItems(): void {
    for (const item of this.currentLevel.items) {
      switch (item.type) {
        case ItemType.COIN: {
          // #14: Coin 现在用动态物理体
          const coin = new Coin(this.scene, item.x, item.y);
          this.coins.add(coin);
          break;
        }
        case ItemType.HEALTH: {
          const hp = new HealthPickup(this.scene, item.x, item.y);
          this.healthPickups.add(hp);
          break;
        }
      }
    }
  }

  private createEnemies(): void {
    for (const spawn of this.currentLevel.enemies) {
      const enemy = EnemyFactory.create(this.scene, spawn);
      this.enemies.push(enemy);
    }
  }

  private createFlag(): void {
    const pos = this.currentLevel.flagPosition;

    this.scene.add.rectangle(pos.x, pos.y - 30, 4, 60, 0x888888)
      .setDepth(DEPTH.ITEMS);

    const flagGraphics = this.scene.add.graphics();
    flagGraphics.fillStyle(COLORS.FLAG);
    flagGraphics.fillTriangle(0, 0, 30, 10, 0, 20);
    flagGraphics.setPosition(pos.x + 2, pos.y - 55);
    flagGraphics.setDepth(DEPTH.ITEMS);

    this.scene.tweens.add({
      targets: flagGraphics,
      scaleX: 0.85,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.flag = this.scene.add.rectangle(pos.x, pos.y - 20, 40, 60);
    this.flag.setVisible(false);
    this.scene.physics.add.existing(this.flag, true);
  }

  get levelHeight(): number {
    return this.currentLevel.height;
  }

  get hasNextLevel(): boolean {
    return this.levelIndex < LEVELS.length - 1;
  }

  get totalLevels(): number {
    return LEVELS.length;
  }
}
