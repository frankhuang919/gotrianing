const CACHE_NAME = 'zengo-v1';

// 需要缓存的核心资源（构建后的文件会通过 fetch 事件动态缓存）
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/wood-pattern.jpg',
    '/tesuji_data.json',
    '/tsumego_data.json',
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// 拦截请求：优先网络，失败则用缓存（Network First 策略）
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求和 Supabase API 请求
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 成功获取网络响应，缓存一份
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 网络失败，从缓存返回
                return caches.match(event.request).then((cached) => {
                    return cached || new Response('离线不可用', { status: 503 });
                });
            })
    );
});
