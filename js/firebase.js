// ===== Firebase 即時同步（防衝突版）=====

const firebaseConfig = {
  apiKey: "AIzaSyACV9lvcVKHa8q_Lmdzyg-U1SzmlsGz9Uo",
  authDomain: "erp-app-90278.firebaseapp.com",
  databaseURL: "https://erp-app-90278-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "erp-app-90278",
  storageBucket: "erp-app-90278.firebasestorage.app",
  messagingSenderId: "58148662994",
  appId: "1:58148662994:web:c19221105ba36b0b45470b"
};

let _db = null;
let _fbReady = false;
let _myWriteTime = 0;   // 記錄自己最後寫入時間，避免自己觸發監聽

// ── 裝置識別碼（每台裝置不同）──
const DEVICE_ID = localStorage.getItem('erp_device_id') || (() => {
  const id = 'D' + Date.now() + Math.random().toString(36).slice(2,6);
  localStorage.setItem('erp_device_id', id);
  return id;
})();

// ── 同步狀態 UI ──
function setSyncStatus(status, msg){
  const el = document.getElementById('sync-status');
  if(!el) return;
  const cfg = {
    ok:      { color:'#1D9E75', icon:'ti-cloud-check',  text: msg||'已同步' },
    syncing: { color:'#BA7517', icon:'ti-cloud-upload',  text: msg||'同步中...' },
    offline: { color:'#6B6B68', icon:'ti-cloud-off',     text: msg||'離線模式' },
    error:   { color:'#E24B4A', icon:'ti-cloud-x',       text: msg||'同步失敗' },
  };
  const c = cfg[status] || cfg.offline;
  el.innerHTML = `<i class="ti ${c.icon}" style="color:${c.color};font-size:16px;"></i>
    <span style="font-size:11px;color:${c.color};">${c.text}</span>`;
}

// ── 初始化 ──
function initFirebase(){
  try {
    if(typeof firebase === 'undefined'){ setSyncStatus('offline'); return; }
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    _db = firebase.database();
    _fbReady = true;
    setSyncStatus('ok', '已連線');

    // 監聽連線狀態
    _db.ref('.info/connected').on('value', snap => {
      if(snap.val()){ setSyncStatus('ok', '已連線'); pullAll(); }
      else { setSyncStatus('offline', '離線中'); }
    });

    // 初次載入從雲端拉
    pullAll();
    // 監聽其他裝置的變更
    listenRemoteChanges();

  } catch(err){
    console.error('Firebase 初始化失敗:', err);
    setSyncStatus('error');
  }
}

// ══════════════════════════════════════
// 讀取：從 Firebase 拉取全部資料
// ══════════════════════════════════════
function pullAll(){
  if(!_fbReady) return;
  setSyncStatus('syncing', '載入中...');
  _db.ref('erp').once('value').then(snap => {
    const data = snap.val();
    if(!data){ setSyncStatus('ok', '已連線（空白）'); return; }

    if(data.inventory){
      inventory = data.inventory;
      localStorage.setItem('erp_inventory', JSON.stringify(inventory));
    }
    if(data.logs){
      // logs 在 Firebase 是物件（key=時間戳），轉回陣列
      logs = Object.values(data.logs).sort((a,b)=>(a._ts||0)-(b._ts||0));
      localStorage.setItem('erp_logs', JSON.stringify(logs.slice(0,500)));
    }
    if(data.customers){
      customers = Array.isArray(data.customers) ? data.customers : Object.values(data.customers);
      localStorage.setItem('erp_customers', JSON.stringify(customers));
    }
    if(data.estimates){
      estimates = Array.isArray(data.estimates) ? data.estimates : Object.values(data.estimates);
      localStorage.setItem('erp_estimates', JSON.stringify(estimates));
    }
    if(data.productionOrders){
      productionOrders = Array.isArray(data.productionOrders) ? data.productionOrders : Object.values(data.productionOrders);
      localStorage.setItem('erp_prod_orders', JSON.stringify(productionOrders));
    }
    if(data.events){
      events = Array.isArray(data.events) ? data.events : Object.values(data.events);
      localStorage.setItem('erp_events', JSON.stringify(events));
    }

    refreshAllViews();
    const t = new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
    setSyncStatus('ok', `已同步 ${t}`);
  }).catch(err => {
    console.error('Firebase 讀取失敗:', err);
    setSyncStatus('error', '讀取失敗');
  });
}

