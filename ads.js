/* ===== ads: AdSense-ready slots (placeholders until a publisher ID is set) ===== */
const ad=slot=>{const c=DB.cfg;if(!c.ads.on||!c.ads[slot])return'';
return`<div class="mt-6 mb-2"><p class="text-center text-[10px] mu tracking-widest">ADVERTISEMENT</p>${c.pub?`<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(c.pub)}" data-ad-slot="${esc(c.slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`:`<div class="ad">Responsive ad slot · ${slot}</div>`}</div>`};
const adsInit=()=>{const c=DB.cfg;if(!c.pub)return;if(!document.getElementById('ags')){const s=document.createElement('script');s.id='ags';s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(c.pub);document.head.appendChild(s)}
document.querySelectorAll('ins.adsbygoogle:not([data-done])').forEach(i=>{i.dataset.done=1;try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}})};

