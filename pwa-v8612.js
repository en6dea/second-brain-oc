(function(){
  'use strict';
  let deferredPrompt=null;
  const state={registered:false,installed:window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true,updateReady:false};
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;window.SecondBrainApp?.render?.();});
  window.addEventListener('appinstalled',()=>{state.installed=true;deferredPrompt=null;window.SecondBrainApp?.toast?.('Second Brain OS установлен');window.SecondBrainApp?.render?.();});
  async function register(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registration=await navigator.serviceWorker.register('./sw.js?v=v8612-r1',{scope:'./',updateViaCache:'none'});
      state.registered=true;
      registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){state.updateReady=true;window.SecondBrainApp?.toast?.('Доступно обновление интерфейса');}});});
      await registration.update().catch(()=>undefined);
    }catch(error){console.warn('[PWA]',error);}
  }
  async function install(){
    if(state.installed){window.SecondBrainApp?.toast?.('Приложение уже установлено');return;}
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;return;}
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    window.SecondBrainApp?.toast?.(ios?'Safari → Поделиться → На экран Домой':'Нажмите значок установки в адресной строке браузера');
  }
  async function applyUpdate(){const registration=await navigator.serviceWorker?.getRegistration?.();registration?.waiting?.postMessage({type:'SKIP_WAITING'});location.reload();}
  window.SecondBrainPWA={install,applyUpdate,getStatus:()=>({...state,canPrompt:Boolean(deferredPrompt)})};
  window.addEventListener('load',async()=>{await register();setTimeout(()=>window.SecondBrainCloud?.init?.(),250);});
})();
