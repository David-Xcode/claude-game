// 编队位置计算器：根据编队类型计算每个敌人的生成位置
// 纯函数，无副作用

import Phaser from 'phaser';
import { layout } from '@shared/utils/Constants';
import { FormationType } from '../data/ShooterConstants';

// ═══════════════════════════════════════════════
// 编队位置计算
// ═══════════════════════════════════════════════

/** 根据编队类型和敌人数量计算生成坐标 */
export function calculateFormationPositions(
  formation: FormationType,
  count: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const margin = 40;
  const usableWidth = layout.width - margin * 2;

  switch (formation) {
    case FormationType.LINE_HORIZONTAL: {
      // 均匀分布在顶部
      const spacing = count > 1 ? usableWidth / (count - 1) : 0;
      for (let i = 0; i < count; i++) {
        positions.push({
          x: count > 1 ? margin + spacing * i : layout.width / 2,
          y: -20,
        });
      }
      break;
    }

    case FormationType.LINE_VERTICAL: {
      // 同一 x 位置，y 略微分散（通过 spawnDelay 实现间隔）
      const x = Phaser.Math.Between(margin + 40, layout.width - margin - 40);
      for (let i = 0; i < count; i++) {
        positions.push({ x, y: -20 });
      }
      break;
    }

    case FormationType.V_FORMATION: {
      // V 字形从中心展开
      const cx = layout.width / 2;
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        positions.push({
          x: cx + side * (row + 1) * 35,
          y: -20 - row * 15,
        });
      }
      break;
    }

    case FormationType.CIRCLE_IN: {
      // 圆形散布，从外围向中心汇聚（初始位置在屏幕上方散开）
      const cx = layout.width / 2;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        positions.push({
          x: cx + Math.cos(angle) * (usableWidth / 2 - 20),
          y: -20 - Math.sin(angle) * 30,
        });
      }
      break;
    }

    case FormationType.RANDOM: {
      // 随机 x 位置
      for (let i = 0; i < count; i++) {
        positions.push({
          x: Phaser.Math.Between(margin, layout.width - margin),
          y: Phaser.Math.Between(-40, -10),
        });
      }
      break;
    }

    case FormationType.SIDES: {
      // 从左右两侧交替
      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        positions.push({
          x: fromLeft ? -20 : layout.width + 20,
          y: Phaser.Math.Between(40, 200),
        });
      }
      break;
    }

    default: {
      // 默认随机
      for (let i = 0; i < count; i++) {
        positions.push({
          x: Phaser.Math.Between(margin, layout.width - margin),
          y: -20,
        });
      }
    }
  }

  return positions;
}
