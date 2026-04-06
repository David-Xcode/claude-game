// 炮塔：进入画面后悬停，定期向玩家发射瞄准弹
// HP 3 / 得分 200 / 20% 武器掉落 + 5% 炸弹

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { layout } from '@shared/utils/Constants';
import { PowerUpType, SHOOTER_COLORS } from '../../data/ShooterConstants';
import { BulletPool } from '../../systems/BulletPool';

const TEXTURE_KEY = 'enemy_turret';
const SIZE = 36;
const ENTER_SPEED = 100;
const FIRE_INTERVAL = 1500;
const BULLET_SPEED = 200;

export class Turret extends ShooterEnemy {
  private bulletPool: BulletPool;
  private playerRef: Phaser.GameObjects.Sprite;
  /** 悬停目标 y 坐标 */
  private hoverY: number;
  /** 是否已到达悬停位置 */
  private hovering = false;
  /** 上次开火时间戳 */
  private lastFireTime = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool,
    playerRef: Phaser.GameObjects.Sprite
  ) {
    Turret.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 3, 200, [
      { type: PowerUpType.WEAPON_VULCAN, weight: 0.10 },
      { type: PowerUpType.WEAPON_SPREAD, weight: 0.10 },
      { type: PowerUpType.BOMB, weight: 0.05 },
    ]);

    this.bulletPool = bulletPool;
    this.playerRef = playerRef;
    this.hoverY = Phaser.Math.Between(60, 200);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SIZE - 4, SIZE - 4);
    body.setVelocityY(ENTER_SPEED);
  }

  // ═══════════════════════════════════════════════
  // 行为：进入 → 悬停 → 开火
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 阶段1：进入画面
    if (!this.hovering) {
      if (this.y >= this.hoverY) {
        this.hovering = true;
        body.setVelocity(0, 0);
        this.lastFireTime = time;
      }
      return;
    }

    // 阶段2：悬停并开火
    if (time - this.lastFireTime >= FIRE_INTERVAL) {
      this.lastFireTime = time;
      this.fireAtPlayer();
    }

    // 微小水平漂移
    this.x += Math.sin(time * 0.001) * 0.3;
    // 限制在屏幕内
    this.x = Phaser.Math.Clamp(this.x, 20, layout.width - 20);
  }

  /** 向玩家发射瞄准弹 */
  private fireAtPlayer(): void {
    if (!this.playerRef.active || !this.active) return;

    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const vx = (dx / dist) * BULLET_SPEED;
    const vy = (dy / dist) * BULLET_SPEED;

    this.bulletPool.fire(this.x, this.y + 10, vx, vy, 1);
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = SIZE / 2;
      const cy = SIZE / 2;

      // 六边形底座
      const hexPoints: Phaser.Geom.Point[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        hexPoints.push(new Phaser.Geom.Point(
          cx + Math.cos(angle) * (SIZE / 2 - 2),
          cy + Math.sin(angle) * (SIZE / 2 - 2)
        ));
      }

      // 白色轮廓，提升可见度
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokePoints(hexPoints, true);

      g.fillStyle(SHOOTER_COLORS.TURRET, 1);
      g.fillPoints(hexPoints, true);

      // 暗色纹理
      g.fillStyle(0x000000, 0.2);
      g.fillCircle(cx, cy, SIZE / 3);

      // 炮管（朝下），更亮
      g.fillStyle(0x999999, 1);
      g.fillRect(cx - 3, cy + 4, 6, 14);

      // 明亮瞄准灯
      g.fillStyle(0xffff00, 1);
      g.fillCircle(cx, cy, 4);

      return { width: SIZE, height: SIZE };
    });
  }

  // ═══════════════════════════════════════════════
  // 覆盖 isOffScreen：炮塔悬停后不应被屏幕边界回收
  // ═══════════════════════════════════════════════

  isOffScreen(): boolean {
    // 悬停状态下只在飞出底部或两侧时回收
    if (this.hovering) {
      return this.y > layout.height + 50 || this.x < -50 || this.x > layout.width + 50;
    }
    return super.isOffScreen();
  }
}
