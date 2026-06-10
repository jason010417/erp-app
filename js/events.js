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
    </button>`;
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
  _currentEvent.name      = name;
  _currentEvent.location  = location;
  _currentEvent.startDate = document.getElementById('ev-start')?.value || todayStr();
  _currentEvent.endDate   = document.getElementById('ev-end')?.value   || todayStr();
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
  if(!ev) return;
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
      <div class="event-quick-label">外展商品</div>
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
  grid.innerHTML = activeItems.map(item => {
    const sold      = calcEventItemSoldQty(ev.id, item.id);
    const remaining = Math.max(0, item.takeQty - sold);
    const soldOut   = remaining <= 0;
    const low       = !soldOut && remaining <= 3;
    return `<button class="event-quick-btn ${soldOut?'sold-out':''}"
      onclick="${soldOut?`showToast('⚠️ 此商品已售完')`:`addPOSItem('${item.id}')`}">
      <span class="eq-emoji">${item.emoji}</span>
      <span class="eq-name">${item.name.length>8?item.name.slice(0,8)+'…':item.name}</span>
      <span class="eq-price">$${item.price}</span>
      <span class="eq-remain ${soldOut?'eq-sold':low?'eq-low':''}">
        ${soldOut?'售完':remaining+'/'+item.takeQty}
      </span>
    </button>`;
  }).join('');
}

// ── 收款後更新快捷格 ──
function onEventSale(eventId, cartItems){
  const ev = getEvent(eventId);
  if(!ev) return;
  // 標記 logs 為此外展
  // （pos.js 已在 addLog 裡帶了 eventId）
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
  saveOfflineState(eventId, { offlineMode:true, startedAt:nowStr() });
  showToast('✅ 已進入外展離線模式');
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
  if(!confirm('確定刪除此外展活動？')) return;
  events = events.filter(e=>e.id!==id);
  saveEvents();
  showToast('🗑️ 已刪除');
  showPage('events');
}

document.addEventListener('DOMContentLoaded', ()=>renderEventList());
