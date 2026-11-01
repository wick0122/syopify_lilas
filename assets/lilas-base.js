/* =========================================================
   Lilas 共通の動き
   - スクロールで静かに表示（[data-r]）
   - ヘッダー：ファーストビューを過ぎたら背景をつける／スマホメニュー
   - カート：Shopify の本物のカートに追加する（window.Lilas.addToCart）
   - 容量の切り替え（.size）
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const designMode = !!(window.Shopify && window.Shopify.designMode);

  /* ---------- スクロールで静かに表示 ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -10% 0px' })
    : null;

  function initReveal(root = document) {
    $$('[data-r]', root).forEach((el) => {
      // テーマエディタでは、編集しやすいように最初から表示する
      if (designMode || !io) el.classList.add('shown');
      else io.observe(el);
    });
  }

  /* ---------- ヘッダー ---------- */
  function initHeader() {
    const hd = $('[data-lilas-header]');
    if (!hd) return;
    const transparent = hd.dataset.transparent !== 'false';
    const update = () => hd.classList.toggle('solid', !transparent || scrollY > 60);
    addEventListener('scroll', update, { passive: true });
    update();

    const btn = $('.mbtn', hd);
    if (btn) btn.onclick = () => {
      const open = hd.classList.toggle('menu');
      btn.setAttribute('aria-expanded', open);
    };
    $$('nav a', hd).forEach((a) => a.addEventListener('click', () => hd.classList.remove('menu')));
  }

  /* ---------- お知らせ ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2800);
  }

  /* ---------- カート ---------- */
  function setCount(n) { $$('[data-cart-count]').forEach((el) => { el.textContent = n; }); }

  // items: [{ id: バリエーションID, quantity: 数 }]
  async function addToCart(items, label) {
    const valid = items.filter((it) => it.id);
    if (!valid.length) {
      toast('この商品は、まだ管理画面で設定されていません');
      return false;
    }
    try {
      const res = await fetch(window.LilasRoutes.cartAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || data.message || 'カートに入れられませんでした');
      const cart = await (await fetch(window.LilasRoutes.cart)).json();
      setCount(cart.item_count);
      const skipped = items.length - valid.length;
      toast(`${label}をカートに入れました` + (skipped ? `（未設定の商品${skipped}点を除く）` : ''));
      return true;
    } catch (err) {
      toast(err.message);
      return false;
    }
  }

  // [data-lilas-add] のボタン：data-variant のIDをカートへ
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-lilas-add]');
    if (!btn) return;
    e.preventDefault();
    btn.setAttribute('aria-busy', 'true');
    await addToCart([{ id: Number(btn.dataset.variant) || null, quantity: 1 }], btn.dataset.name || '商品');
    btn.removeAttribute('aria-busy');
  });

  /* ---------- 容量の切り替え ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.size button');
    if (!b) return;
    const group = b.closest('.size');
    const card = b.closest('article');
    $$('button', group).forEach((x) => x.classList.toggle('on', x === b));
    const pv = card && $('.pv', card);
    if (pv) {
      const isPrice = /[¥￥0-9]/.test(b.dataset.p || '') && !/確認/.test(b.dataset.p);
      pv.textContent = b.dataset.p;
      pv.style.fontSize = isPrice ? '' : '13px';
      const sm = pv.parentNode.querySelector('small');
      if (sm) sm.style.display = isPrice ? '' : 'none';
    }
    const add = card && $('[data-lilas-add]', card);
    if (add) {
      add.dataset.variant = b.dataset.variant || '';
      add.dataset.name = `${add.dataset.base || ''} ${b.dataset.s}`.trim();
    }
  });

  /* ---------- 起動 ---------- */
  window.Lilas = { toast, addToCart, initReveal, setCount };
  const start = () => { initReveal(); initHeader(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // テーマエディタでセクションを変更したとき
  document.addEventListener('shopify:section:load', (e) => { initReveal(e.target); initHeader(); });
})();
