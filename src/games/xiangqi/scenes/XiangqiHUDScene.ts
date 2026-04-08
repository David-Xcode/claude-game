// 中国象棋 HUD 场景：玩家指示器、步数、将军警告、暂停按钮
// 支持 resize 时销毁并重建全部 UI

import Phaser from 'phaser';
import { SceneKey, layout } from '@shared/utils/Constants';
import { XiangqiMode, XiangqiDifficulty, Side, XIANGQI_COLORS, XIANGQI_DEPTH, PIECE_CHARS, PieceType } from '../data/XiangqiConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

interface HUDData {
  mode: XiangqiMode;
  difficulty: XiangqiDifficulty;
}

export class XiangqiHUDScene extends Phaser.Scene {
  private redLabel!: Phaser.GameObjects.Text;
  private blackLabel!: Phaser.GameObjects.Text;
  private redDot!: Phaser.GameObjects.Graphics;
  private blackDot!: Phaser.GameObjects.Graphics;
  private moveText!: Phaser.GameObjects.Text;
  private checkText!: Phaser.GameObjects.Text;
  private mode!: XiangqiMode;
  private difficulty!: XiangqiDifficulty;

  // 运行时状态（resize 后还原）
  private activeSide: Side = Side.RED;
  private currentMoveCount = 0;
  private isInCheck = false;

  private onTurnChanged!: (side: Side) => void;
  private onMoveCountChanged!: (count: number) => void;
  private onCheckStatusChanged!: (isCheck: boolean, side: Side) => void;

  constructor() {
    super({ key: SceneKey.XIANGQI_HUD });
  }

  create(data: HUDData): void {
    this.mode = data.mode;
    this.difficulty = data.difficulty;

    this.buildUI();

    // ── 监听 GameScene 事件 ──
    this.onTurnChanged = (side: Side) => {
      this.activeSide = side;
      this.updateActivePlayer(side);
    };
    this.onMoveCountChanged = (count: number) => {
      this.currentMoveCount = count;
      this.moveText.setText(`Move: ${count}`);
    };
    this.onCheckStatusChanged = (isCheck: boolean) => {
      this.isInCheck = isCheck;
      this.tweens.killTweensOf(this.checkText);
      this.checkText.setAlpha(1);
      this.checkText.setVisible(isCheck);
      if (isCheck) {
        this.tweens.add({
          targets: this.checkText,
          alpha: { from: 1, to: 0.3 },
          duration: 300,
          yoyo: true,
          repeat: 3,
        });
      }
    };

    const gameScene = this.scene.get(SceneKey.XIANGQI_GAME);
    gameScene.events.on('turnChanged', this.onTurnChanged);
    gameScene.events.on('moveCountChanged', this.onMoveCountChanged);
    gameScene.events.on('checkStatusChanged', this.onCheckStatusChanged);

    // resize 监听
    this.scale.on('resize', this.handleResize, this);

    this.events.on('shutdown', this.shutdown, this);
  }

  // ── UI 构建（create + resize 时调用） ─────────

