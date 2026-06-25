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
    // _date 存 YYYY-MM-DD 格式，供 getLogsByDateRange() 做跨年正確比對
    // 舊記錄沒有 _date，getLogsByDateRange() 會 fallback 到原本的補年邏輯
    _date:      todayStr(),
    role:       currentRole() || 'operator',
    ...data,
  };
  logs.push(log);

  // 推送到 Firebase（firebase.js 提供）
  // 必須在 saveLogs() 之前呼叫：pushLogToFirebase 會同步設定 log._fbKey，
  // 讓 localStorage 存入帶有 _fbKey 的版本，避免 sync 時 remoteMap + localOnly 各放一份造成重複
  if(typeof pushLogToFirebase === 'function'){
    pushLogToFirebase(log);
  }
  saveLogs();

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
    // 優先使用 _date 欄位（YYYY-MM-DD 格式），新記錄都有這個欄位，可正確跨年比對
    // 若 _date 不存在（舊記錄），fallback 到原本的邏輯：
    //   從 time 欄位（格式 M/D HH:MM）解析月日，補上當前年份
    //   缺點：跨年查詢 12 月記錄時年份會被補成今年，可能造成資料漏查
    let ds;
    if(l._date){
      // 新記錄：直接用 _date（YYYY-MM-DD），跨年也能正確比對
      ds = l._date;
    } else {
      // 舊記錄 fallback：解析 time 欄位補年份
      if(!l.time) return false;
      const parts = l.time.match(/(\d+)\/(\d+)/);
      if(!parts) return false;
      const year = new Date().getFullYear();
      ds = `${year}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    }
    if(from && ds < from) return false;
    if(to   && ds > to)   return false;
    return true;
  });
}

// ── 銷售記錄查詢（報表用）──
const SALE_OPS     = ['pos_sale', 'order_ship', 'event_sale', 'event_settle'];
const PURCHASE_OPS = ['stock_in', 'purchase'];
const PRODUCE_OPS  = ['produce', 'produce_deduct'];

function getSaleLogs()     { return logs.filter(l => SALE_OPS.includes(l.op)); }
function getPurchaseLogs() { return logs.filter(l => PURCHASE_OPS.includes(l.op)); }
function getProduceLogs()  { return logs.filter(l => PRODUCE_OPS.includes(l.op)); }

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', loadLogs);
