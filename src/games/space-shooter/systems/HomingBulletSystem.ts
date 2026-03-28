// 追踪弹转向系统：每帧调整 homing 子弹速度方向朝最近敌人

import Phaser from 'phaser';
import { BulletPool } from './BulletPool';

const TURN_RATE = 0.06; // 每帧最大转向弧度

/** 更新所有 homing 子弹，使其追踪最近敌人 */
export function updateHomingBullets(
  playerBullets: BulletPool,
  enemies: Phaser.GameObjects.Group
): void {
  const children = playerBullets.group.getChildren();

  for (const child of children) {
    const bullet = child as any;
    if (!bullet.active || !bullet.isHoming) continue;

    // 找最近敌人
    let nearest: Phaser.GameObjects.GameObject | null = null;
    let minDist = Infinity;

    enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;
      const e = enemy as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });

    if (!nearest) continue;

    const target = nearest as Phaser.Physics.Arcade.Sprite;
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    if (!body) continue;

    // 当前速度方向
    const currentAngle = Math.atan2(body.velocity.y, body.velocity.x);
    // 目标方向
    const targetAngle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
    // 角度差（限制转向率）
    let angleDiff = targetAngle - currentAngle;
    // 归一化到 [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const clampedDiff = Phaser.Math.Clamp(angleDiff, -TURN_RATE, TURN_RATE);
    const newAngle = currentAngle + clampedDiff;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2) || 300;

    body.setVelocity(
      Math.cos(newAngle) * speed,
      Math.sin(newAngle) * speed
    );
  }
}
