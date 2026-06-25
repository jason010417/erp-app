// ============================================================
// purchase.js — 採購單管理（草稿 → 已下單 → 已入庫）
// ============================================================

let purchases = JSON.parse(localStorage.getItem('erp_purchases') || '[]');

function savePurchases(){
  localStorage.setItem('erp_purchases', JSON.stringify(purchases));
  if(typeof pushToFirebase === 'function') pushToFirebase('purchases', purchases);
}

function genPurchaseNo(){ return genNo('PU', purchases, 'no'); }
function getPurchase(id){ return purchases.find(p => p.id === id) || null; }

// ── 狀態設定 ──
const PURCHASE_STATUS = {
  draft:     { label:'草稿',   cls:'badge-draft',    icon:'ti-pencil' },
  ordered:   { label:'待收貨', cls:'badge-pending',  icon:'ti-clock' },
  received:  { label:'已入庫', cls:'badge-done',     icon:'ti-circle-check' },
  completed: { label:'已入庫', cls:'badge-done',     icon:'ti-circle-check' }, // 舊資料相容
  cancelled: { label:'已取消', cls:'badge-archived', icon:'ti-ban' },
};

const PURCHASE_PAY_STATUS = {
  unpaid: { label:'未付款', cls:'pay-badge-unpaid' },
  paid:   { label:'已付款', cls:'pay-badge-paid' },
};

function puStatusBadge(status){
  const s = PURCHASE_STATUS[status] || PURCHASE_STATUS.draft;
  return `<span class="status-badge ${s.cls}"><i class="ti ${s.icon}"></i> ${s.label}</span>`;
}

