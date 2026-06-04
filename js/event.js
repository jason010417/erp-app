// ===== 外展活動管理 =====

// ── 資料 ──
let events = JSON.parse(localStorage.getItem('erp_events') || '[]');
function saveEvents(){ localStorage.setItem('erp_events', JSON.stringify(events)); }

// ── 目前外展狀態 ──
let currentEventId  = null;  // 正在進行的外展
let currentEventDay = null;  // 目前是第幾天（1開始）
let editingEventId  = null;  // 正在編輯的外展

// ── 工具 ──
function genEventNo(){
  const d = new Date();
  const prefix = 'EV' + d.getFullYear().toString().slice(2)
    + String(d.getMonth()+1).padStart(2,'0');
  const same = events.filter(e=>e.no.startsWith(prefix)).length;
  return prefix + '-' + String(same+1).padStart(3,'0');
}
function todayStr(){ return new Date().toISOString().slice(0,10); }
function eventStatus(ev){
  const t = todayStr();
  if(t < ev.startDate) return 'upcoming';
  if(t > ev.endDate)   return 'ended';
  return 'active';
}
function statusLabel_ev(s){ return {upcoming:'即將開始',active:'進行中',ended:'已結束'}[s]||s; }
function statusColor_ev(s){ return {upcoming:'#185FA5',active:'#1D9E75',ended:'#6B6B68'}[s]||'#6B6B68'; }
function statusBg_ev(s){ return {upcoming:'#E6F1FB',active:'#E1F5EE',ended:'var(--bg)'}[s]||'var(--bg)'; }

// 計算某天是第幾天
function dayIndex(ev, dateStr){
  const start = new Date(ev.startDate);
  const d     = new Date(dateStr);
  return Math.floor((d - start) / 86400000) + 1;
}
function totalDays(ev){
  const s = new Date(ev.startDate), e = new Date(ev.endDate);
  return Math.floor((e-s)/86400000)+1;
}

