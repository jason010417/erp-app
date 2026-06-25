// ============================================================
// storeB.js — 門市日銷登入（A / B 門市通用）
// ============================================================

let storeBSales = JSON.parse(localStorage.getItem('erp_storeb_sales') || '[]');

function saveStoreBSales(){
  localStorage.setItem('erp_storeb_sales', JSON.stringify(storeBSales));
  if(typeof pushToFirebase === 'function') pushToFirebase('storeBSales', storeBSales);
}

// ── 表單狀態 ──
let _storeDailyItems = [];
let _storeDailyLocId = null;

function initStoreDailyPage(){
  _storeDailyItems = [];

  const dateEl = document.getElementById('store-daily-date');
  if(dateEl) dateEl.value = todayStr();

  const sel = document.getElementById('store-daily-loc');
  if(sel){
    const locs = getStoreLocations();
    sel.innerHTML = locs.map(l =>
      `<option value="${l.id}">${l.name}</option>`
    ).join('');
    _storeDailyLocId = sel.value || getMainLocation()?.id || 'store_A';
  } else {
    _storeDailyLocId = getMainLocation()?.id || 'store_A';
  }

  renderStoreDailyItems();
  renderStoreDailyTotal();
}

function onStoreDailyLocChange(){
  _storeDailyLocId = document.getElementById('store-daily-loc')?.value || _storeDailyLocId;
  renderStoreDailyItems();
  renderStoreDailyTotal();
}

// ── 品項管理（供 searchItemsFor 呼叫）──
function addItemTo_storeDaily(productId){ addStoreDailyItem(productId); }

function addStoreDailyItem(productId){
  const item = getItem(productId);
  if(!item) return;
  const existing = _storeDailyItems.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _storeDailyItems.push({
      id:        productId,
      name:      item.name,
      emoji:     item.emoji,
      qty:       1,
      unitPrice: item.price || 0,
    });
  }
  const si = document.getElementById('store-daily-search');
  if(si) si.value = '';
  const ri = document.getElementById('store-daily-search-result');
  if(ri) ri.style.display = 'none';
  renderStoreDailyItems();
  renderStoreDailyTotal();
}

function removeStoreDailyItem(idx){
  _storeDailyItems.splice(idx, 1);
  renderStoreDailyItems();
  renderStoreDailyTotal();
}

function changeStoreDailyQty(idx, delta){
  const item = _storeDailyItems[idx];
  if(item) item.qty = Math.max(1, item.qty + delta);
  renderStoreDailyItems();
  renderStoreDailyTotal();
}

function renderStoreDailyItems(){
  const el = document.getElementById('store-daily-item-list');
  if(!el) return;
  if(!_storeDailyItems.length){
    el.innerHTML = '<div class="order-empty">尚未加入品項，搜尋今日有售出的商品</div>';
    return;
  }
  const locId = _storeDailyLocId;
  el.innerHTML = _storeDailyItems.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">目前庫存：${getStock(item.id, locId)} 個</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeStoreDailyQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeStoreDailyQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeStoreDailyItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`).join('');
}

function renderStoreDailyTotal(){
  const el = document.getElementById('store-daily-total');
  if(!el) return;
  const total = _storeDailyItems.reduce((s, i) => s + (i.unitPrice || 0) * i.qty, 0);
  el.textContent = fmtMoney(total);
}

// ── 送出 ──
function submitStoreDailySale(){
  if(!_storeDailyLocId){ showToast('⚠️ 請選擇門市'); return; }
  if(!_storeDailyItems.length){ showToast('⚠️ 請先加入銷售品項'); return; }

  const date    = document.getElementById('store-daily-date')?.value || todayStr();
  const locId   = _storeDailyLocId;
  const locName = getLocation(locId)?.name || locId;
  const refId   = 'DAILY-' + date + '-' + locId;

  _storeDailyItems.forEach(item => {
    adjustStock(item.id, locId, -item.qty, {
      op:      'pos_sale',
      refId,
      refType: 'store_daily',
      note:    `${locName} 日銷 ${date}`,
    });
    addLog({
      op:          'pos_sale',
      productId:   item.id,
      productName: item.name,
      locationId:  locId,
      qty:         item.qty,
      unitPrice:   item.unitPrice || 0,
      amount:      (item.unitPrice || 0) * item.qty,
      refId,
      payMethod:   'cash',
      note:        `${locName} 日銷`,
    });
  });

  const sale = {
    id:         'DS' + Date.now(),
    date,
    locationId: locId,
    items:      JSON.parse(JSON.stringify(_storeDailyItems)),
    inputBy:    currentRole(),
    createdAt:  nowStr(),
  };
  storeBSales.push(sale);
  saveStoreBSales();
  if(typeof pushToFirebase === 'function') pushToFirebase();

  showToast(`✅ ${locName} 日銷已記錄（${_storeDailyItems.length} 種商品）`);
  _storeDailyItems = [];
  renderStoreDailyItems();
  renderStoreDailyTotal();
}

document.addEventListener('DOMContentLoaded', initStoreDailyPage);
