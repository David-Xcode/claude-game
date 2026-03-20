// 通关场景：恭喜通关、最终分数、重玩

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.VICTORY });
  }

  create(data: { score: number }): void {
    this.cameras.main.setBackgroundColor(0x0a1a0a);
    this.cameras.main.fadeIn(800);

    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 4,
      'YOU WIN!',
      {
        fontSize: '48px',
        color: '#ffdd44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    title.setOrigin(0.5);

    // 彩虹色标题动画
    this.tweens.add({
      targets: title,
      y: title.y - 10,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const congrats = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 20,
      'Congratulations!\nAll levels cleared!',
      {
        fontSize: '18px',
        color: '#aaffaa',
        fontFamily: 'monospace',
        align: 'center',
      }
    );
    congrats.setOrigin(0.5);

    const score = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      `Final Score: ${data.score ?? 0}`,
      {
        fontSize: '22px',
        color: '#ffdd44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }
    );
    score.setOrigin(0.5);

    const replayText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 100,
      '[ ENTER ] Play Again',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    );
    replayText.setOrigin(0.5);

    this.tweens.add({
      targets: replayText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const quitText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 135,
      '[ Q ] Title Screen',
      {
        fontSize: '16px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }
    );
    quitText.setOrigin(0.5);

    // 撒花粒子效果
    this.createCelebrationParticles();

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.GAME, { level: 0, score: 0, lives: 3 });
      });
    });

    this.input.keyboard!.once('keydown-Q', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKey.TITLE);
      });
    });
  }

  private createCelebrationParticles(): void {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff];

    for (const color of colors) {
      const key = `confetti_${color}`;
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        g.fillStyle(color);
        g.fillRect(0, 0, 6, 6);
        g.generateTexture(key, 6, 6);
        g.destroy();
      }

      this.add.particles(GAME_WIDTH / 2, -10, key, {
        x: { min: -GAME_WIDTH / 2, max: GAME_WIDTH / 2 },
        speed: { min: 50, max: 150 },
        angle: { min: 80, max: 100 },
        lifespan: 4000,
        scale: { start: 1, end: 0.3 },
        rotate: { min: 0, max: 360 },
        gravityY: 60,
        frequency: 100,
      });
    }
  }
}
