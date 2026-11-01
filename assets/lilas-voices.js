/* ===== お客様の声（sections/lilas-voices.liquid） =====
   Prev / Next で、写真と感想のカードを切り替える */
(() => {
  function init(section) {
    if (!section || section.dataset.ready) return;
    section.dataset.ready = '1';
    const slides = [...section.querySelectorAll('.vc-slide')];
    const dots = [...section.querySelectorAll('.vc-dots span')];
    if (slides.length < 2) return;
    let i = 0;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    section.querySelector('[data-prev]').onclick = () => go(i - 1);
    section.querySelector('[data-next]').onclick = () => go(i + 1);

    // テーマエディタでブロックを選んだら、その声を表示する
    section.addEventListener('shopify:block:select', (e) => {
      const k = slides.indexOf(e.target);
      if (k >= 0) go(k);
    });
  }
  const start = () => document.querySelectorAll('[data-lilas-voices]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-lilas-voices]').forEach(init));
})();
