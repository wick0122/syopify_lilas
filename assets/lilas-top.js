/* Lilas トップページ(案C)の動き。lilas-best-C-mix.html から書き出し */
window.LilasTop = window.LilasTop || {};
LilasTop.asset = n => (LilasTop.base || '') + n;
(() => {
// ===== 共通の動き(両案) =====
document.documentElement.classList.add("js");
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// スクロールで静かに表示
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("shown");io.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});
$$("[data-r]").forEach(el=>io.observe(el));
// ファーストビュー:マウスに合わせて四角がわずかに動く
const fvEl=$(".fv");
if(fvEl&&matchMedia("(hover:hover)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches){
  fvEl.addEventListener("mousemove",e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
    $$(".fv .b").forEach((b,i)=>{const k=(i%3+1)*6;b.style.transform=`translate(${-x*k}px,${-y*k}px)`})});
}
// ヘッダー:ファーストビューを過ぎたら背景をつける
const hd=$("header.site");
if(hd){const f=()=>hd.classList.toggle("solid",scrollY>60);addEventListener("scroll",f,{passive:true});f();
  const mb=$(".mbtn");if(mb)mb.onclick=()=>hd.classList.toggle("menu");
  $$("header.site nav a").forEach(a=>a.addEventListener("click",()=>hd.classList.remove("menu")));}

// ===== セラムの容量切り替え =====
$$(".size").forEach(g=>{const card=g.closest("article");g.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
  g.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
  const pv=card.querySelector(".pv");if(pv){pv.textContent=b.dataset.p;const sm=pv.parentNode.querySelector("small");if(sm)sm.style.display=b.dataset.p.startsWith("¥")?"":"none";pv.style.fontSize=b.dataset.p.startsWith("¥")?"":"13px"}
  const ad=card.querySelector(".addcart");if(ad)ad.dataset.name="モイストヴェールセラム "+b.dataset.s}))});

// ===== 肌タイプチェック =====
// 表現は化粧品で言える範囲(うるおい・ハリ・ツヤ・キメ)に合わせています
// ローションは質問1(悩み)と質問2(刺激)、肌タイプとオイルの量は質問3(30分後の肌)で決める
const P={aging:{n:"エイジングケア",s:"濃縮ローション ・ 肌にハリを与える",p:12100},bright:{n:"ブライトアップ",s:"濃縮ローション ・ 肌にツヤを与える",p:12100},smooth:{n:"スムーススキン",s:"濃縮ローション ・ キメを整える",p:10450,wait:true},sensitive:{n:"センシティブケア",s:"濃縮ローション ・ 予約販売(12月5日発送)",p:"¥5,060〜"},oil:{n:"ブレンドオイル",s:"ローションに加えて、よりしっとりと",p:1320},balm:{n:"マルチバーム",s:"お好みで ・ 乾きやすいところに",p:4290}};
const Q=[{k:"s",t:"化粧品を使ったとき、<br>赤みやヒリヒリ感、肌荒れを<br>感じやすいですか？",o:[["often","よく感じる"],["once","過去に1〜2回、感じたことがある"],["yuragi","時おり、揺らぎや敏感さを感じる"],["no","とくに気にならない"]]},{k:"d",t:"いつものスキンケアから<br>30分以上たったとき、<br>肌の感触は？",o:[["mochi","もっちり吸いつく"],["sara","さらっとしている"],["teka","つっぱるのにテカる"],["kona","粉をふく・ガサガサする"],["mix","Tゾーンはテカる、頬は乾く"]]}];
const TT={mochi:{n:"バランスの整った肌",v:[1,1,1]},sara:{n:"乾燥肌タイプ（軽め）",v:[.7,.7,.7]},teka:{n:"脂性肌タイプ",v:[.42,.48,.95]},kona:{n:"乾燥肌タイプ",v:[.55,.55,.55]},mix:{n:"混合肌タイプ",v:[.5,.55,.8],v2:[.6,.6,.45]},sens:{n:"敏感肌タイプ",v:[.34,.34,.34]}};
const OIL={std:{mochi:{s:["ローションのみで、もっちり吸いつくまで重ねづけ"],a:""},sara:{s:["まずはローションを3回重ねづけ","もっちり吸いつかなければ、オイルを3分の1から"],a:"3分の1から、吸いつくまで"},teka:{s:["まずはローションを3回重ねづけ","しっとり感がほしくなったら、オイルを3分の1から"],a:"数日はローションのみ。その後3分の1から"},kona:{s:["まずはローションを3回重ねづけ","吸いつかなければ、オイルを半量から全量まで"],a:"半量から全量まで"},mix:{s:["オイルを3分の1ほど加える","テカる部位は2回、乾く部分は3回重ねづけ"],a:"3分の1ほど。半量〜全量に加減"}},
 sens:{mochi:{s:["ローションにオイルを少量加え、重ねづけ"],a:"少量から、必要に応じて"},sara:{s:["最初からオイルを3分の1加える","もっちり吸いつくまで、少しずつ増やす"],a:"3分の1から、吸いつくまで"},teka:{s:["最初からオイルを3分の1加える","もっちり吸いつくまで、少しずつ増やす"],a:"3分の1から、吸いつくまで"},kona:{s:["最初からオイルを半量加える","様子を見て、全量まで増やす"],a:"半量から全量まで"},mix:{s:["オイルを3分の1ほど加える","テカる部位は2回、乾く部分は3回重ねづけ"],a:"3分の1ほど。半量〜全量に加減"}}};
