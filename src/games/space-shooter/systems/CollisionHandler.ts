// 碰撞管理器：注册碰撞检测 + 处理 4 种碰撞回调

import Phaser from 'phaser';
import { WeaponType, SHOOTER_EVENTS } from '../data/ShooterConstants';
import { BulletPool } from './BulletPool';
import { ExplosionManager } from './ExplosionManager';
import { ScoreManager } from './ScoreManager';
import { ShooterPlayer } from '../entities/ShooterPlayer';

export interface CollisionConfig {
  scene: Phaser.Scene;
  player: ShooterPlayer;
  enemies: Phaser.GameObjects.Group;
  powerups: Phaser.GameObjects.Group;
  playerBullets: BulletPool;
  enemyBullets: BulletPool;
  explosionMgr: ExplosionManager;
  scoreMgr: ScoreManager;
  onPlayerDamage: (amount: number) => void;
}

export class CollisionHandler {
  private scene: Phaser.Scene;
  private player: ShooterPlayer;
  private enemies: Phaser.GameObjects.Group;
  private powerups: Phaser.GameObjects.Group;
  private playerBullets: BulletPool;
  private enemyBullets: BulletPool;
  private explosionMgr: ExplosionManager;
  private scoreMgr: ScoreManager;
  private onPlayerDamage: (amount: number) => void;

  constructor(config: CollisionConfig) {
    this.scene = config.scene;
    this.player = config.player;
    this.enemies = config.enemies;
    this.powerups = config.powerups;
    this.playerBullets = config.playerBullets;
    this.enemyBullets = config.enemyBullets;
    this.explosionMgr = config.explosionMgr;
    this.scoreMgr = config.scoreMgr;
    this.onPlayerDamage = config.onPlayerDamage;
  }

  /** 注册 Phaser 托管的碰撞检测 */
  setup(): void {
    // 注意：Phaser v3.90 中 PhysicsGroup vs 普通 Group 的 add.overlap 不可靠
    // 涉及普通 Group 的碰撞改为在 update() 中通过 Sprite vs Group 方式逐帧检测

    // 敌人子弹 vs 玩家 → 玩家受伤（Sprite vs Sprite，可靠）
    this.scene.physics.add.overlap(
      this.enemyBullets.group,
      this.player,
      (bulletObj) => {
        this.onEnemyBulletHitPlayer(bulletObj as Phaser.GameObjects.GameObject);
      },
      undefined,
      this
    );

    // 玩家 vs 敌人 → 接触伤害（Sprite vs 普通 Group，可靠）
    this.scene.physics.add.overlap(
      this.player,
      this.enemies,
      (_playerObj, enemyObj) => {
        this.onPlayerContactEnemy(enemyObj as Phaser.GameObjects.GameObject);
      },
      undefined,
      this
    );

    // 玩家 vs 道具 → 拾取（Sprite vs 普通 Group，可靠）
    this.scene.physics.add.overlap(
      this.player,
      this.powerups,
      (_playerObj, powerupObj) => {
        this.onCollectPowerup(powerupObj as Phaser.GameObjects.GameObject);
      },
      undefined,
      this
    );
  }

