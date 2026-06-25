// ============================================================
// events.js — 外展活動管理
// ============================================================

let events = JSON.parse(localStorage.getItem('erp_events') || '[]');

function saveEvents(){
  localStorage.setItem('erp_events', JSON.stringify(events));
  if(typeof pushToFirebase === 'function') pushToFirebase('events', events);
}

function getEvent(id){ return events.find(e => e.id === id) || null; }
function genEventNo(){ return genNo('EV', events, 'no'); }

function eventStatus(ev){
  const t = todayStr();
  if(ev.status === 'closed') return 'closed';
  if(t < ev.startDate) return 'upcoming';
  if(t > ev.endDate)   return 'closed';
  return 'active';
}
const EV_STATUS = {
  upcoming: { label:'即將開始', cls:'badge-pending',   color:'#185FA5', bg:'#E6F1FB' },
  active:   { label:'進行中',   cls:'badge-done',      color:'#1D9E75', bg:'#E1F5EE' },
  closed:   { label:'已結束',   cls:'badge-archived',  color:'#6B6B68', bg:'var(--bg)' },
};

// ── 列表 ──
let _evFilter = 'all';

function renderEventList(){
  const el = document.getElementById('event-list');
  if(!el) return;
  let list = _evFilter === 'all'
    ? events
    : events.filter(e => eventStatus(e) === _evFilter);
  list = list.slice().reverse();
  if(!list.length){
    el.innerHTML = '<div class="order-empty">尚無外展活動，點右上角新增</div>'; return;
  }
  el.innerHTML = list.map(ev => {
    const st       = eventStatus(ev);
    const cfg      = EV_STATUS[st] || EV_STATUS.closed;
    const totalSold= calcEventTotalSold(ev.id);
    const totalAmt = calcEventTotalAmt(ev.id);
    return `<div class="list-card" onclick="showEventDetail('${ev.id}')">
      <div class="list-card-top">
        <span style="font-size:16px;font-weight:700;">${ev.name}</span>
        <span class="status-badge ${cfg.cls}">${cfg.label}</span>
      </div>
      <div class="list-card-meta">
        <span><i class="ti ti-map-pin"></i>${ev.location}</span>
        <span><i class="ti ti-calendar"></i>${fmtDate(ev.startDate)}${ev.endDate!==ev.startDate?' ～ '+fmtDate(ev.endDate):''}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;border-top:1px solid var(--border);padding-top:8px;">
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;color:var(--purple);">${fmtMoney(totalAmt)}</div>
          <div style="font-size:11px;color:var(--text3);">銷售額</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;">${totalSold}</div>
          <div style="font-size:11px;color:var(--text3);">銷售數量</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;">${(ev.items||[]).filter(i=>(i.takeQty||0)>0).length}</div>
          <div style="font-size:11px;color:var(--text3);">帶出品項</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterEvents(filter){
  _evFilter = filter;
  document.querySelectorAll('#page-events .ftab').forEach((btn,i) => {
    const fs = ['all','upcoming','active','closed'];
    btn.classList.toggle('active', fs[i] === filter);
  });
  renderEventList();
}

// ── 統計 ──
function getEventLogs(eventId){
  return logs.filter(l => l.eventId === eventId && l.op === 'pos_sale');
}
function calcEventTotalSold(eventId){
  return getEventLogs(eventId).reduce((s,l) => s+(l.qty||0), 0);
}
function calcEventTotalAmt(eventId){
  return getEventLogs(eventId).reduce((s,l) => s+(l.amount||0), 0);
}
function calcEventItemSoldQty(eventId, productId){
  return getEventLogs(eventId).filter(l=>l.productId===productId).reduce((s,l)=>s+(l.qty||0),0);
}

// ── 新增外展 ──
let _currentEvent = null;
let _evItems      = [];

function newEvent(){
  _currentEvent = {
    id:'', no:genEventNo(), name:'', location:'',
    startDate:todayStr(), endDate:todayStr(),
    staff:'', note:'', items:[],
    status:'upcoming', createdAt:todayStr(),
  };
  // 自動帶入所有成品，帶貨量預設 0
  _evItems = FINISHED.map(item => ({
    id:item.id, name:item.name, emoji:item.emoji,
    price:item.salePrice, takeQty:0,
  }));
  renderEventEditPage();
  showPage('event-edit');
}

function editEvent(id){
  const ev = getEvent(id);
  if(!ev) return;
  _currentEvent = JSON.parse(JSON.stringify(ev));
  _evItems      = JSON.parse(JSON.stringify(ev.items||[]));
  // 補入沒在清單的成品
  FINISHED.forEach(item => {
    if(!_evItems.find(i=>i.id===item.id)){
      _evItems.push({id:item.id,name:item.name,emoji:item.emoji,price:item.salePrice,takeQty:0});
    }
  });
  renderEventEditPage();
  showPage('event-edit');
}

function renderEventEditPage(){
  const page = document.getElementById('page-event-edit');
  if(!page) return;
  const ev = _currentEvent;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('events')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${ev.id?'編輯外展':'新增外展活動'}</div>
      <button class="small-btn green-btn" onclick="saveEvent()"><i class="ti ti-check"></i> 儲存</button>
    </div>
    <div class="form-card">
      <div class="cust-field"><label>活動名稱 *</label>
        <input type="text" id="ev-name" value="${ev.name}" placeholder="例：台北美食博覽會" /></div>
      <div class="cust-field"><label>地點 *</label>
        <input type="text" id="ev-location" value="${ev.location}" placeholder="例：世貿一館 B區 123攤" /></div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end;">
        <div class="cust-field" style="margin:0;">
          <label>開始日期</label>
          <input type="date" id="ev-start" value="${ev.startDate}" /></div>
        <div style="padding-bottom:10px;color:var(--text3);">～</div>
        <div class="cust-field" style="margin:0;">
          <label>結束日期</label>
          <input type="date" id="ev-end" value="${ev.endDate}" /></div>
      </div>
      <div class="cust-field" style="margin-top:10px;"><label>參展人員</label>
        <input type="text" id="ev-staff" value="${ev.staff||''}" placeholder="例：王小明、陳小華" /></div>
      <div class="cust-field"><label>備註</label>
        <textarea id="ev-note" rows="2">${ev.note||''}</textarea></div>
    </div>
    <div class="section-title" style="margin-top:4px;">
      <i class="ti ti-package"></i> 帶貨商品
      <span style="font-weight:400;color:var(--text3);font-size:12px;">（輸入要帶出去的數量）</span>
    </div>
    <div id="ev-items-list"></div>
    <button class="confirm-btn" style="margin-top:8px;" onclick="saveEvent()">
      <i class="ti ti-check"></i> 儲存外展活動
    </button>
    ${ev.id ? `<button class="danger-btn" style="margin-top:8px;" onclick="requireAdmin(confirmDeleteCurrentEvent)">
      <i class="ti ti-trash"></i> 刪除外展活動
    </button>` : ''}`;
  renderEvItemsList();
}

function renderEvItemsList(){
  const el = document.getElementById('ev-items-list');
  if(!el) return;
  const taking = _evItems.filter(i=>(i.takeQty||0)>0).length;
  el.innerHTML = `<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">
    已設定 ${taking} / ${_evItems.length} 項商品帶貨數量</div>` +
  _evItems.map((item, idx) => {
    const stock = getTotalStock(item.id);
    const isTaking = (item.takeQty||0) > 0;
    return `<div class="order-row ${isTaking?'':'ev-row-zero'}">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">庫存 <strong>${stock}</strong>
          ${stock>0?`<button class="ev-fill-btn" onclick="evFillAll(${idx},${stock})">全帶</button>`:''}
        </div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn"
          onclick="changeEvItemQty(${idx},-1)"
          onmousedown="startLongPress(${idx},-1,'ev')"
          onmouseup="stopLongPress()" onmouseleave="stopLongPress()"
          ontouchstart="startLongPress(${idx},-1,'ev')" ontouchend="stopLongPress()">−</button>
        <span class="qty-num ${isTaking?'':'qty-zero'}">${item.takeQty||0}</span>
        <button class="qty-btn"
          onclick="changeEvItemQty(${idx},1)"
          onmousedown="startLongPress(${idx},1,'ev')"
          onmouseup="stopLongPress()" onmouseleave="stopLongPress()"
          ontouchstart="startLongPress(${idx},1,'ev')" ontouchend="stopLongPress()">＋</button>
      </div>
    </div>`;
  }).join('');
}

function changeEvItemQty(idx, delta){
  _evItems[idx].takeQty = Math.max(0, (_evItems[idx].takeQty||0)+delta);
  renderEvItemsList();
}
function evFillAll(idx, stock){
  _evItems[idx].takeQty = stock;
  renderEvItemsList();
}

function saveEvent(){
  const name     = document.getElementById('ev-name')?.value.trim();
  const location = document.getElementById('ev-location')?.value.trim();
  if(!name)    { showToast('⚠️ 請填寫活動名稱'); return; }
  if(!location){ showToast('⚠️ 請填寫地點'); return; }

  // 取得日期欄位的值，用來做日期邏輯驗證
  const startDate = document.getElementById('ev-start')?.value || todayStr();
  const endDate   = document.getElementById('ev-end')?.value   || todayStr();

  // 驗證開始日期不可晚於結束日期
  // 若日期填反，活動狀態會立刻變成「已結束」，也無法開啟 POS，使用者不容易察覺原因
  if(startDate && endDate && startDate > endDate){
    showToast('⚠️ 開始日期不可晚於結束日期');
    return;
  }

  _currentEvent.name      = name;
  _currentEvent.location  = location;
  _currentEvent.startDate = startDate;
  _currentEvent.endDate   = endDate;
  _currentEvent.staff     = document.getElementById('ev-staff')?.value.trim() || '';
  _currentEvent.note      = document.getElementById('ev-note')?.value.trim()  || '';
  _currentEvent.items     = JSON.parse(JSON.stringify(_evItems));
  if(!_currentEvent.id) _currentEvent.id = 'EV'+Date.now();
  const idx = events.findIndex(e=>e.id===_currentEvent.id);
  const copy = JSON.parse(JSON.stringify(_currentEvent));
  if(idx>=0) events[idx]=copy; else events.push(copy);
  saveEvents();
  showToast('✅ 外展活動已儲存');
  showEventDetail(_currentEvent.id);
}

// ── 外展詳細 ──
function showEventDetail(id){
  const ev = getEvent(id);
  if(!ev){ showToast('⚠️ 找不到此外展活動（可能已被刪除）'); return; }
  _currentEvent = JSON.parse(JSON.stringify(ev));
  renderEventDetailPage();
  showPage('event-detail');
}

function renderEventDetailPage(){
  const page = document.getElementById('page-event-detail');
  if(!page) return;
  const ev  = _currentEvent;
  const st  = eventStatus(ev);
  const cfg = EV_STATUS[st] || EV_STATUS.closed;
  const totalAmt  = calcEventTotalAmt(ev.id);
  const totalSold = calcEventTotalSold(ev.id);
  const offState  = typeof getOfflineState==='function' ? getOfflineState(ev.id) : {};
  const isOffline = offState.offlineMode;
  const uploaded  = offState.uploaded;
  const evLogs    = logs.filter(l => l.eventId === ev.id && l.op === 'pos_sale');

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('events')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${ev.name}</div>
      <button class="small-btn" onclick="editEvent('${ev.id}')"><i class="ti ti-edit"></i></button>
    </div>

    <!-- 活動資訊 -->
    <div class="form-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span class="status-badge ${cfg.cls}">${cfg.label}</span>
      </div>
      <div class="cust-info-row"><i class="ti ti-map-pin"></i>${ev.location}</div>
      <div class="cust-info-row"><i class="ti ti-calendar"></i>
        ${fmtDate(ev.startDate)}${ev.endDate!==ev.startDate?' ～ '+fmtDate(ev.endDate):''}
      </div>
      ${ev.staff?`<div class="cust-info-row"><i class="ti ti-users"></i>${ev.staff}</div>`:''}
    </div>

    <!-- 銷售摘要 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
      <div class="form-card" style="text-align:center;">
        <div style="font-size:28px;font-weight:700;color:var(--purple);">${fmtMoney(totalAmt)}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">總銷售額</div>
      </div>
      <div class="form-card" style="text-align:center;">
        <div style="font-size:28px;font-weight:700;color:var(--green);">${totalSold}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">銷售數量</div>
      </div>
    </div>

    <!-- 離線模式 -->
    <div style="margin-top:10px;">
      ${uploaded
        ? `<div class="offline-mode-card uploaded">
            <i class="ti ti-cloud-check"></i>
            <div><div class="om-title">已上傳至雲端</div>
            <div class="om-sub">上傳時間：${offState.uploadedAt||'—'}</div></div>
            <button class="small-btn" onclick="showEventReview('${ev.id}')"><i class="ti ti-eye"></i> 查看</button>
          </div>`
        : isOffline
          ? `<div class="offline-mode-card active">
              <i class="ti ti-wifi-off"></i>
              <div style="flex:1;"><div class="om-title">外展離線模式中</div>
              <div class="om-sub">有 ${logs.filter(l=>l.eventId===ev.id&&!l._uploaded).length} 筆未上傳記錄</div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
              <button class="redit-btn" onclick="exitOfflineMode('${ev.id}')">
                <i class="ti ti-wifi"></i> 結束離線
              </button>
              <button class="confirm-btn" style="background:var(--purple);"
                onclick="requireManager(()=>showEventReview('${ev.id}'),'外展審核需要主管權限')">
                <i class="ti ti-clipboard-check"></i> 審核上傳
              </button>
            </div>`
          : st==='active'
            ? `<div class="offline-mode-card normal">
                <i class="ti ti-device-mobile"></i>
                <div style="flex:1;"><div class="om-title">外展離線模式</div>
                <div class="om-sub">出門前開啟，回來後審核上傳</div></div>
                <button class="small-btn green-btn" onclick="enterOfflineMode('${ev.id}')">
                  <i class="ti ti-power"></i> 開啟
                </button>
              </div>`
            : ''}
    </div>

    <!-- 開啟 POS（進行中才顯示）-->
    ${st==='active' ? `
    <button class="confirm-btn" style="background:var(--amber);margin-top:10px;"
      onclick="startEventPOS('${ev.id}')">
      <i class="ti ti-cash-register"></i> 開啟外展 POS
    </button>` : ''}

    <!-- 對帳表 -->
    <div class="section-title" style="margin-top:14px;"><i class="ti ti-clipboard-check"></i> 帶貨對帳</div>
    ${renderEventAccountTable(ev)}

    <!-- 銷售記錄 -->
    <div style="display:flex;align-items:center;gap:8px;margin-top:14px;margin-bottom:6px;">
      <div class="section-title" style="margin:0;flex:1;"><i class="ti ti-receipt"></i> 銷售記錄</div>
      ${evLogs.length ? `<button class="small-btn" onclick="requireManager(()=>settleEventSales('${ev.id}'),'外展結算需要主管確認')">
        <i class="ti ti-cash"></i> 外展結算
      </button>` : ''}
    </div>
    <div id="ev-detail-sales-list">${renderEventSalesSection(ev)}</div>

    <!-- 刪除 -->
    ${st==='upcoming' ? `
    <button class="redit-btn" style="margin-top:14px;color:var(--red);border-color:var(--red);"
      onclick="deleteEvent('${ev.id}')"><i class="ti ti-trash"></i> 刪除活動</button>` : ''}`;
}

function renderEventAccountTable(ev){
  const activeItems = (ev.items||[]).filter(i=>(i.takeQty||0)>0);
  if(!activeItems.length) return '<div class="order-empty">尚未設定帶貨數量</div>';
  let grandTake=0, grandSold=0;
  const rows = activeItems.map(item => {
    const sold   = calcEventItemSoldQty(ev.id, item.id);
    const remain = Math.max(0, item.takeQty - sold);
    grandTake += item.takeQty; grandSold += sold;
    const cls = remain===0&&item.takeQty>0?'acct-sold':sold>0?'acct-partial':'';
    return `<div class="event-acct-row ${cls}">
      <span>${item.emoji} ${item.name.length>10?item.name.slice(0,10)+'…':item.name}</span>
      <span>${item.takeQty}</span><span>${sold}</span>
      <span>${remain===0&&item.takeQty>0?'✅ 售完':remain}</span>
    </div>`;
  }).join('');
  return `<div class="event-acct-table">
    <div class="event-acct-header"><span>商品</span><span>帶出</span><span>賣出</span><span>剩餘</span></div>
    ${rows}
    <div class="event-acct-footer">
      <span>合計</span><span>${grandTake}</span><span>${grandSold}</span><span>${grandTake-grandSold}</span>
    </div>
  </div>`;
}

// ── 開啟外展 POS ──
function startEventPOS(eventId){
  const ev = getEvent(eventId);
  if(!ev) return;
  // 設定 POS 為外展模式
  if(typeof initPOS === 'function') initPOS(eventId);

  // 設定 banner
  const banner = document.getElementById('event-pos-banner');
  if(banner){
    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="event-banner" onclick="showEventDetail('${eventId}')">
        <i class="ti ti-map-pin"></i>
        <span>${ev.name}</span>
        <span class="event-banner-day">${totalEventDays(ev)>1?'外展模式':''}</span>
        <i class="ti ti-chevron-right" style="margin-left:auto;"></i>
      </div>
      <div class="event-quick-header">
        <span class="event-quick-label" style="margin:0;">外展商品</span>
        <div style="display:flex;gap:6px;">
          <button class="small-btn" onclick="openEventRecordsModal('${eventId}')">
            <i class="ti ti-clipboard-list"></i> 記錄
          </button>
          <button class="small-btn" onclick="openRestockModal('${eventId}')">
            <i class="ti ti-package-import"></i> 補貨
          </button>
        </div>
      </div>
      <div class="event-quick-grid" id="event-quick-grid"></div>`;
    renderEventQuickGrid(ev);
  }
  document.getElementById('pos-title').innerHTML =
    `<i class="ti ti-cash-register" style="color:#BA7517;"></i> ${ev.name}`;
  showPage('pos-a');
}

function totalEventDays(ev){
  const s = new Date(ev.startDate), e = new Date(ev.endDate);
  return Math.floor((e-s)/86400000)+1;
}

function renderEventQuickGrid(ev){
  const grid = document.getElementById('event-quick-grid');
  if(!grid) return;
  const activeItems = (ev.items||[]).filter(i=>(i.takeQty||0)>0);
  if(!activeItems.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:12px;color:var(--text3);font-size:13px;">尚未設定帶貨商品</div>`;
    return;
  }
  grid.innerHTML = activeItems.map(item => {
    const sold      = calcEventItemSoldQty(ev.id, item.id);
    const remaining = Math.max(0, item.takeQty - sold);
    const soldOut   = remaining <= 0;
    const low       = !soldOut && remaining <= 3;
    const cartQty   = typeof getPOSCartQty === 'function' ? getPOSCartQty(item.id) : 0;
    const name      = item.name.length > 7 ? item.name.slice(0,7)+'…' : item.name;
    const addFn     = soldOut ? `showToast('⚠️ 此商品已售完')` : `adjustQuickItem('${ev.id}','${item.id}',1)`;
    return `<div class="event-quick-card ${soldOut?'sold-out':''}">
      <div class="eq-tap-area" onclick="${addFn}">
        <span class="eq-emoji">${item.emoji}</span>
        <span class="eq-name">${name}</span>
        <span class="eq-price">$${item.price}</span>
        <span class="eq-remain ${soldOut?'eq-sold':low?'eq-low':''}">剩 ${remaining}/${item.takeQty}</span>
      </div>
      <div class="eq-qty-row">
        <button class="eq-ctrl-btn" onclick="adjustQuickItem('${ev.id}','${item.id}',-1)" ${cartQty<=0?'disabled':''}>−</button>
        <span class="eq-qty-num ${cartQty>0?'':'eq-qty-zero'}">${cartQty||0}</span>
        <button class="eq-ctrl-btn" onclick="${addFn}" ${soldOut?'disabled':''}>＋</button>
      </div>
    </div>`;
  }).join('');
}

// ── 收款後更新快捷格 ──
function onEventSale(eventId, cartItems){
  const ev = getEvent(eventId);
  if(!ev) return;
  renderEventQuickGrid(ev);
}

// ── 快捷格 +/− ──
function adjustQuickItem(eventId, itemId, delta){
  if(delta > 0){
    if(typeof addPOSItem === 'function') addPOSItem(itemId);
  } else {
    if(typeof removePOSItemById === 'function') removePOSItemById(itemId);
  }
  const ev = getEvent(eventId);
  if(ev) renderEventQuickGrid(ev);
}

// ── 補貨 Modal ──
let _restockEventId = null;
let _restockItems   = [];

function openRestockModal(eventId){
  _restockEventId = eventId;
  const ev = getEvent(eventId);
  if(!ev) return;
  _restockItems = (ev.items||[]).map(item => {
    const sold      = calcEventItemSoldQty(ev.id, item.id);
    const remaining = Math.max(0, (item.takeQty||0) - sold);
    return { id:item.id, name:item.name, emoji:item.emoji, remaining, addQty:0 };
  });
  let modal = document.getElementById('restock-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id        = 'restock-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  _renderRestockModal(modal);
  modal.style.display = 'flex';
}

function _renderRestockModal(modal){
  modal = modal || document.getElementById('restock-modal');
  if(!modal) return;
  modal.innerHTML = `
    <div class="modal-card" style="padding:0;display:flex;flex-direction:column;max-height:80vh;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;padding:16px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <i class="ti ti-package-import" style="font-size:20px;color:var(--purple);"></i>
        <div style="flex:1;font-size:17px;font-weight:700;">補貨</div>
        <button onclick="closeRestockModal()" style="background:none;border:none;font-size:22px;color:var(--text3);cursor:pointer;line-height:1;">
          <i class="ti ti-x"></i>
        </button>
      </div>
      <div id="restock-items-list" style="overflow-y:auto;flex:1;"></div>
      <div style="padding:12px 16px;border-top:1px solid var(--border);flex-shrink:0;">
        <button class="confirm-btn" onclick="saveRestock()">
          <i class="ti ti-check"></i> 確認補貨
        </button>
      </div>
    </div>`;
  _renderRestockItems();
}

function _renderRestockItems(){
  const list = document.getElementById('restock-items-list');
  if(!list) return;
  if(!_restockItems.length){ list.innerHTML = '<div class="order-empty">無帶貨商品</div>'; return; }
  list.innerHTML = _restockItems.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="color:var(--text2);">目前剩餘 <strong>${item.remaining}</strong> 個</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="restockChange(${idx},-1)">−</button>
        <span class="qty-num" style="color:${item.addQty>0?'var(--green)':'var(--text3)'}">${item.addQty}</span>
        <button class="qty-btn" onclick="restockChange(${idx},1)">＋</button>
      </div>
    </div>
  `).join('');
}

function restockChange(idx, delta){
  _restockItems[idx].addQty = Math.max(0, (_restockItems[idx].addQty||0)+delta);
  _renderRestockItems();
}

function closeRestockModal(){
  const modal = document.getElementById('restock-modal');
  if(modal) modal.style.display = 'none';
}

function saveRestock(){
  const ev = getEvent(_restockEventId);
  if(!ev) return;
  const added = _restockItems.filter(i=>i.addQty>0);
  if(!added.length){ showToast('⚠️ 請輸入補貨數量'); return; }
  added.forEach(r => {
    const evItem = (ev.items||[]).find(i=>i.id===r.id);
    if(evItem) evItem.takeQty = (evItem.takeQty||0) + r.addQty;
    addLog({ op:'ev_restock', eventId:_restockEventId, productId:r.id, productName:r.name, qty:r.addQty });
  });
  saveEvents();
  closeRestockModal();
  const total = added.reduce((s,i)=>s+i.addQty, 0);
  showToast(`✅ 補貨完成！${added.length} 種商品，共 ${total} 個`);
  renderEventQuickGrid(ev);
}

// ── 離線模式 ──
function getOfflineState(eventId){
  try { return JSON.parse(localStorage.getItem('erp_offline_'+eventId)||'{}'); }
  catch(e){ return {}; }
}
function saveOfflineState(eventId, state){
  localStorage.setItem('erp_offline_'+eventId, JSON.stringify(state));
}
function enterOfflineMode(eventId){
  if(!confirm('確定進入外展離線模式？\n銷售記錄將存在本機，回來後可審核上傳。')) return;

  const ev = getEvent(eventId);
  if(!ev){ showToast('⚠️ 找不到此外展活動'); return; }

  // 防止重複扣庫存：若此活動已標記過 stockDeducted，直接跳過扣減
  // 情境說明：若使用者意外點兩次「開啟」，或離線模式中途退出後重新進入，
  // 不應再扣一次庫存，否則會導致庫存被扣兩次
  if(ev.stockDeducted){
    saveOfflineState(eventId, { offlineMode:true, startedAt:nowStr() });
    showToast('✅ 已重新進入外展離線模式（庫存先前已扣）');
    showEventDetail(eventId);
    return;
  }

  // 從主倉庫位置扣除帶出品項的庫存
  // 對應 submitEventUpload() 中「歸還庫存」所用的同一個 locId
  const locId = getMainLocation()?.id || 'store_A';
  const itemsToDeduct = (ev.items || []).filter(i => (i.takeQty || 0) > 0);

  if(itemsToDeduct.length === 0){
    showToast('⚠️ 尚未設定任何帶貨品項，請先儲存帶貨數量再開啟外展模式');
    return;
  }

  // 逐一扣減每個帶貨品項的庫存，delta 為負數代表扣出
  itemsToDeduct.forEach(item => {
    adjustStock(item.id, locId, -item.takeQty, {
      op:      'ev_takeout',
      refId:   eventId,
      refType: 'event',
      note:    `外展帶出：${ev.name}`,
    });
  });

  // 在活動物件上標記「已扣庫存」，防止重複扣減
  ev.stockDeducted = true;
  saveEvents();

  saveOfflineState(eventId, { offlineMode:true, startedAt:nowStr() });
  showToast(`✅ 已進入外展離線模式，已扣除 ${itemsToDeduct.length} 種商品庫存`);
  showEventDetail(eventId);
}
function exitOfflineMode(eventId){
  const localLogs = logs.filter(l=>l.eventId===eventId&&!l._uploaded);
  if(localLogs.length && !confirm(`本機還有 ${localLogs.length} 筆未上傳記錄。確定結束離線模式？`)) return;
  const s = getOfflineState(eventId);
  s.offlineMode = false;
  saveOfflineState(eventId, s);
  showToast('已結束離線模式');
  showEventDetail(eventId);
}

// ── 審核上傳頁 ──
let _reviewEventId = null;
let _reviewItems   = [];

function showEventReview(eventId){
  _reviewEventId = eventId;
  const ev = getEvent(eventId);
  if(!ev) return;
  const localLogs = logs.filter(l=>l.eventId===eventId&&!l._uploaded);
  const page = document.getElementById('page-event-review');
  if(!page) return;

  _reviewItems = (ev.items||[]).filter(i=>(i.takeQty||0)>0).map(item=>{
    const sold    = localLogs.filter(l=>l.productId===item.id).reduce((s,l)=>s+(l.qty||0),0);
    const remain  = Math.max(0, item.takeQty - sold);
    return { ...item, soldQty:sold, systemRemain:remain, actualRemain:remain };
  });

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showEventDetail('${eventId}')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-clipboard-check" style="color:var(--purple);"></i> 外展審核</div>
    </div>
    <div class="form-card">
      <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${ev.name}</div>
      <div style="font-size:13px;color:var(--text2);">本機有 ${localLogs.length} 筆未上傳記錄</div>
    </div>
    <div class="section-title" style="margin-top:10px;"><i class="ti ti-package"></i> 商品清點</div>
    <div id="review-items"></div>
    <div class="section-title" style="margin-top:10px;"><i class="ti ti-pencil"></i> 上傳備註</div>
    <div class="cust-field">
      <input type="text" id="review-note" placeholder="例：攤位A，結算無誤" />
    </div>
    <button class="confirm-btn" style="background:var(--purple);margin-top:8px;"
      onclick="requireManager(()=>submitEventUpload(),'外展審核上傳需要主管確認')">
      <i class="ti ti-cloud-upload"></i> 主管確認並上傳
    </button>
    <button class="redit-btn" onclick="showEventDetail('${eventId}')">
      <i class="ti ti-arrow-left"></i> 返回繼續銷售
    </button>`;

  renderReviewItems();
  showPage('event-review');
}

function renderReviewItems(){
  const el = document.getElementById('review-items');
  if(!el) return;
  el.innerHTML = _reviewItems.map((item,idx) => {
    const hasDiff = item.actualRemain !== item.systemRemain;
    return `<div class="form-card ${hasDiff?'review-has-diff':''}" style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:28px;">${item.emoji}</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;">${item.name}</div>
          <div style="font-size:12px;color:var(--text3);">${item.id}</div>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--purple);">
          $${(item.price||0)*item.soldQty}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
        <div style="background:var(--bg);padding:8px;border-radius:8px;">
          <div style="font-size:20px;font-weight:700;">${item.takeQty}</div>
          <div style="font-size:10px;color:var(--text3);">帶出</div>
        </div>
        <div style="background:var(--amber-light);padding:8px;border-radius:8px;">
          <div style="font-size:20px;font-weight:700;">${item.soldQty}</div>
          <div style="font-size:10px;color:var(--text3);">賣出</div>
        </div>
        <div style="background:var(--green-light);padding:8px;border-radius:8px;">
          <div style="font-size:20px;font-weight:700;">${item.systemRemain}</div>
          <div style="font-size:10px;color:var(--text3);">系統剩餘</div>
        </div>
        <div style="background:var(--purple-light);padding:8px;border-radius:8px;">
          <label style="font-size:10px;color:var(--text3);display:block;margin-bottom:4px;">實際清點</label>
          <input type="number" value="${item.actualRemain}" min="0"
            style="width:100%;font-size:18px;font-weight:700;text-align:center;
            border:${hasDiff?'2px solid var(--red)':'1px solid var(--border)'};
            border-radius:6px;background:var(--surface);color:var(--text);padding:2px;"
            onchange="updateActualRemain(${idx},this.value)" />
        </div>
      </div>
      ${hasDiff?`<div style="margin-top:8px;padding:6px 10px;background:var(--red-light);
        border-radius:6px;font-size:12px;color:#791F1F;">
        ⚠️ 差異：系統剩 ${item.systemRemain}，實際 ${item.actualRemain}
        （差 ${Math.abs(item.actualRemain-item.systemRemain)} 個）
      </div>`:''}
    </div>`;
  }).join('');
}

function updateActualRemain(idx, val){
  const n = parseInt(val);
  if(!isNaN(n)&&n>=0) _reviewItems[idx].actualRemain = n;
  renderReviewItems();
}

function submitEventUpload(){
  if(!_fbReady||!_db){ showToast('⚠️ 請先連上網路再上傳'); return; }
  const ev   = getEvent(_reviewEventId);
  const note = document.getElementById('review-note')?.value.trim()||'';
  const now  = nowStr();
  const localLogs = logs.filter(l=>l.eventId===_reviewEventId&&!l._uploaded);

  // 計算差異合併庫存
  const locId = getMainLocation()?.id||'store_A';
  _reviewItems.forEach(item => {
    const actualSold = Math.max(0, item.takeQty - item.actualRemain);
    // 歸還未賣出的庫存（帶出時已扣，現在加回來）
    const returnQty = item.actualRemain;
    if(returnQty > 0){
      adjustStock(item.id, locId, returnQty, {
        op:'stock_in', refType:'event_return', note:`外展歸還 ${ev?.name}`
      });
    }
  });

  // 標記本機記錄已上傳
  localLogs.forEach(l => { l._uploaded=true; l._uploadedAt=now; });
  saveLogs();

  // 上傳到 Firebase
  const uploadData = {
    eventId:_reviewEventId, eventName:ev?.name||'',
    deviceId:DEVICE_ID, uploadedAt:now, note,
    items:_reviewItems, logs:localLogs,
    totalAmount: _reviewItems.reduce((s,i)=>s+(i.price||0)*i.soldQty,0),
  };
  const updates = {};
  updates[`erp/eventUploads/${_reviewEventId}/${DEVICE_ID}`] = uploadData;
  localLogs.forEach(l => {
    if(l._fbKey) updates[`erp/logs/${l._fbKey}`] = l;
  });

  _db.ref().update(updates).then(() => {
    saveOfflineState(_reviewEventId, { offlineMode:false, uploaded:true, uploadedAt:now });
    showToast('✅ 外展資料已上傳至雲端');
    showEventDetail(_reviewEventId);
  }).catch(err => {
    console.error('上傳失敗:', err);
    showToast('⚠️ 上傳失敗，請確認網路');
  });
}

function deleteEvent(id){
  events = events.filter(e=>e.id!==id);
  saveEvents();
  // 清除該活動的所有孤兒 log（pos_sale + ev_restock + event_settle）
  const orphanKeys = logs.filter(l=>l.eventId===id).map(l=>l._fbKey).filter(Boolean);
  logs = logs.filter(l=>l.eventId!==id);
  saveLogs();
  orphanKeys.forEach(k => { if(typeof deleteLogFromFirebase==='function') deleteLogFromFirebase(k); });
  showToast('🗑️ 外展活動已刪除');
  showPage('events');
}

// 管理員從編輯頁刪除（無論有無銷售都可刪除，但視情況顯示庫存警告）
function confirmDeleteCurrentEvent(){
  const ev = _currentEvent;
  if(!ev || !ev.id) return;
  const salesCount  = getEventLogs(ev.id).length;
  const wasUploaded = getOfflineState(ev.id).uploaded;
  let warnMsg;
  if(salesCount > 0 && wasUploaded){
    warnMsg = `「${ev.name}」已有 ${salesCount} 筆銷售記錄，且離線資料已上傳（庫存已扣減）。\n\n⚠️ 刪除後銷售記錄會消失，但庫存不會自動恢復，可能造成帳目不符。\n\n確定仍要刪除嗎？`;
  } else if(salesCount > 0){
    warnMsg = `「${ev.name}」已有 ${salesCount} 筆銷售記錄（在線模式，庫存未扣）。\n刪除後銷售記錄也會消失。\n\n確定要刪除嗎？`;
  } else {
    warnMsg = `確定要刪除「${ev.name}」嗎？此操作無法復原。`;
  }
  if(!confirm(warnMsg)) return;
  deleteEvent(ev.id);
}

// ── 活動詳情頁：銷售記錄區塊 ──
function renderEventSalesSection(ev){
  const evLogs = logs
    .filter(l => l.eventId === ev.id && l.op === 'pos_sale')
    .sort((a, b) => (b._ts||0) - (a._ts||0));
  if(!evLogs.length) return '<div class="order-empty" style="margin-bottom:10px;">尚無銷售記錄</div>';
  return evLogs.map(l => {
    const timeStr = l._ts
      ? new Date(l._ts).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})
      : l.time||'';
    const editBtn = l._ts
      ? `<button class="ev-rec-edit" onclick="requireManager(()=>openEditSaleModal(${l._ts}),'修改記錄需要主管驗證')"><i class="ti ti-pencil"></i></button>`
      : '';
    const noteEl  = l.note ? `<div style="font-size:11px;color:var(--text3);">📝 ${l.note}</div>` : '';
    return `<div class="ev-rec-row">
      <i class="ti ti-shopping-cart" style="color:var(--accent);font-size:18px;flex-shrink:0;"></i>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:14px;font-weight:600;">${l.productName||''}</span>
          <span style="font-size:12px;color:var(--text2);">x${l.qty}  $${l.amount||(l.qty*(l.unitPrice||0))}</span>
        </div>
        ${noteEl}
      </div>
      <span style="font-size:12px;color:var(--text3);flex-shrink:0;">${timeStr}</span>
      ${editBtn}
    </div>`;
  }).join('');
}

