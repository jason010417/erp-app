// ============================================================
// gift.js — 贈品/試吃出庫單
// ============================================================

let giftOrders = JSON.parse(localStorage.getItem('erp_gift_orders') || '[]');

function saveGiftOrders(){
  localStorage.setItem('erp_gift_orders', JSON.stringify(giftOrders));
  if(typeof pushToFirebase === 'function') pushToFirebase('giftOrders', giftOrders);
}

function getGiftOrder(id){ return giftOrders.find(g => g.id === id) || null; }

function genGiftNo(){
  return genNo('GF', giftOrders, 'no');
}

// ── 出庫原因設定 ──
const GIFT_REASONS = [
  { value: 'tasting',  label: '試吃推廣',  icon: 'ti-candy',         color: '#C05621', bg: '#FEEBC8' },
  { value: 'gift',     label: '贈禮',       icon: 'ti-gift',          color: '#553C9A', bg: '#EDE9F8' },
  { value: 'event',    label: '外展活動',   icon: 'ti-map-pin',       color: '#2C7A7B', bg: '#E6FFFA' },
  { value: 'staff',    label: '員工福利',   icon: 'ti-heart',         color: '#B83280', bg: '#FED7E2' },
  { value: 'damaged',  label: '損壞報廢',   icon: 'ti-trash',         color: '#742A2A', bg: '#FFF5F5' },
  { value: 'other',    label: '其他',       icon: 'ti-dots-circle-horizontal', color: '#4A5568', bg: '#EDF2F7' },
];

function getGiftReason(value){
  return GIFT_REASONS.find(r => r.value === value) || GIFT_REASONS[5];
}

function giftReasonBadge(value){
  const r = getGiftReason(value);
  return `<span style="font-size:11px;padding:2px 8px;border-radius:20px;
    background:${r.bg};color:${r.color};font-weight:600;white-space:nowrap;">
    <i class="ti ${r.icon}"></i> ${r.label}
  </span>`;
}

// ── 列表頁 ──
let _giftFilter = 'all';

