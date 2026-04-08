// 射击游戏核心场景：整合所有系统，处理阶段推进、事件广播

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { SHOOTER, SHOOTER_DEPTH, SHOOTER_EVENTS } from '../data/ShooterConstants';
import { ScrollingBackground } from '../systems/ScrollingBackground';
import { ShooterPlayer } from '../entities/ShooterPlayer';
import { ShooterInputManager } from '../systems/ShooterInputManager';
import { BulletPool } from '../systems/BulletPool';
import { WaveManager } from '../systems/WaveManager';
import { ExplosionManager } from '../systems/ExplosionManager';
import { ScoreManager } from '../systems/ScoreManager';
import { CollisionHandler } from '../systems/CollisionHandler';
import { updateHomingBullets } from '../systems/HomingBulletSystem';
import { ShooterHUDScene } from './ShooterHUDScene';

// ═══════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════

interface ShooterGameData {
  stage: number;
  score: number;
  lives: number;
}

// ═══════════════════════════════════════════════
// 关卡名称
// ═══════════════════════════════════════════════

const STAGE_NAMES = [
  'STAGE 1 — CITY SKYLINE',
  'STAGE 2 — STRATOSPHERE',
  'STAGE 3 — DEEP SPACE',
];

const TOTAL_STAGES = 3;

export class ShooterGameScene extends Phaser.Scene {
  // 核心系统
  private background!: ScrollingBackground;
  private player!: ShooterPlayer;
  private inputMgr!: ShooterInputManager;
  private playerBullets!: BulletPool;
  private enemyBullets!: BulletPool;
  private waveManager!: WaveManager;
  private explosionMgr!: ExplosionManager;
  private scoreMgr!: ScoreManager;
  private collisionHandler!: CollisionHandler;
  private hudScene!: ShooterHUDScene;

  // 游戏状态
  private currentStage = 0;
  private savedScore = 0;
  private currentLives: number = SHOOTER.MAX_LIVES;
  private stageClearing = false;
  private gameOverTriggered = false;
  private respawning = false;

