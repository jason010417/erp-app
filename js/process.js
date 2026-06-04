// ===== 製程進度系統 =====

// ── 資料 ──
let productionOrders = JSON.parse(localStorage.getItem('erp_prod_orders') || '[]');
function saveProdOrders(){ localStorage.setItem('erp_prod_orders', JSON.stringify(productionOrders)); }

// ── 常數 ──
const PROC_STEPS = [
  { key:'prepare',   label:'備料中', icon:'ti-packages',      color:'#BA7517', bg:'#FAEEDA' },
  { key:'producing', label:'生產中', icon:'ti-player-play',   color:'#185FA5', bg:'#E6F1FB' },
  { key:'done',      label:'已完成', icon:'ti-circle-check',  color:'#1D9E75', bg:'#E1F5EE' },
  { key:'shipped',   label:'已出貨', icon:'ti-truck',         color:'#6B4FBB', bg:'#EDE9F8' },
];
function stepOf(key){ return PROC_STEPS.find(s=>s.key===key) || PROC_STEPS[0]; }
function stepIndex(key){ return PROC_STEPS.findIndex(s=>s.key===key); }
function nextStep(key){
  const i = stepIndex(key);
  return i < PROC_STEPS.length-1 ? PROC_STEPS[i+1] : null;
}

// ── 單號產生 ──
function genProcNo(){
  const d = new Date();
  const prefix = 'P' + d.getFullYear().toString().slice(2)
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0');
  const same = productionOrders.filter(o=>o.no.startsWith(prefix)).length;
  return prefix + '-' + String(same+1).padStart(3,'0');
}

// ══════════════════════════════
// 列表頁
// ══════════════════════════════
let procFilter = 'all';