  private buildUI(): void {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const margin = layout.scale(80, 45);

    // ── 左侧：红方指示器 ──
    const p1X = margin;
    const p1Y = layout.height / 2 - layout.scale(40);

    this.redDot = this.add.graphics().setDepth(XIANGQI_DEPTH.UI);
    this.drawPlayerIndicator(this.redDot, p1X, p1Y, Side.RED, this.activeSide === Side.RED);

    // 红方"帅"字
    this.add.text(p1X, p1Y, PIECE_CHARS[Side.RED][PieceType.GENERAL], {
      fontSize: layout.fontSize(16), color: '#cc2222', fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.UI + 1);

    this.redLabel = this.add
      .text(p1X, p1Y + layout.scale(28), this.mode === XiangqiMode.SINGLE_PLAYER ? 'You' : 'Player 1', {
        fontSize: layout.fontSize(13),
        color: this.activeSide === Side.RED ? '#ffffff' : '#666666',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    this.add
      .text(p1X, p1Y + layout.scale(44), 'RED', {
        fontSize: layout.fontSize(10),
        color: '#cc4444',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 右侧：黑方指示器 ──
    const p2X = layout.width - margin;
    const p2Y = layout.height / 2 - layout.scale(40);

    this.blackDot = this.add.graphics().setDepth(XIANGQI_DEPTH.UI);
    this.drawPlayerIndicator(this.blackDot, p2X, p2Y, Side.BLACK, this.activeSide === Side.BLACK);

    // 黑方"将"字
    this.add.text(p2X, p2Y, PIECE_CHARS[Side.BLACK][PieceType.GENERAL], {
      fontSize: layout.fontSize(16), color: '#222222', fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.UI + 1);

    const p2Name =
      this.mode === XiangqiMode.SINGLE_PLAYER
        ? `AI (${config.name})`
        : 'Player 2';
    this.blackLabel = this.add
      .text(p2X, p2Y + layout.scale(28), p2Name, {
        fontSize: layout.fontSize(13),
        color: this.activeSide === Side.BLACK ? '#ffffff' : '#aaaaaa',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    this.add
      .text(p2X, p2Y + layout.scale(44), 'BLACK', {
        fontSize: layout.fontSize(10),
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 顶部中央：步数 ──
    this.moveText = this.add
      .text(layout.width / 2, layout.safeTop + layout.scale(16), `Move: ${this.currentMoveCount}`, {
        fontSize: layout.fontSize(14),
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 将军警告文字 ──
    this.checkText = this.add
      .text(layout.width / 2, layout.height - layout.scale(24), 'CHECK!', {
        fontSize: layout.fontSize(16),
        color: '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI)
      .setVisible(this.isInCheck);

    // ── 暂停按钮（触摸设备） ──
    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      const pauseBtn = this.add
        .text(layout.width - layout.scale(30), layout.safeTop + layout.scale(16), '❚❚', {
          fontSize: layout.fontSize(18),
          color: '#888888',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setDepth(XIANGQI_DEPTH.UI)
        .setPadding(15, 10, 15, 10)
        .setInteractive();

      pauseBtn.on('pointerdown', () => {
        const gameScene = this.scene.get(SceneKey.XIANGQI_GAME);
        gameScene.scene.pause();
        this.scene.launch(SceneKey.XIANGQI_PAUSE);
      });
    }
  }

  // ── resize 处理 ───────────────────────────────

  private handleResize(): void {
    this.children.removeAll(true);
    this.tweens.killAll();
    this.buildUI();
  }

  private shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    const gameScene = this.scene.get(SceneKey.XIANGQI_GAME);
    if (gameScene) {
      gameScene.events.off('turnChanged', this.onTurnChanged);
      gameScene.events.off('moveCountChanged', this.onMoveCountChanged);
      gameScene.events.off('checkStatusChanged', this.onCheckStatusChanged);
    }
    this.events.off('shutdown', this.shutdown, this);
  }

  private updateActivePlayer(activeSide: Side): void {
    const margin = layout.scale(80, 45);
    const p1X = margin;
    const p1Y = layout.height / 2 - layout.scale(40);
    const p2X = layout.width - margin;
    const p2Y = layout.height / 2 - layout.scale(40);

    this.redDot.clear();
    this.drawPlayerIndicator(this.redDot, p1X, p1Y, Side.RED, activeSide === Side.RED);
    this.redLabel.setColor(activeSide === Side.RED ? '#ffffff' : '#666666');

    this.blackDot.clear();
    this.drawPlayerIndicator(this.blackDot, p2X, p2Y, Side.BLACK, activeSide === Side.BLACK);
    this.blackLabel.setColor(activeSide === Side.BLACK ? '#ffffff' : '#666666');
  }

  private drawPlayerIndicator(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number,
    side: Side, active: boolean
  ): void {
    const r = layout.scale(16, 10);

    // 活跃光环
    if (active) {
      g.lineStyle(2, XIANGQI_COLORS.PLAYER_ACTIVE, 0.8);
      g.strokeCircle(x, y, r + 4);
    }

    // 棋子底色
    const fillColor = side === Side.RED ? XIANGQI_COLORS.RED_FILL : XIANGQI_COLORS.BLACK_FILL;
    const borderColor = side === Side.RED ? XIANGQI_COLORS.RED_BORDER : XIANGQI_COLORS.BLACK_BORDER;
    g.fillStyle(fillColor, active ? 1 : 0.5);
    g.fillCircle(x, y, r);
    g.lineStyle(2, borderColor, active ? 1 : 0.5);
    g.strokeCircle(x, y, r);
    g.lineStyle(1, borderColor, active ? 0.5 : 0.3);
    g.strokeCircle(x, y, r - Math.max(2, Math.round(r * 0.19)));
  }
}