  /** 每帧调用：手动检测玩家子弹 vs 敌人碰撞（Phaser v3.90 PhysicsGroup vs Group 的变通方案） */
  update(): void {
    const bullets = this.playerBullets.group.getChildren();
    for (const bullet of bullets) {
      if (!bullet.active) continue;
      this.scene.physics.overlap(
        bullet,
        this.enemies,
        (_b, enemyObj) => {
          this.onBulletHitEnemy(bullet, enemyObj as Phaser.GameObjects.GameObject);
        },
        undefined,
        this
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 碰撞回调（私有）
  // ═══════════════════════════════════════════════

  /** 玩家子弹命中敌人 */
  private onBulletHitEnemy(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ): void {
    const bullet = bulletObj as Phaser.GameObjects.GameObject & { damage?: number };
    const enemy = enemyObj as Phaser.GameObjects.GameObject & {
      takeDamage?: (dmg: number) => boolean;
      getScoreValue?: () => number;
      x?: number;
      y?: number;
    };

    // 穿透子弹不回收（激光 Lv3）
    if (!(bulletObj as any).isPiercing) {
      this.playerBullets.kill(bulletObj);
    }

    if (!enemy.active || typeof enemy.takeDamage !== 'function') return;

    // 预存位置和分值（die() 内会 destroy() 移除实体）
    const ex = (enemy as any).x ?? 0;
    const ey = (enemy as any).y ?? 0;
    const scoreValue = typeof enemy.getScoreValue === 'function' ? enemy.getScoreValue() : 100;

    const damage = bullet.damage ?? 1;
    const killed = enemy.takeDamage(damage);

    if (killed) {
      // 播放爆炸
      this.explosionMgr.explode(ex, ey);
      this.scoreMgr.addKill(scoreValue);
      this.scene.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);
      this.scene.events.emit(SHOOTER_EVENTS.COMBO_CHANGED, this.scoreMgr.combo, this.scoreMgr.multiplier);
    }
  }

  /** 敌人子弹命中玩家 */
  private onEnemyBulletHitPlayer(bulletObj: Phaser.GameObjects.GameObject): void {
    if (!this.player.isAlive || this.player.isInvincible) return;

    this.enemyBullets.kill(bulletObj);
    this.onPlayerDamage(1);
  }

  /** 玩家与敌人直接接触 */
  private onPlayerContactEnemy(enemyObj: Phaser.GameObjects.GameObject): void {
    if (!this.player.isAlive || this.player.isInvincible) return;
    if (!enemyObj.active) return;

    this.onPlayerDamage(1);

    // 接触伤害同时对敌人造成 1 点伤害
    const enemy = enemyObj as any;
    if (typeof enemy.takeDamage === 'function') {
      // 预存位置和分值（die() 内会 destroy() 移除实体）
      const ex = enemy.x ?? 0;
      const ey = enemy.y ?? 0;
      const scoreValue = typeof enemy.getScoreValue === 'function' ? enemy.getScoreValue() : 50;
      const killed = enemy.takeDamage(1);
      if (killed) {
        this.explosionMgr.explode(ex, ey);
        this.scoreMgr.addKill(scoreValue);
        this.scene.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);
      }
    }
  }

  /** 拾取道具 */
  private onCollectPowerup(powerupObj: Phaser.GameObjects.GameObject): void {
    const powerup = powerupObj as any;
    if (!powerup.active) return;

    const type: string = powerup.powerUpType ?? '';

    switch (type) {
      case 'weapon_vulcan':
      case 'weapon_spread':
      case 'weapon_laser':
      case 'weapon_homing': {
        const weaponMap: Record<string, WeaponType> = {
          weapon_vulcan: WeaponType.VULCAN,
          weapon_spread: WeaponType.SPREAD,
          weapon_laser: WeaponType.LASER,
          weapon_homing: WeaponType.HOMING,
        };
        this.player.setWeapon(weaponMap[type]);
        this.scene.events.emit(SHOOTER_EVENTS.WEAPON_CHANGED, weaponMap[type], this.player.weaponLevel);
        break;
      }
      case 'bomb':
        this.player.addBomb();
        this.scene.events.emit(SHOOTER_EVENTS.BOMBS_CHANGED, this.player.bombs);
        break;
      case 'health':
        this.player.heal(1);
        this.scene.events.emit(SHOOTER_EVENTS.HEALTH_CHANGED, this.player.health);
        break;
      case 'score_bonus':
        this.scoreMgr.addBonus(500);
        this.scene.events.emit(SHOOTER_EVENTS.SCORE_CHANGED, this.scoreMgr.score);
        break;
    }

    // 销毁道具
    powerup.destroy();
  }
}
