// 相机管理器：带死区的跟随相机

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

export class CameraManager {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, worldWidth: number, worldHeight: number) {
    this.camera = scene.cameras.main;

    // 设置世界边界
    this.camera.setBounds(0, 0, worldWidth, worldHeight);

    // 设置死区，让角色在中心区域移动时相机不跟随，减少晃动
    this.camera.setDeadzone(GAME_WIDTH * 0.3, GAME_HEIGHT * 0.4);
  }

  startFollow(target: Phaser.GameObjects.GameObject): void {
    this.camera.startFollow(target, true, 0.1, 0.1);
  }

  // 屏幕震动效果（受伤时使用）
  shake(duration = 100, intensity = 0.005): void {
    this.camera.shake(duration, intensity);
  }

  // 场景过渡：淡出
  fadeOut(duration = 500): Promise<void> {
    return new Promise((resolve) => {
      this.camera.fadeOut(duration);
      this.camera.once('camerafadeoutcomplete', () => resolve());
    });
  }

  // 场景过渡：淡入
  fadeIn(duration = 500): void {
    this.camera.fadeIn(duration);
  }

  // 闪烁效果（收集道具时使用）
  flash(duration = 100, r = 255, g = 255, b = 255): void {
    this.camera.flash(duration, r, g, b);
  }
}
