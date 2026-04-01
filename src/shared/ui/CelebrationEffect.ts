// 共享撒花粒子特效
import Phaser from 'phaser';
import { GAME_WIDTH } from '@shared/utils/Constants';

const DEFAULT_COLORS = [0xffdd44, 0xff4444, 0x44ff44, 0x4488ff, 0xff44ff, 0x44ffff];

export function createCelebrationParticles(
  scene: Phaser.Scene,
  colors: number[] = DEFAULT_COLORS
): void {
  for (const color of colors) {
    const key = `confetti_${color}`;
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      g.fillStyle(color);
      g.fillRect(0, 0, 5, 5);
      g.generateTexture(key, 5, 5);
      g.destroy();
    }
    scene.add.particles(GAME_WIDTH / 2, -10, key, {
      x: { min: -GAME_WIDTH / 2, max: GAME_WIDTH / 2 },
      speed: { min: 40, max: 130 },
      angle: { min: 75, max: 105 },
      lifespan: 5000,
      scale: { start: 1, end: 0.2 },
      rotate: { min: 0, max: 360 },
      gravityY: 40,
      frequency: 120,
    });
  }
}
