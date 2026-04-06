// 中国象棋 HUD 场景：玩家指示器、步数、将军警告、暂停按钮

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
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

  private onTurnChanged!: (side: Side) => void;
  private onMoveCountChanged!: (count: number) => void;
  private onCheckStatusChanged!: (isCheck: boolean, side: Side) => void;

  constructor() {
    super({ key: SceneKey.XIANGQI_HUD });
  }

  // 布局常量
  private static readonly P1_X = 80;
  private static readonly P2_X = GAME_WIDTH - 80;
  private static readonly PY = GAME_HEIGHT / 2 - 40;

  create(data: HUDData): void {
    this.mode = data.mode;
    const config = DIFFICULTY_CONFIGS[data.difficulty];

    const p1X = XiangqiHUDScene.P1_X;
    const p1Y = XiangqiHUDScene.PY;

    this.redDot = this.add.graphics().setDepth(XIANGQI_DEPTH.UI);
    this.drawPlayerIndicator(this.redDot, p1X, p1Y, Side.RED, true);

    // 红方"帅"字
    this.add.text(p1X, p1Y, PIECE_CHARS[Side.RED][PieceType.GENERAL], {
      fontSize: '16px', color: '#cc2222', fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.UI + 1);

    this.redLabel = this.add
      .text(p1X, p1Y + 28, this.mode === XiangqiMode.SINGLE_PLAYER ? 'You' : 'Player 1', {
        fontSize: '13px',
        color: '#ffffff',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    this.add
      .text(p1X, p1Y + 44, 'RED', {
        fontSize: '10px',
        color: '#cc4444',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 右侧：黑方指示器 ──
    const p2X = XiangqiHUDScene.P2_X;
    const p2Y = XiangqiHUDScene.PY;

    this.blackDot = this.add.graphics().setDepth(XIANGQI_DEPTH.UI);
    this.drawPlayerIndicator(this.blackDot, p2X, p2Y, Side.BLACK, false);

    // 黑方"将"字
    this.add.text(p2X, p2Y, PIECE_CHARS[Side.BLACK][PieceType.GENERAL], {
      fontSize: '16px', color: '#222222', fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(XIANGQI_DEPTH.UI + 1);

    const p2Name =
      this.mode === XiangqiMode.SINGLE_PLAYER
        ? `AI (${config.name})`
        : 'Player 2';
    this.blackLabel = this.add
      .text(p2X, p2Y + 28, p2Name, {
        fontSize: '13px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    this.add
      .text(p2X, p2Y + 44, 'BLACK', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 顶部中央：步数 ──
    this.moveText = this.add
      .text(GAME_WIDTH / 2, 16, 'Move: 0', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI);

    // ── 将军警告文字（初始隐藏） ──
    this.checkText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'CHECK!', {
        fontSize: '16px',
        color: '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(XIANGQI_DEPTH.UI)
      .setVisible(false);

    // ── 暂停按钮（触摸设备） ──
    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      const pauseBtn = this.add
        .text(GAME_WIDTH - 30, 16, '❚❚', {
          fontSize: '18px',
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

    // ── 监听 GameScene 事件 ──
    this.onTurnChanged = (side: Side) => {
      this.updateActivePlayer(side);
    };
    this.onMoveCountChanged = (count: number) => {
      this.moveText.setText(`Move: ${count}`);
    };
    this.onCheckStatusChanged = (isCheck: boolean) => {
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

    this.events.on('shutdown', this.shutdown, this);
  }

  private shutdown(): void {
    const gameScene = this.scene.get(SceneKey.XIANGQI_GAME);
    if (gameScene) {
      gameScene.events.off('turnChanged', this.onTurnChanged);
      gameScene.events.off('moveCountChanged', this.onMoveCountChanged);
      gameScene.events.off('checkStatusChanged', this.onCheckStatusChanged);
    }
    this.events.off('shutdown', this.shutdown, this);
  }

  private updateActivePlayer(activeSide: Side): void {
    this.redDot.clear();
    this.drawPlayerIndicator(this.redDot, XiangqiHUDScene.P1_X, XiangqiHUDScene.PY, Side.RED, activeSide === Side.RED);
    this.redLabel.setColor(activeSide === Side.RED ? '#ffffff' : '#666666');

    this.blackDot.clear();
    this.drawPlayerIndicator(this.blackDot, XiangqiHUDScene.P2_X, XiangqiHUDScene.PY, Side.BLACK, activeSide === Side.BLACK);
    this.blackLabel.setColor(activeSide === Side.BLACK ? '#ffffff' : '#666666');
  }

  private drawPlayerIndicator(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number,
    side: Side, active: boolean
  ): void {
    const r = 16;

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
    g.strokeCircle(x, y, r - 3);
  }
}
