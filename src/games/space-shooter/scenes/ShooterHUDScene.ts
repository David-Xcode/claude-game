// 射击游戏 HUD 场景：与 ShooterGameScene 并行运行
// 显示血量、分数、连击、炸弹、武器类型、暂停按钮、触控控制

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { SHOOTER, SHOOTER_COLORS, WeaponType, SHOOTER_EVENTS } from '../data/ShooterConstants';
import { ShooterTouchControls } from '../systems/ShooterTouchControls';

// 武器名称映射
const WEAPON_DISPLAY: Record<WeaponType, { name: string; color: string }> = {
  [WeaponType.VULCAN]: { name: 'VULCAN', color: '#00ccff' },
  [WeaponType.SPREAD]: { name: 'SPREAD', color: '#ff8800' },
  [WeaponType.LASER]: { name: 'LASER', color: '#ff0044' },
  [WeaponType.HOMING]: { name: 'HOMING', color: '#44ff44' },
};

export class ShooterHUDScene extends Phaser.Scene {
  // 血量图标
  private healthIcons: Phaser.GameObjects.Graphics[] = [];

  // 分数 & 连击
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  // 炸弹图标
  private bombIcons: Phaser.GameObjects.Graphics[] = [];

  // 武器指示器
  private weaponText!: Phaser.GameObjects.Text;
  private levelDots: Phaser.GameObjects.Graphics[] = [];

  // 关卡名文字
  private stageText!: Phaser.GameObjects.Text;

  // 触控系统（暴露给 ShooterGameScene 的 inputMgr）
  public shooterTouchControls?: ShooterTouchControls;

  // 游戏场景事件引用（销毁时解绑）
  private gameScene?: Phaser.Scene;

  constructor() {
    super({ key: SceneKey.SHOOTER_HUD });
  }

