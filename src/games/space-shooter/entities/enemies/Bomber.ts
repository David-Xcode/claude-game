// 轰炸机：从屏幕左侧或右侧水平飞过，定期向下投弹
// HP 4 / 得分 250 / 20% 武器掉落 + 10% 炸弹

import Phaser from 'phaser';
import { ShooterEnemy } from '../ShooterEnemy';
import { GAME_WIDTH } from '@shared/utils/Constants';
import { PowerUpType, SHOOTER_COLORS } from '../../data/ShooterConstants';
import { BulletPool } from '../../systems/BulletPool';

const TEXTURE_KEY = 'enemy_bomber';
const W = 40;
const H = 28;
const HORIZONTAL_SPEED = 100;
const BOMB_INTERVAL = 800;
const BOMB_SPEED = 180;

export class Bomber extends ShooterEnemy {
  private bulletPool: BulletPool;
  /** 上次投弹时间 */
  private lastBombTime = 0;
  /** 飞行方向：1 向右，-1 向左 */
  private direction: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletPool: BulletPool,
    fromLeft: boolean = true
  ) {
    Bomber.ensureTexture(scene);

    super(scene, x, y, TEXTURE_KEY, 4, 250, [
      { type: PowerUpType.WEAPON_LASER, weight: 0.10 },
      { type: PowerUpType.WEAPON_SPREAD, weight: 0.10 },
      { type: PowerUpType.BOMB, weight: 0.10 },
    ]);

    this.bulletPool = bulletPool;
    this.direction = fromLeft ? 1 : -1;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(W - 4, H - 4);
    body.setVelocity(HORIZONTAL_SPEED * this.direction, 15); // 缓慢下降

    // 从左边来的朝右飞，翻转贴图
    if (!fromLeft) {
      this.setFlipX(true);
    }
  }

  // ═══════════════════════════════════════════════
  // 行为：水平飞行 + 定时投弹
  // ═══════════════════════════════════════════════

  updateBehavior(time: number, _delta: number): void {
    if (time - this.lastBombTime >= BOMB_INTERVAL) {
      this.lastBombTime = time;
      this.dropBomb();
    }
  }

  /** 向下投弹 */
  private dropBomb(): void {
    if (!this.active) return;
    // 投下直线炸弹
    this.bulletPool.fire(this.x, this.y + H / 2, 0, BOMB_SPEED, 1);
  }

  // ═══════════════════════════════════════════════
  // 覆盖 isOffScreen：允许从侧面飞出
  // ═══════════════════════════════════════════════

  isOffScreen(): boolean {
    // 飞出对面那一侧才回收
    if (this.direction > 0 && this.x > GAME_WIDTH + 50) return true;
    if (this.direction < 0 && this.x < -50) return true;
    return this.y > 530 || this.y < -50;
  }

  // ═══════════════════════════════════════════════
  // 纹理
  // ═══════════════════════════════════════════════

  static ensureTexture(scene: Phaser.Scene): void {
    ShooterEnemy.createTexture(scene, TEXTURE_KEY, (g) => {
      const cx = W / 2;
      const cy = H / 2;

      // 白色轮廓，提升可见度
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeRoundedRect(4, 4, W - 8, H - 8, 3);

      // 宽阔机身
      g.fillStyle(SHOOTER_COLORS.BOMBER, 1);
      g.fillRoundedRect(4, 4, W - 8, H - 8, 3);

      // 机翼（两侧三角）
      g.fillStyle(SHOOTER_COLORS.BOMBER, 0.8);
      // 左翼
      g.fillTriangle(0, cy, 8, 2, 8, H - 2);
      // 右翼
      g.fillTriangle(W, cy, W - 8, 2, W - 8, H - 2);

      // 驾驶舱（更亮）
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx, cy - 2, 5);

      // 炸弹舱标记（更亮）
      g.fillStyle(0xff6600, 0.9);
      g.fillRect(cx - 4, cy + 3, 8, 4);

      return { width: W, height: H };
    });
  }
}
