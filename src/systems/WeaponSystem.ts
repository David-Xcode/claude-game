// V2 扩展桩：武器系统骨架

// 武器配置接口
export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // 射速（毫秒间隔）
  projectileSpeed: number;
  ammo: number; // -1 = 无限
  spriteKey: string;
}

// 武器槽接口
export interface WeaponSlot {
  weapon: WeaponConfig | null;
  currentAmmo: number;
  lastFireTime: number;
}

// V2: 武器系统管理器
export class WeaponSystem {
  private slots: WeaponSlot[] = [];
  private activeSlotIndex = 0;

  // V2: 装备武器
  equipWeapon(_weapon: WeaponConfig, _slotIndex = 0): void {
    // TODO: V2 实现
  }

  // V2: 切换武器槽
  switchWeapon(_slotIndex: number): void {
    // TODO: V2 实现
  }

  // V2: 开火
  fire(_x: number, _y: number, _direction: number): void {
    // TODO: V2 实现
  }

  // V2: 更新弹药状态
  update(_time: number, _delta: number): void {
    // TODO: V2 实现
  }
}
