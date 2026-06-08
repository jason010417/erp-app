// ============================================================
// purchase.js — 進貨單管理
// ============================================================

let purchases = JSON.parse(localStorage.getItem('erp_purchases') || '[]');

function savePurchases(){
  localStorage.setItem('erp_purchases', JSON.stringify(purchases));
  if(typeof pushToFirebase === 'function') pushToFirebase('purchases', purchases);
}

function genPurchaseNo(){ return genNo('PU', purchases, 'no'); }

// ── 目前進貨單（工作中）──
let _currentPurchase = {
  supplierId:  null,
  locationId:  getMainLocation?.()?.id || 'store_A',
  items:       [],
};

// ── 初始化進貨頁面 ──
function initPurchasePage(){
  const el = document.getElementById('purchase-content');
  if(!el) return;
  el.innerHTML = `
    <!-- 廠商選擇 -->
    <div class="form-section-title">廠商</div>
    <button class="customer-select-btn" onclick="openSupplierPicker()">
      <i class="ti ti-building-store"></i>
      <span id="purchase-supplier-name">選擇廠商</span>
      <i class="ti ti-chevron-right" style="margin-left:auto;"></i>
    </button>
    <div id="purchase-supplier-info" style="display:none;" class="customer-info-box"></div>

    <!-- 入庫地點 -->
    <div class="cust-field" style="margin-top:12px;">
      <label>入庫地點</label>
      <select id="purchase-location" onchange="_currentPurchase.locationId=this.value">
        ${getStoreLocations().map(loc =>
          `<option value="${loc.id}" ${loc.isMain?'selected':''}>${loc.name}</option>`
        ).join('')}
      </select>
    </div>

    <!-- 商品搜尋 -->
    <div class="form-section-title" style="margin-top:10px;">進貨品項</div>
    <div class="search-bar">
      <i class="ti ti-search"></i>
      <input type="search" id="purchase-search"
        placeholder="搜尋半成品或包材..."
        oninput="searchItemsFor('purchase',this.value)" />
    </div>
    <div id="purchase-search-result" style="display:none;"></div>

    <div class="order-list-header">
      <span class="order-list-title">進貨清單</span>
      <span class="order-count" id="purchase-count">0 項</span>
    </div>
    <div class="order-list" id="purchase-list">
      <div class="order-empty">請搜尋商品加入進貨清單</div>
    </div>

    <!-- 備註 -->
    <div class="cust-field" style="margin-top:10px;">
      <label>備註</label>
      <input type="text" id="purchase-remark" placeholder="進貨備註..." />
    </div>

    <!-- 確認 -->
    <button class="confirm-btn" style="background:var(--green);margin-top:8px;"
      onclick="confirmPurchase()">
      <i class="ti ti-check"></i> 確認進貨
    </button>

    <!-- 進貨歷史 -->
    <div class="section-title" style="margin-top:20px;"><i class="ti ti-history"></i> 最近進貨記錄</div>
    <div id="purchase-history"></div>`;

  _currentPurchase = {
    supplierId: null,
    locationId: getMainLocation?.()?.id || 'store_A',
    items:      [],
  };
  renderPurchaseList();
  renderPurchaseHistory();
}

// ── 廠商選擇 ──
let _supplierPickerActive = false;

function openSupplierPicker(){
  _supplierPickerActive = true;
  renderSupplierPickerList('');
  const modal = document.getElementById('supplierPickerModal');
  if(modal) modal.style.display = 'flex';
}

function renderSupplierPickerList(q){
  const el   = document.getElementById('supplier-picker-list');
  if(!el) return;
  const list = q
    ? SUPPLIERS.filter(s => s.name.includes(q) || s.id.includes(q))
    : SUPPLIERS;
  el.innerHTML = list.map(s => {
    const extra = JSON.parse(localStorage.getItem('erp_sup_' + s.id) || '{}');
    return `<div class="catdetail-row" onclick="pickSupplier('${s.id}')">
      <div class="catdetail-info">
        <div class="catdetail-name">${s.name}</div>
        <div class="catdetail-id">${s.id}${extra.tel?' ・ '+extra.tel:''}</div>
      </div>
    </div>`;
  }).join('') || `<div class="order-empty">找不到廠商</div>`;
}

function pickSupplier(id){
  const s     = SUPPLIERS.find(sup => sup.id === id);
  if(!s) return;
  _currentPurchase.supplierId = id;
  const el    = document.getElementById('purchase-supplier-name');
  if(el) el.textContent = s.name;

  const extra = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
  const info  = document.getElementById('purchase-supplier-info');
  if(info){
    const lines = [
      extra.contact ? `👤 ${extra.contact}` : '',
      extra.tel     ? `📞 ${extra.tel}`     : '',
      extra.email   ? `✉️ ${extra.email}`   : '',
    ].filter(Boolean);
    info.innerHTML  = lines.join('<br>') || '無聯絡資料';
    info.style.display = 'block';
  }
  const modal = document.getElementById('supplierPickerModal');
  if(modal) modal.style.display = 'none';
}

