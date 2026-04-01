// 五子棋 HUD 场景：玩家指示器、回合数、暂停按钮

import Phaser from 'phaser';
import { SceneKey, GAME_WIDTH, GAME_HEIGHT } from '@shared/utils/Constants';
import { GomokuMode, GomokuDifficulty, GOMOKU_COLORS, GOMOKU_DEPTH } from '../data/GomokuConstants';
import { DIFFICULTY_CONFIGS } from '../data/DifficultyConfig';

interface HUDData {
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
}

export class GomokuHUDScene extends Phaser.Scene {
  private player1Label!: Phaser.GameObjects.Text;
  private player2Label!: Phaser.GameObjects.Text;
  private player1Dot!: Phaser.GameObjects.Graphics;
  private player2Dot!: Phaser.GameObjects.Graphics;
  private moveText!: Phaser.GameObjects.Text;
  private mode!: GomokuMode;
  // 保存事件回调引用，以便 shutdown 时取消订阅
  private onTurnChanged!: (player: 1 | 2) => void;
  private onMoveCountChanged!: (count: number) => void;

  constructor() {
    super({ key: SceneKey.GOMOKU_HUD });
  }

  create(data: HUDData): void {
    this.mode = data.mode;
    const config = DIFFICULTY_CONFIGS[data.difficulty];

    // ── 左侧：Player 1（黑棋）指示器 ──
    const p1X = 70;
    const p1Y = GAME_HEIGHT / 2 - 40;

    this.player1Dot = this.add.graphics().setDepth(GOMOKU_DEPTH.UI);
    this.drawPlayerDot(this.player1Dot, p1X, p1Y, 1, true);

    this.player1Label = this.add
      .text(p1X, p1Y + 22, this.mode === GomokuMode.SINGLE_PLAYER ? 'You' : 'Player 1', {
        fontSize: '13px',
        color: '#ffffff',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    this.add
      .text(p1X, p1Y + 38, 'BLACK', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 右侧：Player 2（白棋）指示器 ──
    const p2X = GAME_WIDTH - 70;
    const p2Y = GAME_HEIGHT / 2 - 40;

    this.player2Dot = this.add.graphics().setDepth(GOMOKU_DEPTH.UI);
    this.drawPlayerDot(this.player2Dot, p2X, p2Y, 2, false);

    const p2Name =
      this.mode === GomokuMode.SINGLE_PLAYER
        ? `AI (${config.name})`
        : 'Player 2';
    this.player2Label = this.add
      .text(p2X, p2Y + 22, p2Name, {
        fontSize: '13px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    this.add
      .text(p2X, p2Y + 38, 'WHITE', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 顶部中央：回合数 ──
    this.moveText = this.add
      .text(GAME_WIDTH / 2, 16, 'Move: 0', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(GOMOKU_DEPTH.UI);

    // ── 暂停按钮 ──
    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      const pauseBtn = this.add
        .text(GAME_WIDTH - 30, 16, '❚❚', {
          fontSize: '18px',
          color: '#888888',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setDepth(GOMOKU_DEPTH.UI)
        .setPadding(15, 10, 15, 10)
        .setInteractive();

      pauseBtn.on('pointerdown', () => {
        const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
        gameScene.scene.pause();
        this.scene.launch(SceneKey.GOMOKU_PAUSE);
      });
    }

    // ── 监听 GameScene 事件 ──
    this.onTurnChanged = (player: 1 | 2) => {
      this.updateActivePlayer(player);
    };
    this.onMoveCountChanged = (count: number) => {
      this.moveText.setText(`Move: ${count}`);
    };

    const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
    gameScene.events.on('turnChanged', this.onTurnChanged);
    gameScene.events.on('moveCountChanged', this.onMoveCountChanged);

    // 注册 shutdown 回调清理事件监听
    this.events.on('shutdown', this.shutdown, this);
  }

  private shutdown(): void {
    const gameScene = this.scene.get(SceneKey.GOMOKU_GAME);
    if (gameScene) {
      gameScene.events.off('turnChanged', this.onTurnChanged);
      gameScene.events.off('moveCountChanged', this.onMoveCountChanged);
    }
    this.events.off('shutdown', this.shutdown, this);
  }

  /** 更新当前活跃玩家的视觉指示 */
  private updateActivePlayer(activePlayer: 1 | 2): void {
    const p1X = 70;
    const p1Y = GAME_HEIGHT / 2 - 40;
    const p2X = GAME_WIDTH - 70;
    const p2Y = GAME_HEIGHT / 2 - 40;

    this.player1Dot.clear();
    this.drawPlayerDot(this.player1Dot, p1X, p1Y, 1, activePlayer === 1);
    this.player1Label.setColor(activePlayer === 1 ? '#ffffff' : '#666666');

    this.player2Dot.clear();
    this.drawPlayerDot(this.player2Dot, p2X, p2Y, 2, activePlayer === 2);
    this.player2Label.setColor(activePlayer === 2 ? '#ffffff' : '#666666');
  }

  /** 绘制玩家棋子指示圆点 */
  private drawPlayerDot(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    player: 1 | 2,
    active: boolean
  ): void {
    const r = 14;

    // 活跃指示光环
    if (active) {
      g.lineStyle(2, GOMOKU_COLORS.PLAYER_ACTIVE, 0.8);
      g.strokeCircle(x, y, r + 4);
    }

    // 棋子
    if (player === 1) {
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK, active ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_BLACK_HIGHLIGHT, 0.3);
      g.fillCircle(x - 3, y - 3, r * 0.4);
    } else {
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE, active ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.fillStyle(GOMOKU_COLORS.STONE_WHITE_HIGHLIGHT, 0.4);
      g.fillCircle(x - 3, y - 3, r * 0.35);
    }
  }
}