// ══════════════════════════════
// 列表頁
// ══════════════════════════════
let evFilter = 'all';
function initEvents(){ filterEvents('all'); }
function filterEvents(status){
  evFilter = status;
  ['all','active','upcoming','ended'].forEach(s=>{
    document.getElementById('evf-'+s)?.classList.toggle('active', s===status);
  });
  renderEventList();
}
function renderEventList(){
  const el = document.getElementById('event-list');
  let list = evFilter==='all' ? events : events.filter(e=>eventStatus(e)===evFilter);
  list = list.slice().reverse();
  if(!list.length){
    el.innerHTML = '<div class="report-empty">沒有符合的外展活動<br>點右上角「新增」建立</div>';
    return;
  }
  el.innerHTML = list.map(ev=>{
    const st = eventStatus(ev);
    const days = totalDays(ev);
    const totalSales = calcEventTotal(ev.id);
    const txCount    = calcEventTxCount(ev.id);
    return `
      <div class="event-list-card" onclick="viewEvent('${ev.id}')">
        <div class="event-list-top">
          <div>
            <div class="event-list-name">${ev.name}</div>
            <div class="event-list-loc"><i class="ti ti-map-pin"></i>${ev.location}</div>
          </div>
          <div class="proc-status-badge" style="background:${statusBg_ev(st)};color:${statusColor_ev(st)};">
            ${statusLabel_ev(st)}
          </div>
        </div>
        <div class="event-list-dates">
          <i class="ti ti-calendar"></i>
          ${fmtDate(ev.startDate)}${days>1?' ～ '+fmtDate(ev.endDate):''}
          （${days} 天）
        </div>
        <div class="event-list-stats">
          <div class="event-stat-item">
            <div class="event-stat-num">$${totalSales.toLocaleString()}</div>
            <div class="event-stat-label">總銷售額</div>
          </div>
          <div class="event-stat-item">
            <div class="event-stat-num">${txCount}</div>
            <div class="event-stat-label">交易筆數</div>
          </div>
          <div class="event-stat-item">
            <div class="event-stat-num">${ev.items?.length||0}</div>
            <div class="event-stat-label">外展商品</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════
// 新增 / 編輯
// ══════════════════════════════
let evItems = [];  // 外展商品清單（編輯中）

function newEvent(){
  editingEventId = null;
  evItems = [];
  document.getElementById('event-edit-title').textContent = '新增外展活動';
  ['ev-name','ev-location','ev-staff','ev-note'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('ev-start').value = todayStr();
  document.getElementById('ev-end').value   = todayStr();
  document.getElementById('ev-item-search').value = '';
  document.getElementById('ev-search-result').style.display = 'none';
  renderEvItems();
  showPage('event-edit');
}

function editCurrentEvent(){
  const ev = events.find(e=>e.id===currentEventId);
  if(!ev) return;
  editingEventId = ev.id;
  evItems = JSON.parse(JSON.stringify(ev.items||[]));
  document.getElementById('event-edit-title').textContent = '編輯外展活動';
  document.getElementById('ev-name').value     = ev.name;
  document.getElementById('ev-location').value = ev.location;
  document.getElementById('ev-start').value    = ev.startDate;
  document.getElementById('ev-end').value      = ev.endDate;
  document.getElementById('ev-staff').value    = ev.staff||'';
  document.getElementById('ev-note').value     = ev.note||'';
  document.getElementById('ev-item-search').value = '';
  document.getElementById('ev-search-result').style.display = 'none';
  renderEvItems();
  showPage('event-edit');
}

// 商品搜尋
function evSearchItems(q){
  const res = document.getElementById('ev-search-result');
  if(!q){ res.style.display='none'; return; }
  const items = FINISHED.filter(i=>i.name.includes(q)||i.id.includes(q)).slice(0,8);
  if(!items.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML = items.map(item=>`
    <div class="pos-search-result-item" onclick="evAddItem('${item.id}')">
      <span>${item.emoji}</span>
      <span style="flex:1;font-size:13px;">${item.name}</span>
      <span style="font-size:11px;color:var(--text3);">$${item.price||0}</span>
    </div>`).join('');
}
function evAddItem(id){
  const item = ALL_ITEMS.find(i=>i.id===id);
  if(!item) return;
  if(evItems.find(i=>i.id===id)){ showToast('⚠️ 已在清單中'); return; }
  evItems.push({id, name:item.name, emoji:item.emoji, price:item.price||0});
  document.getElementById('ev-item-search').value='';
  document.getElementById('ev-search-result').style.display='none';
  renderEvItems();
}
function evRemoveItem(id){
  evItems = evItems.filter(i=>i.id!==id);
  renderEvItems();
}
function renderEvItems(){
  const list  = document.getElementById('ev-item-list');
  const count = document.getElementById('ev-item-count');
  count.textContent = evItems.length+'項';
  if(!evItems.length){
    list.innerHTML='<div class="order-empty">尚未選擇商品</div>'; return;
  }
  list.innerHTML = evItems.map(item=>`
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">$${item.price} ／ 個</div>
      </div>
      <button class="order-del" onclick="evRemoveItem('${item.id}')"><i class="ti ti-x"></i></button>
    </div>`).join('');
}

function saveEvent(){
  const name     = document.getElementById('ev-name').value.trim();
  const location = document.getElementById('ev-location').value.trim();
  const startDate= document.getElementById('ev-start').value;
  const endDate  = document.getElementById('ev-end').value;
  if(!name)     { showToast('⚠️ 請填寫活動名稱'); return; }
  if(!location) { showToast('⚠️ 請填寫地點'); return; }
  if(!startDate){ showToast('⚠️ 請選擇開始日期'); return; }
  if(!endDate)  { showToast('⚠️ 請選擇結束日期'); return; }
  if(endDate < startDate){ showToast('⚠️ 結束日期不能早於開始日期'); return; }
  if(!evItems.length){ showToast('⚠️ 請至少加入一項商品'); return; }

  const data = {
    name, location, startDate, endDate,
    staff: document.getElementById('ev-staff').value.trim(),
    note:  document.getElementById('ev-note').value.trim(),
    items: JSON.parse(JSON.stringify(evItems)),
  };

  if(editingEventId){
    const idx = events.findIndex(e=>e.id===editingEventId);
    if(idx>=0){ events[idx] = {...events[idx], ...data}; }
  } else {
    events.push({ id:'EV'+Date.now(), no:genEventNo(), createdAt:todayStr(), ...data });
  }
  saveEvents();
  showToast('✅ 外展活動已儲存');
  showPage('events');
}

// ══════════════════════════════
// 詳細頁
// ══════════════════════════════
function viewEvent(id){
  const ev = events.find(e=>e.id===id);
  if(!ev) return;
  currentEventId = id;
  document.getElementById('event-detail-title').textContent = ev.name;

  // 活動資訊卡
  const st = eventStatus(ev);
  const days = totalDays(ev);
  document.getElementById('event-info-card').innerHTML = `
    <div class="event-info-top">
      <div class="proc-status-badge" style="background:${statusBg_ev(st)};color:${statusColor_ev(st)};margin-bottom:8px;">
        ${statusLabel_ev(st)}
      </div>
    </div>
    <div class="cust-info-block">
      <div class="cust-info-row"><i class="ti ti-map-pin"></i>${ev.location}</div>
      <div class="cust-info-row"><i class="ti ti-calendar"></i>
        ${fmtDate(ev.startDate)}${days>1?' ～ '+fmtDate(ev.endDate):''}（共 ${days} 天）
      </div>
      ${ev.staff?`<div class="cust-info-row"><i class="ti ti-users"></i>參展人員：${ev.staff}</div>`:''}
      ${ev.no?`<div class="cust-info-row muted"><i class="ti ti-hash"></i>${ev.no}</div>`:''}
      ${ev.note?`<div class="cust-info-row"><i class="ti ti-notes"></i>${ev.note}</div>`:''}
    </div>`;

  // 開始外展按鈕
  renderEventStartSection(ev);

  // 銷售報告
  renderEventReport(ev);

  // 商品排行
  renderEventRanking(ev);

  showPage('event-detail');
}

function renderEventStartSection(ev){
  const st  = eventStatus(ev);
  const el  = document.getElementById('event-start-section');
  const t   = todayStr();
  const days= totalDays(ev);

  if(st === 'upcoming'){
    el.innerHTML=`<div style="text-align:center;padding:16px;color:var(--text3);font-size:14px;">
      <i class="ti ti-clock" style="font-size:28px;display:block;margin-bottom:6px;"></i>
      活動尚未開始，${fmtDate(ev.startDate)} 開始</div>`;
    return;
  }
  if(st === 'ended'){
    el.innerHTML=`<div style="text-align:center;padding:12px;color:var(--text3);font-size:14px;">
      活動已結束</div>`;
    return;
  }

  // 進行中：顯示每天的開啟按鈕
  let dayBtns = '';
  for(let i=0;i<days;i++){
    const d = new Date(ev.startDate);
    d.setDate(d.getDate()+i);
    const ds = d.toISOString().slice(0,10);
    const isToday = ds===t;
    const dayNum  = i+1;
    const txCnt   = calcDayTxCount(ev.id, ds);
    const daySales= calcDaySales(ev.id, ds);
    dayBtns += `
      <button class="event-day-btn ${isToday?'today':''}" onclick="startEventPOS('${ev.id}', ${dayNum}, '${ds}')">
        <div class="event-day-top">
          <span class="event-day-label">第 ${dayNum} 天 ${isToday?'（今天）':''}</span>
          <span style="font-size:11px;color:${isToday?'white':'var(--text3)'};">${fmtDate(ds)}</span>
        </div>
        <div class="event-day-stats">
          <span>💰 $${daySales.toLocaleString()}</span>
          <span>🧾 ${txCnt} 筆</span>
        </div>
        <div class="event-day-open">
          <i class="ti ti-cash-register"></i> 開啟 POS
        </div>
      </button>`;
  }
  el.innerHTML = `<div class="section-title" style="margin-top:14px;">
    <i class="ti ti-cash-register"></i> 開啟外展 POS</div>
    <div class="event-days-grid">${dayBtns}</div>`;
}

// 開啟外展POS
function startEventPOS(eventId, dayNum, dateStr){
  const ev = events.find(e=>e.id===eventId);
  if(!ev) return;
  currentEventId  = eventId;
  currentEventDay = dayNum;

  // 清空POS
  clearPOS();

  // 設定外展banner
  document.getElementById('event-pos-banner').style.display = 'block';
  document.getElementById('event-banner-name').textContent  = ev.name;
  document.getElementById('event-banner-day').textContent   =
    totalDays(ev)>1 ? `第 ${dayNum} 天` : '';

  // 外展快捷商品按鈕
  const grid = document.getElementById('eventQuickGrid');
  grid.innerHTML = (ev.items||[]).map(item=>`
    <button class="event-quick-btn" onclick="addPOSItemById('${item.id}')">
      <span class="eq-emoji">${item.emoji}</span>
      <span class="eq-name">${item.name.length>8?item.name.slice(0,8)+'…':item.name}</span>
      <span class="eq-price">$${item.price}</span>
    </button>`).join('');

  // 更新POS標題
  document.getElementById('pos-title').innerHTML =
    `<i class="ti ti-cash-register" style="color:#BA7517;"></i> ${ev.name}`;

  showPage('pos');
}

// POS 返回
function posBack(){
  if(currentEventId){
    // 外展模式 → 回外展詳細
    showPage('event-detail');
  } else {
    showPage('home');
  }
}

// 外展模式收款後，記錄 eventId 和 day
const _origConfirmPOS = confirmPOS;
window.confirmPOS = function(){
  // 在 logs 的最後一批記錄加上 eventId
  const beforeCount = logs.length;
  _origConfirmPOS();
  // 收款後 logs 會增加，把新記錄加上 eventId
  if(currentEventId){
    for(let i=beforeCount;i<logs.length;i++){
      logs[i].eventId  = currentEventId;
      logs[i].eventDay = currentEventDay;
    }
    saveLogs();
  }
};

// ══════════════════════════════
// 銷售統計
// ══════════════════════════════
function getEventLogs(eventId){
  return logs.filter(l=> l.eventId===eventId && (l.op==='ship'||l.op_label==='POS出售'));
}
function getDayLogs(eventId, dateStr){
  return getEventLogs(eventId).filter(l=> l.time && l.time.includes(
    new Date(dateStr).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'})
  ));
}
function calcEventTotal(eventId){
  return getEventLogs(eventId).reduce((s,l)=>{
    const item = ALL_ITEMS.find(i=>i.id===l.id);
    return s + (item?.price||0)*(l.qty||0);
  },0);
}
function calcEventTxCount(eventId){
  // 用時間分組計算交易筆數（同一秒算一筆）
  const times = [...new Set(getEventLogs(eventId).map(l=>l.time))];
  return times.length;
}
function calcDaySales(eventId, dateStr){
  return getDayLogs(eventId, dateStr).reduce((s,l)=>{
    const item = ALL_ITEMS.find(i=>i.id===l.id);
    return s + (item?.price||0)*(l.qty||0);
  },0);
}
function calcDayTxCount(eventId, dateStr){
  const times = [...new Set(getDayLogs(eventId, dateStr).map(l=>l.time))];
  return times.length;
}

function renderEventReport(ev){
  const el   = document.getElementById('event-report-section');
  const days = totalDays(ev);
  let rows   = '';
  let grandTotal = 0;
  let grandTx    = 0;

  for(let i=0;i<days;i++){
    const d = new Date(ev.startDate);
    d.setDate(d.getDate()+i);
    const ds    = d.toISOString().slice(0,10);
    const sales = calcDaySales(ev.id, ds);
    const txCnt = calcDayTxCount(ev.id, ds);
    grandTotal += sales;
    grandTx    += txCnt;
    rows += `
      <div class="event-report-row">
        <div>
          <div style="font-size:14px;font-weight:600;">第 ${i+1} 天</div>
          <div style="font-size:12px;color:var(--text3);">${fmtDate(ds)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:700;color:#6B4FBB;">$${sales.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text3);">${txCnt} 筆交易</div>
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div class="event-report-card">
      ${rows}
      <div class="event-report-total">
        <span>合計</span>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:700;color:#6B4FBB;">$${grandTotal.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text3);">${grandTx} 筆交易</div>
        </div>
      </div>
    </div>`;
}

function renderEventRanking(ev){
  const el   = document.getElementById('event-ranking-section');
  const evLogs = getEventLogs(ev.id);
  if(!evLogs.length){
    el.innerHTML='<div class="report-empty">尚無銷售記錄</div>'; return;
  }

  // 彙整商品銷售量
  const map = {};
  evLogs.forEach(l=>{
    if(!map[l.id]) map[l.id] = {id:l.id, name:l.name, emoji:l.emoji, qty:0, amount:0};
    const item = ALL_ITEMS.find(i=>i.id===l.id);
    map[l.id].qty    += l.qty||0;
    map[l.id].amount += (item?.price||0)*(l.qty||0);
  });
  const ranking = Object.values(map).sort((a,b)=>b.amount-a.amount);
  const maxAmt  = ranking[0]?.amount||1;

  el.innerHTML = ranking.map((item,idx)=>`
    <div class="event-rank-row">
      <div class="event-rank-num ${idx<3?'top':''}">
        ${idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':idx+1}
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">${item.emoji} ${item.name}</div>
        <div class="event-rank-bar-wrap">
          <div class="event-rank-bar" style="width:${Math.round(item.amount/maxAmt*100)}%"></div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:15px;font-weight:700;color:#6B4FBB;">$${item.amount.toLocaleString()}</div>
        <div style="font-size:11px;color:var(--text3);">${item.qty} 個</div>
      </div>
    </div>`).join('');
}