function triSvg(v,v2){const cx=100,cy=112,R=78,ang=[-90,150,30].map(a=>a*Math.PI/180),pt=(r,i)=>[cx+r*R*Math.cos(ang[i]),cy+r*R*Math.sin(ang[i])],poly=a=>a.map((r,i)=>pt(r,i).map(n=>n.toFixed(1)).join(",")).join(" ");
 let s=`<svg viewBox="0 0 200 204" role="img" aria-label="水分・水分保持力・保護力のバランス"><polygon points="${poly([1,1,1])}" fill="rgba(255,255,255,.5)" stroke="#fff" stroke-width="2.5"/>`;
 [0,1,2].forEach(i=>{const p=pt(1,i);s+=`<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#fff" stroke-width="1.2"/>`});
 if(v2)s+=`<polygon points="${poly(v2)}" fill="none" stroke="#9AA3D0" stroke-width="1.2" stroke-dasharray="3 3"/>`;
 s+=`<polygon points="${poly(v)}" fill="rgba(182,190,228,.62)" stroke="#9AA3D0" stroke-width="1.3"/>`;
 [["水分",100,22,"middle"],["水分保持力",18,200,"start"],["保護力",182,200,"end"]].forEach(([t,x,y,a])=>s+=`<text x="${x}" y="${y}" text-anchor="${a}" font-size="11" fill="#585856" font-family="Shippori Mincho,serif">${t}</text>`);
 return s+"</svg>"}
const yen=n=>"¥"+n.toLocaleString("ja-JP");
const dlg=$("#dlg"),body=$("#dlgBody");let ans={},st=0;
function render(){
  if(st<2){const q=Q[st];body.innerHTML=`<span class="dl">QUESTION ${st+2} / 3</span><h3>${q.t}</h3>${q.o.map(([v,l])=>`<button class="choice" data-v="${v}">${l}</button>`).join("")}<button class="back" id="bk">${st?"ひとつ戻る":"閉じる"}</button>`;
    body.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{ans[q.k]=b.dataset.v;st++;render()});$("#bk").onclick=()=>{if(st){st--;render()}else dlg.close()};return;}
  const {c,s,d}=ans;const sens=s!=="no";let lot=[],title;
  if(sens){lot=["sensitive"];title="まずは、やさしく守る。"}
  else if(c==="dry"){lot=["aging"];title="うるおいで、満たす。"}
  else if(c==="smooth"){lot=["smooth","bright"];title="キメを、整える。"}   // スムーススキンが再入荷待ちの間は、ブライトアップも並べる
  else if(c==="bright"){lot=["bright"];title="ツヤを、与える。"}
  else{lot=["aging"];title="ハリを、与える。"}
  const tt=sens?TT.sens:TT[d];const o=OIL[sens?"sens":"std"][d];
  let it=[...lot];if(o.a)it.push("oil");
  const balm=sens||d==="kona"||d==="mix"||c==="aging";if(balm)it.push("balm");
  const li=it.map(k=>{const x=P[k];const extra=k==="oil"?`<em class="amt-b">ローションに加える量の目安:<b>${o.a}</b></em>`:"";const w=x.wait?`<span class="wt">再入荷待ち</span>`:"";return `<li><span>${x.n}${w}<small>${x.s}</small>${extra}</span><i>${typeof x.p==="string"?x.p:yen(x.p)}</i></li>`}).join("");
  const steps=o.s.map(t=>`<li>${t}</li>`).join("");
  const notes=[];if(sens)notes.push("センシティブケアから始めて、3か月ほどで問題がなければ、ほかの種類に移ることもできます。");
  if(d==="mix")notes.push("Uゾーンはオイル多めが合う方が多いです。1種はそのまま顔全体に、もう1種はオイルを加えて乾く部分に、という2本使いもおすすめです。");
  body.innerHTML=`<div class="rx"><span class="dl">YOUR SKIN TYPE</span><div class="rx-hd"><div class="rx-tri">${triSvg(tt.v,tt.v2)}</div><div><p class="rx-type">${tt.n}</p><h3>${title}</h3></div></div>
   <p class="rx-h">使い方</p><ol class="rx-steps">${steps}</ol>${notes.map(n=>`<p class="rx-note">${n}</p>`).join("")}
   <p class="rx-h">おすすめ</p><ul>${li}</ul><button class="addcart wide" id="toLineup">おすすめを製品一覧で見る</button><p class="fine">チェック結果は目安です。肌に合わないときは使用をおやめください。${it.includes("aging")?"<br>※エイジングケア:年齢に応じたうるおいケアのこと":""}</p></div>`;
  body.querySelector("#toLineup").onclick=()=>{dlg.close();const c=document.getElementById("collection");if(c)c.scrollIntoView({behavior:"smooth"})};
}
$$(".qopts button").forEach(b=>b.onclick=()=>{ans={c:b.dataset.v};st=0;render();dlg.showModal()});
$("#dlgClose").onclick=()=>dlg.close();
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});

