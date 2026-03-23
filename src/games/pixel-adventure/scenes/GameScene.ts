// 核心游戏场景：整合所有系统，处理碰撞逻辑和游戏流程

import Phaser from 'phaser';
import { SceneKey, DEPTH, GRAVITY } from '@shared/utils/Constants';
import { InputManager } from '@shared/systems/InputManager';
import { CameraManager } from '@shared/systems/CameraManager';
import { Player } from '@games/pixel-adventure/entities/Player';
import { LevelManager } from '@games/pixel-adventure/systems/LevelManager';
import { Enemy } from '@games/pixel-adventure/entities/Enemy';
import { Coin } from '@games/pixel-adventure/entities/items/Coin';
import { HealthPickup } from '@games/pixel-adventure/entities/items/HealthPickup';
import { HUDScene } from './HUDScene';

interface GameSceneData {
  level: number;
  score: number;
  lives: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputMgr!: InputManager;
  private cameraManager!: CameraManager;
  private levelManager!: LevelManager;
  private hudScene!: HUDScene;
  private debugMode = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private levelComplete = false;

  // 当前游戏数据
  private currentLevel = 0;
  private savedScore = 0;
  private savedLives = 3;

  // 粒子效果
  private dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // #15: 落地灰尘节流
  private lastDustTime = 0;
  private wasPlayerGrounded = false;

  public levelHeight = 480;

  constructor() {
    super({ key: SceneKey.GAME });
  }

  init(data: GameSceneData): void {
    this.currentLevel = data.level ?? 0;
    this.savedScore = data.score ?? 0;
    this.savedLives = data.lives ?? 3;
    this.levelComplete = false;
  }

  create(): void {
    // 平台跳跃需要重力（全局配置已改为 0，各游戏自行设置）
    this.physics.world.gravity.y = GRAVITY;

    // 初始化输入
    this.inputMgr = new InputManager(this);

    // 初始化关卡
    this.levelManager = new LevelManager(this);
    this.levelManager.loadLevel(this.currentLevel);

    const levelConfig = this.levelManager.currentLevel;
    this.levelHeight = levelConfig.height;

    // 初始化相机
    this.cameraManager = new CameraManager(
      this,
      levelConfig.width,
      levelConfig.height
    );

    // 创建玩家
    this.player = new Player(
      this,
      levelConfig.playerStart.x,
      levelConfig.playerStart.y,
      this.inputMgr
    );
    this.player.score = this.savedScore;
    this.player.lives = this.savedLives;

    // 相机跟随玩家
    this.cameraManager.startFollow(this.player);
    this.cameraManager.fadeIn();

    // #9: 使用 Phaser 场景事件系统代替 delayedCall，确保 HUD 已创建
    this.scene.launch(SceneKey.HUD);
    this.hudScene = this.scene.get(SceneKey.HUD) as HUDScene;
    const hudSys = this.hudScene.sys;
    const initHUD = () => {
      this.hudScene.updateHealth(this.player.health);
      this.hudScene.updateScore(this.player.score);
      this.hudScene.updateLives(this.player.lives);
      this.hudScene.showLevelName(levelConfig.name);
      // 触控设备：将 HUD 层的触控按钮接入 InputManager
      if (this.hudScene.touchControls) {
        this.inputMgr.setTouchControls(this.hudScene.touchControls);
      }
    };
    if (hudSys.isActive()) {
      initHUD();
    } else {
      this.hudScene.events.once('create', initHUD);
    }

    // 设置碰撞
    this.setupCollisions();

    // 设置玩家事件回调
    this.setupPlayerCallbacks();

    // 创建落地灰尘粒子纹理
    this.createDustEffect();

    // 创建调试图形层
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(DEPTH.UI + 10);
  }

