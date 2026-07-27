(function(){
  'use strict';
  const build=window.SecondBrainBuild||{cacheVersion:'v96-r1'};
  let deferredPrompt=null;
  const state={registered:false,installed:window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true,updateReady:false,error:''};
  const render=()=>window.SecondBrainApp?.render?.();
  const toast=message=>window.SecondBrainApp?.toast?.(message);
  function announceUpdate(){state.updateReady=true;window.dispatchEvent(new CustomEvent('second-brain-update-ready'));toast('Доступно безопасное обновление. Оно применится только после подтверждения.');render();}
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;render();});
  window.addEventListener('appinstalled',()=>{state.installed=true;deferredPrompt=null;toast('Second Brain OS установлен');render();});
  async function register(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registration=await navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(build.cacheVersion||'v96-r1')}`,{scope:'./',updateViaCache:'none'});
      state.registered=true;
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)announceUpdate();});
      });
      if(registration.waiting&&navigator.serviceWorker.controller)announceUpdate();
      await registration.update().catch(()=>undefined);
    }catch(error){
      state.error=error?.message||String(error);
      console.warn('[PWA V96]',error);
    }
  }
  async function install(){
    if(state.installed){toast('Приложение уже установлено');return;}
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;return;}
    toast(/iphone|ipad|ipod/i.test(navigator.userAgent)?'Safari → Поделиться → На экран «Домой»':'Нажмите значок установки в адресной строке браузера');
  }
  async function applyUpdate(){
    const registration=await navigator.serviceWorker?.getRegistration?.();
    if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return;}
    location.reload();
  }
  navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{
    const key=`sbos-${build.cacheVersion||'v96-r1'}-reloaded`;
    try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1');location.reload();}
    catch(_){location.reload();}
  });
  window.SecondBrainPWA={install,applyUpdate,getStatus:()=>({...state,canPrompt:Boolean(deferredPrompt)})};
  window.addEventListener('load',async()=>{await register();setTimeout(()=>window.SecondBrainCloud?.init?.(),250);});
})();
