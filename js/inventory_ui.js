// ============================================================
// inventory_ui.js — 庫存查詢頁面 UI
// ============================================================

let _invCurrentLoc = 'all';
let _invCurrentCat = 'all';

function renderInventoryPage(){
  renderLocTabs();
  renderCatFilter();
  renderInventoryList();
  renderInventorySummary();
}

// ── 地點標籤 ──
function renderLocTabs(){
  const el = document.getElementById('loc-tabs');
  if(!el) return;
  const tabs = [{ id:'all', name:'全部' }, ...getStoreLocations()];
  el.innerHTML = tabs.map(loc => `
    <button class="loc-tab ${_invCurrentLoc === loc.id ? 'active' : ''}"
      onclick="setInvLoc('${loc.id}')">
      ${loc.name}
    </button>`).join('');
}

function setInvLoc(locId){
  _invCurrentLoc = locId;
  renderLocTabs();
  renderInventoryList();
}

// ── 分類標籤 ──
function renderCatFilter(){
  const el = document.getElementById('cat-filter');
  if(!el) return;
  const cats = [{ id:'all', name:'全部', emoji:'📦' }, ...Object.entries(CATEGORIES).map(([id, v]) => ({ id, ...v }))];
  el.innerHTML = cats.map(c => `
    <button class="cat-tag ${_invCurrentCat === c.id ? 'active' : ''}"
      onclick="setInvCat('${c.id}')">
      ${c.emoji} ${c.name}
    </button>`).join('');
}

function setInvCat(catId){
  _invCurrentCat = catId;
  renderCatFilter();
  renderInventoryList();
}

// ── 商品列表 ──
function renderInventoryList(){
  const el = document.getElementById('inventory-list');
  if(!el) return;
  const q = document.getElementById('inv-search')?.value?.toLowerCase() || '';

  let items = FINISHED;

  // 分類篩選
  if(_invCurrentCat !== 'all'){
    items = items.filter(i => i.category === _invCurrentCat);
  }

  // 搜尋篩選
  if(q){
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.barcode?.toLowerCase().includes(q)
    );
  }

  if(!items.length){
    el.innerHTML = `<div class="order-empty">找不到符合的商品</div>`;
    return;
  }

  el.innerHTML = items.map(item => {
    const stock = _invCurrentLoc === 'all'
      ? getTotalStock(item.id)
      : getStock(item.id, _invCurrentLoc);
    const cls   = stock <= 0 ? 'empty' : isLowStock(item.id) ? 'low' : 'ok';
    const locs  = _invCurrentLoc === 'all' ? getStockSummary(item.id) : [];

    return `<div class="inv-item" onclick="showItemDetail('${item.id}')">
      <div class="inv-item-emoji">${item.emoji}</div>
      <div class="inv-item-info">
        <div class="inv-item-name">${item.name}</div>
        <div class="inv-item-id">${item.id}
          ${locs.length > 1 ? locs.map(l => `<span style="color:var(--text3);">${l.locationName}:${l.qty}</span>`).join(' ') : ''}
        </div>
      </div>
      <div class="inv-item-right">
        <div class="inv-qty ${cls}">${stock}</div>
        <div class="inv-unit">${item.unit}</div>
      </div>
    </div>`;
  }).join('');
}

// ── 商品詳細（Modal）──
function showItemDetail(productId){
  const item  = getItem(productId);
  if(!item) return;
  const locs  = getStoreLocations();
  const total = getTotalStock(productId);
  const bom   = BOM[productId] || [];

  let html = `
    <div style="text-align:center;margin-bottom:14px;">
      <div style="font-size:52px;">${item.emoji}</div>
      <div style="font-size:18px;font-weight:700;margin-top:8px;">${item.name}</div>
      <div style="font-size:13px;color:var(--text3);">${item.id}</div>
    </div>
    <div class="amount-section">`;

  // 各地點庫存
  locs.forEach(loc => {
    const qty = getStock(productId, loc.id);
    const cls = qty <= 0 ? 'inv-qty empty' : isLowStock(productId) ? 'inv-qty low' : 'inv-qty ok';
    html += `<div class="amount-row">
      <span>${loc.name}</span>
      <span class="${cls}" style="font-size:20px;">${qty} ${item.unit}</span>
    </div>`;
  });

  html += `<div class="amount-row grand">
    <span>合計</span>
    <strong>${total} ${item.unit}</strong>
  </div></div>`;

  // 商品資訊
  html += `<div class="form-card" style="margin-top:10px;">
    <div class="amount-row"><span>售價</span><span>$${item.salePrice}</span></div>
    <div class="amount-row"><span>進貨價</span><span>$${item.costPrice}</span></div>
    <div class="amount-row"><span>安全庫存</span><span>${item.safetyStock} ${item.unit}</span></div>
  </div>`;

  // BOM 組合
  if(bom.length){
    html += `<div class="section-title" style="margin-top:10px;"><i class="ti ti-git-merge"></i> 加工組合</div>`;
    html += bom.map(b => {
      const mat = getItem(b.materialId) || { emoji:'📦', name:b.materialId };
      return `<div class="inv-item" style="margin-bottom:6px;">
        <div class="inv-item-emoji">${mat.emoji}</div>
        <div class="inv-item-info">
          <div class="inv-item-name">${mat.name}</div>
          <div class="inv-item-id">每個需要 ${b.qty} ${mat.unit || '個'}</div>
        </div>
        <div class="inv-item-right">
          <div class="inv-qty ${getTotalStock(b.materialId)<=0?'empty':'ok'}">${getTotalStock(b.materialId)}</div>
          <div class="inv-unit">${mat.unit || '個'}</div>
        </div>
      </div>`;
    }).join('');
  }

  document.getElementById('item-detail-content').innerHTML = html;
  document.getElementById('item-detail-title').textContent = item.name;
  document.getElementById('itemDetailModal').style.display = 'flex';
}

// ── 初始化：在 HTML 插入 itemDetailModal ──
document.addEventListener('DOMContentLoaded', () => {
  // 加入商品詳細 Modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id        = 'itemDetailModal';
  modal.style.display = 'none';
  modal.onclick   = e => { if(e.target === modal) modal.style.display = 'none'; };
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-title" id="item-detail-title"></div>
      <div id="item-detail-content"></div>
      <button class="redit-btn" onclick="document.getElementById('itemDetailModal').style.display='none'">
        關閉
      </button>
    </div>`;
  document.body.appendChild(modal);
});
