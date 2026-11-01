/* Lilas ブランドの歩みページの動き */
(()=>{
document.documentElement.classList.add("js");
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("shown");io.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});
document.querySelectorAll("[data-r]").forEach(el=>io.observe(el));

})();
(()=>{const h=document.querySelector("header.site"),b=h&&h.querySelector(".mbtn");if(!b)return;b.addEventListener("click",()=>h.classList.toggle("menu"));h.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>h.classList.remove("menu")))})();
/* 動画:読み込んだら再生 */
document.querySelectorAll("video").forEach(v=>{v.muted=true;const p=v.play();if(p&&p.catch)p.catch(()=>{})});
if (window.Shopify && Shopify.designMode) document.querySelectorAll('[data-r]').forEach(e => e.classList.add('shown'));