// ── 品項管理 ──
function addPurchaseItem(productId){
  const item = getItem(productId);
  if(!item) return;
  const existing = _currentPurchase.items.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _currentPurchase.items.push({
      id:        productId,
      name:      item.name,
      emoji:     item.emoji,
      qty:       1,
      unitCost:  item.costPrice || 0,
    });
  }
  renderPurchaseList();
}

function removePurchaseItem(idx){
  _currentPurchase.items.splice(idx, 1);
  renderPurchaseList();
}

function changePurchaseQty(idx, delta){
  const item = _currentPurchase.items[idx];
  if(item) item.qty = Math.max(1, item.qty + delta);
  renderPurchaseList();
}

function changePurchaseCost(idx, val){
  const item = _currentPurchase.items[idx];
  if(item) item.unitCost = parseInt(val) || 0;
}

function renderPurchaseList(){
  const el    = document.getElementById('purchase-list');
  const count = document.getElementById('purchase-count');
  if(!el) return;
  const items = _currentPurchase.items;
  if(count) count.textContent = items.length + ' 項';
  if(!items.length){
    el.innerHTML = `<div class="order-empty">請搜尋商品加入進貨清單</div>`; return;
  }
  el.innerHTML = items.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;">進貨價</span>
          <input type="number" class="unit-price-input"
            value="${item.unitCost}" min="0"
            onchange="changePurchaseCost(${idx},this.value)"
            onclick="this.select()" />
        </div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changePurchaseQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changePurchaseQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removePurchaseItem(${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

// ── 確認進貨 ──
function confirmPurchase(){
  if(!_currentPurchase.items.length){ showToast('⚠️ 請先加入品項'); return; }
  const locId  = _currentPurchase.locationId || getMainLocation()?.id || 'store_A';
  const now    = nowStr();
  const remark = document.getElementById('purchase-remark')?.value.trim() || '';
  const total  = _currentPurchase.items.reduce((s,i)=>s+i.unitCost*i.qty, 0);

  // 存進貨單
  const pu = {
    id:         'PU' + Date.now(),
    no:         genPurchaseNo(),
    supplierId: _currentPurchase.supplierId,
    locationId: locId,
    items:      JSON.parse(JSON.stringify(_currentPurchase.items)),
    totalCost:  total,
    remark,
    status:     'completed',
    createdAt:  todayStr(),
  };
  purchases.push(pu);
  savePurchases();

  // 更新庫存
  adjustStockBatch(
    _currentPurchase.items.map(i => ({ productId: i.id, qty: i.qty })),
    locId,
    'in',
    { op:'purchase', refId:pu.id, refType:'purchase', note:`進貨單 ${pu.no}` }
  );

  const sup = SUPPLIERS.find(s => s.id === _currentPurchase.supplierId);
  showToast(`✅ 進貨完成！${_currentPurchase.items.length} 種商品已入庫`);

  // 重設
  _currentPurchase = {
    supplierId: null,
    locationId: locId,
    items:      [],
  };
  initPurchasePage();
}

// ── 進貨記錄 ──
function renderPurchaseHistory(){
  const el = document.getElementById('purchase-history');
  if(!el) return;
  const recent = purchases.slice().reverse().slice(0, 10);
  if(!recent.length){
    el.innerHTML = `<div class="order-empty">尚無進貨記錄</div>`; return;
  }
  el.innerHTML = recent.map(pu => {
    const sup = SUPPLIERS.find(s => s.id === pu.supplierId);
    return `<div class="list-card" style="margin-bottom:8px;">
      <div class="list-card-top">
        <span class="list-card-no">${pu.no}</span>
        <span style="font-size:12px;color:var(--text3);">${fmtDate(pu.createdAt)}</span>
      </div>
      <div class="list-card-meta">
        ${sup ? `<span><i class="ti ti-building-store"></i>${sup.name}</span>` : ''}
        <span><i class="ti ti-package"></i>${pu.items.length} 種商品</span>
      </div>
    </div>`;
  }).join('');
}

// ── 廠商選擇 Modal（動態建立）──
function initSupplierPickerModal(){
  if(document.getElementById('supplierPickerModal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id        = 'supplierPickerModal';
  modal.style.display = 'none';
  modal.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-title"><i class="ti ti-building-store"></i> 選擇廠商</div>
      <div class="search-bar" style="margin-bottom:10px;">
        <i class="ti ti-search"></i>
        <input type="search" id="supplier-picker-search" placeholder="搜尋廠商..."
          oninput="renderSupplierPickerList(this.value)" />
      </div>
      <div id="supplier-picker-list" style="max-height:50vh;overflow-y:auto;"></div>
      <button class="modal-cancel-btn" style="margin-top:10px;width:100%;"
        onclick="document.getElementById('supplierPickerModal').style.display='none'">
        取消
      </button>
    </div>`;
  document.body.appendChild(modal);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initSupplierPickerModal();
});
