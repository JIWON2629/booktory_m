/**
 * KSI OSP Mobile - PWA Service Worker
 * 오프라인 지원, 캐싱, 백그라운드 동기화
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = 'ksi-osp-static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'ksi-osp-dynamic-' + CACHE_VERSION;
const DATA_CACHE = 'ksi-osp-data-' + CACHE_VERSION;

// 정적 파일 목록 (앱 설치 시 캐시)
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './css/mobile-common.css',
    './js/mobile-common.js',
    './js/barcode-scanner.js',
    './m_9_1_0.html',
    './m_9_2_0.html',
    './m_9_3_0.html',
    './m_9_4_0.html',
    './m_9_5_0.html',
    './m_9_5_1_0.html',
    './m_9_6_0.html',
    './m_9_7_0.html',
    './m_9_scan.html',
    './offline.html'
];

// 캐시하지 않을 URL 패턴
const EXCLUDE_PATTERNS = [
    /\/api\//,
    /chrome-extension/,
    /extensions/
];

// 설치 이벤트
self.addEventListener('install', function(event) {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(function(cache) {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(function() {
                console.log('[SW] Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(function(err) {
                console.error('[SW] Failed to cache static files:', err);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames
                        .filter(function(cacheName) {
                            return cacheName.startsWith('ksi-osp-') && 
                                   cacheName !== STATIC_CACHE &&
                                   cacheName !== DYNAMIC_CACHE &&
                                   cacheName !== DATA_CACHE;
                        })
                        .map(function(cacheName) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(function() {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', function(event) {
    const request = event.request;
    const url = new URL(request.url);
    
    // 제외할 URL 패턴 체크
    if (EXCLUDE_PATTERNS.some(function(pattern) { return pattern.test(url.href); })) {
        return;
    }
    
    // GET 요청만 캐시
    if (request.method !== 'GET') {
        return;
    }
    
    // API 요청은 네트워크 우선
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirst(request, DATA_CACHE));
        return;
    }
    
    // HTML 파일은 네트워크 우선 (최신 버전 유지)
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }
    
    // 정적 파일은 캐시 우선
    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// 캐시 우선 전략
function cacheFirst(request, cacheName) {
    return caches.match(request)
        .then(function(response) {
            if (response) {
                return response;
            }
            return fetchAndCache(request, cacheName);
        })
        .catch(function() {
            return caches.match('./offline.html');
        });
}

// 네트워크 우선 전략
function networkFirst(request, cacheName) {
    return fetch(request)
        .then(function(response) {
            if (response && response.status === 200) {
                var responseClone = response.clone();
                caches.open(cacheName).then(function(cache) {
                    cache.put(request, responseClone);
                });
            }
            return response;
        })
        .catch(function() {
            return caches.match(request)
                .then(function(response) {
                    if (response) {
                        return response;
                    }
                    // HTML 요청인 경우 오프라인 페이지 반환
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('./offline.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
        });
}

// Fetch 후 캐시에 저장
function fetchAndCache(request, cacheName) {
    return fetch(request)
        .then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            
            var responseClone = response.clone();
            caches.open(cacheName).then(function(cache) {
                cache.put(request, responseClone);
            });
            
            return response;
        });
}

// 백그라운드 동기화
self.addEventListener('sync', function(event) {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-pending-data') {
        event.waitUntil(syncPendingData());
    }
    
    if (event.tag === 'sync-inbound') {
        event.waitUntil(syncInboundData());
    }
    
    if (event.tag === 'sync-outbound') {
        event.waitUntil(syncOutboundData());
    }
});

// 대기 중인 데이터 동기화
async function syncPendingData() {
    console.log('[SW] Syncing pending data...');
    
    // IndexedDB에서 대기 중인 데이터 가져오기
    // 실제 구현 시 IndexedDB 연동 필요
    
    // 클라이언트에 동기화 완료 메시지 전송
    const clients = await self.clients.matchAll();
    clients.forEach(function(client) {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            message: '데이터 동기화가 완료되었습니다.'
        });
    });
}

async function syncInboundData() {
    console.log('[SW] Syncing inbound data...');
}

async function syncOutboundData() {
    console.log('[SW] Syncing outbound data...');
}

// 푸시 알림
self.addEventListener('push', function(event) {
    console.log('[SW] Push received');
    
    var data = { title: 'KSI OSP', body: '새로운 알림이 있습니다.' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    var options = {
        body: data.body,
        icon: './icons/icon-192x192.png',
        badge: './icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './index.html'
        },
        actions: [
            { action: 'open', title: '열기' },
            { action: 'close', title: '닫기' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 알림 클릭
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    var url = event.notification.data.url || './index.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(function(clientList) {
                // 이미 열린 창이 있으면 포커스
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.includes('ksi-osp') && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // 없으면 새 창 열기
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// 메시지 수신 (클라이언트 -> SW)
self.addEventListener('message', function(event) {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(function(cache) {
                return cache.addAll(event.data.urls);
            })
        );
    }
});
