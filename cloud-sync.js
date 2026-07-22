(function(){
  'use strict';
  const DEVICE_KEY='secondBrainOS.deviceId';
  const deviceId=localStorage.getItem(DEVICE_KEY)||('dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36));
  localStorage.setItem(DEVICE_KEY,deviceId);
  let auth=null,db=null,pushTimer=null,remoteUnsubscribe=null,applyingRemote=false;
  const cloudState={configured:false,ready:false,user:null,status:'Облако не настроено',lastSync:localStorage.getItem('secondBrainOS.lastSync')||'',lastError:''};
  function hasConfig(){const cfg=window.SECOND_BRAIN_FIREBASE_CONFIG||{};return Boolean(cfg.apiKey&&cfg.projectId&&!String(cfg.apiKey).includes('PASTE')&&!String(cfg.projectId).includes('PASTE'));}
  function setStatus(status,error=''){cloudState.status=status;cloudState.lastError=error;window.SecondBrainApp?.render?.();}
  function humanError(error){const code=String(error?.code||'');const map={'auth/email-already-in-use':'Такой email уже зарегистрирован.','auth/invalid-email':'Некорректный email.','auth/weak-password':'Пароль должен содержать минимум 6 символов.','auth/user-not-found':'Пользователь не найден.','auth/wrong-password':'Неверный пароль.','permission-denied':'Проверьте Firestore Rules.','unavailable':'Нет соединения с Firebase.'};return map[code]||code||error?.message||'Неизвестная ошибка';}
  function docRef(){return db&&cloudState.user?db.collection('users').doc(cloudState.user.uid).collection('sync').doc('app'):null;}
  async function init(){
    if(cloudState.ready)return;
    cloudState.configured=hasConfig();
    if(!cloudState.configured){setStatus('Нужен firebase-config.js');return;}
    if(!window.firebase){setStatus('Firebase SDK не загрузился');return;}
    try{
      if(!firebase.apps.length)firebase.initializeApp(window.SECOND_BRAIN_FIREBASE_CONFIG);
      auth=firebase.auth();db=firebase.firestore();cloudState.ready=true;setStatus('Готово к входу');
      auth.onAuthStateChanged(async user=>{
        cloudState.user=user?{uid:user.uid,email:user.email}:null;
        if(remoteUnsubscribe){remoteUnsubscribe();remoteUnsubscribe=null;}
        if(!user){setStatus('Не выполнен вход');return;}
        setStatus('Синхронизация активна');
        await pullIfCloudNewer();
        remoteUnsubscribe=docRef().onSnapshot(snapshot=>{
          if(!snapshot.exists||applyingRemote)return;
          const remote=snapshot.data();
          if(remote.deviceId===deviceId||!remote.state)return;
          const local=window.SecondBrainApp?.getState?.()||{};
          const remoteTime=String(remote.updatedAtLocal||''),localTime=String(local?.settings?.v78?.updatedAt||local?.meta?.updatedAtLocal||'');
          if(remoteTime&&remoteTime>localTime){applyingRemote=true;try{window.SecondBrainApp?.setStateFromCloud?.(remote.state);cloudState.lastSync=remoteTime;localStorage.setItem('secondBrainOS.lastSync',remoteTime);setStatus('Получены изменения с другого устройства');}finally{applyingRemote=false;}}
        },error=>setStatus('Ошибка фоновой синхронизации',humanError(error)));
      });
    }catch(error){console.error(error);setStatus('Ошибка инициализации облака',humanError(error));}
  }
  function schedulePush(data){if(!cloudState.ready||!cloudState.user||applyingRemote)return;clearTimeout(pushTimer);pushTimer=setTimeout(()=>pushNow(data,true),1200);}
  async function pushNow(data,silent=false){
    try{
      if(!cloudState.ready||!cloudState.user){setStatus('Сначала войдите в облако');return;}
      const payload=JSON.parse(JSON.stringify(data||window.SecondBrainApp?.getState?.()||{}));
      payload.settings=payload.settings||{};payload.settings.v78=payload.settings.v78||{};payload.settings.v78.updatedAt=new Date().toISOString();
      await docRef().set({state:payload,updatedAtLocal:payload.settings.v78.updatedAt,deviceId,appVersion:'v86.12',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      cloudState.lastSync=payload.settings.v78.updatedAt;localStorage.setItem('secondBrainOS.lastSync',cloudState.lastSync);setStatus('Синхронизация активна');if(!silent)window.SecondBrainApp?.toast?.('☁️ Данные отправлены в облако');
    }catch(error){console.error(error);setStatus('Не удалось отправить данные',humanError(error));}
  }
  async function pullNow(){
    try{
      if(!cloudState.ready||!cloudState.user){setStatus('Сначала войдите в облако');return;}
      const snapshot=await docRef().get();if(!snapshot.exists){setStatus('В облаке пока нет данных');return;}
      const remote=snapshot.data();if(!remote?.state){setStatus('В облаке нет данных приложения');return;}
      applyingRemote=true;window.SecondBrainApp?.setStateFromCloud?.(remote.state);cloudState.lastSync=remote.updatedAtLocal||new Date().toISOString();localStorage.setItem('secondBrainOS.lastSync',cloudState.lastSync);setStatus('Загружено из облака');window.SecondBrainApp?.toast?.('☁️ Данные загружены');
    }catch(error){console.error(error);setStatus('Не удалось загрузить данные',humanError(error));}finally{applyingRemote=false;}
  }
  async function pullIfCloudNewer(){
    const snapshot=await docRef().get();
    if(!snapshot.exists){await pushNow(window.SecondBrainApp?.getState?.(),true);return;}
    const remote=snapshot.data(),local=window.SecondBrainApp?.getState?.()||{},remoteTime=String(remote?.updatedAtLocal||''),localTime=String(local?.settings?.v78?.updatedAt||local?.meta?.updatedAtLocal||'');
    if(remote?.state&&remoteTime>localTime&&remote.deviceId!==deviceId){applyingRemote=true;try{window.SecondBrainApp?.setStateFromCloud?.(remote.state);cloudState.lastSync=remoteTime;localStorage.setItem('secondBrainOS.lastSync',remoteTime);}finally{applyingRemote=false;}}
    else if(localTime>remoteTime)await pushNow(local,true);
  }
  async function register(email,password){try{if(!cloudState.ready)return setStatus('Сначала настройте Firebase');await auth.createUserWithEmailAndPassword(email,password);await pushNow(window.SecondBrainApp?.getState?.(),false);}catch(error){setStatus('Не удалось создать аккаунт',humanError(error));}}
  async function login(email,password){try{if(!cloudState.ready)return setStatus('Сначала настройте Firebase');await auth.signInWithEmailAndPassword(email,password);window.SecondBrainApp?.toast?.('Вход выполнен');}catch(error){setStatus('Не удалось войти',humanError(error));}}
  async function logout(){try{if(auth)await auth.signOut();cloudState.user=null;setStatus('Вы вышли из облака');}catch(error){setStatus('Не удалось выйти',humanError(error));}}
  window.SecondBrainCloud={init,getStatus:()=>({...cloudState}),register,login,logout,pushNow,pullNow,schedulePush,refreshStatus:()=>setStatus(cloudState.user?'Синхронизация активна':hasConfig()?'Готово к входу':'Нужен firebase-config.js')};
})();
