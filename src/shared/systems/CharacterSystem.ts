// V2 扩展桩：角色系统骨架

import { PlayerConfig } from '@games/pixel-adventure/data/PlayerConfig';

// 角色解锁条件
export interface CharacterUnlockCondition {
  type: 'score' | 'level' | 'achievement';
  value: number | string;
}

// 完整角色配置（V2 扩展 PlayerConfig）
export interface CharacterConfig extends PlayerConfig {
  id: string;
  description: string;
  unlockCondition?: CharacterUnlockCondition;
  specialAbility?: string; // V2: 角色特殊能力名
}

// V2: 角色系统管理器
export class CharacterSystem {
  private characters: CharacterConfig[] = [];
  private unlockedIds: Set<string> = new Set();
  private activeCharacterId = 'hero';

  // V2: 注册角色
  registerCharacter(_config: CharacterConfig): void {
    // TODO: V2 实现
  }

  // V2: 解锁角色
  unlockCharacter(_id: string): void {
    // TODO: V2 实现
  }

  // V2: 选择角色
  selectCharacter(_id: string): PlayerConfig | null {
    // TODO: V2 实现
    return null;
  }

  // V2: 获取已解锁角色列表
  getUnlockedCharacters(): CharacterConfig[] {
    // TODO: V2 实现
    return [];
  }
}
