// ============================================================
// processing.js — 加工日報（每批次一張）
// ============================================================

let processingLogs = JSON.parse(localStorage.getItem('erp_processing_logs') || '[]');

function saveProcessingLogs(){
  localStorage.setItem('erp_processing_logs', JSON.stringify(processingLogs));
  if(typeof pushToFirebase === 'function') pushToFirebase('processingLogs', processingLogs);
}

function getProcessingLog(id){ return processingLogs.find(p => p.id === id) || null; }
function genProcNo(){ return genNo('PL', processingLogs, 'no'); }

// ── 狀態設定 ──
const PROC_STATUSES = {
  draft:     { label:'草稿',   color:'#718096', bg:'#EDF2F7', icon:'ti-pencil' },
  confirmed: { label:'已確認', color:'#1D9E75', bg:'#E1F5EE', icon:'ti-circle-check' },
};

function procStatusBadge(status){
  const s = PROC_STATUSES[status] || PROC_STATUSES.draft;
  return `<span class="status-badge" style="background:${s.bg};color:${s.color};">
    <i class="ti ${s.icon}"></i> ${s.label}
  </span>`;
}

// ── 列表頁 ──
let _procFilter = 'all';

function initProcessingPage(){
  const page = document.getElementById('page-processing');
  if(!page) return;

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('factory-menu')">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="op-title">
        <i class="ti ti-clipboard-list" style="color:#1D9E75;"></i> 加工日報
      </div>
      <button class="small-btn green-btn" onclick="openNewProcModal()">
        <i class="ti ti-plus"></i> 新增
      </button>
    </div>

    <div class="filter-tabs">
      <button class="ftab active" onclick="renderProcList('all',this)">全部</button>
      <button class="ftab" onclick="renderProcList('draft',this)">草稿</button>
      <button class="ftab" onclick="renderProcList('confirmed',this)">已確認</button>
    </div>
    <div id="proc-list"></div>`;

  renderProcList('all');
}

function renderProcList(filter, btn){
  if(filter) _procFilter = filter;
  if(btn){
    document.querySelectorAll('#page-processing .ftab')
      .forEach(b => b.classList.toggle('active', b === btn));
  }

  const el = document.getElementById('proc-list');
  if(!el) return;

  let list = _procFilter === 'all'
    ? processingLogs
    : processingLogs.filter(p => p.status === _procFilter);
  list = list.slice().reverse();

  if(!list.length){
    el.innerHTML = `<div class="order-empty">尚無加工日報</div>`;
    return;
  }

  el.innerHTML = list.map(p => {
    const inStr  = (p.inputs||[]).slice(0,2).map(i=>i.name).join('、')
      + ((p.inputs||[]).length > 2 ? ` 等${p.inputs.length}項` : '');
    const outStr = (p.outputs||[]).slice(0,2).map(i=>i.name).join('、')
      + ((p.outputs||[]).length > 2 ? ` 等${p.outputs.length}項` : '');
    const totalOut = (p.outputs||[]).reduce((s,i)=>s+(i.qty||0),0);

    return `<div class="list-card" onclick="openProcDetail('${p.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${p.no}</span>
        ${procStatusBadge(p.status)}
      </div>
      <div class="list-card-meta">
        <span><i class="ti ti-calendar"></i>${fmtDate(p.date)}</span>
        ${p.worker ? `<span><i class="ti ti-user"></i>${p.worker}</span>` : ''}
        ${p.lossRate != null ? `<span style="color:var(--amber)"><i class="ti ti-percentage"></i>損耗 ${p.lossRate}%</span>` : ''}
      </div>
      ${inStr ? `<div class="list-card-items" style="color:var(--text3);font-size:12px;">投入：${inStr}</div>` : ''}
      <div class="list-card-items">產出：${outStr || '（無）'} ×${totalOut}</div>
    </div>`;
  }).join('');
}

// ── 新增 Modal ──
let _currentProc = null;

function openNewProcModal(){
  _currentProc = {
    id:         null,
    no:         genProcNo(),
    date:       todayStr(),
    worker:     '',
    status:     'draft',
    inputs:     [],
    outputs:    [],
    lossQty:    null,
    lossRate:   null,
    lossNote:   '',
    note:       '',
  };
  _renderProcModal();
}

function openEditProcModal(id){
  const p = getProcessingLog(id);
  if(!p) return;
  if(p.status === 'confirmed' && !isAdmin()){
    showToast('⚠️ 已確認的日報僅管理員可修改'); return;
  }
  _currentProc = JSON.parse(JSON.stringify(p));
  _renderProcModal();
}

function _renderProcModal(){
  document.getElementById('procModal')?.remove();

  const p    = _currentProc;
  const locs = typeof getStoreLocations === 'function' ? getStoreLocations() : [];
  const defaultLocId = locs[0]?.id || 'store_A';

  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'procModal';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) _closeProcModal(); };

  modal.innerHTML = `
    <div class="modal-card" style="max-width:520px;max-height:92vh;overflow-y:auto;">
      <div class="modal-title">
        <i class="ti ti-clipboard-list"></i> ${p.id ? '編輯' : '新增'}加工日報
        <span style="font-size:13px;color:var(--text3);margin-left:8px;">${p.no}</span>
      </div>

      <!-- 基本資訊 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div class="cust-field">
          <label>加工日期</label>
          <input type="date" id="proc-date" value="${p.date}" />
        </div>
        <div class="cust-field">
          <label>作業員</label>
          <input type="text" id="proc-worker" value="${p.worker}" placeholder="姓名（可空白）" />
        </div>
      </div>

      <!-- ── 投入原料 ── -->
      <div class="form-section-title" style="margin-top:4px;">
        <i class="ti ti-arrow-down-circle" style="color:var(--amber);"></i> 投入原料
      </div>
      <div class="search-bar" style="margin-bottom:4px;">
        <i class="ti ti-search"></i>
        <input type="search" id="proc-in-search" placeholder="搜尋原料 / 半成品..." />
      </div>
      <div id="proc-in-list" style="margin-bottom:12px;"></div>

      <!-- ── 產出成品 ── -->
      <div class="form-section-title">
        <i class="ti ti-arrow-up-circle" style="color:var(--green);"></i> 產出成品
      </div>
      <div class="search-bar" style="margin-bottom:4px;">
        <i class="ti ti-search"></i>
        <input type="search" id="proc-out-search" placeholder="搜尋成品 / 包裝品..." />
      </div>
      <div id="proc-out-list" style="margin-bottom:12px;"></div>

      <!-- ── 損耗記錄 ── -->
      <div class="form-section-title">
        <i class="ti ti-alert-triangle" style="color:var(--red);"></i> 損耗記錄
      </div>
      <div id="proc-loss-calc" style="margin-bottom:6px;"></div>
      <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;margin-bottom:8px;">
        <div class="cust-field">
          <label>損耗率 %</label>
          <input type="number" id="proc-loss-rate" min="0" max="100" step="0.1"
            value="${p.lossRate ?? ''}" placeholder="0"
            oninput="_updateProcLossDisplay()" />
        </div>
        <div class="cust-field">
          <label>損耗說明</label>
          <input type="text" id="proc-loss-note" value="${p.lossNote}"
            placeholder="例：分裝破損、茶葉粉末散落..." />
        </div>
      </div>

      <!-- ── 備註 ── -->
      <div class="cust-field">
        <label>備註</label>
        <textarea id="proc-note" rows="2" placeholder="（可空白）">${p.note}</textarea>
      </div>

      <div class="modal-actions" style="margin-top:14px;">
        <button class="modal-ok-btn" onclick="submitProc('confirmed')">
          <i class="ti ti-check"></i> 確認並扣庫存
        </button>
        <button class="redit-btn" onclick="submitProc('draft')">
          <i class="ti ti-device-floppy"></i> 暫存草稿
        </button>
        <button class="modal-cancel-btn" onclick="_closeProcModal()">取消</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  _renderProcInputList();
  _renderProcOutputList();
  _updateProcLossDisplay();
  _attachProcSearches(defaultLocId);
}