// ── 外展結算（匯總銷售到銷貨明細）──
function settleEventSales(eventId){
  const ev = getEvent(eventId);
  if(!ev) return;
  const evLogs = logs.filter(l => l.eventId === eventId && l.op === 'pos_sale');
  if(!evLogs.length){ showToast('⚠️ 尚無銷售記錄可結算'); return; }
  // 防止重複結算
  const prevSettle = logs.find(l => l.op === 'event_settle' && l.eventId === eventId);
  if(prevSettle){
    if(!confirm(`「${ev.name}」已有一筆結算記錄（${prevSettle.time}）。\n確定要再新增一筆嗎？`)) return;
  } else {
    if(!confirm(`將「${ev.name}」的 ${evLogs.length} 筆銷售匯總成一筆記錄，加入銷貨明細？`)) return;
  }

  const byProduct = {};
  evLogs.forEach(l => {
    if(!byProduct[l.productId]){
      byProduct[l.productId] = { productId:l.productId, productName:l.productName||'', qty:0, amount:0, unitPrice:l.unitPrice||0 };
    }
    byProduct[l.productId].qty    += (l.qty||0);
    byProduct[l.productId].amount += (l.amount||0);
  });
  const items       = Object.values(byProduct);
  const totalAmount = items.reduce((s,i)=>s+i.amount, 0);
  const totalQty    = items.reduce((s,i)=>s+i.qty, 0);

  addLog({
    op:          'event_settle',
    eventId:     ev.id,
    eventName:   ev.name,
    productName: ev.name,
    qty:         totalQty,
    amount:      totalAmount,
    items:       items,
    settledAt:   nowStr(),
  });
  showToast(`✅ 外展結算完成！共 ${totalQty} 個 ${fmtMoney(totalAmount)}，已加入銷貨明細`);
}

