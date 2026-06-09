// Relay ?id= da URL para o iframe do mapa (QR code das placas)
(function(){
  var id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;
  var done = false;

  function inject(el) {
    if (done || !el || el.tagName !== 'IFRAME') return;
    var src = el.getAttribute('src') || '';
    if (!src) return;
    // Alvo: iframe do mapa Florescer (github.io ou mapa-lotes)
    if (src.indexOf('github.io/site-florescer') === -1 && src.indexOf('mapa-lotes') === -1) return;
    if (src.indexOf('id=') !== -1) return;
    done = true;
    el.src = src + (src.indexOf('?') !== -1 ? '&' : '?') + 'id=' + encodeURIComponent(id);
  }

  // Verifica iframes já presentes
  [].forEach.call(document.querySelectorAll('iframe'), inject);

  // MutationObserver: captura o iframe assim que o Webflow o adicionar ao DOM
  if (!done) {
    var obs = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        [].forEach.call(m.addedNodes, function(n) {
          if (!n || n.nodeType !== 1) return;
          if (n.tagName === 'IFRAME') inject(n);
          if (n.querySelectorAll) [].forEach.call(n.querySelectorAll('iframe'), inject);
        });
      });
      if (done) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function(){ obs.disconnect(); }, 15000);
  }

  // Fallback: postMessage para iframe já carregado
  window.addEventListener('load', function() {
    [].forEach.call(document.querySelectorAll('iframe'), function(f) {
      if (f.contentWindow) f.contentWindow.postMessage({ focusLot: id }, '*');
    });
    setTimeout(function() {
      [].forEach.call(document.querySelectorAll('iframe'), function(f) {
        if (f.contentWindow) f.contentWindow.postMessage({ focusLot: id }, '*');
      });
    }, 1500);
  });
}());

(function(){
  if(location.pathname.indexOf('ponzoni-industrial-vendas')!==-1)return;
  var GS='https://script.google.com/macros/s/AKfycbzouicNR8FGPRX9rw_SPN0lGr2qKKtg4QcBCZPlk8ivEp0IvezzRsVr0mo9tr5SE1iQfA/exec';
  var SK='flx_v6',EX=864e5,shown=false;

  var h='<div id="flx-ov" style="display:none;position:fixed;inset:0;background:rgba(26,15,26,.78);z-index:99999;align-items:center;justify-content:center;padding:1rem"><div style="background:#e4ddce;border-radius:16px;padding:2rem;max-width:440px;width:100%;position:relative;box-shadow:0 8px 40px rgba(0,0,0,.3)"><button id="flx-cl" style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#573259">\xd7</button><p style="background:#573259;color:#e4ddce;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.2rem .6rem;border-radius:99px;display:inline-block;margin-bottom:.5rem">Condi\xe7\xe3o especial</p><h2 style="font-size:1.4rem;color:#1a0f1a;margin:0 0 .5rem">Antes de ir, garanta seu lote no Florescer!</h2><p style="color:#666;font-size:.9rem;margin:0 0 1rem">Preencha seus dados e um consultor entrar\xe1 em contato com uma proposta exclusiva.</p><form id="flx-fm" style="display:flex;flex-direction:column;gap:.5rem"><input name="nome" placeholder="Nome completo" required style="padding:.65rem;border:1.5px solid #c5b99e;border-radius:8px;font-size:.95rem;font-family:inherit"><input name="wpp" type="tel" placeholder="WhatsApp (com DDD)" required style="padding:.65rem;border:1.5px solid #c5b99e;border-radius:8px;font-size:.95rem;font-family:inherit"><input name="email" type="email" placeholder="E-mail (opcional)" style="padding:.65rem;border:1.5px solid #c5b99e;border-radius:8px;font-size:.95rem;font-family:inherit"><button type="submit" style="padding:.75rem;background:#573259;color:#e4ddce;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit">Quero receber uma proposta</button></form><p id="flx-tk" style="display:none;text-align:center;color:#573259;font-weight:600;margin-top:.5rem">Obrigado! Em breve entraremos em contato.</p></div></div>';
  document.body.insertAdjacentHTML('beforeend',h);

  function ok(){try{var d=localStorage.getItem(SK);return!d||(Date.now()-+d)>EX;}catch(e){return true;}}
  function show(){if(shown||!ok())return;shown=true;try{localStorage.setItem(SK,''+Date.now());}catch(e){}var o=document.getElementById('flx-ov');if(o){o.style.display='flex';document.body.style.overflow='hidden';}}
  function hide(){var o=document.getElementById('flx-ov');if(o)o.style.display='none';document.body.style.overflow='';}
  function init(){
    var ov=document.getElementById('flx-ov'),cb=document.getElementById('flx-cl'),fm=document.getElementById('flx-fm'),tk=document.getElementById('flx-tk');
    if(cb)cb.onclick=hide;
    if(ov)ov.onclick=function(e){if(e.target===ov)hide();};
    if(fm)fm.onsubmit=function(e){
      e.preventDefault();
      var n=fm.querySelector('[name=nome]').value,w=fm.querySelector('[name=wpp]').value,em=fm.querySelector('[name=email]').value;
      try{
        var ifr=document.createElement('iframe');
        ifr.style.cssText='display:none;width:0;height:0;border:0';
        ifr.name='_flx_gs';
        document.body.appendChild(ifr);
        var frm=document.createElement('form');
        frm.method='GET';frm.action=GS;frm.target='_flx_gs';
        var params={nome:n,wpp:w,email:em,origem:'Exit Intent'};
        for(var k in params){var inp=document.createElement('input');inp.type='hidden';inp.name=k;inp.value=params[k];frm.appendChild(inp);}
        document.body.appendChild(frm);
        frm.submit();
      }catch(er){new Image().src=GS+'?nome='+encodeURIComponent(n)+'&wpp='+encodeURIComponent(w)+'&email='+encodeURIComponent(em)+'&origem=Exit%20Intent';}
      fm.style.display='none';
      if(tk)tk.style.display='block';
      setTimeout(function(){
        window.open('https://wa.me/5554996098638?text='+encodeURIComponent('Ol\xe1! Meu nome \xe9 '+n+' e tenho interesse no Florescer. Contato: '+w),'_blank');
        hide();
      },2000);
    };
  }
  document.addEventListener('mouseout',function(e){var t=e.relatedTarget||e.toElement;if(!t||t.nodeName==='HTML')show();});
  setTimeout(show,15000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}());