// LOGOHIDE: ロゴは動画の時間に合わせて表示を変える(ループのたびに同じ動き)
// 0〜1.0秒:表示 → 1.0〜2.5秒:ゆっくり消えて、2.5秒ちょうどで完全に消える → 終わり0.55秒で木漏れ日に戻りながら現れる
(()=>{const fv=document.querySelector(".fv.video"),v=fv&&fv.querySelector("video");if(!v)return;
 const sp=[...fv.querySelectorAll(".big span")];const FS=1.0,FE=2.5,IN=0.55;
 const ease=x=>.5-.5*Math.cos(Math.PI*x); // なめらかに始まり、なめらかに終わる
 const tick=()=>{let o=1;const t=v.currentTime,d=v.duration||0;
  if(!v.paused&&d){if(t>=FS&&t<FE)o=1-ease((t-FS)/(FE-FS));else if(t>=FE&&t<d-IN)o=0;else if(t>=d-IN)o=ease((t-(d-IN))/IN)}
  sp.forEach(s=>{s.style.opacity=o;s.style.filter=o<1?`blur(${(1-o)*6}px)`:""});requestAnimationFrame(tick)};requestAnimationFrame(tick)})();

// 声:写真とカードを切り替え
(()=>{const t=document.getElementById("vtTrack");if(!t)return;const cs=[...t.children],cnt=document.getElementById("vtCount");
const step=()=>cs[0].getBoundingClientRect().width+parseFloat(getComputedStyle(t).columnGap||0);
const upd=()=>{const i=Math.round(t.scrollLeft/step());cnt.textContent=(Math.min(i,cs.length-1)+1)+" / "+cs.length};
const pv=()=>t.scrollBy({left:-step(),behavior:"smooth"});document.getElementById("vcPrev").onclick=pv;document.querySelector(".vt-prev").onclick=pv;
const nx=()=>{if(t.scrollLeft+t.clientWidth>=t.scrollWidth-4)t.scrollTo({left:0,behavior:"smooth"});else t.scrollBy({left:step(),behavior:"smooth"})};document.getElementById("vcNext").onclick=nx;document.querySelector(".vt-next").onclick=nx;
t.addEventListener("scroll",upd,{passive:true})})();

// 動画:動きを減らす設定の人には止めた状態で表示
const bgv=document.querySelector(".fv.video video");
if(bgv){if(matchMedia("(prefers-reduced-motion:reduce)").matches){bgv.removeAttribute("autoplay");bgv.pause()}
 const vb=document.querySelector(".vctl");if(vb)vb.onclick=()=>{if(bgv.paused){bgv.play();vb.textContent="Pause"}else{bgv.pause();vb.textContent="Play"}}}

})();
(()=>{const IM={s100:window.LilasTop.asset("lilas-t-01-1e523f.jpg"),s50:window.LilasTop.asset("lilas-t-02-9c6b7e.jpg")};document.querySelectorAll(".sens-size button").forEach(b=>b.addEventListener("click",()=>{const c=b.closest("article");c.querySelector(".ph img").src=IM[b.dataset.img];const ad=c.querySelector(".addcart");if(ad)delete ad.dataset.name}));document.querySelectorAll(".size button[data-note]").forEach(b=>b.addEventListener("click",()=>{const n=b.closest("article").querySelector(".sznote");if(n)n.textContent=b.dataset.note}))})();
/* テーマエディタでは最初から表示する */
if (window.Shopify && Shopify.designMode) {
  const showAll = () => document.querySelectorAll('[data-r]').forEach(e => e.classList.add('shown'));
  showAll(); document.addEventListener('shopify:section:load', showAll);
}