function puPayBadge(payStatus){
  const s = PURCHASE_PAY_STATUS[payStatus] || PURCHASE_PAY_STATUS.unpaid;
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── 列表 ──
let _puFilter = 'all';

function initPurchasePage(){
  const el = document.getElementById('purchase-content');
  if(!el) return;
  el.innerHTML = `
    <div class="filter-tabs" style="margin:-4px -4px 10px;">
      <button class="ftab active" onclick="renderPurchaseList('all')">全部</button>
      <button class="ftab" onclick="renderPurchaseList('draft')">草稿</button>
      <button class="ftab" onclick="renderPurchaseList('ordered')">待收貨</button>
      <button class="ftab" onclick="renderPurchaseList('received')">已入庫</button>
      <button class="ftab" onclick="renderPurchaseList('unpaid')">未付款</button>
    </div>
    <div id="purchase-list-container"></div>
    <button class="confirm-btn" style="background:var(--green);margin-top:8px;"
      onclick="newPurchase()">
      <i class="ti ti-plus"></i> 新增採購單
    </button>`;
  renderPurchaseList('all');
}

function renderPurchaseList(filter){
  _puFilter = filter || 'all';
  const tabs    = document.querySelectorAll('#purchase-content .ftab');
  const filters = ['all','draft','ordered','received','unpaid'];
  tabs.forEach((btn, i) => btn.classList.toggle('active', filters[i] === _puFilter));

  const el = document.getElementById('purchase-list-container');
  if(!el) return;

  let list = [...purchases].reverse();
  if(_puFilter === 'unpaid'){
    list = list.filter(p =>
      (p.status === 'ordered' || p.status === 'received' || p.status === 'completed')
      && p.payStatus !== 'paid'
    );
  } else if(_puFilter === 'received'){
    list = list.filter(p => p.status === 'received' || p.status === 'completed');
  } else if(_puFilter !== 'all'){
    list = list.filter(p => p.status === _puFilter);
  }

  if(!list.length){
    el.innerHTML = '<div class="order-empty">沒有符合的採購單</div>';
    return;
  }

  el.innerHTML = list.map(pu => {
    const sup      = SUPPLIERS.find(s => s.id === pu.supplierId);
    const itemsStr = (pu.items||[]).slice(0,2).map(i=>i.name).join('、')
      + ((pu.items||[]).length > 2 ? ` 等${pu.items.length}項` : '');
    const showPay  = pu.status === 'ordered' || pu.status === 'received' || pu.status === 'completed';
    return `<div class="list-card" onclick="showPurchaseDetail('${pu.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${pu.no}</span>
        <div style="display:flex;gap:6px;">
          ${puStatusBadge(pu.status)}
          ${showPay ? puPayBadge(pu.payStatus) : ''}
        </div>
      </div>
      <div class="list-card-meta">
        ${sup ? `<span><i class="ti ti-building-store"></i>${sup.name}</span>` : ''}
        <span><i class="ti ti-calendar"></i>${fmtDate(pu.createdAt)}</span>
        ${pu.expectedDate ? `<span><i class="ti ti-clock"></i>預計 ${fmtDate(pu.expectedDate)}</span>` : ''}
      </div>
      <div class="list-card-items">${itemsStr || '無品項'}</div>
      <div class="list-card-footer">
        <span class="list-card-amount">${fmtMoney(pu.totalCost||0)}</span>
      </div>
    </div>`;
  }).join('');
}

// ── 新增採購單 ──
let _currentPurchase = null;

function newPurchase(){
  _currentPurchase = {
    id:           null,
    no:           genPurchaseNo(),
    supplierId:   null,
    locationId:   getMainLocation?.()?.id || 'store_A',
    items:        [],
    totalCost:    0,
    remark:       '',
    status:       'draft',
    payStatus:    'unpaid',
    expectedDate: '',
    orderedAt:    '',
    receivedAt:   '',
    createdAt:    todayStr(),
    updatedAt:    todayStr(),
  };
  renderPurchaseEditPage();
  showPage('purchase-edit');
}

function showPurchaseDetail(id){
  const pu = getPurchase(id);
  if(!pu) return;
  _currentPurchase = JSON.parse(JSON.stringify(pu));
  renderPurchaseEditPage();
  showPage('purchase-edit');
}

// ── 編輯頁 ──
function renderPurchaseEditPage(){
  const page = document.getElementById('page-purchase-edit');
  if(!page) return;
  const pu         = _currentPurchase;
  const sup        = SUPPLIERS.find(s => s.id === pu.supplierId);
  const isReceived = pu.status === 'received' || pu.status === 'completed';
  const isOrdered  = pu.status === 'ordered';
  const isDraft    = pu.status === 'draft' || !pu.status;
  const isEditable = isDraft || isAdmin();  // 管理員可強制編輯任何狀態

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('purchase')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${pu.id ? pu.no : '新增採購單'}</div>
      ${isEditable
        ? `<button class="small-btn green-btn" onclick="savePurchaseDraft()">
             <i class="ti ti-device-floppy"></i> 儲存
           </button>`
        : '<span></span>'}
    </div>

    <div class="form-card">
      <div class="form-meta-row">
        <span class="form-no">${pu.no}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${puStatusBadge(pu.status)}
          ${!isDraft ? puPayBadge(pu.payStatus) : ''}
        </div>
      </div>

      <!-- 廠商 -->
      <div class="form-section-title">廠商</div>
      <button class="customer-select-btn" ${!isEditable ? 'disabled' : ''}
        onclick="openSupplierPicker()">
        <i class="ti ti-building-store"></i>
        <span id="pu-supplier-name">${sup ? sup.name : '選擇廠商'}</span>
        <i class="ti ti-chevron-right" style="margin-left:auto;"></i>
      </button>
      ${sup ? `<div id="pu-supplier-info" class="customer-info-box" style="margin-top:6px;">
        ${_getSupplierInfoLines(pu.supplierId)}
      </div>` : ''}

      <!-- 入庫地點 -->
      <div class="cust-field" style="margin-top:12px;">
        <label>入庫地點</label>
        <select id="pu-location" ${!isEditable && !isOrdered ? 'disabled' : ''}
          onchange="_currentPurchase.locationId=this.value">
          ${getStoreLocations().map(loc =>
            `<option value="${loc.id}" ${pu.locationId===loc.id?'selected':''}>${loc.name}</option>`
          ).join('')}
        </select>
      </div>

      <!-- 品項 -->
      <div class="form-section-title" style="margin-top:10px;">進貨品項</div>
      ${isEditable ? `
      <div class="search-bar">
        <i class="ti ti-search"></i>
        <input type="search" id="purchase-search"
          placeholder="搜尋可進貨品項（原料、包材等）..."
          oninput="searchItemsFor('purchase',this.value)" />
      </div>
      <div id="purchase-search-result" style="display:none;"></div>` : ''}
      <div class="order-list-header">
        <span class="order-list-title">進貨清單</span>
        <span class="order-count" id="pu-item-count">${pu.items.length} 項</span>
      </div>
      <div class="order-list" id="pu-item-list"></div>

      <!-- 採購總金額 -->
      <div class="amount-section" style="margin-top:12px;">
        <div class="amount-row grand">
          <span>採購總金額</span>
          <strong id="pu-total">${fmtMoney(pu.totalCost||0)}</strong>
        </div>
      </div>

      <!-- 預計到貨日 -->
      <div class="cust-field" style="margin-top:10px;">
        <label>預計到貨日</label>
        <input type="date" id="pu-expected-date" value="${pu.expectedDate||''}"
          ${isReceived ? 'disabled' : ''} />
      </div>

      <!-- 備註 -->
      <div class="cust-field">
        <label>備註</label>
        <textarea id="pu-remark" rows="2"
          ${isReceived ? 'disabled' : ''}>${pu.remark||''}</textarea>
      </div>

      <!-- 付款狀態（下單後才顯示）-->
      ${!isDraft ? `
      <div class="form-section-title" style="margin-top:14px;">付款</div>
      <div class="amount-section">
        <div class="amount-row">
          <span>付款狀態</span>
          <div style="display:flex;gap:6px;">
            <button class="pay-status-btn ${pu.payStatus!=='paid'?'active':''}"
              id="pu-pay-unpaid" onclick="setPuPayStatus('unpaid')">未付款</button>
            <button class="pay-status-btn ${pu.payStatus==='paid'?'active':''}"
              id="pu-pay-paid" onclick="setPuPayStatus('paid')">已付款</button>
          </div>
        </div>
      </div>` : ''}
    </div>

    <!-- 進度時間軸 -->
    ${pu.id ? _renderPurchaseTimeline(pu) : ''}

    <!-- 操作按鈕 -->
    ${isDraft ? `
    <button class="confirm-btn" style="background:var(--green);margin-top:8px;"
      onclick="submitPurchaseOrder()">
      <i class="ti ti-send"></i> 送出採購單（向廠商下單）
    </button>` : ''}
    ${isOrdered ? `
    <button class="confirm-btn" style="background:var(--purple);margin-top:8px;"
      onclick="receivePurchaseStock()">
      <i class="ti ti-package-import"></i> 確認到貨入庫
    </button>` : ''}
    ${(isOrdered || isDraft) ? `
    <button class="redit-btn"
      style="margin-top:8px;color:var(--red);border-color:var(--red);"
      onclick="cancelPurchase('${pu.id||''}')">
      <i class="ti ti-ban"></i> 取消採購單
    </button>` : ''}
    ${isAdmin() && pu.id ? `
    <button class="redit-btn" style="margin-top:8px;color:var(--red);border-color:var(--red);"
      onclick="requireAdmin(()=>hardDeletePurchase('${pu.id}'),'永久刪除採購單需要管理員權限')">
      <i class="ti ti-trash"></i> 永久刪除採購單
    </button>` : ''}`;

  renderPuItems();
}

function _getSupplierInfoLines(id){
  if(!id) return '無聯絡資料';
  const extra = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
  return [
    extra.contact ? `👤 ${extra.contact}` : '',
    extra.tel     ? `📞 ${extra.tel}`     : '',
    extra.email   ? `✉️ ${extra.email}`   : '',
  ].filter(Boolean).join('<br>') || '無聯絡資料';
}

function _renderPurchaseTimeline(pu){
  const steps = [
    { label:'建立草稿',   time: pu.createdAt,  done: true },
    { label:'送出採購單', time: pu.orderedAt,   done: !!pu.orderedAt },
    { label:'到貨入庫',   time: pu.receivedAt,  done: !!pu.receivedAt
        || pu.status==='completed' },
  ];
  const rows = steps.map((s, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;
      ${i<steps.length-1?'border-bottom:1px solid var(--border);':''}">
      <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;
        background:${s.done?'var(--green)':'var(--border)'};"></div>
      <span style="font-size:13px;color:${s.done?'var(--text)':'var(--text3)'};">
        ${s.label}
      </span>
      <span style="font-size:12px;color:var(--text3);margin-left:auto;">
        ${s.time ? fmtDate(s.time) : '—'}
      </span>
    </div>`).join('');
  return `<div class="form-card" style="margin-top:8px;">
    <div class="form-section-title">進度</div>
    ${rows}
  </div>`;
}

