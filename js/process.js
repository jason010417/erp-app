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

  // 直接建立生產訂單，不需要再填一次表單
  const now = new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const newOrder = {
    id: 'PO'+Date.now(),
    no: genProcNo(),
    createdAt: now,
    deadline: '',
    sourceRef: e.no,
    customerId: e.customerId,
    items: e.items.map(i=>({id:i.id, name:i.name, emoji:i.emoji, qty:i.qty})),
    delivery: e.delivery||'pickup',
    remark: e.remark||'',
    status: 'prepare',
    statusLog: [{ status:'prepare', label:'備料中', time:now, note:'由估價單 '+e.no+' 建立' }]
  };
  productionOrders.push(newOrder);
  saveProdOrders();
  renderOrderList_proc();

  // 同時標記估價單為生產中
  const ei = typeof estimates!=='undefined' ? estimates.findIndex(x=>x.id===estId) : -1;
  if(ei>=0){ estimates[ei].status='proc'; saveEstimates(); }

  showToast('✅ 生產訂單已建立：'+newOrder.no);

  // 直接跳到製程詳細頁
  currentProcOrder = JSON.parse(JSON.stringify(newOrder));
  renderProcDetail();
  showPage('process-detail');
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
  if(o.status === 'shipped'){
    actEl.innerHTML = `
      <button class="confirm-btn" style="background:#6B4FBB;margin-bottom:8px;" onclick="openShippingNote('${o.id}')">
        <i class="ti ti-file-text"></i> 列印出貨單
      </button>
      <div style="text-align:center;padding:8px;color:var(--text3);font-size:13px;">✅ 此訂單已完成出貨</div>`;
  } else if(next){
    actEl.innerHTML = `
      <button class="confirm-btn" style="background:${next.color};margin-bottom:8px;" onclick="advanceProcStatus()">
        <i class="ti ${next.icon}"></i> 推進到「${next.label}」
      </button>`;
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
    // 同步把對應估價單標為已完成
    if(currentProcOrder.sourceRef && typeof estimates!=='undefined'){
      const ei = estimates.findIndex(e=>e.no===currentProcOrder.sourceRef);
      if(ei>=0){ estimates[ei].status='done'; saveEstimates(); }
    }
    renderHome(); renderFinished(); renderMaterials(); renderLogs();
  }
  _upsertProcOrder();
  renderProcDetail();
  showToast(`✅ 狀態已更新為「${next.label}」`);
  // 出貨後提示開出貨單
  if(next.key==='shipped'){
    setTimeout(()=>{
      const actEl = document.getElementById('proc-status-actions');
      actEl.innerHTML = `
        <button class="confirm-btn" style="background:#6B4FBB;margin-bottom:8px;" onclick="openShippingNote('${currentProcOrder.id}')">
          <i class="ti ti-file-text"></i> 列印出貨單
        </button>
        <div style="text-align:center;padding:8px;color:var(--text3);font-size:13px;">✅ 此訂單已完成出貨</div>`;
    }, 300);
  }
}

// ===== 出貨單列印 =====
let shippingNoteOrder = null;
let snMethod = 'pickup';

