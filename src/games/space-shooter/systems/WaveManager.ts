// 波次管理器：控制敌人生成节奏、编队、Boss 触发
// 每个关卡有独立的波次时间表，根据经过时间依次释放敌人编队
// 所有波次完成后生成 Boss，Boss 被击败标记关卡完成

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';
import { ShooterEnemyType, PowerUpType } from '../data/ShooterConstants';
import { ShooterEnemy } from '../entities/ShooterEnemy';
import { EnemyFactory, EnemyCreateConfig } from '../entities/enemies/EnemyFactory';
import { BulletPool } from './BulletPool';
import { PowerUp } from '../entities/PowerUp';
import { STAGE_WAVES, WaveDefinition } from '../data/StageWaves';
import { calculateFormationPositions } from './FormationCalculator';
import { spawnBoss, showBossWarning } from './BossSpawner';

// ═══════════════════════════════════════════════
// WaveManager
// ═══════════════════════════════════════════════

export class WaveManager {
  /** 关卡是否已通关（Boss 被击败） */
  isStageComplete = false;

  private scene: Phaser.Scene;
  private stageIndex: number;
  private enemyGroup: Phaser.GameObjects.Group;
  private enemyBulletPool: BulletPool;
  private powerupGroup: Phaser.GameObjects.Group;

  /** 波次定义表 */
  private waves: WaveDefinition[] = [];
  /** 已触发的波次索引 */
  private nextWaveIndex = 0;
  /** 关卡开始时间戳 */
  private stageStartTime = 0;
  /** 是否已初始化开始时间 */
  private started = false;

  /** Boss 是否已生成 */
  private bossSpawned = false;
  /** Boss 引用 */
  private bossRef: ShooterEnemy | null = null;
  /** Boss 触发时间（最后一波触发后延迟） */
  private bossTriggerTime = 0;

  /** 玩家引用（通过 scene 的 children 获取） */
  private playerRef!: Phaser.GameObjects.Sprite;
  private onEnemyDrop: (x: number, y: number, type: PowerUpType) => void;

  constructor(
    scene: Phaser.Scene,
    stageIndex: number,
    enemyGroup: Phaser.GameObjects.Group,
    enemyBulletPool: BulletPool,
    powerupGroup: Phaser.GameObjects.Group
  ) {
    this.scene = scene;
    this.stageIndex = stageIndex;
    this.enemyGroup = enemyGroup;
    this.enemyBulletPool = enemyBulletPool;
    this.powerupGroup = powerupGroup;

    // 预创建所有敌人纹理
    EnemyFactory.preloadTextures(scene);

    // 监听敌人死亡掉落事件（替代 monkey-patch die()）
    this.onEnemyDrop = (x: number, y: number, type: PowerUpType) => {
      this.spawnPowerUp(x, y, type);
    };
    this.scene.events.on('enemyDrop', this.onEnemyDrop);

    // 加载波次数据
    this.waves = this.getWaveDefinitions(stageIndex);
    // Boss 在最后一波触发后 2 秒生成
    const lastWave = this.waves[this.waves.length - 1];
    this.bossTriggerTime = lastWave ? lastWave.triggerTime + 3000 : 5000;
  }

  // ═══════════════════════════════════════════════
  // 更新
  // ═══════════════════════════════════════════════

  update(time: number, _delta: number): void {
    if (this.isStageComplete) return;

    // 延迟获取玩家引用（确保玩家已创建）
    if (!this.playerRef) {
      this.playerRef = this.findPlayer();
      if (!this.playerRef) return;
    }

    // 记录开始时间
    if (!this.started) {
      this.stageStartTime = time;
      this.started = true;
    }

    const elapsed = time - this.stageStartTime;

    // 触发到时的波次
    while (
      this.nextWaveIndex < this.waves.length &&
      elapsed >= this.waves[this.nextWaveIndex].triggerTime
    ) {
      this.spawnWave(this.waves[this.nextWaveIndex], time);
      this.nextWaveIndex++;
    }

    // 所有波次完成后触发 Boss
    if (
      !this.bossSpawned &&
      this.nextWaveIndex >= this.waves.length &&
      elapsed >= this.bossTriggerTime
    ) {
      this.handleBossSpawn();
    }

    // 检查 Boss 是否被击败
    if (this.bossSpawned && this.bossRef && !this.bossRef.active) {
      this.isStageComplete = true;
    }
  }