// ── 搜尋框綁定 ──
function _attachProcSearches(defaultLocId){
  const inEl  = document.getElementById('proc-in-search');
  const outEl = document.getElementById('proc-out-search');
  if(!inEl || !outEl) return;

  SmartSearch.attach(inEl, item => _addProcItem('input', item, defaultLocId), {
    pool: getMaterialItems(),
  });
  SmartSearch.attach(outEl, item => _addProcItem('output', item, defaultLocId), {
    pool: getSellableItems(),
  });
}

// ── 投入 / 產出品項管理 ──
function _addProcItem(side, item, defaultLocId){
  if(!_currentProc) return;
  const list   = side === 'input' ? _currentProc.inputs : _currentProc.outputs;
  const locs   = typeof getStoreLocations === 'function' ? getStoreLocations() : [];
  const locId  = locs[0]?.id || defaultLocId;
  const existing = list.find(i => i.itemId === item.id);
  if(existing){
    existing.qty++;
  } else {
    list.push({ itemId: item.id, name: item.name, emoji: item.emoji || '📦', qty: 1, locationId: locId });
  }
  if(side === 'input'){
    document.getElementById('proc-in-search').value = '';
    _renderProcInputList();
  } else {
    document.getElementById('proc-out-search').value = '';
    _renderProcOutputList();
  }
  _updateProcLossDisplay();
}

