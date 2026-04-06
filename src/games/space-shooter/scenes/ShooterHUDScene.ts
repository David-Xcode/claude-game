// 射击游戏 HUD 场景：与 ShooterGameScene 并行运行
// 显示血量、分数、连击、炸弹、武器类型、暂停按钮、触控控制

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { SHOOTER, WeaponType, SHOOTER_EVENTS } from '../data/ShooterConstants';
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

  // 暂停按钮引用（resize 时重建需要销毁）
  private pauseBtn?: Phaser.GameObjects.Graphics;
  private pauseZone?: Phaser.GameObjects.Zone;

  // 触控系统（暴露给 ShooterGameScene 的 inputMgr）
  public shooterTouchControls?: ShooterTouchControls;

  // 游戏场景事件引用（销毁时解绑）
  private gameScene?: Phaser.Scene;

  // 缓存当前 HUD 状态，resize 重建后恢复
  private cachedHealth: number = SHOOTER.MAX_HEALTH;
  private cachedBombs: number = SHOOTER.MAX_BOMBS;
  private cachedWeapon: WeaponType = WeaponType.VULCAN;
  private cachedWeaponLevel = 1;

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

    // 构建所有 HUD 元素
    this.buildHUD();

    // 监听 ShooterGameScene 事件
    this.bindGameEvents();

    // 监听窗口尺寸变化，重建 HUD
    this.scale.on('resize', this.onResize, this);
  }

  /** 构建/重建全部 HUD 元素 */
  private buildHUD(): void {
    const safeT = layout.safeTop;

    // ─── 左上角：血量条 ───
    this.createHealthBar();

    // ─── 上方居中：分数 + 连击 ───
    this.scoreText = this.add.text(layout.centerX, safeT + layout.scale(10), 'SCORE: 0', {
      fontSize: layout.fontSize(16),
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.scoreText.setOrigin(0.5, 0);

    this.comboText = this.add.text(layout.centerX, safeT + layout.scale(30), '', {
      fontSize: layout.fontSize(12),
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
    this.weaponText = this.add.text(
      layout.safeLeft + layout.scale(15),
      layout.height - layout.safeBottom - layout.scale(30),
      'VULCAN',
      {
        fontSize: layout.fontSize(12),
        color: '#00ccff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      },
    );

    this.createWeaponLevelDots();

    // ─── 关卡名（显示后淡出） ───
    this.stageText = this.add.text(layout.centerX, layout.centerY - layout.scale(60), '', {
      fontSize: layout.fontSize(24),
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.stageText.setOrigin(0.5);
    this.stageText.setAlpha(0);
  }

  // ═══════════════════════════════════════════════
  // Resize 处理
  // ═══════════════════════════════════════════════

  /** 窗口尺寸变化时销毁并重建全部 HUD 元素 */
  private onResize(): void {
    // 销毁所有子对象（保留 touchControls 和事件绑定）
    this.healthIcons = [];
    this.bombIcons = [];
    this.levelDots = [];
    this.pauseBtn = undefined;
    this.pauseZone = undefined;
    this.children.removeAll(true);

    // 触控按钮也需重建
    if (this.sys.game.device.input.touch) {
      this.shooterTouchControls?.destroy();
      this.shooterTouchControls = new ShooterTouchControls(this);

      // 重新绑定到 inputMgr
      const gameScene = this.scene.get(SceneKey.SHOOTER_GAME) as any;
      if (gameScene?.getInputManager) {
        gameScene.getInputManager().setShooterTouchControls(this.shooterTouchControls);
      }
    }

    this.buildHUD();

    // 恢复缓存的 HUD 状态
    this.updateHealth(this.cachedHealth);
    this.updateBombs(this.cachedBombs);
    this.updateWeapon(this.cachedWeapon, this.cachedWeaponLevel);
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

    const s = layout.uiScale;
    const gap = layout.scale(22);
    const baseX = layout.safeLeft + layout.scale(20);
    const baseY = layout.safeTop + layout.scale(18);

    for (let i = 0; i < SHOOTER.MAX_HEALTH; i++) {
      const heart = this.add.graphics();
      heart.fillStyle(0xff4466);
      // 心形按 uiScale 缩放
      heart.fillCircle(-4 * s, 0, 4 * s);
      heart.fillCircle(4 * s, 0, 4 * s);
      heart.fillTriangle(-8 * s, 1 * s, 8 * s, 1 * s, 0, 9 * s);
      heart.setPosition(baseX + i * gap, baseY);
      this.healthIcons.push(heart);
    }
  }

  /** 创建炸弹图标 */
  private createBombIcons(): void {
    this.bombIcons.forEach((icon) => icon.destroy());
    this.bombIcons = [];

    const s = layout.uiScale;
    const gap = layout.scale(20);
    const pauseWidth = layout.scale(50);
    // 炸弹区域从暂停按钮左侧开始向左排列
    const baseX = layout.width - layout.safeRight - pauseWidth - layout.scale(10);
    const baseY = layout.safeTop + layout.scale(18);

    for (let i = 0; i < SHOOTER.MAX_BOMBS; i++) {
      const bomb = this.add.graphics();
      bomb.fillStyle(0xffcc00);
      bomb.fillCircle(0, 2 * s, 6 * s);
      // 引信
      bomb.lineStyle(2 * s, 0xff6600);
      bomb.lineBetween(0, -4 * s, 2 * s, -8 * s);
      // 从右向左排列
      bomb.setPosition(baseX - (SHOOTER.MAX_BOMBS - 1 - i) * gap, baseY);
      this.bombIcons.push(bomb);
    }
  }

  /** 创建暂停按钮 */
  private createPauseButton(): void {
    const s = layout.uiScale;
    const btnX = layout.width - layout.safeRight - layout.scale(30);
    const btnY = layout.safeTop + layout.scale(18);

    this.pauseBtn = this.add.graphics();
    this.pauseBtn.setPosition(btnX, btnY);
    this.pauseBtn.fillStyle(0xffffff, 0.5);
    this.pauseBtn.fillRect(-5 * s, -8 * s, 4 * s, 16 * s);
    this.pauseBtn.fillRect(3 * s, -8 * s, 4 * s, 16 * s);

    // 触控热区
    const zoneSize = layout.scale(50, 40);
    this.pauseZone = this.add.zone(btnX, btnY, zoneSize, zoneSize);
    this.pauseZone.setInteractive();
    this.pauseZone.on('pointerdown', () => {
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

    const s = layout.uiScale;
    const gap = layout.scale(12);
    const dotRadius = 3 * s;
    const baseX = layout.safeLeft + layout.scale(80);
    const baseY = layout.height - layout.safeBottom - layout.scale(24);

    for (let i = 0; i < 3; i++) {
      const dot = this.add.graphics();
      dot.fillStyle(0x00ccff, i === 0 ? 1 : 0.3);
      dot.fillCircle(0, 0, dotRadius);
      dot.setPosition(baseX + i * gap, baseY);
      this.levelDots.push(dot);
    }
  }

  // ═══════════════════════════════════════════════
  // 状态更新回调
  // ═══════════════════════════════════════════════

  private updateHealth(health: number): void {
    this.cachedHealth = health;
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
    this.cachedBombs = bombs;
    this.bombIcons.forEach((icon, i) => {
      icon.setAlpha(i < bombs ? 1 : 0.15);
    });
  }

  private updateWeapon(weapon: WeaponType, level: number): void {
    // 缓存状态供 resize 后恢复
    this.cachedWeapon = weapon;
    this.cachedWeaponLevel = level;

    const info = WEAPON_DISPLAY[weapon] ?? WEAPON_DISPLAY[WeaponType.VULCAN];
    this.weaponText.setText(info.name);
    this.weaponText.setColor(info.color);

    const s = layout.uiScale;
    const dotRadius = 3 * s;

    // 更新等级圆点
    this.levelDots.forEach((dot, i) => {
      dot.clear();
      const color = Phaser.Display.Color.HexStringToColor(info.color).color;
      dot.fillStyle(color, i < level ? 1 : 0.3);
      dot.fillCircle(0, 0, dotRadius);
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
    this.scale.off('resize', this.onResize, this);
    this.unbindGameEvents();
    this.shooterTouchControls?.destroy();
    this.shooterTouchControls = undefined;
    this.gameScene = undefined;
  }
}
