/* Lilas × Shopify カート連携
   製品ページの「カートに入れる」を、カスタマイズ画面で選んだShopifyの商品につなぎます。 */
(()=>{
  const C=window.LX_CART;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const go=items=>fetch((window.Shopify&&Shopify.routes?Shopify.routes.root:"/")+"cart/add.js",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({items})})
    .then(r=>r.ok?r.json():r.json().then(e=>Promise.reject(e)))
    .then(()=>{location.href="/cart"})
    .catch(e=>alert((e&&e.description)||"カートに追加できませんでした。時間をおいてお試しください。"));
  if(C&&C.variants&&C.variants.length){
    const pick=()=>{const b=$(".szsel button.on");const s=b&&(b.dataset.s||b.textContent||"").trim();
      let v=s&&C.variants.find(x=>x.title.replace(/\s/g,"").toLowerCase().includes(s.replace(/\s/g,"").toLowerCase()));
      return v||C.variants.find(x=>x.available)||C.variants[0]};
    const buy=e=>{e&&e.preventDefault();e&&e.stopImmediatePropagation();
      const q=Math.max(1,parseInt(($("#qty")||{}).textContent,10)||1);
      const items=[{id:pick().id,quantity:q}];
      const oil=$("#optOil"),gift=$("#optGift");
      if(C.oil&&oil&&oil.checked)items.push({id:C.oil,quantity:1});
      if(C.gift&&gift&&gift.checked)items.push({id:C.gift,quantity:1});
      go(items)};
    ["#buyBtn","#sbarBtn"].forEach(s=>{const b=$(s);if(b){b.onclick=null;b.addEventListener("click",buy,true)}});
  }
  /* 「一緒に使う」などのカードのカートボタン:その製品のページへ */
  $$(".addcart[data-name]").forEach(b=>{const a=b.closest("article,li,.card,div")&&b.closest("article,li,.card,div").querySelector("a[href^='/pages/']");
    if(!a)return;b.onclick=null;b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();location.href=a.getAttribute("href")},true)});
})();