function _changeProcItemQty(side, idx, delta){
  if(!_currentProc) return;
  const list = side === 'input' ? _currentProc.inputs : _currentProc.outputs;
  list[idx].qty = Math.max(1, (list[idx].qty || 1) + delta);
  if(side === 'input') _renderProcInputList(); else _renderProcOutputList();
  _updateProcLossDisplay();
}

function _setProcItemQty(side, idx, val){
  if(!_currentProc) return;
  const list = side === 'input' ? _currentProc.inputs : _currentProc.outputs;
  list[idx].qty = Math.max(1, parseInt(val) || 1);
  _updateProcLossDisplay();
}

function _setProcItemLoc(side, idx, locId){
  if(!_currentProc) return;
  const list = side === 'input' ? _currentProc.inputs : _currentProc.outputs;
  list[idx].locationId = locId;
}

function _removeProcItem(side, idx){
  if(!_currentProc) return;
  if(side === 'input') _currentProc.inputs.splice(idx, 1);
  else _currentProc.outputs.splice(idx, 1);
  if(side === 'input') _renderProcInputList(); else _renderProcOutputList();
  _updateProcLossDisplay();
}

function _renderProcItemList(side){
  const id   = side === 'input' ? 'proc-in-list' : 'proc-out-list';
  const list = side === 'input' ? _currentProc.inputs : _currentProc.outputs;
  const el   = document.getElementById(id);
  if(!el || !_currentProc) return;

  const locs = typeof getStoreLocations === 'function' ? getStoreLocations() : [];
  const color = side === 'input' ? 'var(--amber)' : 'var(--green)';

  if(!list.length){
    el.innerHTML = `<div class="order-empty" style="padding:8px 0;font-size:13px;">尚未加入品項</div>`;
    return;
  }

  el.innerHTML = list.map((item, idx) => {
    const stock = typeof getTotalStock === 'function' ? getTotalStock(item.itemId) : 0;
    const locOpts = locs.map(l =>
      `<option value="${l.id}" ${item.locationId===l.id?'selected':''}>${l.name}</option>`
    ).join('');
    return `<div class="order-row" style="flex-wrap:wrap;gap:4px;padding:8px;">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info" style="flex:1;min-width:100px;">
        <div class="order-name" style="font-size:13px;">${item.name}</div>
        <div class="order-id" style="font-size:11px;color:var(--text3);">庫存 ${stock}</div>
      </div>
      <select onchange="_setProcItemLoc('${side}',${idx},this.value)"
        style="font-size:12px;padding:3px 6px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);">
        ${locOpts}
      </select>
      <div class="qty-ctrl" style="gap:4px;">
        <button class="qty-btn" onclick="_changeProcItemQty('${side}',${idx},-1)">−</button>
        <input type="number" value="${item.qty}" min="1"
          style="width:52px;text-align:center;font-weight:700;color:${color};border:1px solid ${color};border-radius:4px;padding:2px 4px;"
          onchange="_setProcItemQty('${side}',${idx},this.value)"
          oninput="_setProcItemQty('${side}',${idx},this.value)" />
        <button class="qty-btn" onclick="_changeProcItemQty('${side}',${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="_removeProcItem('${side}',${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`;
  }).join('');
}

function _renderProcInputList()  { _renderProcItemList('input');  }
function _renderProcOutputList() { _renderProcItemList('output'); }

