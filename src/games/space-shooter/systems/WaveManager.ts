// 波次管理器：控制敌人生成节奏、编队、Boss 触发
// 每个关卡有独立的波次时间表，根据经过时间依次释放敌人编队
// 所有波次完成后生成 Boss，Boss 被击败标记关卡完成

import Phaser from 'phaser';
import {
  ShooterEnemyType,
  FormationType,
  GAME_WIDTH,
  GAME_HEIGHT,
  PowerUpType,
} from '@shared/utils/Constants';
import { ShooterEnemy } from '../entities/ShooterEnemy';
import { EnemyFactory, EnemyCreateConfig } from '../entities/enemies/EnemyFactory';
import { BulletPool } from './BulletPool';
import { PowerUp } from '../entities/PowerUp';
import { Boss1Commander } from '../entities/bosses/Boss1_Commander';
import { Boss2SkyFortress } from '../entities/bosses/Boss2_SkyFortress';
import { Boss3Mothership } from '../entities/bosses/Boss3_Mothership';

// ═══════════════════════════════════════════════
// 波次定义接口
// ═══════════════════════════════════════════════

interface WaveEnemy {
  type: ShooterEnemyType;
  count: number;
  /** 编队内每个敌人之间的生成延迟（ms） */
  spawnDelay: number;
}