  // 敌人组
  public enemies!: Phaser.GameObjects.Group;
  // 道具组
  public powerups!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: SceneKey.SHOOTER_GAME });
  }

  // ═══════════════════════════════════════════════
  // 生命周期
  // ═══════════════════════════════════════════════

  init(data: ShooterGameData): void {
    this.currentStage = data.stage ?? 0;
    this.savedScore = data.score ?? 0;
    this.currentLives = data.lives ?? SHOOTER.MAX_LIVES;
    this.stageClearing = false;
    this.gameOverTriggered = false;
    this.respawning = false;
  }

  create(): void {
    // 射击游戏无重力
    this.physics.world.gravity.x = 0;
    this.physics.world.gravity.y = 0;

    // 世界边界（略大于画面，允许子弹/敌人在屏幕外缓冲）
    this.physics.world.setBounds(-50, -80, layout.width + 100, layout.height + 160);

    // 监听 resize，更新世界边界和玩家重生位置
    this.scale.on('resize', this.handleResize, this);

    // 初始化滚动背景
    this.background = new ScrollingBackground(this, this.currentStage);

    // 初始化子弹池
    this.playerBullets = new BulletPool(this, 'player', 60, SHOOTER_DEPTH.PLAYER_BULLETS);
    this.enemyBullets = new BulletPool(this, 'enemy', 80, SHOOTER_DEPTH.ENEMY_BULLETS);

    // 初始化爆炸管理器
    this.explosionMgr = new ExplosionManager(this);

    // 初始化敌人组 & 道具组（普通 Group，子 sprite 自行管理物理体）
    this.enemies = this.add.group({ runChildUpdate: true });
    this.powerups = this.add.group({ runChildUpdate: true });

    // 初始化玩家
    this.player = new ShooterPlayer(
      this,
      layout.width / 2,
      layout.height - 60,
      this.playerBullets
    );

    // 初始化输入管理器
    this.inputMgr = new ShooterInputManager(this);

    // 初始化分数管理器
    this.scoreMgr = new ScoreManager(this, this.savedScore);

    // 初始化波次管理器
    this.waveManager = new WaveManager(
      this,
      this.currentStage,
      this.enemies,
      this.enemyBullets,
      this.powerups
    );

    // 初始化碰撞处理器
    this.collisionHandler = new CollisionHandler({
      scene: this,
      player: this.player,
      enemies: this.enemies,
      powerups: this.powerups,
      playerBullets: this.playerBullets,
      enemyBullets: this.enemyBullets,
      explosionMgr: this.explosionMgr,
      scoreMgr: this.scoreMgr,
      onPlayerDamage: (amount) => this.damagePlayer(amount),
    });
    this.collisionHandler.setup();

    // 启动 HUD 并行场景
    this.scene.launch(SceneKey.SHOOTER_HUD);
    this.hudScene = this.scene.get(SceneKey.SHOOTER_HUD) as ShooterHUDScene;

    const initHUD = () => {
      // 将触控接入输入管理器
      if (this.hudScene.shooterTouchControls) {
        this.inputMgr.setShooterTouchControls(this.hudScene.shooterTouchControls);
      }
      // 广播初始状态
      this.emitAllHUDState();
      this.events.emit(SHOOTER_EVENTS.STAGE_NAME, STAGE_NAMES[this.currentStage] ?? '');
    };

    if (this.hudScene.sys.isActive()) {
      initHUD();
    } else {
      this.hudScene.events.once('create', initHUD);
    }

    // 注册 shutdown 回调，确保场景停止时执行清理
    this.events.on('shutdown', this.shutdown, this);

    // 淡入
    this.cameras.main.fadeIn(400);
  }

  update(time: number, delta: number): void {
    if (this.stageClearing || this.gameOverTriggered) return;

    // 更新输入
    const input = this.inputMgr.getState();

    // 更新玩家
    if (this.player.isAlive && !this.respawning) {
      this.player.handleInput(input);
      this.player.update(time, delta);
    }

    // 更新波次管理器
    this.waveManager.update(time, delta);

    // 玩家子弹 vs 敌人碰撞（逐帧 Sprite vs Group 检测）
    this.collisionHandler.update();

    // 追踪弹逻辑：调整 homing 子弹速度方向朝最近敌人
    updateHomingBullets(this.playerBullets, this.enemies);

    // 更新子弹池（清理超出屏幕的子弹）
    this.playerBullets.update();
    this.enemyBullets.update();

    // 更新背景滚动
    this.background.update(delta);

    // 更新连击计时器（超时后自动衰减连击，仅在归零瞬间广播事件）
    const prevCombo = this.scoreMgr.combo;
    this.scoreMgr.update(delta);
    if (prevCombo > 0 && this.scoreMgr.combo === 0) {
      this.events.emit(SHOOTER_EVENTS.COMBO_CHANGED, 0, 1);
    }

    // 炸弹输入
    if (input.bomb && this.player.isAlive && !this.respawning) {
      this.useBomb();
    }

    // 暂停检测
    if (input.pause) {
      this.scene.launch(SceneKey.SHOOTER_PAUSE);
      this.scene.pause();
    }

    // 检查关卡完成（Boss 被击败后由 WaveManager 标记）
    if (this.waveManager.isStageComplete) {
      this.onStageClear();
    }

    // 清除触控单帧标记
    this.inputMgr.update();
  }

  // ═══════════════════════════════════════════════
  // 玩家伤害 & 死亡
  // ═══════════════════════════════════════════════

  /** 对玩家造成伤害 */
  private damagePlayer(amount: number): void {
    this.player.takeDamage(amount);
    this.cameras.main.shake(150, 0.01);
    this.events.emit(SHOOTER_EVENTS.HEALTH_CHANGED, this.player.health);

    // 连击中断
    this.scoreMgr.resetCombo();
    this.events.emit(SHOOTER_EVENTS.COMBO_CHANGED, 0, 1);

    if (!this.player.isAlive) {
      this.onPlayerDeath();
    }
  }

  /** 玩家死亡处理 */
  private onPlayerDeath(): void {
    // 播放爆炸
    this.explosionMgr.explode(this.player.x, this.player.y, true);

    this.currentLives--;
    this.events.emit(SHOOTER_EVENTS.LIVES_CHANGED, this.currentLives);

    if (this.currentLives > 0) {
      this.respawnPlayer();
    } else {
      this.triggerGameOver();
    }
  }

  /** 重生玩家 */
  private respawnPlayer(): void {
    this.respawning = true;

    this.time.delayedCall(1500, () => {
      if (!this.sys?.isActive()) return;

      this.player.respawn(layout.width / 2, layout.height - 60);
      this.events.emit(SHOOTER_EVENTS.HEALTH_CHANGED, this.player.health);
      this.events.emit(SHOOTER_EVENTS.BOMBS_CHANGED, this.player.bombs);
      this.respawning = false;
    });
  }

  /** 触发 Game Over */
  private triggerGameOver(): void {
    if (this.gameOverTriggered) return;
    this.gameOverTriggered = true;

    // 清除所有子弹和敌人
    this.playerBullets.clear();
    this.enemyBullets.clear();

    this.time.delayedCall(2000, () => {
      if (!this.sys?.isActive()) return;
      this.scene.stop(SceneKey.SHOOTER_HUD);
      this.scene.start(SceneKey.SHOOTER_GAME_OVER, {
        score: this.scoreMgr.score,
        stage: this.currentStage,
      });
    });
  }

  // ═══════════════════════════════════════════════
  // 关卡推进
  // ═══════════════════════════════════════════════

  /** 关卡通关处理 */
  private onStageClear(): void {
    if (this.stageClearing) return;
    this.stageClearing = true;

    // 清除敌方子弹
    this.enemyBullets.clear();

    // 显示 "STAGE CLEAR" 文字
    const clearText = this.add.text(layout.width / 2, layout.height / 2 - 30, 'STAGE CLEAR', {
      fontSize: layout.fontSize(36),
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    clearText.setOrigin(0.5);
    clearText.setDepth(SHOOTER_DEPTH.UI);
    clearText.setAlpha(0);

    // 分数结算文字
    const tallyText = this.add.text(layout.width / 2, layout.height / 2 + 20, '', {
      fontSize: layout.fontSize(18),
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    tallyText.setOrigin(0.5);
    tallyText.setDepth(SHOOTER_DEPTH.UI);
    tallyText.setAlpha(0);

    // 通关奖励分数
    const stageBonus = (this.currentStage + 1) * 1000;
    this.scoreMgr.addBonus(stageBonus);

    // 动画序列
    this.tweens.add({
      targets: clearText,
      alpha: 1,
      y: layout.height / 2 - 40,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        tallyText.setText(`Stage Bonus: +${stageBonus}\nTotal: ${this.scoreMgr.score}`);
        this.tweens.add({
          targets: tallyText,
          alpha: 1,
          duration: 400,
        });
      },
    });

    this.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);

    // 等待后切换
    this.time.delayedCall(3000, () => {
      if (!this.sys?.isActive()) return;

      const nextStage = this.currentStage + 1;

      if (nextStage >= TOTAL_STAGES) {
        // 全部通关 → 胜利场景
        this.scene.stop(SceneKey.SHOOTER_HUD);
        this.scene.start(SceneKey.SHOOTER_VICTORY, {
          score: this.scoreMgr.score,
        });
      } else {
        // 下一关卡
        this.scene.stop(SceneKey.SHOOTER_HUD);
        this.scene.restart({
          stage: nextStage,
          score: this.scoreMgr.score,
          lives: this.currentLives,
        });
      }
    });
  }

  // ═══════════════════════════════════════════════
  // 公开方法（供子系统调用）
  // ═══════════════════════════════════════════════

  /** 使用炸弹：清屏 */
  public useBomb(): void {
    if (this.player.bombs <= 0) return;

    this.player.useBomb();
    this.events.emit(SHOOTER_EVENTS.BOMBS_CHANGED, this.player.bombs);

    // 清除所有敌方子弹
    this.enemyBullets.clear();

    // 对所有敌人造成大量伤害（复制数组，因为 destroy 会修改 children）
    const aliveEnemies = this.enemies.getChildren().filter(c => c.active);
    for (const child of aliveEnemies) {
      const enemy = child as any;
      if (typeof enemy.takeDamage === 'function') {
        const ex = enemy.x ?? 0;
        const ey = enemy.y ?? 0;
        const scoreValue = typeof enemy.getScoreValue === 'function' ? enemy.getScoreValue() : 100;
        const killed = enemy.takeDamage(10);
        if (killed) {
          this.explosionMgr.explode(ex, ey);
          this.scoreMgr.addKill(scoreValue);
        }
      }
    }

    this.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);

    // 全屏闪白
    this.cameras.main.flash(300, 255, 255, 255);
  }

  /** 获取当前输入管理器引用（HUD 注入触控用） */
  public getInputManager(): ShooterInputManager {
    return this.inputMgr;
  }

  // ═══════════════════════════════════════════════
  // HUD 状态广播
  // ═══════════════════════════════════════════════

  /** 向 HUD 广播当前全部状态 */
  private emitAllHUDState(): void {
    this.events.emit(SHOOTER_EVENTS.HEALTH_CHANGED, this.player.health);
    this.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);
    this.events.emit(SHOOTER_EVENTS.BOMBS_CHANGED, this.player.bombs);
    this.events.emit(SHOOTER_EVENTS.WEAPON_CHANGED, this.player.currentWeapon, this.player.weaponLevel);
    this.events.emit(SHOOTER_EVENTS.COMBO_CHANGED, this.scoreMgr.combo, this.scoreMgr.multiplier);
    this.events.emit(SHOOTER_EVENTS.LIVES_CHANGED, this.currentLives);
  }

  // ═══════════════════════════════════════════════
  // Resize 处理
  // ═══════════════════════════════════════════════

  /** 窗口尺寸变化时更新世界边界 */
  private handleResize(): void {
    this.physics.world.setBounds(-50, -80, layout.width + 100, layout.height + 160);
  }

  // ═══════════════════════════════════════════════
  // 场景清理
  // ═══════════════════════════════════════════════

  /** 场景停止时清理资源，防止内存泄漏 */
  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.background?.destroy();
    this.playerBullets?.clear();
    this.enemyBullets?.clear();
    this.waveManager?.destroy();
    // 只移除自定义事件，不破坏 Phaser 内部生命周期事件
    Object.values(SHOOTER_EVENTS).forEach(evt => this.events.removeAllListeners(evt));
    this.events.off('shutdown', this.shutdown, this);
  }
}