// ── 損耗自動計算顯示 ──
function _updateProcLossDisplay(){
  const el = document.getElementById('proc-loss-calc');
  if(!el || !_currentProc) return;

  const totalIn  = _currentProc.inputs.reduce((s,i)=>s+(i.qty||0),0);
  const totalOut = _currentProc.outputs.reduce((s,i)=>s+(i.qty||0),0);

  if(!totalIn && !totalOut){ el.innerHTML = ''; return; }

  // 只有單一品項投入 + 單一品項產出時才嘗試自動計算損耗率
  let autoRate = null;
  if(_currentProc.inputs.length === 1 && _currentProc.outputs.length === 1){
    const inQty  = _currentProc.inputs[0].qty || 0;
    const outQty = _currentProc.outputs[0].qty || 0;
    if(inQty > 0) autoRate = Math.max(0, ((inQty - outQty) / inQty * 100)).toFixed(1);
    // 自動填入損耗率（如果使用者沒手動填）
    const lossInput = document.getElementById('proc-loss-rate');
    if(lossInput && !lossInput.value && autoRate !== null){
      lossInput.value = autoRate;
    }
  }

  const rateEl = document.getElementById('proc-loss-rate');
  const rate   = rateEl ? parseFloat(rateEl.value) : null;

  el.innerHTML = `<div style="background:var(--bg2);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;display:flex;gap:16px;flex-wrap:wrap;">
    <span style="color:var(--amber);">⬇ 投入共 <strong>${totalIn}</strong></span>
    <span style="color:var(--green);">⬆ 產出共 <strong>${totalOut}</strong></span>
    ${autoRate !== null
      ? `<span style="color:var(--red);">損耗 <strong>${autoRate}%</strong>（自動計算）</span>`
      : (rate ? `<span style="color:var(--red);">損耗率 <strong>${rate}%</strong></span>` : '')
    }
  </div>`;
}

function _closeProcModal(){
  document.getElementById('procModal')?.remove();
  _currentProc = null;
}

// ── 提交（草稿 or 確認）──
function submitProc(targetStatus){
  if(!_currentProc) return;

  // 讀取表單
  _currentProc.date     = document.getElementById('proc-date')?.value    || todayStr();
  _currentProc.worker   = document.getElementById('proc-worker')?.value?.trim() || '';
  _currentProc.lossRate = parseFloat(document.getElementById('proc-loss-rate')?.value) || null;
  _currentProc.lossNote = document.getElementById('proc-loss-note')?.value?.trim() || '';
  _currentProc.note     = document.getElementById('proc-note')?.value?.trim() || '';
  _currentProc.status   = targetStatus;

  if(targetStatus === 'confirmed'){
    // 驗證
    if(!_currentProc.inputs.length && !_currentProc.outputs.length){
      showToast('⚠️ 請加入投入或產出品項'); return;
    }

    // 庫存檢查（投入品項）
    const overStock = _currentProc.inputs.filter(item => {
      const avail = typeof getStock === 'function'
        ? getStock(item.itemId, item.locationId)
        : (typeof getTotalStock === 'function' ? getTotalStock(item.itemId) : 0);
      return item.qty > avail;
    });
    if(overStock.length){
      const msg = overStock.map(i =>
        `${i.name}（需 ${i.qty}，現有 ${
          typeof getStock === 'function' ? getStock(i.itemId, i.locationId) : '?'
        }）`
      ).join('\n');
      if(!confirm(`以下投入品項庫存不足：\n${msg}\n\n仍要確認？`)) return;
    }

    // 如果是已確認的舊單在重新儲存，先反轉原庫存（簡易版：不反轉，直接覆蓋）
    // TODO: 若有需要支援修改已確認日報，需在此先 reverse 原 adjustStock

    // 扣減投入庫存
    _currentProc.inputs.forEach(item => {
      if(typeof adjustStock === 'function'){
        adjustStock(item.itemId, item.locationId, -item.qty, {
          op:      'proc_in',
          refId:   _currentProc.no,
          refType: 'processing',
          note:    `加工投入 ${_currentProc.no}`,
        });
      }
    });

    // 新增產出庫存
    _currentProc.outputs.forEach(item => {
      if(typeof adjustStock === 'function'){
        adjustStock(item.itemId, item.locationId, +item.qty, {
          op:      'proc_out',
          refId:   _currentProc.no,
          refType: 'processing',
          note:    `加工產出 ${_currentProc.no}`,
        });
      }
    });

    _currentProc.confirmedAt = todayStr();
  }

  // 儲存
  const existIdx = processingLogs.findIndex(p => p.id === _currentProc.id);
  if(existIdx >= 0){
    processingLogs[existIdx] = _currentProc;
  } else {
    _currentProc.id = 'PL' + Date.now();
    processingLogs.push(_currentProc);
  }
  saveProcessingLogs();

  const label = targetStatus === 'confirmed' ? '確認並扣庫存' : '草稿儲存';
  showToast(`✅ ${label}：${_currentProc.no}`);
  _closeProcModal();
  renderProcList(_procFilter);
}

