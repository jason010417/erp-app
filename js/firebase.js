// ============================================================
// firebase.js — Firebase 即時同步（防衝突版）
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyACV9lvcVKHa8q_Lmdzyg-U1SzmlsGz9Uo",
  authDomain:        "erp-app-90278.firebaseapp.com",
  databaseURL:       "https://erp-app-90278-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "erp-app-90278",
  storageBucket:     "erp-app-90278.firebasestorage.app",
  messagingSenderId: "58148662994",
  appId:             "1:58148662994:web:c19221105ba36b0b45470b",
};

// 裝置識別碼
const DEVICE_ID = (() => {
  let id = localStorage.getItem('erp_device_id');
  if(!id){
    id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    localStorage.setItem('erp_device_id', id);
  }
  return id;
})();

let _db        = null;
let _fbReady   = false;
let _myWriteAt = 0;   // 自己最後寫入時間（避免自觸發）

// ── 同步狀態 ──
function setSyncStatus(status, msg){
  const el = document.getElementById('sync-status');
  if(!el) return;
  const cfg = {
    ok:      { cls:'ok',      icon:'ti-cloud-check',  text: msg || '已同步' },
    syncing: { cls:'syncing', icon:'ti-cloud-upload',  text: msg || '同步中...' },
    offline: { cls:'',        icon:'ti-cloud-off',     text: msg || '離線' },
    error:   { cls:'error',   icon:'ti-cloud-x',       text: msg || '錯誤' },
  };
  const c = cfg[status] || cfg.offline;
  el.className = `sync-badge ${c.cls}`;
  el.innerHTML = `<i class="ti ${c.icon}"></i><span>${c.text}</span>`;
}

// ── 初始化 ──
function initFirebase(){
  try {
    if(typeof firebase === 'undefined'){ setSyncStatus('offline'); return; }
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db      = firebase.database();
    _fbReady = true;
    setSyncStatus('ok', '已連線');

    _db.ref('.info/connected').on('value', snap => {
      if(snap.val()){
        setSyncStatus('ok', '已連線');
        pullAll();
      } else {
        setSyncStatus('offline', '離線中');
      }
    });

    pullAll();
    setTimeout(listenRemoteChanges, 2000);

  } catch(err){
    console.error('Firebase 初始化失敗:', err);
    setSyncStatus('error');
  }
}

// ── 從 Firebase 拉取全部資料 ──
function pullAll(){
  if(!_fbReady) return;
  setSyncStatus('syncing', '載入中...');
  _db.ref('erp').once('value').then(snap => {
    const data = snap.val();
    if(!data){ setSyncStatus('ok', '已連線（空白）'); return; }
    applyRemoteData(data);
    const t = new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
    setSyncStatus('ok', `同步 ${t}`);
  }).catch(err => {
    console.error('拉取失敗:', err);
    setSyncStatus('error', '讀取失敗');
  });
}

