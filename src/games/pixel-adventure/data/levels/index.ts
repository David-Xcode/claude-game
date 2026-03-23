// 关卡聚合导出：统一入口

export type { PlatformData, SpikeData, ItemSpawnData, EnemySpawnEntry, DecorationData, LevelConfig } from './types';
export { LEVEL_1 } from './level1';
export { LEVEL_2 } from './level2';
export { LEVEL_3 } from './level3';

import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';
import { LEVEL_3 } from './level3';
import { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3];
