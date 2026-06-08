// ============================================================
// inventory.js — 多地點庫存管理
// ============================================================

// ── 資料結構 ──
// inventory = { 'F003001': { 'store_A': 80, 'store_B': 15 } }
let inventory = {};

function loadInventory(){
  const saved = localStorage.getItem('erp_inventory');
  if(saved){
    inventory = JSON.parse(saved);
  } else {
    resetInventoryToDefault();
  }
}

function saveInventory(){
  localStorage.setItem('erp_inventory', JSON.stringify(inventory));
}

// ── 重設為初始值（全部 0，正式上線時再匯入）──
function resetInventoryToDefault(){
  inventory = {};
  ALL_ITEMS.forEach(item => {
    inventory[item.id] = { store_A: 0 };
    // 有 B 門市就加上 B
    if(locations && locations.find(l => l.id === 'store_B')){
      inventory[item.id].store_B = 0;
    }
  });
  saveInventory();
}

// ── 查詢 ──
function getStock(productId, locationId){
  return inventory[productId]?.[locationId] ?? 0;
}

function getTotalStock(productId){
  const locs = inventory[productId];
  if(!locs) return 0;
  return Object.values(locs).reduce((s, v) => s + (v || 0), 0);
}

function getStockSummary(productId){
  // 回傳各地點庫存，包含地點名稱
  const result = [];
  const locs = inventory[productId] || {};
  Object.keys(locs).forEach(locId => {
    const loc = getLocation(locId);
    if(loc && locs[locId] > 0){
      result.push({
        locationId:   locId,
        locationName: loc.name,
        qty:          locs[locId],
      });
    }
  });
  return result;
}

// 低庫存警示（依安全庫存判斷）
function isLowStock(productId){
  const item = getItem(productId);
  if(!item) return false;
  const total = getTotalStock(productId);
  return total <= item.safetyStock;
}

function isOutOfStock(productId, locationId){
  return getStock(productId, locationId) <= 0;
}

// ── 異動（所有庫存變動都透過這個函式）──
function adjustStock(productId, locationId, delta, opts = {}){
  // opts: { refId, refType, note, deviceId }
  if(!inventory[productId]) inventory[productId] = {};
  const before = inventory[productId][locationId] ?? 0;
  const after  = Math.max(0, before + delta);
  inventory[productId][locationId] = after;
  saveInventory();

  // 寫入操作記錄
  addLog({
    op:          delta > 0 ? 'stock_in' : 'stock_out',
    locationId,
    productId,
    productName: getItem(productId)?.name || productId,
    qty:         Math.abs(delta),
    before,
    after,
    ...opts,
  });

  return after;
}

// 批次異動（同一張單多個品項）
function adjustStockBatch(items, locationId, direction, opts = {}){
  // direction: 'in' | 'out'
  items.forEach(({ productId, qty }) => {
    const delta = direction === 'in' ? qty : -qty;
    adjustStock(productId, locationId, delta, opts);
  });
}

// ── 調貨（A→B 同時扣增）──
function transferStock(items, fromLocationId, toLocationId, opts = {}){
  items.forEach(({ productId, qty }) => {
    adjustStock(productId, fromLocationId, -qty, { ...opts, note:`調撥至 ${toLocationId}` });
    adjustStock(productId, toLocationId,  +qty, { ...opts, note:`從 ${fromLocationId} 調入` });
  });
}

// ── 庫存警示列表 ──
function getLowStockItems(){
  return ALL_ITEMS.filter(item => isLowStock(item.id));
}

// ── 渲染庫存總覽（首頁用）──
function renderInventorySummary(){
  const el = document.getElementById('inventory-summary');
  if(!el) return;
  const low = getLowStockItems();
  if(!low.length){
    el.innerHTML = `<div class="inv-ok"><i class="ti ti-circle-check"></i> 庫存充足，無警示</div>`;
    return;
  }
  el.innerHTML = low.slice(0,5).map(item => {
    const total = getTotalStock(item.id);
    return `<div class="inv-warn-row" onclick="showPage('inventory-detail');selectProduct('${item.id}')">
      <span>${item.emoji} ${item.name}</span>
      <span class="inv-qty ${total <= 0 ? 'empty' : 'low'}">${total} ${item.unit}</span>
    </div>`;
  }).join('') + (low.length > 5 ? `<div class="inv-more">還有 ${low.length-5} 項偏低...</div>` : '');
}

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', loadInventory);