// ── 詳細檢視 Modal ──
function openProcDetail(id){
  const p = getProcessingLog(id);
  if(!p) return;

  document.getElementById('procDetailModal')?.remove();

  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'procDetailModal';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) modal.remove(); };

  const renderItems = (items, side) => {
    if(!items?.length) return '<div style="color:var(--text3);font-size:13px;padding:4px 0;">（無）</div>';
    const color = side === 'input' ? 'var(--amber)' : 'var(--green)';
    return items.map(item => `
      <div class="order-row" style="cursor:default;">
        <div class="order-emoji">${item.emoji}</div>
        <div class="order-info">
          <div class="order-name">${item.name}</div>
          <div class="order-id">${item.itemId} · ${_locName(item.locationId)}</div>
        </div>
        <div style="font-size:20px;font-weight:700;color:${color};padding-right:8px;">${item.qty}</div>
      </div>`).join('');
  };

  const totalIn  = (p.inputs||[]).reduce((s,i)=>s+(i.qty||0),0);
  const totalOut = (p.outputs||[]).reduce((s,i)=>s+(i.qty||0),0);

  modal.innerHTML = `
    <div class="modal-card" style="max-width:460px;max-height:88vh;overflow-y:auto;">
      <div class="modal-title">
        <i class="ti ti-clipboard-list"></i> ${p.no}
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
        ${procStatusBadge(p.status)}
        <span style="font-size:12px;color:var(--text3);">${fmtDateFull(p.date)}</span>
        ${p.worker ? `<span style="font-size:12px;color:var(--text3);"><i class="ti ti-user"></i> ${p.worker}</span>` : ''}
      </div>

      <div class="amount-section" style="margin-bottom:12px;">
        <div class="amount-row"><span>投入總量</span><strong style="color:var(--amber);">${totalIn}</strong></div>
        <div class="amount-row"><span>產出總量</span><strong style="color:var(--green);">${totalOut}</strong></div>
        ${p.lossRate != null ? `<div class="amount-row"><span>損耗率</span><strong style="color:var(--red);">${p.lossRate}%</strong></div>` : ''}
        ${p.lossNote ? `<div class="amount-row"><span>損耗說明</span><span>${p.lossNote}</span></div>` : ''}
        ${p.confirmedAt ? `<div class="amount-row"><span>確認日期</span><span>${fmtDate(p.confirmedAt)}</span></div>` : ''}
        ${p.note ? `<div class="amount-row"><span>備註</span><span>${p.note}</span></div>` : ''}
      </div>

      <div class="form-section-title" style="margin-bottom:4px;">
        <i class="ti ti-arrow-down-circle" style="color:var(--amber);"></i> 投入原料
      </div>
      ${renderItems(p.inputs, 'input')}

      <div class="form-section-title" style="margin-top:10px;margin-bottom:4px;">
        <i class="ti ti-arrow-up-circle" style="color:var(--green);"></i> 產出成品
      </div>
      ${renderItems(p.outputs, 'output')}

      <div style="display:flex;gap:8px;margin-top:16px;">
        ${p.status === 'draft' || isAdmin() ? `
        <button class="redit-btn" style="flex:1;"
          onclick="document.getElementById('procDetailModal').remove(); openEditProcModal('${p.id}')">
          <i class="ti ti-edit"></i> 編輯
        </button>` : ''}
        ${isAdmin() ? `
        <button class="redit-btn" style="flex:1;color:var(--red);border-color:var(--red);"
          onclick="requireAdmin(()=>hardDeleteProcLog('${p.id}'),'刪除加工日報需要管理員權限')">
          <i class="ti ti-trash"></i> 刪除
        </button>` : ''}
        <button class="modal-cancel-btn" style="flex:1;"
          onclick="document.getElementById('procDetailModal').remove()">關閉</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

// ── 管理員刪除（不逆轉庫存）──
function hardDeleteProcLog(id){
  const p = getProcessingLog(id);
  if(!p) return;
  if(!confirm(`確定永久刪除加工日報 ${p.no}？\n` +
    `${p.status==='confirmed'?'⚠️ 庫存變動不會回復，請手動調整。\n':''}此操作無法復原。`)) return;
  processingLogs = processingLogs.filter(x => x.id !== id);
  saveProcessingLogs();
  document.getElementById('procDetailModal')?.remove();
  showToast('🗑️ 加工日報已刪除');
  renderProcList(_procFilter);
}

function _locName(id){
  if(typeof getLocation === 'function'){
    const loc = getLocation(id);
    return loc ? loc.name : (id || '—');
  }
  return id || '—';
}
