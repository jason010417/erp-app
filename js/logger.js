// ============================================================
// logger.js — 操作記錄
// 所有庫存異動、銷售、生產都透過這裡記錄
// ============================================================

let logs = [];

function loadLogs(){
  try {
    logs = JSON.parse(localStorage.getItem('erp_logs') || '[]');
  } catch(e){
    logs = [];
  }
}

function saveLogs(){
  // 只保留最新 1000 筆在本機，完整資料在 Firebase
  localStorage.setItem('erp_logs', JSON.stringify(logs.slice(-1000)));
}

// ── 新增記錄 ──
function addLog(data){
  const log = {
    _ts:        Date.now(),
    _device:    typeof DEVICE_ID !== 'undefined' ? DEVICE_ID : 'unknown',
    time:       nowStr(),
    role:       currentRole() || 'operator',
    ...data,
  };
  logs.push(log);
  saveLogs();

  // 推送到 Firebase（firebase.js 提供）
  if(typeof pushLogToFirebase === 'function'){
    pushLogToFirebase(log);
  }
  return log;
}

// ── 查詢 ──
function getLogsByRef(refId){
  return logs.filter(l => l.refId === refId);
}
function getLogsByLocation(locationId){
  return logs.filter(l => l.locationId === locationId);
}
function getLogsByProduct(productId){
  return logs.filter(l => l.productId === productId);
}
function getLogsByDateRange(from, to){
  return logs.filter(l => {
    if(!l.time) return false;
    const parts = l.time.match(/(\d+)\/(\d+)/);
    if(!parts) return false;
    const year = new Date().getFullYear();
    const ds = `${year}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    if(from && ds < from) return false;
    if(to   && ds > to)   return false;
    return true;
  });
}

// ── 銷售記錄查詢（報表用）──
const SALE_OPS     = ['pos_sale', 'order_ship', 'event_sale'];
const PURCHASE_OPS = ['stock_in', 'purchase'];
const PRODUCE_OPS  = ['produce', 'produce_deduct'];

function getSaleLogs()     { return logs.filter(l => SALE_OPS.includes(l.op)); }
function getPurchaseLogs() { return logs.filter(l => PURCHASE_OPS.includes(l.op)); }
function getProduceLogs()  { return logs.filter(l => PRODUCE_OPS.includes(l.op)); }

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', loadLogs);
