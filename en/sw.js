/* 실습 세션 자동 저장(session.js)이 "강력 새로고침"을 알아보는 데만 쓰는 서비스 워커.
   요청을 가로채거나 캐시하지 않는다. 브라우저는 강력 새로고침(Ctrl+F5, Ctrl+Shift+R) 때
   서비스 워커를 거치지 않으므로, 그때는 페이지에 navigator.serviceWorker.controller가 없다. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