// 刷新活動詳情頁的銷售列表（修改/刪除後呼叫）
function _refreshDetailSales(eventId){
  const el = document.getElementById('ev-detail-sales-list');
  if(!el) return;
  const ev = getEvent(eventId);
  if(ev) el.innerHTML = renderEventSalesSection(ev);
}

// ── 銷售/補貨記錄 Modal ──
let _evRecordsEventId = null;

function openEventRecordsModal(eventId){
  _evRecordsEventId = eventId;
  let modal = document.getElementById('ev-records-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'ev-records-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  _renderEvRecordsModal(modal);
  modal.style.display = 'flex';
}

function _renderEvRecordsModal(modal){
  modal = modal || document.getElementById('ev-records-modal');
  if(!modal) return;
  const evLogs = logs
    .filter(l => l.eventId === _evRecordsEventId && (l.op === 'pos_sale' || l.op === 'ev_restock'))
    .sort((a, b) => (b._ts||0) - (a._ts||0));
  const rows = evLogs.length
    ? evLogs.map(l => _renderEvRecordRow(l)).join('')
    : '<div class="order-empty">尚無記錄</div>';
  modal.innerHTML = `
    <div class="modal-card" style="padding:0;display:flex;flex-direction:column;max-height:85vh;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;padding:16px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <i class="ti ti-clipboard-list" style="font-size:20px;color:var(--purple);"></i>
        <div style="flex:1;font-size:17px;font-weight:700;">銷售與補貨記錄</div>
        <button onclick="closeEvRecordsModal()" style="background:none;border:none;font-size:22px;color:var(--text3);cursor:pointer;line-height:1;"><i class="ti ti-x"></i></button>
      </div>
      <div style="overflow-y:auto;flex:1;">${rows}</div>
    </div>`;
}

function _renderEvRecordRow(l){
  const isSale  = l.op === 'pos_sale';
  const timeStr = l._ts ? new Date(l._ts).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}) : '';
  const icon    = isSale ? 'ti-shopping-cart' : 'ti-package-import';
  const clr     = isSale ? 'var(--accent)' : 'var(--purple)';
  const detail  = isSale ? `x${l.qty}  $${l.amount||(l.qty*(l.unitPrice||0))}` : `補貨 +${l.qty}`;
  const noteEl  = l.note ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;">📝 ${l.note}</div>` : '';
  const editBtn = isSale
    ? `<button class="ev-rec-edit" onclick="requireManager(()=>openEditSaleModal(${l._ts}),'修改記錄需要主管驗證')"><i class="ti ti-pencil"></i></button>`
    : '';
  return `<div class="ev-rec-row">
    <i class="ti ${icon}" style="color:${clr};font-size:18px;flex-shrink:0;"></i>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:600;">${l.productName||''}</span>
        <span style="font-size:12px;color:var(--text2);">${detail}</span>
      </div>
      ${noteEl}
    </div>
    <span style="font-size:12px;color:var(--text3);flex-shrink:0;">${timeStr}</span>
    ${editBtn}
  </div>`;
}

