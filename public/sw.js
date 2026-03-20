// Service Worker: 网络优先 + 运行时缓存，实现离线支持
// 首次在线访问后所有资源自动缓存，后续可离线运行
const CACHE_NAME = 'pixel-adventure-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 仅处理同源 GET 请求
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  // 网络优先：在线时用最新资源并更新缓存，离线时回退到缓存
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