  private setupCollisions(): void {
    const lm = this.levelManager;
    const player = this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;

    // 玩家 vs 静态平台
    this.physics.add.collider(player, lm.platforms, (_player, platform) => {
      const plat = platform as any;
      if (plat._isCrumble) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down) {
          lm.triggerCrumble(platform as Phaser.GameObjects.GameObject);
        }
      }
    });

    // #3: 玩家 vs 移动平台 — 逐个添加碰撞器
    for (const movPlat of lm.movingPlatforms) {
      const mp = movPlat as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;
      this.physics.add.collider(player, mp);
    }

    // 敌人 vs 平台
    for (const enemy of lm.enemies) {
      const e = enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;
      this.physics.add.collider(e, lm.platforms);
      for (const movPlat of lm.movingPlatforms) {
        const mp = movPlat as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;
        this.physics.add.collider(e, mp);
      }
    }

    // 玩家 vs 敌人
    for (const enemy of lm.enemies) {
      const e = enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;
      this.physics.add.overlap(
        player,
        e,
        () => this.handlePlayerEnemyCollision(enemy),
        undefined,
        this
      );
    }

    // 玩家 vs 尖刺（即死）
    this.physics.add.overlap(
      player,
      lm.spikes,
      () => {
        if (this.player.isAlive) {
          this.player.takeDamage(99);
        }
      },
      undefined,
      this
    );

    // 玩家 vs 金币
    this.physics.add.overlap(
      player,
      lm.coins,
      (_, coinObj) => {
        const c = coinObj as unknown as Coin;
        this.player.addScore(c.scoreValue);
        c.collect();
      },
      undefined,
      this
    );

    // 玩家 vs 血量恢复
    this.physics.add.overlap(
      player,
      lm.healthPickups,
      (_, hpObj) => {
        const h = hpObj as unknown as HealthPickup;
        this.player.heal(h.healAmount);
        h.collect();
      },
      undefined,
      this
    );

    // 玩家 vs 终点旗帜
    this.physics.add.overlap(
      player,
      lm.flag,
      () => this.onLevelComplete(),
      undefined,
      this
    );
  }

  private handlePlayerEnemyCollision(enemy: Enemy): void {
    if (!this.player.isAlive || enemy.active === false) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;

    // #5: 改进踩踏检测 — 使用中心点比较 + 更宽容的阈值
    // 条件：玩家下落中 + 玩家底部在敌人中心点以上（允许4像素误差）
    const isStomping =
      playerBody.velocity.y > 0 &&
      playerBody.bottom <= enemyBody.center.y + 4;

    if (isStomping && enemy.canBeStomp) {
      this.player.bounce();
      const killed = enemy.takeDamage(1);
      if (killed) {
        this.player.addScore(enemy.getScoreValue());
      }
    } else {
      // shake 由 onDamage 回调统一触发，此处不重复调用
      this.player.takeDamage(1);
    }
  }

  private setupPlayerCallbacks(): void {
    this.player.onDamage = () => {
      this.hudScene?.updateHealth(this.player.health);
      this.cameraManager.shake();
    };

    this.player.onHeal = () => {
      this.hudScene?.updateHealth(this.player.health);
      this.cameraManager.flash(100, 100, 255, 100);
    };

    this.player.onScoreChange = () => {
      this.hudScene?.updateScore(this.player.score);
    };

    this.player.onLivesChange = () => {
      this.hudScene?.updateLives(this.player.lives);
    };

    this.player.onDeath = () => {
      if (this.player.hasLives) {
        this.restartLevel();
      } else {
        this.gameOver();
      }
    };
  }

  private createDustEffect(): void {
    const key = 'dust_particle';
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();
      g.fillStyle(0xcccccc);
      g.fillCircle(2, 2, 2);
      g.generateTexture(key, 4, 4);
      g.destroy();
    }

    this.dustEmitter = this.add.particles(0, 0, key, {
      speed: { min: 20, max: 50 },
      angle: { min: 220, max: 320 },
      lifespan: 300,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      gravityY: 100,
      emitting: false,
    });
    this.dustEmitter.setDepth(DEPTH.EFFECTS);
  }

  // #15: 灰尘仅在落地瞬间或快速移动时发射，带节流
  private emitDust(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const isGrounded = body.blocked.down;
    const justLanded = isGrounded && !this.wasPlayerGrounded;

    if (justLanded) {
      // 落地瞬间发射较多粒子
      this.dustEmitter?.emitParticleAt(this.player.x, this.player.y + 12, 5);
      this.lastDustTime = time;
    } else if (isGrounded && Math.abs(body.velocity.x) > 80 && time - this.lastDustTime > 150) {
      // 快速跑动时间隔发射
      this.dustEmitter?.emitParticleAt(this.player.x, this.player.y + 12, 2);
      this.lastDustTime = time;
    }

    this.wasPlayerGrounded = isGrounded;
  }

  update(time: number, delta: number): void {
    if (this.levelComplete) return;

    // 更新玩家（先消费输入信号）
    this.player.update(delta);

    // #3: 更新移动平台位置（使用速度驱动，确保玩家随平台移动）
    this.levelManager.updateMovingPlatforms(time);

    // 更新敌人
    for (const enemy of this.levelManager.enemies) {
      if (enemy.active) {
        enemy.update(time, delta);
      }
    }

    // 暂停检测
    if (this.inputMgr.pausePressed) {
      this.scene.launch(SceneKey.PAUSE);
      this.scene.pause();
    }

    // 调试模式切换
    if (this.inputMgr.debugPressed) {
      this.toggleDebug();
    }

    // 落地灰尘
    this.emitDust(time);

    // 清除触控单帧标记（必须在所有输入消费完毕后调用）
    this.inputMgr.update();
  }

  private async onLevelComplete(): Promise<void> {
    if (this.levelComplete) return;
    this.levelComplete = true;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    body.setAcceleration(0);

    this.player.addScore(500);

    await this.cameraManager.fadeOut(800);

    if (this.levelManager.hasNextLevel) {
      this.scene.stop(SceneKey.HUD);
      this.scene.restart({
        level: this.currentLevel + 1,
        score: this.player.score,
        lives: this.player.lives,
      });
    } else {
      this.scene.stop(SceneKey.HUD);
      this.scene.start(SceneKey.VICTORY, {
        score: this.player.score,
      });
    }
  }

  private async restartLevel(): Promise<void> {
    await this.cameraManager.fadeOut(500);
    this.scene.stop(SceneKey.HUD);
    this.scene.restart({
      level: this.currentLevel,
      score: this.player.score,
      lives: this.player.lives,
    });
  }

  private gameOver(): void {
    this.time.delayedCall(1000, () => {
      if (!this.sys?.isActive()) return;
      this.scene.stop(SceneKey.HUD);
      this.scene.start(SceneKey.GAME_OVER, {
        score: this.player.score,
      });
    });
  }

  private toggleDebug(): void {
    this.debugMode = !this.debugMode;
    this.physics.world.drawDebug = this.debugMode;

    if (this.debugMode) {
      this.physics.world.debugGraphic?.setVisible(true);
    } else {
      this.physics.world.debugGraphic?.clear();
      this.physics.world.debugGraphic?.setVisible(false);
      this.debugGraphics?.clear();
    }
  }
}