function closeEvRecordsModal(){
  const modal = document.getElementById('ev-records-modal');
  if(modal) modal.style.display = 'none';
}

// ── 修改銷售記錄 Modal ──
let _editingLog = null;
let _editingQty = 0;

function openEditSaleModal(ts){
  _editingLog = logs.find(l => l._ts === ts && l.op === 'pos_sale');
  if(!_editingLog){ showToast('⚠️ 找不到記錄'); return; }
  _editingQty = _editingLog.qty;
  let modal = document.getElementById('ev-edit-sale-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'ev-edit-sale-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  _renderEditSaleModal(modal);
  modal.style.display = 'flex';
}

function _renderEditSaleModal(modal){
  modal = modal || document.getElementById('ev-edit-sale-modal');
  if(!modal || !_editingLog) return;
  const l       = _editingLog;
  const timeStr = l._ts ? new Date(l._ts).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
  const emoji   = (typeof getItem==='function' && getItem(l.productId)?.emoji) || '📦';
  modal.innerHTML = `
    <div class="modal-card" style="padding:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:8px;padding:16px 18px 12px;border-bottom:1px solid var(--border);">
        <i class="ti ti-pencil" style="font-size:20px;color:var(--accent);"></i>
        <div style="flex:1;font-size:17px;font-weight:700;">修改銷售記錄</div>
        <button onclick="closeEditSaleModal()" style="background:none;border:none;font-size:22px;color:var(--text3);cursor:pointer;line-height:1;"><i class="ti ti-x"></i></button>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="font-size:26px;">${emoji}</span>
          <div>
            <div style="font-size:15px;font-weight:700;">${l.productName}</div>
            <div style="font-size:12px;color:var(--text3);">${timeStr}・$${l.unitPrice||0}/個</div>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;color:var(--text2);margin-bottom:8px;">數量</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="qty-btn" style="width:40px;height:40px;" onclick="editSaleQtyChange(-1)">−</button>
            <input type="number" id="edit-sale-qty" value="${_editingQty}" min="1"
              style="width:72px;height:40px;text-align:center;font-size:20px;font-weight:700;border:1.5px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);"
              onchange="editSaleQtyInput(this.value)" onclick="this.select()" />
            <button class="qty-btn" style="width:40px;height:40px;" onclick="editSaleQtyChange(1)">＋</button>
            <span id="edit-sale-amount" style="font-size:14px;color:var(--text2);">= $${_editingQty*(l.unitPrice||0)}</span>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;color:var(--text2);margin-bottom:6px;">修改備註</div>
          <input type="text" id="edit-sale-note" value="${l.note||''}" placeholder="輸入修改原因..."
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;background:var(--surface);color:var(--text);" />
        </div>
        <button class="confirm-btn" onclick="saveEditSale()" style="margin-bottom:8px;">
          <i class="ti ti-check"></i> 儲存修改
        </button>
        <button class="danger-btn" onclick="confirmDeleteSaleLog()">
          <i class="ti ti-trash"></i> 刪除此筆
        </button>
      </div>
    </div>`;
}

function editSaleQtyChange(delta){
  _editingQty = Math.max(1, _editingQty + delta);
  const input = document.getElementById('edit-sale-qty');
  if(input) input.value = _editingQty;
  const amtEl = document.getElementById('edit-sale-amount');
  if(amtEl && _editingLog) amtEl.textContent = `= $${_editingQty * (_editingLog.unitPrice||0)}`;
}

function editSaleQtyInput(val){
  _editingQty = Math.max(1, parseInt(val)||1);
  const amtEl = document.getElementById('edit-sale-amount');
  if(amtEl && _editingLog) amtEl.textContent = `= $${_editingQty * (_editingLog.unitPrice||0)}`;
}

function closeEditSaleModal(){
  const modal = document.getElementById('ev-edit-sale-modal');
  if(modal) modal.style.display = 'none';
  _editingLog = null;
  _editingQty = 0;
}

function saveEditSale(){
  if(!_editingLog) return;
  const note        = document.getElementById('edit-sale-note')?.value.trim() || '';
  const eventId     = _editingLog.eventId;
  const productName = _editingLog.productName;
  const savedQty    = _editingQty;
  _editingLog.qty       = _editingQty;
  _editingLog.amount    = _editingQty * (_editingLog.unitPrice||0);
  _editingLog.note      = note;
  _editingLog._editedAt = nowStr();
  saveLogs();
  if(_editingLog._fbKey){
    if(typeof updateLogInFirebase === 'function') updateLogInFirebase(_editingLog);
  } else {
    // 尚未推送到 Firebase 的離線記錄，補推一次
    if(typeof pushLogToFirebase === 'function') pushLogToFirebase(_editingLog);
  }
  closeEditSaleModal(); // 此後 _editingLog = null
  _renderEvRecordsModal();
  _refreshDetailSales(eventId);
  if(typeof renderSaleReport === 'function') renderSaleReport();
  const ev = getEvent(eventId);
  if(ev) renderEventQuickGrid(ev);
  showToast(`✅ 已修改：${productName} x${savedQty}`);
}

function confirmDeleteSaleLog(){
  if(!_editingLog) return;
  if(!confirm(`確定要刪除「${_editingLog.productName}」這筆銷售記錄嗎？`)) return;
  const fbKey   = _editingLog._fbKey;
  const eventId = _editingLog.eventId;
  // 用物件參照精確定位，避免 _ts 碰撞誤刪其他記錄
  const logIdx = logs.indexOf(_editingLog);
  if(logIdx >= 0) logs.splice(logIdx, 1);
  saveLogs();
  if(fbKey && typeof deleteLogFromFirebase === 'function') deleteLogFromFirebase(fbKey);
  closeEditSaleModal();
  _renderEvRecordsModal();
  _refreshDetailSales(eventId);
  if(typeof renderSaleReport === 'function') renderSaleReport();
  const ev = getEvent(eventId);
  if(ev) renderEventQuickGrid(ev);
  showToast('🗑️ 記錄已刪除');
}

document.addEventListener('DOMContentLoaded', ()=>renderEventList());
