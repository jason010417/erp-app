// ============================================================
// transfer.js — 調貨單管理（A門市 → B門市）
// ============================================================

let transfers = JSON.parse(localStorage.getItem('erp_transfers') || '[]');

function saveTransfers(){
  localStorage.setItem('erp_transfers', JSON.stringify(transfers));
  if(typeof pushToFirebase === 'function') pushToFirebase('transfers', transfers);
}

function getTransfer(id){ return transfers.find(t => t.id === id) || null; }
function genTransferNo(){ return genNo('TR', transfers, 'no'); }

function renderTransferList(){
  const el = document.getElementById('transfer-list');
  if(!el) return;
  const list = transfers.slice().reverse();
  if(!list.length){
    el.innerHTML = '<div class="order-empty">尚無調貨記錄，點右上角新增</div>';
    return;
  }
  el.innerHTML = list.map(t => {
    const isDone = t.status === 'completed';
    return `<div class="list-card" onclick="showTransferDetail('${t.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${t.no}</span>
        <span class="status-badge ${isDone?'badge-done':'badge-pending'}">
          <i class="ti ${isDone?'ti-check':'ti-clock'}"></i> ${isDone?'已完成':'待確認'}
        </span>
      </div>
      <div class="list-card-meta">
        <span><i class="ti ti-arrows-right-left"></i>
          ${getLocation(t.from)?.name||t.from} → ${getLocation(t.to)?.name||t.to}
        </span>
        <span><i class="ti ti-calendar"></i>${fmtDate(t.createdAt)}</span>
      </div>
      <div class="list-card-items">
        ${(t.items||[]).slice(0,3).map(i=>i.name).join('、')}
        ${(t.items||[]).length>3?' 等'+t.items.length+'項':''}
      </div>
    </div>`;
  }).join('');
}

let _currentTransfer = null;

function newTransfer(){
  const locs = getStoreLocations();
  _currentTransfer = {
    id:'', no:genTransferNo(),
    from: locs.find(l=>l.isMain)?.id  || 'store_A',
    to:   locs.find(l=>!l.isMain)?.id || 'store_B',
    items:[], remark:'', status:'pending', createdAt:todayStr(),
  };
  renderTransferEditPage();
  showPage('transfer-edit');
}

function showTransferDetail(id){
  const t = getTransfer(id);
  if(!t) return;
  _currentTransfer = JSON.parse(JSON.stringify(t));
  renderTransferEditPage();
  showPage('transfer-edit');
}

