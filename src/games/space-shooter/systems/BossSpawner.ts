// Boss 生成器：创建正确的 Boss 并连接回调

import Phaser from 'phaser';
import { ShooterEnemy } from '../entities/ShooterEnemy';
import { BulletPool } from './BulletPool';
import { Boss1Commander } from '../entities/bosses/Boss1_Commander';
import { Boss2SkyFortress } from '../entities/bosses/Boss2_SkyFortress';
import { Boss3Mothership } from '../entities/bosses/Boss3_Mothership';
import { PowerUpType, ShooterEnemyType, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';

export interface BossSpawnerCallbacks {
  spawnMinions: (x: number, y: number, count: number, type: ShooterEnemyType) => void;
  spawnPowerUp: (x: number, y: number, type: PowerUpType) => void;
}

/** 根据关卡索引创建 Boss 并连接回调 */
export function spawnBoss(
  scene: Phaser.Scene,
  stageIndex: number,
  enemyBulletPool: BulletPool,
  playerRef: Phaser.GameObjects.Sprite,
  callbacks: BossSpawnerCallbacks
): ShooterEnemy {
  const cx = GAME_WIDTH / 2;

  switch (stageIndex) {
    case 0: {
      const boss = new Boss1Commander(
        scene, cx, -80,
        enemyBulletPool, playerRef
      );
      boss.onSpawnDrones = (x, y, count) =>
        callbacks.spawnMinions(x, y, count, ShooterEnemyType.DRONE);
      boss.onPhaseChange = (phase) => {
        // Phase 2 掉落 SPREAD 武器
        if (phase === 2) {
          callbacks.spawnPowerUp(cx, 200, PowerUpType.WEAPON_SPREAD);
        }
      };
      return boss;
    }

    case 1: {
      const boss = new Boss2SkyFortress(
        scene, cx, -100,
        enemyBulletPool, playerRef
      );
      boss.onSpawnShields = (x, y, count) =>
        callbacks.spawnMinions(x, y, count, ShooterEnemyType.SHIELD);
      boss.onPhaseChange = (phase) => {
        if (phase === 2) {
          callbacks.spawnPowerUp(cx, 200, PowerUpType.WEAPON_LASER);
        }
      };
      return boss;
    }

    case 2: {
      const boss = new Boss3Mothership(
        scene, cx, -120,
        enemyBulletPool, playerRef
      );
      boss.onSpawnSpinners = (x, y, count) =>
        callbacks.spawnMinions(x, y, count, ShooterEnemyType.SPINNER);
      boss.onPhaseChange = (phase) => {
        if (phase === 2) {
          callbacks.spawnPowerUp(cx, 200, PowerUpType.WEAPON_HOMING);
        }
      };
      // 监听多段爆炸事件（由 Boss3 的死亡动画触发）
      scene.events.on('bossExplosion', (x: number, y: number) => {
        scene.events.emit('explosion', x, y);
      });
      return boss;
    }

    default: {
      // 兜底：使用 Boss1
      const boss = new Boss1Commander(
        scene, cx, -80,
        enemyBulletPool, playerRef
      );
      boss.onSpawnDrones = (x, y, count) =>
        callbacks.spawnMinions(x, y, count, ShooterEnemyType.DRONE);
      boss.onPhaseChange = (phase) => {
        if (phase === 2) {
          callbacks.spawnPowerUp(cx, 200, PowerUpType.WEAPON_SPREAD);
        }
      };
      return boss;
    }
  }
}

/** Boss 来袭警告 */
export function showBossWarning(scene: Phaser.Scene): void {
  const warning = scene.add.text(
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
  scene.tweens.add({
    targets: warning,
    alpha: { from: 1, to: 0.2 },
    duration: 200,
    yoyo: true,
    repeat: 5,
    onComplete: () => warning.destroy(),
  });
}
