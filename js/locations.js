// ============================================================
// locations.js — 地點管理（動態，支援擴充）
// ============================================================

// ── 預設地點（首次啟動時寫入 localStorage）──
const DEFAULT_LOCATIONS = [
  { id:'store_A', name:'A 門市', type:'store_main', isMain:true,  active:true },
  { id:'store_B', name:'B 門市', type:'store_sub',  isMain:false, active:true },
];

// ── 讀寫 ──
let locations = [];

function loadLocations(){
  const saved = localStorage.getItem('erp_locations');
  if(saved){
    locations = JSON.parse(saved);
  } else {
    locations = JSON.parse(JSON.stringify(DEFAULT_LOCATIONS));
    saveLocations();
  }
}

function saveLocations(){
  localStorage.setItem('erp_locations', JSON.stringify(locations));
}

// ── 查詢 ──
function getLocation(id){
  return locations.find(l => l.id === id) || null;
}
function getMainLocation(){
  return locations.find(l => l.type === 'store_main' && l.active) || locations[0];
}
function getStoreLocations(){
  return locations.filter(l =>
    (l.type === 'store_main' || l.type === 'store_sub') && l.active
  );
}
function getActiveLocations(){
  return locations.filter(l => l.active);
}

// ── 新增地點（管理員） ──
function addLocation(data){
  const id = data.id || 'loc_' + Date.now();
  if(locations.find(l => l.id === id)){
    showToast('⚠️ 此地點 ID 已存在');
    return false;
  }
  locations.push({ ...data, id, active:true });
  saveLocations();
  syncLocationsToFirebase();
  return true;
}

// ── 修改地點 ──
function updateLocation(id, data){
  const idx = locations.findIndex(l => l.id === id);
  if(idx < 0) return false;
  locations[idx] = { ...locations[idx], ...data };
  saveLocations();
  syncLocationsToFirebase();
  return true;
}

// ── Firebase 同步（由 firebase.js 提供）──
function syncLocationsToFirebase(){
  if(typeof pushToFirebase === 'function'){
    pushToFirebase('locations', locations);
  }
}

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', loadLocations);
