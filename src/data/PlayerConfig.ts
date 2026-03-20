// 角色属性配置（便于 V2 多角色切换）

import { PLAYER } from '../utils/Constants';

export interface PlayerConfig {
  name: string;
  speed: number;
  jumpForce: number;
  maxHealth: number;
  maxLives: number;
  color: number;
}

// V1 默认角色配置
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  name: 'Hero',
  speed: PLAYER.SPEED,
  jumpForce: PLAYER.JUMP_FORCE,
  maxHealth: PLAYER.MAX_HEALTH,
  maxLives: PLAYER.MAX_LIVES,
  color: 0xc27462, // Claude toy 珊瑚色
};
