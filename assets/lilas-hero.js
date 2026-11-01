/* ===== 表紙の動画（sections/lilas-hero.liquid） =====
   - 一時停止／再生ボタン
   - 「動きを減らす」設定の人には、止めた状態で表示する */
(() => {
  function init(root = document) {
    const section = root.querySelector ? root.querySelector('.fv') || (root.classList && root.classList.contains('fv') ? root : null) : null;
    if (!section) return;
    const video = section.querySelector('video');
    const btn = section.querySelector('.vctl');
    if (!video) { if (btn) btn.hidden = true; return; }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
      if (btn) btn.textContent = 'Play';
    }
    if (btn) btn.onclick = () => {
      if (video.paused) { video.play(); btn.textContent = 'Pause'; }
      else { video.pause(); btn.textContent = 'Play'; }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
  document.addEventListener('shopify:section:load', (e) => init(e.target));
})();
