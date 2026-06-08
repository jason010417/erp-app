// ============================================================
// storeB.js — B 門市日銷售輸入
// ============================================================

let storeBSales = JSON.parse(localStorage.getItem('erp_storeb_sales') || '[]');

function saveStoreBSales(){
  localStorage.setItem('erp_storeb_sales', JSON.stringify(storeBSales));
  if(typeof pushToFirebase === 'function') pushToFirebase('storeBSales', storeBSales);
}

// ── 初始化頁面 ──
let _storeBItems = [];

function initStoreBPage(){
  _storeBItems = [];
  const dateEl = document.getElementById('storeB-date');
  if(dateEl) dateEl.value = todayStr();
  renderStoreBItems();
}

// ── 品項管理 ──
function addStoreBItem(productId){
  const item = getItem(productId);
  if(!item) return;
  const existing = _storeBItems.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _storeBItems.push({
      id:    productId,
      name:  item.name,
      emoji: item.emoji,
      qty:   1,
    });
  }
  const si = document.getElementById('storeB-search');
  if(si) si.value = '';
  const ri = document.getElementById('storeB-search-result');
  if(ri) ri.style.display = 'none';
  renderStoreBItems();
}

function removeStoreBItem(idx){ _storeBItems.splice(idx,1); renderStoreBItems(); }
function changeStoreBQty(idx, delta){
  const item = _storeBItems[idx];
  if(item) item.qty = Math.max(1, item.qty + delta);
  renderStoreBItems();
}

function renderStoreBItems(){
  const el = document.getElementById('storeB-item-list');
  if(!el) return;
  if(!_storeBItems.length){
    el.innerHTML = '<div class="order-empty">尚未加入品項，請搜尋今日有售出的商品</div>'; return;
  }
  el.innerHTML = _storeBItems.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">B 門市目前庫存：${getStock(item.id,'store_B')} 個</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeStoreBQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeStoreBQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeStoreBItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`).join('');
}

// ── 送出 ──
function submitStoreBSale(){
  if(!_storeBItems.length){ showToast('⚠️ 請先加入銷售品項'); return; }
  const date   = document.getElementById('storeB-date')?.value || todayStr();
  const locId  = 'store_B';

  // 扣 B 門市庫存
  _storeBItems.forEach(item => {
    adjustStock(item.id, locId, -item.qty, {
      op:      'pos_sale',
      refType: 'storeb',
      note:    `B 門市 ${fmtDate(date)}`,
    });
  });

  // 存記錄
  const sale = {
    id:       'BS' + Date.now(),
    date,
    locationId: locId,
    items:    JSON.parse(JSON.stringify(_storeBItems)),
    inputBy:  currentRole(),
    createdAt: nowStr(),
  };
  storeBSales.push(sale);
  saveStoreBSales();

  showToast(`✅ B 門市銷售已記錄（${_storeBItems.length} 種商品）`);
  _storeBItems = [];
  renderStoreBItems();
}

document.addEventListener('DOMContentLoaded', () => {
  if(typeof initStoreBPage === 'function') initStoreBPage();
});