function renderTransferEditPage(){
  const page = document.getElementById('page-transfer-edit');
  if(!page) return;
  const t = _currentTransfer, locs = getStoreLocations(), isDone = t.status==='completed';
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('transfer')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${t.id?t.no:'新增調貨單'}</div>
    </div>
    <div class="form-card">
      <div class="form-meta-row">
        <span class="form-no">${t.no}</span>
        <span class="form-date">${fmtDate(t.createdAt)}</span>
      </div>
      <div class="transfer-direction">
        <select id="tr-from" ${isDone?'disabled':''} onchange="updateTransferDir()">
          ${locs.map(l=>`<option value="${l.id}" ${t.from===l.id?'selected':''}>${l.name}</option>`).join('')}
        </select>
        <div class="transfer-arrow"><i class="ti ti-arrow-right"></i></div>
        <select id="tr-to" ${isDone?'disabled':''} onchange="updateTransferDir()">
          ${locs.map(l=>`<option value="${l.id}" ${t.to===l.id?'selected':''}>${l.name}</option>`).join('')}
        </select>
      </div>
      ${!isDone?`<div class="search-bar" style="margin-top:10px;">
        <i class="ti ti-search"></i>
        <input type="search" id="tr-search" placeholder="搜尋成品加入..."
          oninput="searchTransferItems(this.value)"/>
      </div>
      <div id="tr-search-result" style="display:none;"></div>`:''}
      <div class="order-list-header">
        <span class="order-list-title">調貨清單</span>
        <span class="order-count" id="tr-item-count">${t.items.length} 項</span>
      </div>
      <div class="order-list" id="tr-item-list"></div>
      <div class="cust-field" style="margin-top:10px;">
        <label>備註</label>
        <input type="text" id="tr-remark" value="${t.remark||''}"
          placeholder="調貨備註..." ${isDone?'disabled':''}/>
      </div>
    </div>
    ${t.items.length&&!isDone?`<div class="section-title" style="margin-top:10px;"><i class="ti ti-packages"></i> 來源庫存</div>
    <div id="tr-stock-ref"></div>`:''}
    ${!isDone?`<button class="confirm-btn" style="background:var(--green);margin-top:10px;" onclick="confirmTransfer()">
      <i class="ti ti-check"></i> 確認調貨（立即更新庫存）</button>
    <button class="redit-btn" onclick="saveTransferDraft()">
      <i class="ti ti-device-floppy"></i> 存草稿</button>`
    :`<div style="text-align:center;padding:14px;color:var(--green);font-size:15px;font-weight:600;">
      <i class="ti ti-circle-check"></i> 調貨已完成</div>`}`;
  renderTransferItems();
  if(!isDone&&t.items.length) renderTransferStockRef();
}

function updateTransferDir(){
  if(!_currentTransfer) return;
  _currentTransfer.from = document.getElementById('tr-from')?.value;
  _currentTransfer.to   = document.getElementById('tr-to')?.value;
  renderTransferStockRef();
}

function searchTransferItems(q){
  const res = document.getElementById('tr-search-result');
  if(!res||!q){ if(res) res.style.display='none'; return; }
  const results = FINISHED.filter(i=>i.name.includes(q)||i.id.toLowerCase().startsWith(q.toLowerCase())).slice(0,10);
  if(!results.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML = results.map(item=>{
    const s = getStock(item.id, _currentTransfer?.from||'store_A');
    return `<div class="ss-item" onmousedown="addTransferItem('${item.id}')">
      <span class="ss-emoji">${item.emoji}</span>
      <div class="ss-info"><div class="ss-name">${item.name}</div><div class="ss-sub">${item.id}</div></div>
      <div class="${s<=0?'ss-qty-empty':'ss-qty-ok'} ss-stock">${s}</div>
    </div>`;
  }).join('');
}

function addTransferItem(id){
  const item = getItem(id); if(!item) return;
  const ex   = _currentTransfer.items.find(i=>i.id===id);
  if(ex) ex.qty++;
  else _currentTransfer.items.push({id, name:item.name, emoji:item.emoji, unit:item.unit||'個', qty:1});
  const r = document.getElementById('tr-search-result');
  if(r) r.style.display='none';
  const s = document.getElementById('tr-search');
  if(s) s.value='';
  renderTransferItems(); renderTransferStockRef();
}

function removeTransferItem(idx){ _currentTransfer.items.splice(idx,1); renderTransferItems(); renderTransferStockRef(); }
function changeTransferQty(idx,delta){
  const item = _currentTransfer.items[idx];
  if(item) item.qty = Math.max(1,item.qty+delta);
  renderTransferItems(); renderTransferStockRef();
}

function renderTransferItems(){
  const el=document.getElementById('tr-item-list'), cnt=document.getElementById('tr-item-count');
  if(!el||!_currentTransfer) return;
  const items=_currentTransfer.items, isDone=_currentTransfer.status==='completed';
  if(cnt) cnt.textContent=items.length+' 項';
  if(!items.length){ el.innerHTML='<div class="order-empty">尚未加入品項</div>'; return; }
  el.innerHTML=items.map((item,idx)=>`
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info"><div class="order-name">${item.name}</div><div class="order-id">${item.id}</div></div>
      <div class="qty-ctrl">
        ${isDone?`<span class="qty-num">${item.qty}</span>`
        :`<button class="qty-btn" onclick="changeTransferQty(${idx},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeTransferQty(${idx},1)">＋</button>`}
      </div>
      ${isDone?'':`<button class="order-del" onclick="removeTransferItem(${idx})"><i class="ti ti-x"></i></button>`}
    </div>`).join('');
}

function renderTransferStockRef(){
  const el=document.getElementById('tr-stock-ref');
  if(!el||!_currentTransfer) return;
  el.innerHTML=_currentTransfer.items.map(item=>{
    const s=getStock(item.id,_currentTransfer.from), after=s-item.qty;
    const cls=after<0?'inv-qty empty':after<=3?'inv-qty low':'inv-qty ok';
    return `<div class="inv-warn-row" style="cursor:default;">
      <span>${item.emoji} ${item.name}</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:13px;color:var(--text3);">現有 ${s}</span>
        <i class="ti ti-arrow-right" style="color:var(--text3);"></i>
        <span class="${cls}" style="font-size:16px;">${after}</span>
      </div>
    </div>`;
  }).join('');
}

function saveTransferDraft(){
  if(!_currentTransfer.items.length){ showToast('⚠️ 請先加入品項'); return; }
  _currentTransfer.remark=document.getElementById('tr-remark')?.value.trim()||'';
  upsertTransfer(); showToast('📝 調貨單已儲存'); showPage('transfer');
}

function confirmTransfer(){
  if(!_currentTransfer.items.length){ showToast('⚠️ 請先加入品項'); return; }
  if(_currentTransfer.from===_currentTransfer.to){ showToast('⚠️ 來源和目的地不能相同'); return; }
  const bad=_currentTransfer.items.filter(i=>getStock(i.id,_currentTransfer.from)<i.qty);
  if(bad.length){ showToast('⚠️ '+bad.map(i=>i.name).join('、')+' 庫存不足'); return; }
  _currentTransfer.remark=document.getElementById('tr-remark')?.value.trim()||'';
  _currentTransfer.status='completed';
  _currentTransfer.completedAt=todayStr();
  if(!_currentTransfer.id) _currentTransfer.id='TR'+Date.now();
  transferStock(
    _currentTransfer.items.map(i=>({productId:i.id,qty:i.qty})),
    _currentTransfer.from, _currentTransfer.to,
    {op:'transfer',refId:_currentTransfer.id,refType:'transfer',note:'調貨 '+_currentTransfer.no}
  );
  upsertTransfer(); showToast('✅ 調貨完成！庫存已更新'); showPage('transfer');
}

function upsertTransfer(){
  if(!_currentTransfer.id) _currentTransfer.id='TR'+Date.now();
  const idx=transfers.findIndex(t=>t.id===_currentTransfer.id);
  const copy=JSON.parse(JSON.stringify(_currentTransfer));
  if(idx>=0) transfers[idx]=copy; else transfers.push(copy);
  saveTransfers(); renderTransferList();
}

document.addEventListener('DOMContentLoaded', ()=>renderTransferList());