function applyRemoteData(data){
  if(data.inventory){
    inventory = data.inventory;
    localStorage.setItem('erp_inventory', JSON.stringify(inventory));
    if(typeof renderInventorySummary === 'function') renderInventorySummary();
  }
  if(data.locations && Array.isArray(data.locations)){
    locations = data.locations;
    saveLocations();
  }
  if(data.bom){
    Object.keys(data.bom).forEach(id => { BOM[id] = data.bom[id]; });
    localStorage.setItem('erp_bom', JSON.stringify(BOM));
  }
  if(data.productOverrides && typeof applyProductOverrides === 'function'){
    localStorage.setItem('erp_product_overrides', JSON.stringify(data.productOverrides));
    applyProductOverrides(data.productOverrides);
  }
  if(data.customItems && typeof applyCustomItems === 'function'){
    const list = Array.isArray(data.customItems) ? data.customItems : Object.values(data.customItems);
    localStorage.setItem('erp_custom_items', JSON.stringify(list));
    applyCustomItems(list);
  }
  if(data.logs){
    const remote = typeof data.logs === 'object' ? Object.values(data.logs) : data.logs;
    // 保留本機日誌：(1) 無 fbKey（純本機）(2) 有 fbKey 但尚未同步至 Firebase（離線排隊中）
    const remoteKeys = new Set(remote.map(l => l._fbKey).filter(Boolean));
    const localNew   = logs.filter(l => !l._fbKey || !remoteKeys.has(l._fbKey));
    const merged     = [...remote, ...localNew].sort((a,b)=>(a._ts||0)-(b._ts||0));
    logs = merged;
    localStorage.setItem('erp_logs', JSON.stringify(logs.slice(-1000)));
  }
  // customers, estimates, orders 等由各自的模組處理
  const collectionMap = {
    customers:        'erp_customers',
    estimates:        'erp_estimates',
    orders:           'erp_orders',
    productionOrders: 'erp_production_orders',
    purchases:        'erp_purchases',
    transfers:        'erp_transfers',
    events:           'erp_events',
    storeBSales:      'erp_storeb_sales',
    giftOrders:       'erp_gift_orders',
    processingLogs:   'erp_processing_logs',
    customItems:      'erp_custom_items',
  };
  Object.keys(collectionMap).forEach(key => {
    if(data[key]){
      const arr = Array.isArray(data[key]) ? data[key] : Object.values(data[key]);
      localStorage.setItem(collectionMap[key], JSON.stringify(arr));
      // 通知對應模組更新變數
      const varMap = {
        customers:        'customers',
        estimates:        'estimates',
        orders:           'orders',
        productionOrders: 'productionOrders',
        purchases:        'purchases',
        transfers:        'transfers',
        events:           'events',
        storeBSales:      'storeBSales',
        giftOrders:       'giftOrders',
        processingLogs:   'processingLogs',
        customItems:      'customItems',
      };
      if(typeof window[varMap[key]] !== 'undefined') window[varMap[key]] = arr;
    }
  });
}

// ── 監聽其他裝置變更 ──
function listenRemoteChanges(){
  if(!_fbReady) return;

  // 庫存（單欄位更新）
  _db.ref('erp/inventory').on('value', snap => {
    if(Date.now() - _myWriteAt < 2000) return;
    const data = snap.val();
    if(!data) return;
    inventory = data;
    localStorage.setItem('erp_inventory', JSON.stringify(inventory));
    if(typeof renderInventorySummary === 'function') renderInventorySummary();
  });

  // 記錄（只監聽新增）
  _db.ref('erp/logs').limitToLast(50).on('child_added', snap => {
    if(Date.now() - _myWriteAt < 2000) return;
    const log = snap.val();
    if(!log || logs.find(l => l._fbKey === snap.key)) return;
    log._fbKey = snap.key;
    logs.push(log);
    logs.sort((a,b) => (a._ts||0) - (b._ts||0));
    localStorage.setItem('erp_logs', JSON.stringify(logs.slice(-1000)));
  });

  // 其他集合（整批監聽）
  ['customers','estimates','orders','productionOrders','events','transfers'].forEach(key => {
    _db.ref(`erp/${key}`).on('value', snap => {
      if(Date.now() - _myWriteAt < 2000) return;
      const data = snap.val();
      if(!data) return;
      const arr = Array.isArray(data) ? data : Object.values(data);
      if(typeof window[key] !== 'undefined') window[key] = arr;
    });
  });
}

// ── 推送到 Firebase ──
function pushToFirebase(key, data){
  if(!_fbReady || !_db) return;
  _myWriteAt = Date.now();
  _db.ref(`erp/${key}`).set(data).then(() => {
    const t = new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
    setSyncStatus('ok', `同步 ${t}`);
  }).catch(err => {
    console.error('推送失敗:', err);
    setSyncStatus('error', '同步失敗');
  });
}

// 記錄專用（push key，永不衝突）
function pushLogToFirebase(log){
  if(!_fbReady || !_db) return;
  _myWriteAt = Date.now();
  log._ts     = log._ts     || Date.now();
  log._device = log._device || DEVICE_ID;
  const ref = _db.ref('erp/logs').push(log);
  log._fbKey  = ref.key;
}

// ── 手動同步 ──
function manualSync(){
  if(!_fbReady){ showToast('⚠️ 尚未連上 Firebase'); return; }
  showToast('🔄 正在同步...');
  pullAll();
}

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initFirebase, 600);
});
