// Service Worker の登録。失敗してもゲームは遊べる。

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // file:// や非対応の環境では登録できないが、ゲーム自体は動く
    });
  });
}
