// ===== Firebase 即時同步 =====
// 使用 Firebase Realtime Database 讓多台裝置共用資料

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyACV9lvcVKHa8q_Lmdzyg-U1SzmlsGz9Uo",
  authDomain: "erp-app-90278.firebaseapp.com",
  databaseURL: "https://erp-app-90278-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "erp-app-90278",
  storageBucket: "erp-app-90278.firebasestorage.app",
  messagingSenderId: "58148662994",
  appId: "1:58148662994:web:c19221105ba36b0b45470b"
};

// ── Firebase SDK（CDN 載入）──
// 使用 compat 版本，不需要 import/export
let _db = null;
let _fbReady = false;
let _syncEnabled = false;
let _lastSyncTime = 0;

// 同步狀態 UI
function setSyncStatus(status, msg){
  const el = document.getElementById('sync-status');
  if(!el) return;
  const configs = {
    ok:      { color:'#1D9E75', icon:'ti-cloud-check',    text: msg||'已同步' },
    syncing: { color:'#BA7517', icon:'ti-cloud-upload',   text: msg||'同步中...' },
    offline: { color:'#6B6B68', icon:'ti-cloud-off',      text: msg||'離線模式' },
    error:   { color:'#E24B4A', icon:'ti-cloud-x',        text: msg||'同步失敗' },
  };
  const c = configs[status] || configs.offline;
  el.innerHTML = `<i class="ti ${c.icon}" style="color:${c.color};font-size:16px;"></i>
    <span style="font-size:11px;color:${c.color};">${c.text}</span>`;
}

// ── 初始化 Firebase ──
function initFirebase(){
  try {
    if(typeof firebase === 'undefined'){
      console.warn('Firebase SDK 尚未載入');
      setSyncStatus('offline', '離線模式');
      return;
    }
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    _db = firebase.database();
    _fbReady = true;
    _syncEnabled = true;
    setSyncStatus('ok', '已連線');
    console.log('✅ Firebase 已連線');

    // 監聽連線狀態
    _db.ref('.info/connected').on('value', snap => {
      if(snap.val()){
        setSyncStatus('ok', '已連線');
        // 重新連線時從雲端拉取最新資料
        pullFromFirebase();
      } else {
        setSyncStatus('offline', '離線中');
      }
    });

    // 初次載入：從 Firebase 拉取資料
    pullFromFirebase();

  } catch(err){
    console.error('Firebase 初始化失敗:', err);
    setSyncStatus('error', '連線失敗');
  }
}

// ── 從 Firebase 拉取資料（覆蓋本機）──
function pullFromFirebase(){
  if(!_fbReady || !_db) return;
  setSyncStatus('syncing', '載入中...');

  _db.ref('erp').once('value').then(snap => {
    const data = snap.val();
    if(!data){ setSyncStatus('ok', '已連線（空白）'); return; }

    // 更新本機資料
    if(data.inventory)  { inventory = data.inventory;  saveInventory(); }
    if(data.logs)       { logs = data.logs;             saveLogs(); }
    if(data.customers)  { customers = data.customers;   saveCustomers(); }
    if(data.estimates)  { estimates = data.estimates;   saveEstimates(); }
    if(data.productionOrders){ productionOrders = data.productionOrders; saveProdOrders(); }
    if(data.events)     { events = data.events;         saveEvents(); }

    // 重新渲染頁面
    renderHome();
    renderFinished();
    renderMaterials();
    renderLogs();
    if(typeof renderEstimateList==='function') renderEstimateList('all');
    if(typeof renderCustomerList==='function') renderCustomerList('');

    setSyncStatus('ok', '已同步 ' + new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));
    _lastSyncTime = Date.now();
    console.log('✅ 從 Firebase 載入完成');

  }).catch(err => {
    console.error('Firebase 讀取失敗:', err);
    setSyncStatus('error', '讀取失敗');
  });
}

// ── 推送資料到 Firebase ──
function pushToFirebase(key, data){
  if(!_fbReady || !_db || !_syncEnabled) return;
  setSyncStatus('syncing');
  _db.ref('erp/' + key).set(data).then(()=>{
    setSyncStatus('ok', '已同步 ' + new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));
  }).catch(err=>{
    console.error('Firebase 寫入失敗:', err);
    setSyncStatus('error', '同步失敗');
  });
}

// ── 覆寫本機儲存函式，同步到 Firebase ──
function hookLocalStorage(){
  // 保存原始函式
  const _origSaveInventory = window.saveInventory;
  const _origSaveLogs      = window.saveLogs;
  const _origSaveCustomers = window.saveCustomers;
  const _origSaveEstimates = window.saveEstimates;
  const _origSaveProdOrders= window.saveProdOrders;
  const _origSaveEvents    = window.saveEvents;

  window.saveInventory = function(){
    if(_origSaveInventory) _origSaveInventory();
    pushToFirebase('inventory', inventory);
  };
  window.saveLogs = function(){
    if(_origSaveLogs) _origSaveLogs();
    pushToFirebase('logs', logs);
  };
  window.saveCustomers = function(){
    if(_origSaveCustomers) _origSaveCustomers();
    pushToFirebase('customers', customers);
  };
  window.saveEstimates = function(){
    if(_origSaveEstimates) _origSaveEstimates();
    pushToFirebase('estimates', estimates);
  };
  window.saveProdOrders = function(){
    if(_origSaveProdOrders) _origSaveProdOrders();
    pushToFirebase('productionOrders', productionOrders);
  };
  window.saveEvents = function(){
    if(_origSaveEvents) _origSaveEvents();
    pushToFirebase('events', events);
  };
}

// ── 監聽 Firebase 即時變更（其他裝置更新時自動同步）──
function listenFirebase(){
  if(!_fbReady || !_db) return;
  _db.ref('erp').on('value', snap => {
    // 避免自己觸發的更新也進來（5秒內不重複載入）
    if(Date.now() - _lastSyncTime < 3000) return;

    const data = snap.val();
    if(!data) return;

    if(data.inventory)       inventory       = data.inventory;
    if(data.logs)            logs            = data.logs;
    if(data.customers)       customers       = data.customers;
    if(data.estimates)       estimates       = data.estimates;
    if(data.productionOrders)productionOrders= data.productionOrders;
    if(data.events)          events          = data.events;

    // 靜默更新（不跳 toast，避免打擾操作）
    renderHome();
    renderFinished();
    renderMaterials();
    renderLogs();

    setSyncStatus('ok', '已同步 '+new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));
  });
}

// ── 手動同步按鈕 ──
function manualSync(){
  setSyncStatus('syncing', '同步中...');
  pullFromFirebase();
  showToast('🔄 正在同步...');
}

// ── 啟動 ──
document.addEventListener('DOMContentLoaded', () => {
  // 延遲 500ms 等其他 JS 載入完畢
  setTimeout(() => {
    hookLocalStorage();
    initFirebase();
    setTimeout(listenFirebase, 2000);
  }, 500);
});
