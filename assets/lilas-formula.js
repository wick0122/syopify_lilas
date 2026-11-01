/* ===== 肌診断（sections/lilas-formula.liquid） =====
   最初の質問（気になること）→ 刺激を感じやすいか → 乾燥したときの肌、の3問。
   結果は必ず「濃縮ローション」が主役。オイル・セラム・バームは仕上げとして組み合わせる。
   表現は化粧品で言える範囲（うるおい・ハリ・ツヤ・キメ）に合わせています。 */
(() => {
  // 仮の商品データ（管理画面で商品を選ぶと、名前・価格・カートが本物に置き換わる）
  const FALLBACK = {
    aging:     { n: 'エイジングケア',         s: '濃縮ローション ・ 肌にハリを与える', p: 12100 },
    bright:    { n: 'ブライトアップ',         s: '濃縮ローション ・ 肌にツヤを与える', p: 12100 },
    smooth:    { n: 'スムーススキン',         s: '濃縮ローション ・ キメを整える',     p: 10450 },
    sensitive: { n: 'センシティブケア',       s: '濃縮ローション ・ 取り扱い要確認',   p: null },
    oil:       { n: 'ブレンドオイル',         s: 'ローションに加えて、オールインワンに', p: 1320 },
    serum:     { n: 'モイストヴェールセラム', s: '肌の乾燥を防ぐ',                     p: 5060 },
    balm:      { n: 'マルチバーム',           s: '乾きやすいところに',                 p: 4290 },
  };

  const QUESTIONS = [
    { k: 's', t: '化粧品で、刺激を<br>感じやすいですか。', o: [['yes', '感じやすい'], ['no', 'あまり感じない']] },
    { k: 'd', t: '乾燥するとき、<br>肌はどうなりますか。', o: [['water', 'つっぱるのに、テカる'], ['oil', '粉をふく・ガサガサする'], ['none', 'あまり乾燥しない']] },
  ];

  const yen = (n) => '¥' + Number(n).toLocaleString('ja-JP');

  function init(section) {
    if (!section || section.dataset.ready) return;
    section.dataset.ready = '1';

    const dlg = section.querySelector('dialog');
    const body = section.querySelector('[data-body]');
    let data = { freeShipping: 14000, products: {} };
    try { data = JSON.parse(section.querySelector('[data-formula-data]').textContent); } catch (e) { /* 仮データのまま */ }

    // 仮データと、管理画面で選んだ商品をまとめる
    const P = {};
    Object.keys(FALLBACK).forEach((k) => {
      const real = data.products && data.products[k];
      P[k] = real
        ? { n: real.n, s: FALLBACK[k].s, p: Number(real.p), variant: real.variant }
        : { ...FALLBACK[k], variant: null };
    });

    let ans = {};
    let step = 0;

    function renderQuestion() {
      const q = QUESTIONS[step];
      body.innerHTML =
        `<span class="dl">QUESTION ${step + 2} / 3</span><h3>${q.t}</h3>` +
        q.o.map(([v, l]) => `<button type="button" class="choice" data-v="${v}">${l}</button>`).join('') +
        `<button type="button" class="back" data-back>${step ? 'ひとつ戻る' : '閉じる'}</button>`;
      body.querySelectorAll('.choice').forEach((b) => {
        b.onclick = () => { ans[q.k] = b.dataset.v; step++; render(); };
      });
      body.querySelector('[data-back]').onclick = () => { if (step) { step--; render(); } else dlg.close(); };
    }

    function renderResult() {
      const { c, s, d } = ans;
      const items = [];
      let title;
      if (s === 'yes') { items.push('sensitive'); title = 'まずは、やさしく守る。'; }
      else if (c === 'dry') { items.push('aging'); title = 'うるおいで、満たす。'; }
      else { items.push(c); title = { smooth: 'キメを、整える。', bright: 'ツヤを、与える。', aging: 'ハリを、与える。' }[c]; }

      // ブレンドオイル：乾燥の強さで、ローションに加える量の目安を出す
      let amt = '';
      if (d === 'oil') amt = '全量';
      else if (c === 'dry' || d === 'water') amt = '半量〜3分の2';
      if (amt) items.push('oil');
      if (c === 'dry') items.push('serum');
      if (d === 'oil') items.push('balm');

      let total = 0;
      let unknown = false;
      const list = items.map((k) => {
        const x = P[k];
        if (x.p == null || isNaN(x.p)) unknown = true; else total += x.p;
        const extra = k === 'oil' ? `<em class="amt-b">ローションに加える量の目安：<b>${amt}</b></em>` : '';
        return `<li><span>${x.n}<small>${x.s}</small>${extra}</span><i>${x.p == null || isNaN(x.p) ? '—' : yen(x.p)}</i></li>`;
      }).join('');

      const rest = (data.freeShipping || 0) - total;
      const ship = unknown
        ? '価格が未確定の商品があるため、送料はカートで確認してください'
        : rest > 0 ? `あと${yen(rest)}で送料無料` : '送料無料でお届けします';

      body.innerHTML =
        `<div class="rx"><span class="dl">YOUR FORMULA</span><h3>${title}</h3><ul>${list}</ul>` +
        `<div class="sum"><span>合計（税込）${unknown ? ' ・ 価格確認済みのみ' : ''}</span><b>${yen(total)}</b></div>` +
        `<p class="ship">${ship}</p>` +
        `<button type="button" class="addcart wide" data-add-combo>この組み合わせをカートに入れる</button>` +
        `<p class="fine">診断は目安です。肌に合わないときは使用をおやめください。</p></div>`;

      body.querySelector('[data-add-combo]').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.setAttribute('aria-busy', 'true');
        const ok = await window.Lilas.addToCart(items.map((k) => ({ id: P[k].variant, quantity: 1 })), 'おすすめの組み合わせ');
        btn.removeAttribute('aria-busy');
        if (ok) dlg.close();
      };
    }

    function render() { if (step < QUESTIONS.length) renderQuestion(); else renderResult(); }

    section.querySelectorAll('.qopts button').forEach((b) => {
      b.onclick = () => { ans = { c: b.dataset.v }; step = 0; render(); dlg.showModal(); };
    });
    section.querySelector('[data-close]').onclick = () => dlg.close();
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  const start = () => document.querySelectorAll('[data-lilas-formula]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-lilas-formula]').forEach(init));
})();