// ══════════════════════════════════════
// 監聽：其他裝置更新時自動同步
// ══════════════════════════════════════
function listenRemoteChanges(){
  if(!_fbReady) return;

  // 監聽庫存變更（單一欄位級別）
  _db.ref('erp/inventory').on('value', snap => {
    if(Date.now() - _myWriteTime < 2000) return; // 自己剛寫的，跳過
    const data = snap.val();
    if(!data) return;
    inventory = data;
    localStorage.setItem('erp_inventory', JSON.stringify(inventory));
    renderHome(); renderFinished(); renderMaterials();
    setSyncStatus('ok', '庫存已更新');
  });

  // 監聽新增記錄（只監聽新增，不整份覆蓋）
  _db.ref('erp/logs').limitToLast(50).on('child_added', snap => {
    if(Date.now() - _myWriteTime < 2000) return;
    const log = snap.val();
    if(!log) return;
    // 避免重複加入
    if(!logs.find(l => l._fbKey === snap.key)){
      log._fbKey = snap.key;
      logs.push(log);
      logs.sort((a,b)=>(a._ts||0)-(b._ts||0));
      localStorage.setItem('erp_logs', JSON.stringify(logs.slice(0,500)));
      renderLogs();
    }
  });

  // 監聽客戶、估價單、生產單、外展（整份，這些不常衝突）
  ['customers','estimates','productionOrders','events'].forEach(key => {
    _db.ref('erp/'+key).on('value', snap => {
      if(Date.now() - _myWriteTime < 2000) return;
      const data = snap.val();
      if(!data) return;
      const arr = Array.isArray(data) ? data : Object.values(data);
      if(key==='customers')       { customers=arr; localStorage.setItem('erp_customers', JSON.stringify(arr)); }
      if(key==='estimates')       { estimates=arr; localStorage.setItem('erp_estimates', JSON.stringify(arr)); }
      if(key==='productionOrders'){ productionOrders=arr; localStorage.setItem('erp_prod_orders', JSON.stringify(arr)); }
      if(key==='events')          { events=arr; localStorage.setItem('erp_events', JSON.stringify(arr)); }
    });
  });
}

// ══════════════════════════════════════
// 寫入：覆寫 saveXxx 函式，同步到 Firebase
// ══════════════════════════════════════
function hookSaveFunctions(){

  // 庫存：整份更新（庫存是數字，整份沒問題）
  const _origSaveInventory = window.saveInventory;
  window.saveInventory = function(){
    if(_origSaveInventory) _origSaveInventory();
    if(!_fbReady) return;
    _myWriteTime = Date.now();
    setSyncStatus('syncing');
    _db.ref('erp/inventory').set(inventory).then(()=>{
      setSyncStatus('ok', '已同步');
    }).catch(()=> setSyncStatus('error'));
  };

  // 記錄：用 push() 新增，每筆獨立 key，永不互蓋
  const _origSaveLogs = window.saveLogs;
  window.saveLogs = function(){
    if(_origSaveLogs) _origSaveLogs();
    if(!_fbReady) return;
    // 只推送最新一筆（沒有 _fbKey 的）
    const newLogs = logs.filter(l => !l._fbKey);
    newLogs.forEach(log => {
      _myWriteTime = Date.now();
      log._ts = Date.now();
      log._device = DEVICE_ID;
      const ref = _db.ref('erp/logs').push(log);
      log._fbKey = ref.key; // 記錄 Firebase key
    });
    if(newLogs.length) setSyncStatus('ok', '已同步');
  };

  // 客戶：整份更新
  const _origSaveCustomers = window.saveCustomers;
  window.saveCustomers = function(){
    if(_origSaveCustomers) _origSaveCustomers();
    if(!_fbReady) return;
    _myWriteTime = Date.now();
    _db.ref('erp/customers').set(customers).catch(()=> setSyncStatus('error'));
  };

  // 估價單：整份更新
  const _origSaveEstimates = window.saveEstimates;
  window.saveEstimates = function(){
    if(_origSaveEstimates) _origSaveEstimates();
    if(!_fbReady) return;
    _myWriteTime = Date.now();
    _db.ref('erp/estimates').set(estimates).catch(()=> setSyncStatus('error'));
  };

  // 生產訂單：整份更新
  const _origSaveProdOrders = window.saveProdOrders;
  window.saveProdOrders = function(){
    if(_origSaveProdOrders) _origSaveProdOrders();
    if(!_fbReady) return;
    _myWriteTime = Date.now();
    _db.ref('erp/productionOrders').set(productionOrders).catch(()=> setSyncStatus('error'));
  };

  // 外展：整份更新
  const _origSaveEvents = window.saveEvents;
  window.saveEvents = function(){
    if(_origSaveEvents) _origSaveEvents();
    if(!_fbReady) return;
    _myWriteTime = Date.now();
    _db.ref('erp/events').set(events).catch(()=> setSyncStatus('error'));
  };
}

// ── 重新渲染所有頁面 ──
function refreshAllViews(){
  try {
    renderHome();
    renderFinished();
    renderMaterials();
    renderLogs();
    if(typeof renderEstimateList==='function') renderEstimateList('all');
    if(typeof renderCustomerList==='function') renderCustomerList('');
  } catch(e){}
}

// ── 手動同步 ──
function manualSync(){
  showToast('🔄 正在同步...');
  pullAll();
}

// ── 啟動 ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    hookSaveFunctions();
    initFirebase();
  }, 600);
});