function initProcessTrack(){
  filterOrders('all');
}
function filterOrders(status){
  procFilter = status;
  ['all','prepare','producing','done','shipped'].forEach(s=>{
    document.getElementById('pf-'+s)?.classList.toggle('active', s===status);
  });
  renderOrderList_proc();
}
function renderOrderList_proc(){
  const el = document.getElementById('process-order-list');
  let orders = procFilter==='all' ? productionOrders : productionOrders.filter(o=>o.status===procFilter);
  orders = orders.slice().reverse();

  if(!orders.length){
    el.innerHTML = `<div class="proc-empty">
      <i class="ti ti-clipboard-x" style="font-size:40px;color:var(--text3);display:block;text-align:center;margin-bottom:8px;"></i>
      <div style="text-align:center;color:var(--text3);font-size:14px;">沒有符合的訂單<br>點右上角「新增」建立生產訂單</div>
    </div>`;
    return;
  }

  el.innerHTML = orders.map(o=>{
    const step = stepOf(o.status);
    const c = typeof customers!=='undefined' ? customers.find(x=>x.id===o.customerId) : null;
    const itemNames = (o.items||[]).slice(0,2).map(i=>i.name).join('、');
    const more = (o.items||[]).length > 2 ? ` 等${(o.items||[]).length}項` : '';
    const deadlineStr = o.deadline ? `預計 ${fmtDate(o.deadline)}` : '';
    return `
      <div class="proc-list-card" onclick="viewProcOrder('${o.id}')">
        <div class="proc-list-top">
          <div class="proc-list-no">${o.no}</div>
          <div class="proc-status-badge" style="background:${step.bg};color:${step.color};">
            <i class="ti ${step.icon}"></i> ${step.label}
          </div>
        </div>
        <div class="proc-list-items">${o.items?.[0]?.emoji||'📦'} ${itemNames}${more}</div>
        <div class="proc-list-meta">
          ${c?`<span><i class="ti ti-user"></i>${c.name}</span>`:''}
          ${o.sourceRef?`<span><i class="ti ti-link"></i>${o.sourceRef}</span>`:''}
          ${deadlineStr?`<span><i class="ti ti-calendar"></i>${deadlineStr}</span>`:''}
          <span><i class="ti ti-clock"></i>${o.createdAt||''}</span>
        </div>
        <!-- mini 進度條 -->
        <div class="proc-mini-bar">
          ${PROC_STEPS.map((s,i)=>`
            <div class="proc-mini-step ${stepIndex(o.status)>=i?'active':''}">
              <div class="proc-mini-dot" style="${stepIndex(o.status)>=i?'background:'+s.color:''}"></div>
              <div class="proc-mini-label">${s.label}</div>
            </div>
            ${i<PROC_STEPS.length-1?'<div class="proc-mini-line '+(stepIndex(o.status)>i?'active':'')+'"></div>':''}`).join('')}
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════
// 新增 / 編輯
// ══════════════════════════════
let currentProcOrder = null;
let _procCustId = null;

function newProductionOrder(){
  currentProcOrder = {
    id: null, no: genProcNo(),
    createdAt: new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    deadline: '', sourceRef: '', customerId: null,
    items: [], remark: '', status: 'prepare', statusLog: []
  };
  _procCustId = null;
  resetProcEditForm();
  showPage('process-edit');
}

function resetProcEditForm(){
  document.getElementById('proc-edit-title').textContent = '新增生產訂單';
  document.getElementById('proc-no').textContent   = currentProcOrder.no;
  document.getElementById('proc-date').textContent = currentProcOrder.createdAt;
  document.getElementById('proc-deadline').value   = currentProcOrder.deadline||'';
  document.getElementById('proc-source-ref').value = currentProcOrder.sourceRef||'';
  document.getElementById('proc-remark').value     = currentProcOrder.remark||'';
  document.getElementById('proc-customer-name').textContent = '選擇客戶 ▾';
  document.getElementById('proc-item-search').value = '';
  document.getElementById('proc-search-result').style.display = 'none';
  renderProcItems();
}

// 客戶選擇
function openProcCustomerPicker(){
  // 複用估價單的 customerModal
  filterCustomerList('');
  document.getElementById('customerSearch').value = '';
  // 暫時覆蓋 selectCustomer 行為
  window._procSelectMode = true;
  document.getElementById('customerModal').style.display = 'flex';
}

// 攔截 selectCustomer（在 estimate.js 定義的）：判斷是否為製程模式
const _origSelectCustomer = window.selectCustomer;
window.selectCustomer = function(id){
  if(window._procSelectMode){
    window._procSelectMode = false;
    const c = typeof customers!=='undefined' ? customers.find(x=>x.id===id) : null;
    if(!c) return;
    currentProcOrder.customerId = id;
    document.getElementById('proc-customer-name').textContent = c.name;
    document.getElementById('customerModal').style.display = 'none';
  } else {
    if(typeof _origSelectCustomer==='function') _origSelectCustomer(id);
  }
};

// 品項搜尋（只找成品）
function procSearchItems(q){
  const res = document.getElementById('proc-search-result');
  if(!q){ res.style.display='none'; return; }
  const items = FINISHED.filter(i=>i.name.includes(q)||i.id.includes(q)).slice(0,8);
  if(!items.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML = items.map(item=>`
    <div class="pos-search-result-item" onclick="procAddItem('${item.id}')">
      <span>${item.emoji}</span>
      <span style="flex:1;font-size:13px;">${item.name}</span>
      <span style="font-size:11px;color:var(--text3);">${item.id}</span>
    </div>`).join('');
}
function procAddItem(id){
  const item = ALL_ITEMS.find(i=>i.id===id);
  if(!item) return;
  const ex = currentProcOrder.items.find(i=>i.id===id);
  if(ex){ ex.qty++; }
  else { currentProcOrder.items.push({id, name:item.name, emoji:item.emoji, qty:1}); }
  document.getElementById('proc-item-search').value='';
  document.getElementById('proc-search-result').style.display='none';
  renderProcItems();
  showToast(`✅ 加入：${item.name}`);
}
function procRemoveItem(idx){ currentProcOrder.items.splice(idx,1); renderProcItems(); }
function procChangeQty(idx,delta){
  currentProcOrder.items[idx].qty = Math.max(1, currentProcOrder.items[idx].qty+delta);
  renderProcItems();
}
function renderProcItems(){
  const list  = document.getElementById('proc-item-list');
  const count = document.getElementById('proc-item-count');
  if(!currentProcOrder.items.length){
    list.innerHTML='<div class="order-empty">尚未加入成品</div>';
    count.textContent='0 項'; return;
  }
  count.textContent = currentProcOrder.items.length+'項';
  list.innerHTML = currentProcOrder.items.map((item,idx)=>`
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">${item.id}</div>
      </div>
      <div class="order-qty-ctrl">
        <button class="qty-edit-btn minus" onclick="procChangeQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-edit-btn plus"  onclick="procChangeQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="procRemoveItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`).join('');
}

// 從估價單建立
function estimateToProcess(estId){
  const e = typeof estimates!=='undefined' ? estimates.find(x=>x.id===estId) : null;
  if(!e) return;
  currentProcOrder = {
    id: null, no: genProcNo(),
    createdAt: new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    deadline:'', sourceRef: e.no, customerId: e.customerId,
    items: e.items.map(i=>({id:i.id,name:i.name,emoji:i.emoji,qty:i.qty})),
    remark:'', status:'prepare', statusLog:[]
  };
  resetProcEditForm();
  document.getElementById('proc-source-ref').value = e.no;
  if(e.customerId){
    const c = typeof customers!=='undefined' ? customers.find(x=>x.id===e.customerId) : null;
    if(c) document.getElementById('proc-customer-name').textContent = c.name;
  }
  showPage('process-edit');
}

function saveProcDraft(){
  _collectProc();
  if(!currentProcOrder.items.length){ showToast('⚠️ 請先加入成品'); return; }
  _upsertProcOrder();
  showToast('📝 已儲存：'+currentProcOrder.no);
}
function confirmProcOrder(){
  _collectProc();
  if(!currentProcOrder.items.length){ showToast('⚠️ 請先加入成品'); return; }
  if(!currentProcOrder.id) {
    currentProcOrder.statusLog = [{
      status:'prepare', label:'備料中',
      time: new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
      note:'訂單建立'
    }];
  }
  _upsertProcOrder();
  showToast('✅ 生產訂單已建立：'+currentProcOrder.no);
  showPage('process-track');
}
function _collectProc(){
  currentProcOrder.deadline  = document.getElementById('proc-deadline').value;
  currentProcOrder.sourceRef = document.getElementById('proc-source-ref').value.trim();
  currentProcOrder.remark    = document.getElementById('proc-remark').value.trim();
}
function _upsertProcOrder(){
  if(!currentProcOrder.id) currentProcOrder.id = 'PO'+Date.now();
  const idx = productionOrders.findIndex(o=>o.id===currentProcOrder.id);
  if(idx>=0) productionOrders[idx] = JSON.parse(JSON.stringify(currentProcOrder));
  else productionOrders.push(JSON.parse(JSON.stringify(currentProcOrder)));
  saveProdOrders();
  renderOrderList_proc();
}

// ══════════════════════════════
// 詳細頁
// ══════════════════════════════
function viewProcOrder(id){
  const o = productionOrders.find(x=>x.id===id);
  if(!o) return;
  currentProcOrder = JSON.parse(JSON.stringify(o));
  renderProcDetail();
  showPage('process-detail');
}
function editProcOrder(){
  document.getElementById('proc-edit-title').textContent = currentProcOrder.no;
  document.getElementById('proc-no').textContent   = currentProcOrder.no;
  document.getElementById('proc-date').textContent = currentProcOrder.createdAt;
  document.getElementById('proc-deadline').value   = currentProcOrder.deadline||'';
  document.getElementById('proc-source-ref').value = currentProcOrder.sourceRef||'';
  document.getElementById('proc-remark').value     = currentProcOrder.remark||'';
  const c = typeof customers!=='undefined' ? customers.find(x=>x.id===currentProcOrder.customerId) : null;
  document.getElementById('proc-customer-name').textContent = c ? c.name : '選擇客戶 ▾';
  renderProcItems();
  showPage('process-edit');
}

function renderProcDetail(){
  const o = currentProcOrder;
  document.getElementById('proc-detail-no').textContent = o.no;

  // ── 進度條 ──
  const curIdx = stepIndex(o.status);
  document.getElementById('proc-progress-card').innerHTML = `
    <div class="proc-progress-steps">
      ${PROC_STEPS.map((s,i)=>`
        <div class="proc-step-col ${i<=curIdx?'active':''}">
          <div class="proc-step-circle" style="${i<=curIdx?'background:'+s.color+';border-color:'+s.color:''}">
            <i class="ti ${s.icon}" style="color:${i<=curIdx?'white':'var(--text3)'}"></i>
          </div>
          <div class="proc-step-label" style="${i===curIdx?'color:'+s.color+';font-weight:700':''}">
            ${s.label}${i===curIdx?' ←':''}
          </div>
        </div>
        ${i<PROC_STEPS.length-1?`<div class="proc-step-line ${i<curIdx?'active':''}"></div>`:''}`
      ).join('')}
    </div>`;

  // ── 品項 ──
  const itemsEl = document.getElementById('proc-detail-items');
  itemsEl.innerHTML = (o.items||[]).map(item=>`
    <div class="catdetail-row" style="cursor:default;">
      <div class="catdetail-emoji">${item.emoji}</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${item.name}</div>
        <div class="catdetail-id">${item.id}</div>
      </div>
      <div class="catdetail-right">
        <div class="catdetail-qty ok">${item.qty}</div>
        <div class="catdetail-unit">個</div>
      </div>
    </div>`).join('') || '<div class="order-empty">無品項</div>';

  // ── 訂單資訊 ──
  const c = typeof customers!=='undefined' ? customers.find(x=>x.id===o.customerId) : null;
  document.getElementById('proc-detail-info').innerHTML = `
    <div class="cust-info-block">
      ${c?`<div class="cust-info-row"><i class="ti ti-user"></i>${c.name}</div>`:''}
      ${o.sourceRef?`<div class="cust-info-row"><i class="ti ti-link"></i>來源：${o.sourceRef}</div>`:''}
      ${o.deadline?`<div class="cust-info-row"><i class="ti ti-calendar"></i>預計完成：${fmtDate(o.deadline)}</div>`:''}
      ${o.remark?`<div class="cust-info-row"><i class="ti ti-notes"></i>${o.remark}</div>`:''}
      <div class="cust-info-row muted"><i class="ti ti-clock"></i>建立：${o.createdAt}</div>
    </div>`;

  // ── 狀態更新按鈕 ──
  const actEl = document.getElementById('proc-status-actions');
  const next  = nextStep(o.status);
  if(next && o.status!=='shipped'){
    actEl.innerHTML = `
      <button class="confirm-btn" style="background:${next.color};margin-bottom:8px;" onclick="advanceProcStatus()">
        <i class="ti ${next.icon}"></i> 推進到「${next.label}」
      </button>
      ${o.status==='done'?`
      <button class="confirm-btn" style="background:#6B4FBB;" onclick="advanceProcStatus()">
        <i class="ti ti-truck"></i> 標記出貨完成
      </button>`:''}`;
  } else {
    actEl.innerHTML = `<div style="text-align:center;padding:12px;color:var(--text3);font-size:14px;">✅ 此訂單已完成出貨</div>`;
  }

  // ── 狀態記錄 ──
  const logEl = document.getElementById('proc-status-log');
  const logItems = (o.statusLog||[]).slice().reverse();
  logEl.innerHTML = logItems.length ? logItems.map(l=>{
    const s = stepOf(l.status);
    return `<div class="log-row">
      <div class="log-icon" style="background:${s.bg};"><i class="ti ${s.icon}" style="color:${s.color};font-size:16px;"></i></div>
      <div class="log-text">
        <div class="log-name">${s.label}${l.note?'：'+l.note:''}</div>
        <div class="log-time">${l.time}</div>
      </div>
    </div>`;
  }).join('') : '<div class="order-empty">尚無狀態記錄</div>';
}

// 推進狀態
function advanceProcStatus(){
  const next = nextStep(currentProcOrder.status);
  if(!next) return;
  const now = new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  currentProcOrder.status = next.key;
  currentProcOrder.statusLog = currentProcOrder.statusLog || [];
  currentProcOrder.statusLog.push({ status:next.key, label:next.label, time:now, note:'' });
  // 出貨時自動扣庫存並寫記錄
  if(next.key==='shipped'){
    currentProcOrder.items.forEach(item=>{
      inventory[item.id] = Math.max(0,(inventory[item.id]??0)-item.qty);
      logs.push({op:'ship',op_label:'生產出貨',id:item.id,name:item.name,emoji:item.emoji,qty:item.qty,time:now});
    });
    saveInventory(); saveLogs();
    renderHome(); renderFinished(); renderMaterials(); renderLogs();
  }
  _upsertProcOrder();
  renderProcDetail();
  showToast(`✅ 狀態已更新為「${next.label}」`);
}