function openShippingNote(orderId){
  const o = productionOrders.find(x=>x.id===orderId) || currentProcOrder;
  if(!o) return;
  shippingNoteOrder = o;
  snMethod = o.delivery || 'pickup';

  // 預設寄貨日期為今天
  document.getElementById('sn-ship-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('sn-logistics').value  = '';
  document.getElementById('sn-tracking').value   = '';

  // 套用估價單的送貨方式
  selectShipping(snMethod);
  renderShippingPreview();
  showPage('shipping-note');
}

function selectShipping(method){
  snMethod = method;
  ['pickup','delivery','personal'].forEach(m=>{
    document.getElementById('sn-'+m)?.classList.toggle('active', m===method);
  });
  // 宅配才顯示物流欄位
  const showLogistics = method === 'delivery';
  document.getElementById('sn-logistics-section').style.display = showLogistics ? 'block' : 'none';
  document.getElementById('sn-tracking-section').style.display  = showLogistics ? 'block' : 'none';
  renderShippingPreview();
}

function renderShippingPreview(){
  const o  = shippingNoteOrder;
  if(!o) return;
  const c  = typeof customers!=='undefined' ? customers.find(x=>x.id===o.customerId) : null;
  const shipDate  = document.getElementById('sn-ship-date').value;
  const logistics = document.getElementById('sn-logistics').value;
  const tracking  = document.getElementById('sn-tracking').value;
  const methodLabels = { pickup:'自取', delivery:'宅配', personal:'親送' };

  const itemsHTML = (o.items||[]).map(item=>`
    <tr>
      <td>${item.emoji} ${item.name}</td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:center;">個</td>
    </tr>`).join('');

  document.getElementById('shipping-preview').innerHTML = `
    <div class="shipping-doc" id="shipping-doc-body">
      <div class="shipping-doc-header">
        <div class="shipping-doc-title">出　貨　單</div>
        <div class="shipping-doc-company">工廠直售</div>
      </div>
      <div class="shipping-doc-meta">
        <div class="shipping-meta-col">
          <div class="shipping-meta-title">收件人資訊</div>
          <div class="shipping-meta-row"><span>公司／姓名</span><strong>${c?c.name:'—'}</strong></div>
          ${c&&c.contact?`<div class="shipping-meta-row"><span>承辦人</span><span>${c.contact}</span></div>`:''}
          ${c&&c.receiver?`<div class="shipping-meta-row"><span>收件人</span><span>${c.receiver}</span></div>`:''}
          ${c&&c.receiverTel?`<div class="shipping-meta-row"><span>收件電話</span><span>${c.receiverTel}</span></div>`:''}
          ${c&&c.addr?`<div class="shipping-meta-row"><span>收件地址</span><span>${c.addr}</span></div>`:''}
        </div>
        <div class="shipping-meta-col">
          <div class="shipping-meta-title">出貨資訊</div>
          <div class="shipping-meta-row"><span>訂單單號</span><strong>${o.no}</strong></div>
          ${o.sourceRef?`<div class="shipping-meta-row"><span>來源估價單</span><span>${o.sourceRef}</span></div>`:''}
          <div class="shipping-meta-row"><span>送貨方式</span><strong>${methodLabels[snMethod]}</strong></div>
          <div class="shipping-meta-row"><span>寄貨日期</span><span>${shipDate?fmtDate(shipDate):'—'}</span></div>
          ${snMethod==='delivery'&&logistics?`<div class="shipping-meta-row"><span>物流公司</span><span>${logistics}</span></div>`:''}
          ${snMethod==='delivery'&&tracking?`<div class="shipping-meta-row"><span>物流單號</span><strong>${tracking}</strong></div>`:''}
        </div>
      </div>
      <table class="shipping-table">
        <thead><tr><th>品項</th><th>數量</th><th>單位</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="shipping-doc-footer">
        <div class="shipping-sign-row">
          <div class="shipping-sign-box">出貨人員簽名：_______________</div>
          <div class="shipping-sign-box">收件人簽名：_______________</div>
        </div>
        <div class="shipping-note-text">如有問題請聯繫我們，感謝您的支持！</div>
      </div>
    </div>`;
}

function printShippingNote(){
  renderShippingPreview();
  const content = document.getElementById('shipping-doc-body').innerHTML;
  const win = window.open('','_blank','width=800,height=900');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>出貨單</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:-apple-system,'Noto Sans TC',sans-serif;padding:24px;color:#1a1a18;max-width:720px;margin:0 auto;}
    .shipping-doc-header{text-align:center;border-bottom:3px solid #6B4FBB;padding-bottom:12px;margin-bottom:16px;}
    .shipping-doc-title{font-size:28px;font-weight:700;color:#6B4FBB;letter-spacing:4px;}
    .shipping-doc-company{font-size:14px;color:#6B6B68;margin-top:4px;}
    .shipping-doc-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
    .shipping-meta-col{background:#F5F5F3;padding:12px;border-radius:8px;}
    .shipping-meta-title{font-size:12px;font-weight:700;color:#6B4FBB;margin-bottom:8px;letter-spacing:0.5px;}
    .shipping-meta-row{display:flex;gap:8px;font-size:13px;padding:3px 0;}
    .shipping-meta-row span:first-child{color:#6B6B68;min-width:60px;flex-shrink:0;}
    .shipping-meta-row strong{color:#1a1a18;}
    .shipping-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    .shipping-table th{background:#6B4FBB;color:white;padding:10px;font-size:13px;text-align:left;}
    .shipping-table td{padding:10px;font-size:13px;border-bottom:1px solid #eee;}
    .shipping-doc-footer{border-top:1px solid #ddd;padding-top:16px;}
    .shipping-sign-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:12px;}
    .shipping-sign-box{font-size:13px;color:#6B6B68;border-bottom:1px solid #ddd;padding-bottom:24px;}
    .shipping-note-text{font-size:12px;color:#9B9B98;text-align:center;}
    @media print{body{padding:0;}}
  </style></head><body>${content}</body></html>`);
  win.document.close();
  setTimeout(()=>{ win.focus(); win.print(); },400);
}