  // ═══════════════════════════════════════════════
  // 敌人生成
  // ═══════════════════════════════════════════════

  /** 根据波次定义生成一组敌人 */
  private spawnWave(wave: WaveDefinition, _time: number): void {
    for (const enemyDef of wave.enemies) {
      const positions = calculateFormationPositions(
        wave.formation,
        enemyDef.count
      );

      for (let i = 0; i < enemyDef.count; i++) {
        const delay = i * enemyDef.spawnDelay;

        this.scene.time.delayedCall(delay, () => {
          if (!this.scene?.sys?.isActive()) return;

          const pos = positions[i];
          // Bomber 方向由生成位置决定（左半屏 → 向右飞，右半屏 → 向左飞）
          const fromLeft = pos.x < layout.width / 2;
          const config: EnemyCreateConfig = {
            playerRef: this.playerRef,
            bulletPool: this.enemyBulletPool,
            fromLeft,
            onSpawnDrones: (x, y, count) => this.spawnMinions(x, y, count, ShooterEnemyType.DRONE),
          };

          const enemy = EnemyFactory.create(
            this.scene,
            enemyDef.type,
            pos.x,
            pos.y,
            config
          );

          this.enemyGroup.add(enemy);
        });
      }
    }
  }

  /** 生成道具 */
  private spawnPowerUp(x: number, y: number, type: PowerUpType): void {
    const powerup = new PowerUp(this.scene, x, y, type);
    this.powerupGroup.add(powerup);
  }

  /** 生成小型增援（无人机、旋转器等） */
  private spawnMinions(
    x: number,
    y: number,
    count: number,
    type: ShooterEnemyType
  ): void {
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.scene?.sys?.isActive()) return;

        const offsetX = (i - Math.floor(count / 2)) * 30;
        const config: EnemyCreateConfig = {
          playerRef: this.playerRef,
          bulletPool: this.enemyBulletPool,
        };

        const minion = EnemyFactory.create(
          this.scene,
          type,
          x + offsetX,
          y,
          config
        );
        this.enemyGroup.add(minion);
      });
    }
  }

  // ═══════════════════════════════════════════════
  // Boss 生成
  // ═══════════════════════════════════════════════

  /** 生成 Boss 并注册回调 */
  private handleBossSpawn(): void {
    this.bossSpawned = true;

    const boss = spawnBoss(
      this.scene,
      this.stageIndex,
      this.enemyBulletPool,
      this.playerRef,
      {
        spawnMinions: (x, y, count, type) => this.spawnMinions(x, y, count, type),
        spawnPowerUp: (x, y, type) => this.spawnPowerUp(x, y, type),
      }
    );

    this.enemyGroup.add(boss);
    this.bossRef = boss;

    // Boss 警告提示
    showBossWarning(this.scene);
  }

  // ═══════════════════════════════════════════════
  // 查找玩家精灵
  // ═══════════════════════════════════════════════

  private findPlayer(): Phaser.GameObjects.Sprite {
    // 在场景 children 中查找 ShooterPlayer（位于 SHOOTER_DEPTH.PLAYER 层）
    const children = this.scene.children.getAll();
    for (const child of children) {
      if (
        child instanceof Phaser.Physics.Arcade.Sprite &&
        (child as any).isShooterPlayer === true
      ) {
        return child;
      }
    }
    // 兜底：返回场景中第一个 Arcade Sprite（通常是玩家）
    // 更稳妥的做法：查找 PLAYER 深度层的精灵
    for (const child of children) {
      if (
        child instanceof Phaser.Physics.Arcade.Sprite &&
        child.depth === 30 && // SHOOTER_DEPTH.PLAYER
        child.active
      ) {
        return child;
      }
    }
    // 最终兜底：返回一个虚拟目标
    return this.scene.add.sprite(layout.width / 2, layout.height - 60, '__DEFAULT') as any;
  }

  // ═══════════════════════════════════════════════
  // 关卡波次数据
  // ═══════════════════════════════════════════════

  private getWaveDefinitions(stage: number): WaveDefinition[] {
    return STAGE_WAVES[stage] ?? STAGE_WAVES[0];
  }

  /** 清理事件监听器，防止场景重启时泄漏 */
  destroy(): void {
    this.scene.events.off('enemyDrop', this.onEnemyDrop);
  }
}