// ── 品項管理 ──
function addPurchaseItem(productId){
  const item = getItem(productId);
  if(!item || !_currentPurchase) return;
  const existing = _currentPurchase.items.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _currentPurchase.items.push({
      id:       productId,
      name:     item.name,
      emoji:    item.emoji,
      qty:      1,
      unitCost: item.costPrice || 0,
    });
  }
  renderPuItems();
  calcPuTotal();
}

function removePurchaseItem(idx){
  if(!_currentPurchase) return;
  _currentPurchase.items.splice(idx, 1);
  renderPuItems();
  calcPuTotal();
}

function changePurchaseQty(idx, delta){
  const item = _currentPurchase?.items[idx];
  if(item) item.qty = Math.max(1, item.qty + delta);
  renderPuItems();
  calcPuTotal();
}

function changePurchaseCost(idx, val){
  const item = _currentPurchase?.items[idx];
  if(item){ item.unitCost = parseInt(val) || 0; calcPuTotal(); }
}

function renderPuItems(){
  const el    = document.getElementById('pu-item-list');
  const count = document.getElementById('pu-item-count');
  if(!el || !_currentPurchase) return;
  const items      = _currentPurchase.items;
  const isEditable = _currentPurchase.status === 'draft' || !_currentPurchase.status || isAdmin();
  if(count) count.textContent = items.length + ' 項';
  if(!items.length){
    el.innerHTML = '<div class="order-empty">請搜尋商品加入進貨清單</div>';
    return;
  }
  el.innerHTML = items.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;">進貨價</span>
          ${isEditable
            ? `<input type="number" class="unit-price-input" value="${item.unitCost}" min="0"
                 onchange="changePurchaseCost(${idx},this.value)" onclick="this.select()" />`
            : `<span style="font-weight:700;">$${item.unitCost}</span>`}
        </div>
      </div>
      <div class="qty-ctrl">
        ${isEditable
          ? `<button class="qty-btn" onclick="changePurchaseQty(${idx},-1)">−</button>
             <span class="qty-num">${item.qty}</span>
             <button class="qty-btn" onclick="changePurchaseQty(${idx},1)">＋</button>`
          : `<span class="qty-num">${item.qty}</span>`}
      </div>
      ${isEditable
        ? `<button class="order-del" onclick="removePurchaseItem(${idx})">
             <i class="ti ti-x"></i>
           </button>`
        : ''}
    </div>`).join('');
}

function calcPuTotal(){
  if(!_currentPurchase) return;
  const total = _currentPurchase.items.reduce((s,i) => s + (i.unitCost||0) * i.qty, 0);
  _currentPurchase.totalCost = total;
  const el = document.getElementById('pu-total');
  if(el) el.textContent = fmtMoney(total);
}

// ── 收集表單 ──
function collectPurchaseForm(){
  if(!_currentPurchase) return;
  _currentPurchase.expectedDate = document.getElementById('pu-expected-date')?.value || '';
  _currentPurchase.remark       = document.getElementById('pu-remark')?.value.trim() || '';
  _currentPurchase.locationId   = document.getElementById('pu-location')?.value
                                 || _currentPurchase.locationId;
  _currentPurchase.updatedAt    = todayStr();
  calcPuTotal();
}

// ── upsert ──
function upsertPurchase(){
  if(!_currentPurchase.id) _currentPurchase.id = 'PU' + Date.now();
  const idx  = purchases.findIndex(p => p.id === _currentPurchase.id);
  const copy = JSON.parse(JSON.stringify(_currentPurchase));
  if(idx >= 0) purchases[idx] = copy;
  else         purchases.push(copy);
  savePurchases();
}

// ── 儲存草稿 ──
function savePurchaseDraft(){
  if(!_currentPurchase.items.length){ showToast('⚠️ 請先加入品項'); return; }
  collectPurchaseForm();
  upsertPurchase();
  renderPurchaseList(_puFilter);
  showToast('📝 採購單已儲存：' + _currentPurchase.no);
}

// ── 送出採購單（草稿 → 已下單，不入庫）──
function submitPurchaseOrder(){
  if(!_currentPurchase.supplierId){ showToast('⚠️ 請先選擇廠商'); return; }
  if(!_currentPurchase.items.length){ showToast('⚠️ 請先加入品項'); return; }
  collectPurchaseForm();
  _currentPurchase.status    = 'ordered';
  _currentPurchase.orderedAt = todayStr();
  upsertPurchase();
  renderPurchaseList(_puFilter);
  renderPurchaseEditPage();
  showToast('✅ 採購單已下單，等待到貨：' + _currentPurchase.no);
}

// ── 確認到貨入庫（已下單 → 已入庫，此時才異動庫存）──
function receivePurchaseStock(){
  if(!_currentPurchase) return;
  const pu    = _currentPurchase;
  collectPurchaseForm();
  const locId = pu.locationId || getMainLocation()?.id || 'store_A';
  const loc   = getStoreLocations().find(l => l.id === locId);
  const lines = pu.items.map(i => `・${i.emoji} ${i.name} × ${i.qty}`).join('\n');
  if(!confirm(`確認以下商品到貨，入庫至「${loc?.name||locId}」？\n\n${lines}`)) return;

  pu.status     = 'received';
  pu.receivedAt = nowStr();

  adjustStockBatch(
    pu.items.map(i => ({ productId: i.id, qty: i.qty })),
    locId,
    'in',
    { op:'purchase', refId: pu.id, refType:'purchase', note:`採購單入庫 ${pu.no}` }
  );

  upsertPurchase();
  renderPurchaseList(_puFilter);
  renderPurchaseEditPage();
  showToast(`📦 ${pu.items.length} 種商品已入庫：${pu.no}`);

  // 提示登錄效期
  _openExpiryAfterReceive(pu);
}

function _openExpiryAfterReceive(pu){
  const existing = document.getElementById('expiryAfterReceiveModal');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id        = 'expiryAfterReceiveModal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) modal.remove(); };

  const rows = pu.items.map((item, idx) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:20px;flex-shrink:0;">${item.emoji}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;">${item.name}</div>
        <div style="font-size:11px;color:var(--text3);">× ${item.qty}</div>
      </div>
      <input type="date" id="ear-exp-${idx}"
        style="width:130px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:13px;"
        placeholder="選填" />
    </div>`).join('');

  modal.innerHTML = `
    <div class="modal-card" style="max-width:400px;">
      <div class="modal-title"><i class="ti ti-calendar-event"></i> 登錄效期（選填）</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:10px;">
        有效期限的商品請填入日期，不需追蹤的留空即可。
      </div>
      <div style="max-height:300px;overflow-y:auto;">${rows}</div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="modal-cancel-btn" style="flex:1;" onclick="document.getElementById('expiryAfterReceiveModal').remove()">跳過</button>
        <button class="confirm-btn" style="flex:1;padding:10px;"
          onclick="_saveExpiryFromReceive(${JSON.stringify(pu.items).replace(/"/g,'&quot;')})">
          <i class="ti ti-check"></i> 儲存效期
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function _saveExpiryFromReceive(items){
  loadBatches();
  let saved = 0;
  items.forEach((item, idx) => {
    const expiryDate = document.getElementById(`ear-exp-${idx}`)?.value;
    if(!expiryDate) return;
    _batches.push({
      id:          'B' + Date.now() + idx,
      productId:   item.id,
      productName: item.name,
      emoji:       item.emoji || '📦',
      unit:        item.unit  || '個',
      expiryDate,
      qty:         item.qty,
      note:        `採購單入庫`,
      addedAt:     todayStr(),
      consumed:    false,
    });
    saved++;
  });
  saveBatches();
  document.getElementById('expiryAfterReceiveModal')?.remove();
  if(saved > 0){
    showToast(`✅ 已登錄 ${saved} 項效期批次`);
  } else {
    showToast('已跳過效期登錄');
  }
}

// ── 付款狀態 ──
function setPuPayStatus(status){
  if(!_currentPurchase) return;
  _currentPurchase.payStatus = status;
  _currentPurchase.updatedAt = todayStr();
  ['unpaid','paid'].forEach(s =>
    document.getElementById(`pu-pay-${s}`)?.classList.toggle('active', s === status));
  upsertPurchase();
  renderPurchaseList(_puFilter);
  showToast(status === 'paid' ? '✅ 已標記付款' : '已更新為未付款');
}

// ── 取消採購單 ──
function cancelPurchase(id){
  const pu = (id && id !== 'null') ? getPurchase(id) : _currentPurchase;
  if(!pu) return;
  if(pu.status === 'received' || pu.status === 'completed'){
    showToast('⚠️ 已入庫的採購單無法取消'); return;
  }
  if(!confirm(`確定取消採購單 ${pu.no}？`)) return;

  if(!pu.id){
    // 尚未存過的草稿，直接離開
    showPage('purchase'); return;
  }
  pu.status    = 'cancelled';
  pu.updatedAt = todayStr();
  const idx = purchases.findIndex(p => p.id === pu.id);
  if(idx >= 0) purchases[idx] = pu;
  savePurchases();
  renderPurchaseList(_puFilter);
  showToast('❌ 採購單已取消：' + pu.no);
  showPage('purchase');
}

// ── 廠商選擇 Modal ──
let _supplierPickerActive = false;

function openSupplierPicker(){
  _supplierPickerActive = true;
  renderSupplierPickerList('');
  const modal = document.getElementById('supplierPickerModal');
  if(modal) modal.style.display = 'flex';
}

function renderSupplierPickerList(q){
  const el = document.getElementById('supplier-picker-list');
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
  }).join('') || '<div class="order-empty">找不到廠商</div>';
}

function pickSupplier(id){
  const s = SUPPLIERS.find(sup => sup.id === id);
  if(!s) return;
  if(_currentPurchase) _currentPurchase.supplierId = id;

  const nameEl = document.getElementById('pu-supplier-name');
  if(nameEl) nameEl.textContent = s.name;

  const infoEl = document.getElementById('pu-supplier-info');
  if(infoEl){
    infoEl.innerHTML     = _getSupplierInfoLines(id);
    infoEl.style.display = 'block';
  } else {
    renderPurchaseEditPage();
  }
  document.getElementById('supplierPickerModal').style.display = 'none';
}

function initSupplierPickerModal(){
  if(document.getElementById('supplierPickerModal')) return;
  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'supplierPickerModal';
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

// ── 管理員永久刪除採購單 ──
function hardDeletePurchase(id){
  if(!confirm('確定永久刪除此採購單？此操作無法復原。')) return;
  purchases = purchases.filter(p => p.id !== id);
  savePurchases();
  showToast('🗑️ 採購單已刪除');
  renderPurchaseList(_puFilter);
  showPage('purchase');
}

// ── 舊版相容（report.js 呼叫）──
function renderPurchaseHistory(){}
function confirmPurchase(){ showToast('請使用新版採購單流程'); }

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', () => {
  initSupplierPickerModal();
});
