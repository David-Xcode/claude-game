// Service Worker: 智能缓存策略，实现离线支持
// Vite 构建的 hashed 资源用 cache-first（文件名即版本号，永不变）
// HTML/manifest 等用 network-first（确保部署更新即时生效）
const CACHE_NAME = 'pixel-adventure-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // 清理旧版本缓存，完成后接管所有客户端
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // 仅处理同源 GET 请求
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);

  // Vite 构建产物（/assets/ 下的文件带 content hash）→ cache-first
  // 文件名包含 hash，内容变化时文件名必定变化，缓存永远有效
  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          // 仅缓存成功响应，防止错误响应被永久缓存
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 其余文件（index.html、manifest.json、图标等）→ network-first
  // 确保部署新版本时用户能即时获取更新
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // 仅缓存成功响应，避免缓存临时错误
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