function initGiftOrdersPage(){
  const page = document.getElementById('page-gift-orders');
  if(!page) return;

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('sales-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-gift" style="color:var(--purple);"></i> 贈品出庫</div>
      <button class="small-btn green-btn" onclick="openNewGiftModal()">
        <i class="ti ti-plus"></i> 新增
      </button>
    </div>

    <div class="filter-tabs">
      <button class="ftab active" onclick="renderGiftList('all',this)">全部</button>
      <button class="ftab" onclick="renderGiftList('tasting',this)">試吃</button>
      <button class="ftab" onclick="renderGiftList('gift',this)">贈禮</button>
      <button class="ftab" onclick="renderGiftList('event',this)">外展</button>
      <button class="ftab" onclick="renderGiftList('damaged',this)">報廢</button>
    </div>
    <div id="gift-list"></div>`;

  renderGiftList('all');
}

function renderGiftList(filter, btn){
  if(filter) _giftFilter = filter;
  if(btn){
    document.querySelectorAll('#page-gift-orders .ftab')
      .forEach(b => b.classList.toggle('active', b === btn));
  }

  const el = document.getElementById('gift-list');
  if(!el) return;

  let list = _giftFilter === 'all'
    ? giftOrders
    : giftOrders.filter(g => g.reason === _giftFilter);
  list = list.slice().reverse();

  if(!list.length){
    el.innerHTML = `<div class="order-empty">尚無出庫記錄</div>`;
    return;
  }

  el.innerHTML = list.map(g => {
    const itemsStr = (g.items||[]).slice(0,2).map(i => i.name).join('、')
      + ((g.items||[]).length > 2 ? ` 等${g.items.length}項` : '');
    const totalQty = (g.items||[]).reduce((s,i) => s + (i.qty||0), 0);
    return `<div class="list-card" onclick="openGiftDetail('${g.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${g.no}</span>
        ${giftReasonBadge(g.reason)}
      </div>
      <div class="list-card-meta">
        <span><i class="ti ti-calendar"></i>${fmtDate(g.createdAt)}</span>
        ${g.recipient ? `<span><i class="ti ti-user"></i>${g.recipient}</span>` : ''}
        <span><i class="ti ti-map-pin"></i>${_locName(g.locationId)}</span>
      </div>
      <div class="list-card-items">${itemsStr || '無品項'}</div>
      <div class="list-card-footer">
        <span style="font-size:13px;color:var(--text2);">共 ${totalQty} 件</span>
        ${g.remark ? `<span style="font-size:12px;color:var(--text3);">${g.remark}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function _locName(id){
  const loc = typeof getLocation === 'function' ? getLocation(id) : null;
  return loc ? loc.name : (id || 'A門市');
}

// ── 新增出庫單 Modal ──
let _currentGift = null;

function openNewGiftModal(){
  _currentGift = {
    id:         null,
    no:         genGiftNo(),
    reason:     'tasting',
    recipient:  '',
    locationId: (typeof getMainLocation === 'function' ? getMainLocation()?.id : null) || 'store_A',
    items:      [],
    remark:     '',
    createdAt:  todayStr(),
  };
  _renderGiftModal();
}

function _renderGiftModal(){
  const existing = document.getElementById('giftModal');
  if(existing) existing.remove();

  const g   = _currentGift;
  const locs = typeof getStoreLocations === 'function' ? getStoreLocations() : [];

  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'giftModal';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) _closeGiftModal(); };

  modal.innerHTML = `
    <div class="modal-card" style="max-width:480px;max-height:90vh;overflow-y:auto;">
      <div class="modal-title"><i class="ti ti-gift"></i> 新增贈品出庫</div>

      <!-- 出庫原因 -->
      <div class="cust-field" style="margin-bottom:10px;">
        <label>出庫原因</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px;">
          ${GIFT_REASONS.map(r => `
            <button onclick="_setGiftReason('${r.value}')"
              id="gr-btn-${r.value}"
              style="padding:10px 6px;border-radius:var(--radius-sm);border:2px solid ${g.reason===r.value?r.color:r.bg};
              background:${g.reason===r.value?r.bg:'var(--surface)'};color:${r.color};cursor:pointer;
              font-size:12px;font-weight:600;text-align:center;transition:all .15s;">
              <i class="ti ${r.icon}" style="display:block;font-size:20px;margin-bottom:4px;"></i>
              ${r.label}
            </button>`).join('')}
        </div>
      </div>

      <!-- 受贈者 -->
      <div class="cust-field">
        <label>對象 / 受贈者</label>
        <input type="text" id="gf-recipient" value="${g.recipient}"
          placeholder="例：南投縣長、試吃活動..." />
      </div>

      <!-- 出庫地點 -->
      <div class="cust-field">
        <label>出庫地點</label>
        <select id="gf-location">
          ${locs.map(l => `<option value="${l.id}" ${g.locationId===l.id?'selected':''}>${l.name}</option>`).join('')}
        </select>
      </div>

      <!-- 品項搜尋 -->
      <div class="form-section-title" style="margin-top:10px;">出庫品項</div>
      <div class="search-bar">
        <i class="ti ti-search"></i>
        <input type="search" id="gift-item-search" placeholder="搜尋商品..."
          oninput="searchItemsFor('gift',this.value)" />
      </div>
      <div id="gift-item-search-result" style="display:none;"></div>
      <div id="gf-item-list" style="margin-top:6px;"></div>

      <!-- 備註 -->
      <div class="cust-field" style="margin-top:8px;">
        <label>備註</label>
        <textarea id="gf-remark" rows="2" placeholder="（可空白）">${g.remark}</textarea>
      </div>

      <div class="modal-actions" style="margin-top:12px;">
        <button class="modal-ok-btn" onclick="submitGiftOrder()">
          <i class="ti ti-check"></i> 確認出庫
        </button>
        <button class="modal-cancel-btn" onclick="_closeGiftModal()">取消</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  _renderGiftItems();
}

function _setGiftReason(value){
  if(!_currentGift) return;
  _currentGift.reason = value;
  // 更新按鈕樣式
  GIFT_REASONS.forEach(r => {
    const btn = document.getElementById('gr-btn-' + r.value);
    if(!btn) return;
    btn.style.border      = `2px solid ${r.value === value ? r.color : r.bg}`;
    btn.style.background  = r.value === value ? r.bg : 'var(--surface)';
  });
}

function _closeGiftModal(){
  document.getElementById('giftModal')?.remove();
  _currentGift = null;
}

// ── 贈品品項管理 ──
function addGiftItem(productId){
  if(!_currentGift) return;
  const item = getItem(productId);
  if(!item) return;
  const existing = _currentGift.items.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _currentGift.items.push({
      id:    productId,
      name:  item.name,
      emoji: item.emoji,
      qty:   1,
    });
  }
  const si = document.getElementById('gift-item-search');
  const rs = document.getElementById('gift-item-search-result');
  if(si) si.value = '';
  if(rs) rs.style.display = 'none';
  _renderGiftItems();
}

function changeGiftItemQty(idx, delta){
  if(!_currentGift) return;
  const item = _currentGift.items[idx];
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  _renderGiftItems();
}

function removeGiftItem(idx){
  if(!_currentGift) return;
  _currentGift.items.splice(idx, 1);
  _renderGiftItems();
}

function _renderGiftItems(){
  const el = document.getElementById('gf-item-list');
  if(!el || !_currentGift) return;
  const items = _currentGift.items;
  if(!items.length){
    el.innerHTML = '<div class="order-empty" style="padding:12px 0;">尚未加入品項</div>';
    return;
  }
  el.innerHTML = items.map((item, idx) => {
    const stock = typeof getTotalStock === 'function' ? getTotalStock(item.id) : 0;
    const over  = item.qty > stock;
    return `<div class="order-row" style="${over?'background:#FFF5F5;':''}">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="color:${over?'var(--red)':'var(--text3)'};">
          庫存 ${stock}${over ? ' ⚠️ 超出庫存' : ''}
        </div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeGiftItemQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeGiftItemQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeGiftItem(${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`;
  }).join('');
}

// ── 提交出庫 ──
function submitGiftOrder(){
  if(!_currentGift) return;
  if(!_currentGift.items.length){
    showToast('⚠️ 請先加入品項'); return;
  }

  // 讀取表單
  _currentGift.recipient  = document.getElementById('gf-recipient')?.value.trim() || '';
  _currentGift.locationId = document.getElementById('gf-location')?.value || _currentGift.locationId;
  _currentGift.remark     = document.getElementById('gf-remark')?.value.trim() || '';

  const locId = _currentGift.locationId;
  const reason = getGiftReason(_currentGift.reason);

  // 庫存檢查
  const overStock = _currentGift.items.filter(i => {
    const s = typeof getStock === 'function' ? getStock(i.id, locId) : 0;
    return i.qty > s;
  });
  if(overStock.length){
    if(!confirm(`以下品項庫存不足：\n${overStock.map(i=>`${i.name} (需${i.qty}，現有${getStock(i.id,locId)})`).join('\n')}\n\n仍要出庫？`)) return;
  }

  // 扣庫存
  _currentGift.items.forEach(item => {
    if(typeof adjustStock === 'function'){
      adjustStock(item.id, locId, -item.qty, {
        op:      'gift_out',
        refId:   _currentGift.no,
        refType: 'gift',
        note:    `${reason.label}出庫${_currentGift.recipient ? '（' + _currentGift.recipient + '）' : ''}`,
      });
    }
  });

  // 儲存
  _currentGift.id = 'GF' + Date.now();
  giftOrders.push(_currentGift);
  saveGiftOrders();

  showToast(`✅ 出庫完成：${_currentGift.no}`);
  _closeGiftModal();
  renderGiftList(_giftFilter);
}

// ── 出庫單詳細 ──
function openGiftDetail(id){
  const g = getGiftOrder(id);
  if(!g) return;

  const existing = document.getElementById('giftDetailModal');
  if(existing) existing.remove();

  const reason    = getGiftReason(g.reason);
  const totalQty  = (g.items||[]).reduce((s,i) => s + (i.qty||0), 0);

  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'giftDetailModal';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="modal-card" style="max-width:420px;max-height:85vh;overflow-y:auto;">
      <div class="modal-title">
        <i class="ti ${reason.icon}" style="color:${reason.color};"></i>
        ${g.no}
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
        ${giftReasonBadge(g.reason)}
        <span style="font-size:12px;color:var(--text3);">${fmtDateFull(g.createdAt)}</span>
      </div>

      <div class="amount-section">
        ${g.recipient ? `<div class="amount-row"><span>對象</span><span>${g.recipient}</span></div>` : ''}
        <div class="amount-row"><span>出庫地點</span><span>${_locName(g.locationId)}</span></div>
        <div class="amount-row"><span>出庫總數</span><strong>${totalQty} 件</strong></div>
        ${g.remark ? `<div class="amount-row"><span>備註</span><span>${g.remark}</span></div>` : ''}
      </div>

      <div class="form-section-title" style="margin-top:12px;">出庫品項</div>
      ${(g.items||[]).map(item => `
        <div class="order-row" style="cursor:default;">
          <div class="order-emoji">${item.emoji}</div>
          <div class="order-info">
            <div class="order-name">${item.name}</div>
            <div class="order-id">${item.id}</div>
          </div>
          <div style="font-size:22px;font-weight:700;color:var(--text);padding-right:8px;">
            ${item.qty}
          </div>
        </div>`).join('')}

      <div style="display:flex;gap:8px;margin-top:14px;">
        ${isAdmin() ? `
        <button class="redit-btn" style="flex:1;color:var(--red);border-color:var(--red);"
          onclick="requireAdmin(()=>hardDeleteGiftOrder('${g.id}'))">
          <i class="ti ti-trash"></i> 刪除
        </button>` : ''}
        <button class="modal-cancel-btn" style="flex:1;"
          onclick="document.getElementById('giftDetailModal').remove()">關閉</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

// ── 管理員刪除 ──
function hardDeleteGiftOrder(id){
  const g = getGiftOrder(id);
  if(!g) return;
  if(!confirm(`確定永久刪除出庫單 ${g.no}？\n庫存不會歸還，此操作無法復原。`)) return;
  giftOrders = giftOrders.filter(x => x.id !== id);
  saveGiftOrders();
  document.getElementById('giftDetailModal')?.remove();
  showToast('🗑️ 出庫單已刪除');
  renderGiftList(_giftFilter);
}

// ── smartsearch 整合（gift context）──
// addItemTo('gift', itemId) → 呼叫 addGiftItem
// searchItemsFor 的 resId/searchId 對應在 smartsearch.js 要加 gift

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', () => {
  // giftOrders 已從 firebase.js 同步，如果有更新會直接覆蓋 window.giftOrders
});