interface WaveDefinition {
  /** 相对于关卡开始的触发时间（ms） */
  triggerTime: number;
  enemies: WaveEnemy[];
  formation: FormationType;
}

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
      this.spawnBoss();
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
      const positions = this.calculateFormationPositions(
        wave.formation,
        enemyDef.count
      );

      for (let i = 0; i < enemyDef.count; i++) {
        const delay = i * enemyDef.spawnDelay;

        this.scene.time.delayedCall(delay, () => {
          if (!this.scene?.sys?.isActive()) return;

          const pos = positions[i];
          // Bomber 方向由生成位置决定（左半屏 → 向右飞，右半屏 → 向左飞）
          const fromLeft = pos.x < GAME_WIDTH / 2;
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

          // 敌人死亡时掉落道具
          this.setupDropOnDeath(enemy);
        });
      }
    }
  }

  /** 在敌人死亡时检查掉落 */
  private setupDropOnDeath(enemy: ShooterEnemy): void {
    // 覆盖 die 方法来挂载掉落逻辑
    const originalDie = enemy.die.bind(enemy);
    enemy.die = () => {
      // 掉落检测
      const dropType = enemy.rollDrop();
      if (dropType) {
        this.spawnPowerUp(enemy.x, enemy.y, dropType);
      }
      originalDie();
    };
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
        this.setupDropOnDeath(minion);
      });
    }
  }

  // ═══════════════════════════════════════════════
  // Boss 生成
  // ═══════════════════════════════════════════════

  private spawnBoss(): void {
    this.bossSpawned = true;

    const cx = GAME_WIDTH / 2;

    switch (this.stageIndex) {
      case 0: {
        const boss = new Boss1Commander(
          this.scene, cx, -80,
          this.enemyBulletPool, this.playerRef
        );
        boss.onSpawnDrones = (x, y, count) =>
          this.spawnMinions(x, y, count, ShooterEnemyType.DRONE);
        boss.onPhaseChange = (phase) => {
          // Phase 2 掉落 SPREAD 武器
          if (phase === 2) {
            this.spawnPowerUp(cx, 200, PowerUpType.WEAPON_SPREAD);
          }
        };
        this.enemyGroup.add(boss);
        this.setupDropOnDeath(boss);
        this.bossRef = boss;
        break;
      }

      case 1: {
        const boss = new Boss2SkyFortress(
          this.scene, cx, -100,
          this.enemyBulletPool, this.playerRef
        );
        boss.onSpawnShields = (x, y, count) =>
          this.spawnMinions(x, y, count, ShooterEnemyType.SHIELD);
        boss.onPhaseChange = (phase) => {
          if (phase === 2) {
            this.spawnPowerUp(cx, 200, PowerUpType.WEAPON_LASER);
          }
        };
        this.enemyGroup.add(boss);
        this.setupDropOnDeath(boss);
        this.bossRef = boss;
        break;
      }

      case 2: {
        const boss = new Boss3Mothership(
          this.scene, cx, -120,
          this.enemyBulletPool, this.playerRef
        );
        boss.onSpawnSpinners = (x, y, count) =>
          this.spawnMinions(x, y, count, ShooterEnemyType.SPINNER);
        boss.onPhaseChange = (phase) => {
          if (phase === 2) {
            this.spawnPowerUp(cx, 200, PowerUpType.WEAPON_HOMING);
          }
        };
        // 监听多段爆炸事件（由 Boss3 的死亡动画触发）
        this.scene.events.on('bossExplosion', (x: number, y: number) => {
          this.scene.events.emit('explosion', x, y);
        });
        this.enemyGroup.add(boss);
        this.setupDropOnDeath(boss);
        this.bossRef = boss;
        break;
      }
    }

    // Boss 警告提示
    this.showBossWarning();
  }

  /** Boss 来袭警告 */
  private showBossWarning(): void {
    const warning = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'WARNING — BOSS APPROACHING',
      {
        fontSize: '24px',
        color: '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    warning.setOrigin(0.5);
    warning.setDepth(100);

    // 闪烁后消失
    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 1, to: 0.2 },
      duration: 200,
      yoyo: true,
      repeat: 5,
      onComplete: () => warning.destroy(),
    });
  }

  // ═══════════════════════════════════════════════
  // 编队位置计算
  // ═══════════════════════════════════════════════

  private calculateFormationPositions(
    formation: FormationType,
    count: number
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const margin = 40;
    const usableWidth = GAME_WIDTH - margin * 2;

    switch (formation) {
      case FormationType.LINE_HORIZONTAL: {
        // 均匀分布在顶部
        const spacing = count > 1 ? usableWidth / (count - 1) : 0;
        for (let i = 0; i < count; i++) {
          positions.push({
            x: count > 1 ? margin + spacing * i : GAME_WIDTH / 2,
            y: -20,
          });
        }
        break;
      }

      case FormationType.LINE_VERTICAL: {
        // 同一 x 位置，y 略微分散（通过 spawnDelay 实现间隔）
        const x = Phaser.Math.Between(margin + 40, GAME_WIDTH - margin - 40);
        for (let i = 0; i < count; i++) {
          positions.push({ x, y: -20 });
        }
        break;
      }

      case FormationType.V_FORMATION: {
        // V 字形从中心展开
        const cx = GAME_WIDTH / 2;
        for (let i = 0; i < count; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const row = Math.floor(i / 2);
          positions.push({
            x: cx + side * (row + 1) * 35,
            y: -20 - row * 15,
          });
        }
        break;
      }

      case FormationType.CIRCLE_IN: {
        // 圆形散布，从外围向中心汇聚（初始位置在屏幕上方散开）
        const cx = GAME_WIDTH / 2;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          positions.push({
            x: cx + Math.cos(angle) * (usableWidth / 2 - 20),
            y: -20 - Math.sin(angle) * 30,
          });
        }
        break;
      }

      case FormationType.RANDOM: {
        // 随机 x 位置
        for (let i = 0; i < count; i++) {
          positions.push({
            x: Phaser.Math.Between(margin, GAME_WIDTH - margin),
            y: Phaser.Math.Between(-40, -10),
          });
        }
        break;
      }

      case FormationType.SIDES: {
        // 从左右两侧交替
        for (let i = 0; i < count; i++) {
          const fromLeft = i % 2 === 0;
          positions.push({
            x: fromLeft ? -20 : GAME_WIDTH + 20,
            y: Phaser.Math.Between(40, 200),
          });
        }
        break;
      }

      default: {
        // 默认随机
        for (let i = 0; i < count; i++) {
          positions.push({
            x: Phaser.Math.Between(margin, GAME_WIDTH - margin),
            y: -20,
          });
        }
      }
    }

    return positions;
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
    return this.scene.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, '__DEFAULT') as any;
  }

  // ═══════════════════════════════════════════════
  // 关卡波次数据
  // ═══════════════════════════════════════════════

  private getWaveDefinitions(stage: number): WaveDefinition[] {
    switch (stage) {
      case 0: return this.getStage0Waves();
      case 1: return this.getStage1Waves();
      case 2: return this.getStage2Waves();
      default: return this.getStage0Waves();
    }
  }

  // ─────────────────────────────────────────────
  // Stage 0 — City Skyline（~85 秒）
  // ─────────────────────────────────────────────

  private getStage0Waves(): WaveDefinition[] {
    return [
      // 0-15s: 教学无人机波次
      {
        triggerTime: 1000,
        enemies: [{ type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 400 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 5000,
        enemies: [{ type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 300 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 10000,
        enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 250 }],
        formation: FormationType.V_FORMATION,
      },

      // 15-30s: 引入 Zigzag + 混合 Drone
      {
        triggerTime: 16000,
        enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 500 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 21000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 300 },
          { type: ShooterEnemyType.ZIGZAG, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 27000,
        enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 350 }],
        formation: FormationType.LINE_HORIZONTAL,
      },

      // 30-50s: 引入 Turret + V 编队 Drone
      {
        triggerTime: 31000,
        enemies: [{ type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 800 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 36000,
        enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 200 }],
        formation: FormationType.V_FORMATION,
      },
      {
        triggerTime: 41000,
        enemies: [
          { type: ShooterEnemyType.TURRET, count: 1, spawnDelay: 0 },
          { type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 400 },
        ],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 46000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 300 },
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 600 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },

      // 50-70s: 混合编队，密度增加
      {
        triggerTime: 52000,
        enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 250 }],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 57000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 200 },
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
        ],
        formation: FormationType.V_FORMATION,
      },
      {
        triggerTime: 62000,
        enemies: [
          { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 300 },
          { type: ShooterEnemyType.DRONE, count: 3, spawnDelay: 250 },
        ],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 67000,
        enemies: [{ type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 600 }],
        formation: FormationType.LINE_HORIZONTAL,
      },

      // 70-85s: 高强度最终推进
      {
        triggerTime: 71000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 8, spawnDelay: 150 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 75000,
        enemies: [
          { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 80000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
          { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
        ],
        formation: FormationType.V_FORMATION,
      },
    ];
  }

  // ─────────────────────────────────────────────
  // Stage 1 — Stratosphere（~100 秒）
  // ─────────────────────────────────────────────

  private getStage1Waves(): WaveDefinition[] {
    return [
      // 0-15s: 快速 Drone 热身
      {
        triggerTime: 1000,
        enemies: [{ type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 250 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 7000,
        enemies: [{ type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 300 }],
        formation: FormationType.V_FORMATION,
      },

      // 15-30s: 引入 Bomber
      {
        triggerTime: 16000,
        enemies: [{ type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 1000 }],
        formation: FormationType.SIDES,
      },
      {
        triggerTime: 22000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 4, spawnDelay: 200 },
          { type: ShooterEnemyType.BOMBER, count: 1, spawnDelay: 0 },
        ],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 28000,
        enemies: [{ type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 800 }],
        formation: FormationType.SIDES,
      },

      // 30-50s: 引入 ShieldEnemy + 复杂编队
      {
        triggerTime: 32000,
        enemies: [{ type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 600 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 38000,
        enemies: [
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 44000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 800 },
          { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 250 },
        ],
        formation: FormationType.SIDES,
      },

      // 50s: 中段高强度时刻
      {
        triggerTime: 50000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 8, spawnDelay: 120 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
        ],
        formation: FormationType.V_FORMATION,
      },
      {
        triggerTime: 55000,
        enemies: [
          { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
          { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 700 },
        ],
        formation: FormationType.CIRCLE_IN,
      },

      // 60-80s: 全敌人类型混战
      {
        triggerTime: 62000,
        enemies: [
          { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 68000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 600 },
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
        ],
        formation: FormationType.SIDES,
      },
      {
        triggerTime: 74000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
          { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.RANDOM,
      },

      // 80-95s: 最终推进
      {
        triggerTime: 82000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 500 },
          { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
        ],
        formation: FormationType.SIDES,
      },
      {
        triggerTime: 88000,
        enemies: [
          { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
          { type: ShooterEnemyType.ZIGZAG, count: 6, spawnDelay: 150 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 93000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 10, spawnDelay: 100 },
        ],
        formation: FormationType.V_FORMATION,
      },
    ];
  }

  // ─────────────────────────────────────────────
  // Stage 2 — Deep Space（~120 秒）
  // ─────────────────────────────────────────────

  private getStage2Waves(): WaveDefinition[] {
    return [
      // 0-15s: 快速混合热身
      {
        triggerTime: 1000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 5, spawnDelay: 200 },
          { type: ShooterEnemyType.ZIGZAG, count: 3, spawnDelay: 300 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 8000,
        enemies: [
          { type: ShooterEnemyType.TURRET, count: 2, spawnDelay: 500 },
          { type: ShooterEnemyType.BOMBER, count: 2, spawnDelay: 600 },
        ],
        formation: FormationType.SIDES,
      },

      // 15-30s: 引入 Spinner
      {
        triggerTime: 16000,
        enemies: [{ type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 600 }],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 22000,
        enemies: [
          { type: ShooterEnemyType.SPINNER, count: 2, spawnDelay: 500 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 28000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 6, spawnDelay: 150 },
          { type: ShooterEnemyType.SPINNER, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.V_FORMATION,
      },

      // 30-50s: 引入 Carrier + 高密度
      {
        triggerTime: 32000,
        enemies: [{ type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 38000,
        enemies: [
          { type: ShooterEnemyType.ZIGZAG, count: 5, spawnDelay: 200 },
          { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
        ],
        formation: FormationType.RANDOM,
      },
      {
        triggerTime: 44000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 600 },
          { type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 400 },
        ],
        formation: FormationType.SIDES,
      },

      // 50-70s: 密集弹幕阶段
      {
        triggerTime: 52000,
        enemies: [
          { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
          { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 58000,
        enemies: [{ type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 60000,
        enemies: [
          { type: ShooterEnemyType.SPINNER, count: 4, spawnDelay: 300 },
          { type: ShooterEnemyType.ZIGZAG, count: 4, spawnDelay: 200 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 66000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 500 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 400 },
        ],
        formation: FormationType.SIDES,
      },

      // 70-90s: 超高密度
      {
        triggerTime: 72000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 10, spawnDelay: 100 },
          { type: ShooterEnemyType.SPINNER, count: 3, spawnDelay: 300 },
        ],
        formation: FormationType.V_FORMATION,
      },
      {
        triggerTime: 78000,
        enemies: [{ type: ShooterEnemyType.CARRIER, count: 2, spawnDelay: 2000 }],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 84000,
        enemies: [
          { type: ShooterEnemyType.TURRET, count: 4, spawnDelay: 300 },
          { type: ShooterEnemyType.BOMBER, count: 3, spawnDelay: 400 },
          { type: ShooterEnemyType.SHIELD, count: 2, spawnDelay: 500 },
        ],
        formation: FormationType.RANDOM,
      },

      // 90-110s: 最终疯狂
      {
        triggerTime: 92000,
        enemies: [
          { type: ShooterEnemyType.SPINNER, count: 5, spawnDelay: 250 },
          { type: ShooterEnemyType.ZIGZAG, count: 6, spawnDelay: 150 },
        ],
        formation: FormationType.CIRCLE_IN,
      },
      {
        triggerTime: 98000,
        enemies: [
          { type: ShooterEnemyType.CARRIER, count: 1, spawnDelay: 0 },
          { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
        ],
        formation: FormationType.LINE_HORIZONTAL,
      },
      {
        triggerTime: 104000,
        enemies: [
          { type: ShooterEnemyType.DRONE, count: 12, spawnDelay: 80 },
          { type: ShooterEnemyType.TURRET, count: 3, spawnDelay: 400 },
        ],
        formation: FormationType.V_FORMATION,
      },
      {
        triggerTime: 110000,
        enemies: [
          { type: ShooterEnemyType.BOMBER, count: 4, spawnDelay: 400 },
          { type: ShooterEnemyType.SPINNER, count: 4, spawnDelay: 300 },
          { type: ShooterEnemyType.SHIELD, count: 3, spawnDelay: 300 },
        ],
        formation: FormationType.RANDOM,
      },
    ];
  }
}
