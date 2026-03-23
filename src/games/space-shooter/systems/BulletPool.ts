// 子弹对象池：基于 Phaser Arcade Group，管理子弹的发射、回收、碰撞

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SHOOTER_COLORS } from '@shared/utils/Constants';
import { Bullet } from '../entities/Bullet';

export class BulletPool {
  /** 暴露给外部做碰撞检测的 Arcade Group */
  public readonly group: Phaser.Physics.Arcade.Group;

  private scene: Phaser.Scene;
  private textureKey: string;
  private depth: number;

  constructor(
    scene: Phaser.Scene,
    type: 'player' | 'enemy',
    maxSize: number,
    depth: number
  ) {
    this.scene = scene;
    this.depth = depth;

    // 根据类型选择颜色和纹理 key
    const isPlayer = type === 'player';
    this.textureKey = isPlayer ? 'bullet_player' : 'bullet_enemy';

    // 如果纹理尚未创建，生成程序化纹理
    if (!scene.textures.exists(this.textureKey)) {
      const color = isPlayer ? SHOOTER_COLORS.PLAYER_BULLET : SHOOTER_COLORS.ENEMY_BULLET;
      const w = isPlayer ? 4 : 5;
      const h = isPlayer ? 12 : 10;
      BulletPool.createBulletTexture(scene, this.textureKey, color, w, h);
    }

    // 创建 Arcade Group，预设 classType 为 Bullet
    this.group = scene.physics.add.group({
      classType: Bullet,
      maxSize,
      runChildUpdate: false,
      allowGravity: false,
    });

    // 预创建全部子弹实例（放入池中不激活）
    this.group.createMultiple({
      key: this.textureKey,
      quantity: maxSize,
      active: false,
      visible: false,
    });

    // 设置深度并禁用初始 body
    this.group.getChildren().forEach((child) => {
      const bullet = child as Bullet;
      bullet.setDepth(this.depth);
      if (bullet.body) {
        bullet.body.enable = false;
      }
    });
  }

  /**
   * 从池中取出一颗子弹并发射
   * @returns 发射的子弹，如果池已满则返回 null
   */
  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number = 1
  ): Bullet | null {
    const bullet = this.group.getFirstDead(false) as Bullet | null;
    if (!bullet) return null;

    bullet.setPosition(x, y);
    bullet.setDepth(this.depth);
    bullet.fire(vx, vy, damage);
    return bullet;
  }

  /** 回收指定子弹 */
  kill(bulletObj: Phaser.GameObjects.GameObject): void {
    const bullet = bulletObj as Bullet;
    if (typeof bullet.recycle === 'function') {
      bullet.recycle();
    }
  }

  /** 清除所有活跃子弹（炸弹、关卡切换时使用） */
  clear(): void {
    this.group.getChildren().forEach((child) => {
      const bullet = child as Bullet;
      if (bullet.active) {
        bullet.recycle();
      }
    });
  }

  /** 每帧更新：回收超出屏幕的子弹 */
  update(): void {
    this.group.getChildren().forEach((child) => {
      const bullet = child as Bullet;
      if (!bullet.active) return;

      const x = bullet.x;
      const y = bullet.y;

      // 子弹飞出屏幕缓冲区则回收
      if (y < -20 || y > GAME_HEIGHT + 20 || x < -20 || x > GAME_WIDTH + 20) {
        bullet.recycle();
      }
    });
  }

  /**
   * 静态工具：生成子弹纹理
   * 椭圆发光效果，带渐变边缘
   */
  static createBulletTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    width: number,
    height: number
  ): void {
    const g = scene.add.graphics();

    // 外层辉光（半透明）
    g.fillStyle(color, 0.3);
    g.fillEllipse(width / 2, height / 2, width + 4, height + 4);

    // 核心颜色
    g.fillStyle(color, 1);
    g.fillEllipse(width / 2, height / 2, width, height);

    // 白色高亮中心
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(width / 2, height / 2, width * 0.4, height * 0.5);

    g.generateTexture(key, width + 4, height + 4);
    g.destroy();
  }
}