  create(): void {
    this.gameScene = this.scene.get(SceneKey.SHOOTER_GAME);

    // 触控设备创建虚拟按钮
    if (this.sys.game.device.input.touch) {
      this.shooterTouchControls = new ShooterTouchControls(this);
    }

    // 注册 shutdown 清理
    this.events.on('shutdown', this.shutdown, this);

    // ─── 左上角：血量条 ───
    this.createHealthBar();

    // ─── 上方居中：分数 + 连击 ───
    this.scoreText = this.add.text(GAME_WIDTH / 2, 10, 'SCORE: 0', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setOrigin(0.5, 0);

    this.comboText = this.add.text(GAME_WIDTH / 2, 30, '', {
      fontSize: '12px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.comboText.setOrigin(0.5, 0);

    // ─── 右上角：炸弹图标 + 暂停按钮 ───
    this.createBombIcons();
    this.createPauseButton();

    // ─── 左下角：武器类型 + 等级指示 ───
    this.weaponText = this.add.text(15, GAME_HEIGHT - 30, 'VULCAN', {
      fontSize: '12px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });

    this.createWeaponLevelDots();

    // ─── 关卡名（显示后淡出） ───
    this.stageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      fontSize: '24px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.stageText.setOrigin(0.5);
    this.stageText.setAlpha(0);

    // ─── 监听 ShooterGameScene 事件 ───
    this.bindGameEvents();
  }

  // ═══════════════════════════════════════════════
  // 事件绑定
  // ═══════════════════════════════════════════════

  private bindGameEvents(): void {
    if (!this.gameScene) return;

    this.gameScene.events.on(SHOOTER_EVENTS.HEALTH_CHANGED, this.updateHealth, this);
    this.gameScene.events.on(SHOOTER_EVENTS.SCORE_CHANGED, this.updateScore, this);
    this.gameScene.events.on(SHOOTER_EVENTS.BOMBS_CHANGED, this.updateBombs, this);
    this.gameScene.events.on(SHOOTER_EVENTS.WEAPON_CHANGED, this.updateWeapon, this);
    this.gameScene.events.on(SHOOTER_EVENTS.COMBO_CHANGED, this.updateCombo, this);
    this.gameScene.events.on(SHOOTER_EVENTS.STAGE_NAME, this.showStageName, this);
  }

  private unbindGameEvents(): void {
    if (!this.gameScene) return;

    this.gameScene.events.off(SHOOTER_EVENTS.HEALTH_CHANGED, this.updateHealth, this);
    this.gameScene.events.off(SHOOTER_EVENTS.SCORE_CHANGED, this.updateScore, this);
    this.gameScene.events.off(SHOOTER_EVENTS.BOMBS_CHANGED, this.updateBombs, this);
    this.gameScene.events.off(SHOOTER_EVENTS.WEAPON_CHANGED, this.updateWeapon, this);
    this.gameScene.events.off(SHOOTER_EVENTS.COMBO_CHANGED, this.updateCombo, this);
    this.gameScene.events.off(SHOOTER_EVENTS.STAGE_NAME, this.showStageName, this);
  }

  // ═══════════════════════════════════════════════
  // UI 创建
  // ═══════════════════════════════════════════════

  /** 创建血量心形图标 */
  private createHealthBar(): void {
    this.healthIcons.forEach((icon) => icon.destroy());
    this.healthIcons = [];

    for (let i = 0; i < SHOOTER.MAX_HEALTH; i++) {
      const heart = this.add.graphics();
      heart.fillStyle(0xff4466);
      heart.fillCircle(-4, 0, 4);
      heart.fillCircle(4, 0, 4);
      heart.fillTriangle(-8, 1, 8, 1, 0, 9);
      heart.setPosition(20 + i * 22, 18);
      this.healthIcons.push(heart);
    }
  }

  /** 创建炸弹图标 */
  private createBombIcons(): void {
    this.bombIcons.forEach((icon) => icon.destroy());
    this.bombIcons = [];

    for (let i = 0; i < SHOOTER.MAX_BOMBS; i++) {
      const bomb = this.add.graphics();
      bomb.fillStyle(0xffcc00);
      bomb.fillCircle(0, 2, 6);
      // 引信
      bomb.lineStyle(2, 0xff6600);
      bomb.lineBetween(0, -4, 2, -8);
      bomb.setPosition(GAME_WIDTH - 100 + i * 20, 18);
      this.bombIcons.push(bomb);
    }
  }

  /** 创建暂停按钮 */
  private createPauseButton(): void {
    const pauseBtn = this.add.graphics();
    pauseBtn.setPosition(GAME_WIDTH - 30, 18);
    pauseBtn.fillStyle(0xffffff, 0.5);
    pauseBtn.fillRect(-5, -8, 4, 16);
    pauseBtn.fillRect(3, -8, 4, 16);

    // 触控热区
    const zone = this.add.zone(GAME_WIDTH - 30, 18, 50, 50);
    zone.setInteractive();
    zone.on('pointerdown', () => {
      const gameScene = this.scene.get(SceneKey.SHOOTER_GAME);
      if (gameScene?.sys?.isActive()) {
        gameScene.scene.launch(SceneKey.SHOOTER_PAUSE);
        gameScene.scene.pause();
      }
    });
  }

  /** 创建武器等级指示圆点（3 个） */
  private createWeaponLevelDots(): void {
    this.levelDots.forEach((d) => d.destroy());
    this.levelDots = [];

    for (let i = 0; i < 3; i++) {
      const dot = this.add.graphics();
      dot.fillStyle(0x00ccff, i === 0 ? 1 : 0.3);
      dot.fillCircle(0, 0, 3);
      dot.setPosition(80 + i * 12, GAME_HEIGHT - 24);
      this.levelDots.push(dot);
    }
  }

  // ═══════════════════════════════════════════════
  // 状态更新回调
  // ═══════════════════════════════════════════════

  private updateHealth(health: number): void {
    this.healthIcons.forEach((icon, i) => {
      icon.setAlpha(i < health ? 1 : 0.15);
    });
  }

  private updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);

    // 弹跳反馈
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
    });
  }

  private updateBombs(bombs: number): void {
    this.bombIcons.forEach((icon, i) => {
      icon.setAlpha(i < bombs ? 1 : 0.15);
    });
  }

  private updateWeapon(weapon: WeaponType, level: number): void {
    const info = WEAPON_DISPLAY[weapon] ?? WEAPON_DISPLAY[WeaponType.VULCAN];
    this.weaponText.setText(info.name);
    this.weaponText.setColor(info.color);

    // 更新等级圆点
    this.levelDots.forEach((dot, i) => {
      dot.clear();
      const color = Phaser.Display.Color.HexStringToColor(info.color).color;
      dot.fillStyle(color, i < level ? 1 : 0.3);
      dot.fillCircle(0, 0, 3);
    });
  }

  private updateCombo(combo: number, multiplier: number): void {
    if (combo <= 1) {
      this.comboText.setText('');
      return;
    }

    this.comboText.setText(`COMBO x${combo}  (${multiplier.toFixed(1)}x)`);

    // 连击文字缩放反馈
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 60,
      yoyo: true,
    });
  }

  private showStageName(name: string): void {
    this.stageText.setText(name);
    this.stageText.setAlpha(0);
    this.stageText.setScale(0.8);

    this.tweens.add({
      targets: this.stageText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.stageText,
          alpha: 0,
          delay: 2000,
          duration: 800,
        });
      },
    });
  }

  // ═══════════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════════

  shutdown(): void {
    this.unbindGameEvents();
    this.shooterTouchControls?.destroy();
    this.shooterTouchControls = undefined;
    this.gameScene = undefined;
  }
}
