/// <reference types="vite/client" />

// 扩展 ScreenOrientation 接口以支持 lock 方法
interface ScreenOrientation {
  lock?(orientation: string): Promise<void>;
}
