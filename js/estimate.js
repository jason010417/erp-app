
// ── 送貨方式 ──
let estDelivery = 'pickup';
const DELIVERY_LABELS = { pickup:'自取', delivery:'宅配', personal:'親送' };
function selectDelivery(method){
  estDelivery = method;
  ['pickup','delivery','personal'].forEach(m=>{
    document.getElementById('dm-'+m)?.classList.toggle('active', m===method);
  });
}

// ===== 估價單 + 客戶資料系統 =====

// ── 資料儲存 ──
let customers  = JSON.parse(localStorage.getItem('erp_customers')  || '[]');
let estimates  = JSON.parse(localStorage.getItem('erp_estimates')  || '[]');

function saveCustomers(){ localStorage.setItem('erp_customers', JSON.stringify(customers)); }
function saveEstimates(){ localStorage.setItem('erp_estimates', JSON.stringify(estimates)); }

// ── 工具 ──
function genEstNo(){
  const d = new Date();
  const prefix = 'Q' + d.getFullYear().toString().slice(2)
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0');
  const same = estimates.filter(e => e.no.startsWith(prefix)).length;
  return prefix + '-' + String(same+1).padStart(3,'0');
}
function fmtDate(dateStr){
  if(!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('zh-TW',{year:'numeric',month:'numeric',day:'numeric'});
}
function today(){ return new Date().toISOString().slice(0,10); }
function addDays(d,n){ const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); }

// ══════════════════════════════
// 客戶管理
// ══════════════════════════════
let _customerFormFromPage = 'estimate-edit';

function openCustomerPicker(){
  filterCustomerList('');
  document.getElementById('customerSearch').value = '';
  document.getElementById('customerModal').style.display = 'flex';
}
function closeCustomerModal(e){
  if(!e || e.target===document.getElementById('customerModal'))
    document.getElementById('customerModal').style.display = 'none';
}
function filterCustomerList(q){
  const list = document.getElementById('customerPickList');
  const items = q ? customers.filter(c=>c.name.includes(q)||(c.tel||'').includes(q)) : customers;
  if(!items.length){
    list.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);">找不到客戶，請新增</div>';
    return;
  }
  list.innerHTML = items.map(c=>`
    <div class="supplier-item" onclick="selectCustomer('${c.id}')">
      <div style="flex:1;">
        <div class="sup-name">${c.name}</div>
        <div class="sup-tel">${c.tel||''} ${c.email?'・'+c.email:''}</div>
      </div>
      <i class="ti ti-chevron-right" style="color:var(--text3);"></i>
    </div>`).join('');
}
function selectCustomer(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  currentEstimate.customerId = id;
  document.getElementById('est-customer-name').textContent = c.name;
  const info = document.getElementById('est-customer-info');
  let lines=[];
  if(c.contact)  lines.push(`👤 ${c.contact}`);
  if(c.tel)      lines.push(`📞 ${c.tel}`);
  if(c.email)    lines.push(`✉️ ${c.email}`);
  if(c.receiver) lines.push(`📦 收件人：${c.receiver}`);
  if(c.addr)     lines.push(`📍 ${c.addr}`);
  document.getElementById('est-customer-detail').innerHTML = lines.join('<br>') || '無詳細資料';
  info.style.display = 'block';
  closeCustomerModal();
}

function openNewCustomerForm(fromCustomerPage){
  _customerFormFromPage = fromCustomerPage ? 'customers' : 'estimate-edit';
  _editCustomerId = null;
  ['nc-name','nc-contact','nc-tel','nc-email','nc-fax',
   'nc-company-title','nc-tax-id','nc-receiver','nc-receiver-tel','nc-addr'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value='';
  });
  document.getElementById('newCustomerModal').style.display = 'flex';
  document.getElementById('customerModal').style.display = 'none';
}
function closeNewCustomerModal(e){
  if(!e || e.target===document.getElementById('newCustomerModal'))
    document.getElementById('newCustomerModal').style.display = 'none';
}
function saveNewCustomer(){
  const name = document.getElementById('nc-name').value.trim();
  if(!name){ showToast('⚠️ 請填寫公司名稱或客戶姓名'); return; }

  const fields = {
    name,
    contact:      document.getElementById('nc-contact')?.value.trim()||'',
    tel:          document.getElementById('nc-tel').value.trim(),
    email:        document.getElementById('nc-email').value.trim(),
    fax:          document.getElementById('nc-fax')?.value.trim()||'',
    companyTitle: document.getElementById('nc-company-title')?.value.trim()||'',
    taxId:        document.getElementById('nc-tax-id')?.value.trim()||'',
    receiver:     document.getElementById('nc-receiver')?.value.trim()||'',
    receiverTel:  document.getElementById('nc-receiver-tel')?.value.trim()||'',
    addr:         document.getElementById('nc-addr').value.trim(),
  };

  // 編輯模式
  if(_editCustomerId){
    const idx = customers.findIndex(x=>x.id===_editCustomerId);
    if(idx>=0){
      customers[idx] = { ...customers[idx], ...fields };
      saveCustomers();
      closeNewCustomerModal();
      _editCustomerId = null;
      showToast('✅ 客戶資料已更新');
      renderCustomerList('');
      showCustomerDetail(customers[idx].id);
      return;
    }
  }

  // 新增模式
  const c = { id:'C'+Date.now(), ...fields, createdAt:today() };
  customers.push(c);
  saveCustomers();
  closeNewCustomerModal();
  showToast('✅ 客戶已新增：'+name);
  renderCustomerList('');
  if(_customerFormFromPage==='customers'){
    showPage('customers');
  } else {
    selectCustomer(c.id);
  }
}

// 客戶列表頁
function renderCustomerList(q){
  const list = document.getElementById('customer-list');
  const items = q ? customers.filter(c=>c.name.includes(q)||(c.tel||'').includes(q)) : customers;
  if(!items.length){
    list.innerHTML = '<div class="order-empty" style="padding:30px;text-align:center;color:var(--text3);">還沒有客戶<br>點右上角「新增」開始建立</div>';
    return;
  }
  list.innerHTML = items.map(c=>{
    const estCount = estimates.filter(e=>e.customerId===c.id).length;
    return `<div class="catdetail-row" onclick="showCustomerDetail('${c.id}')">
      <div class="catdetail-emoji">👤</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${c.name}</div>
        <div class="catdetail-id">${c.tel||'無電話'} ${c.email?'・'+c.email:''}</div>
      </div>
      <div class="catdetail-right" style="text-align:right;">
        <div style="font-size:13px;color:var(--text2);">估價單</div>
        <div style="font-size:20px;font-weight:700;color:var(--green);">${estCount}</div>
      </div>
    </div>`;
  }).join('');
}

function showCustomerDetail(id){
  const c = customers.find(x=>x.id===id);
  if(!c) return;
  _detailCustomerId = id;
  document.getElementById('cust-detail-name').textContent = c.name;
  document.getElementById('cust-detail-card').innerHTML = `
    <div class="cust-info-block">
      <div class="cust-section-label">聯絡資訊</div>
      ${c.contact     ? `<div class="cust-info-row"><i class="ti ti-user"></i>承辦人：${c.contact}</div>`:''}
      ${c.tel         ? `<div class="cust-info-row"><i class="ti ti-phone"></i>承辦電話：${c.tel}</div>`:''}
      ${c.email       ? `<div class="cust-info-row"><i class="ti ti-mail"></i>E-mail：${c.email}</div>`:''}
      ${c.fax         ? `<div class="cust-info-row"><i class="ti ti-device-fax"></i>傳真：${c.fax}</div>`:''}
      ${(c.companyTitle||c.taxId) ? `<div class="cust-section-label" style="margin-top:10px;">發票資訊</div>`:''}
      ${c.companyTitle? `<div class="cust-info-row"><i class="ti ti-receipt"></i>公司抬頭：${c.companyTitle}</div>`:''}
      ${c.taxId       ? `<div class="cust-info-row"><i class="ti ti-hash"></i>統一編號：${c.taxId}</div>`:''}
      ${(c.receiver||c.receiverTel||c.addr) ? `<div class="cust-section-label" style="margin-top:10px;">收件資訊</div>`:''}
      ${c.receiver    ? `<div class="cust-info-row"><i class="ti ti-package"></i>收件人：${c.receiver}</div>`:''}
      ${c.receiverTel ? `<div class="cust-info-row"><i class="ti ti-phone"></i>收件電話：${c.receiverTel}</div>`:''}
      ${c.addr        ? `<div class="cust-info-row"><i class="ti ti-map-pin"></i>收件地址：${c.addr}</div>`:''}
      <div class="cust-section-label" style="margin-top:10px;"></div>
      <div class="cust-info-row muted"><i class="ti ti-calendar"></i>建立日期：${fmtDate(c.createdAt)}</div>
    </div>`;
  const ests = estimates.filter(e=>e.customerId===id).slice().reverse();
  const hist = document.getElementById('cust-estimate-history');
  if(!ests.length){
    hist.innerHTML='<div class="order-empty" style="padding:20px;text-align:center;color:var(--text3);">尚無估價記錄</div>';
  } else {
    hist.innerHTML = ests.map(e=>`
      <div class="catdetail-row" onclick="viewEstimate('${e.id}')">
        <div class="catdetail-emoji">${statusIcon(e.status)}</div>
        <div class="catdetail-info">
          <div class="catdetail-name">${e.no}</div>
          <div class="catdetail-id">${fmtDate(e.date)} ・ ${statusLabel(e.status)}</div>
        </div>
        <div class="catdetail-right">
          <div style="font-size:18px;font-weight:700;color:var(--text);">$${e.total||0}</div>
        </div>
      </div>`).join('');
  }
  showPage('customer-detail');
}

let _editCustomerId = null;
let _detailCustomerId = null;  // 目前詳細頁的客戶id
function editCurrentCustomer(){
  const c = customers.find(x=>x.id===_detailCustomerId);
  if(!c) return;
  _editCustomerId = c.id;
  const setVal = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
  setVal('nc-name',         c.name);
  setVal('nc-contact',      c.contact);
  setVal('nc-tel',          c.tel);
  setVal('nc-email',        c.email);
  setVal('nc-fax',          c.fax);
  setVal('nc-company-title',c.companyTitle);
  setVal('nc-tax-id',       c.taxId);
  setVal('nc-receiver',     c.receiver);
  setVal('nc-receiver-tel', c.receiverTel);
  setVal('nc-addr',         c.addr);
  _customerFormFromPage = 'customer-detail';
  document.getElementById('newCustomerModal').style.display = 'flex';
}

// ══════════════════════════════
// 估價單
// ══════════════════════════════
let currentEstimate = { id:null, no:'', date:'', expire:'', customerId:null, items:[], discount:0, remark:'', status:'pending' };
let estDiscount = 0;

function statusLabel(s){ return {pending:'待確認',proc:'生產中',done:'已完成',cancel:'已取消',draft:'草稿'}[s]||s; }
function statusIcon(s) { return {pending:'📋',proc:'⚙️',done:'✅',cancel:'❌',draft:'📝'}[s]||'📋'; }
function statusColor(s){ return {pending:'#BA7517',proc:'#185FA5',done:'#1D9E75',cancel:'#E24B4A',draft:'#6B6B68'}[s]||'#BA7517'; }

function newEstimate(){
  currentEstimate = {
    id: null,
    no: genEstNo(),
    date: today(),
    expire: addDays(today(), 30),
    customerId: null,
    items: [],
    discount: 0,
    remark: '',
    status: 'draft'
  };
  estDiscount = 0;
  estDelivery = 'pickup';
  document.getElementById('est-edit-title').textContent = '新增估價單';
  document.getElementById('est-no').textContent   = currentEstimate.no;
  document.getElementById('est-date').textContent = fmtDate(currentEstimate.date);
  document.getElementById('est-expire').value     = currentEstimate.expire;
  document.getElementById('est-customer-name').textContent = '請選擇或新增客戶 ▾';
  document.getElementById('est-customer-info').style.display = 'none';
  document.getElementById('est-remark').value = '';
  document.getElementById('est-discount-label').textContent = '0%';
  document.getElementById('est-search-result').style.display = 'none';
  document.getElementById('est-item-search').value = '';
  renderEstItems();
  showPage('estimate-edit');
}

function viewEstimate(id){
  const e = estimates.find(x=>x.id===id);
  if(!e) return;

  // 已確認（生產中/已完成）→ 直接跳預覽，不開編輯頁
  if(e.status==='proc' || e.status==='done'){
    currentEstimate = JSON.parse(JSON.stringify(e));
    estDiscount = e.discount;
    previewEstimate();
    // 預覽頁顯示「主管解鎖」按鈕
    const actEl = document.getElementById('est-confirm-actions');
    const c = customers.find(x=>x.id===e.customerId);
    actEl.style.display = 'block';
    actEl.innerHTML = `
      <div class="est-locked-banner">
        <i class="ti ti-lock"></i>
        <span>此估價單已確認鎖定（${statusLabel(e.status)}）</span>
      </div>
      <button class="redit-btn" onclick="requestAdmin(()=>unlockEstimateEdit('${id}'),'解鎖編輯估價單 ${e.no}')">
        <i class="ti ti-lock-open"></i> 主管解鎖編輯
      </button>
      ${e.status!=='done'?`<button class="redit-btn" style="margin-top:6px;" onclick="cancelEstimate()">
        <i class="ti ti-x"></i> 取消此估價單
      </button>`:''}`;
    return;
  }

  // 草稿/待確認 → 正常開編輯頁
  currentEstimate = JSON.parse(JSON.stringify(e));
  estDiscount = e.discount;
  document.getElementById('est-edit-title').textContent = e.no;
  document.getElementById('est-no').textContent   = e.no;
  document.getElementById('est-date').textContent = fmtDate(e.date);
  document.getElementById('est-expire').value     = e.expire||'';
  document.getElementById('est-discount-label').textContent = e.discount + '%';
  estDelivery = e.delivery || 'pickup';
  ['pickup','delivery','personal'].forEach(m=>{
    document.getElementById('dm-'+m)?.classList.toggle('active', m===estDelivery);
  });
  document.getElementById('est-remark').value     = e.remark||'';
  const c = customers.find(x=>x.id===e.customerId);
  if(c){
    document.getElementById('est-customer-name').textContent = c.name;
    let lines=[];
    if(c.contact) lines.push(`👤 ${c.contact}`);
    if(c.tel)     lines.push(`📞 ${c.tel}`);
    if(c.email)   lines.push(`✉️ ${c.email}`);
    document.getElementById('est-customer-detail').innerHTML = lines.join('<br>')||'';
    document.getElementById('est-customer-info').style.display = 'block';
  } else {
    document.getElementById('est-customer-name').textContent = '請選擇客戶';
    document.getElementById('est-customer-info').style.display = 'none';
  }
  renderEstItems();
  showPage('estimate-edit');
}

// 主管解鎖後開放編輯
function unlockEstimateEdit(id){
  const e = estimates.find(x=>x.id===id);
  if(!e) return;
  currentEstimate = JSON.parse(JSON.stringify(e));
  estDiscount = e.discount;
  document.getElementById('est-edit-title').textContent = '✏️ ' + e.no + '（已解鎖）';
  document.getElementById('est-no').textContent   = e.no;
  document.getElementById('est-date').textContent = fmtDate(e.date);
  document.getElementById('est-expire').value     = e.expire||'';
  document.getElementById('est-discount-label').textContent = e.discount + '%';
  estDelivery = e.delivery || 'pickup';
  ['pickup','delivery','personal'].forEach(m=>{
    document.getElementById('dm-'+m)?.classList.toggle('active', m===estDelivery);
  });
  document.getElementById('est-remark').value = e.remark||'';
  const c = customers.find(x=>x.id===e.customerId);
  if(c){
    document.getElementById('est-customer-name').textContent = c.name;
    let lines=[];
    if(c.contact) lines.push(`👤 ${c.contact}`);
    if(c.tel)     lines.push(`📞 ${c.tel}`);
    document.getElementById('est-customer-detail').innerHTML = lines.join('<br>')||'';
    document.getElementById('est-customer-info').style.display = 'block';
  }
  renderEstItems();
  showPage('estimate-edit');
  showToast('🔓 已解鎖，可以修改估價單');
}

// 品項搜尋
function estSearchItems(q){
  const res = document.getElementById('est-search-result');
  if(!q){ res.style.display='none'; return; }
  const items = FINISHED.filter(i=>i.name.includes(q)||i.id.includes(q)).slice(0,8);
  if(!items.length){ res.style.display='none'; return; }
  res.style.display = 'block';
  res.innerHTML = items.map(item=>`
    <div class="pos-search-result-item" onclick="estAddItem('${item.id}')">
      <span>${item.emoji}</span>
      <span style="flex:1;font-size:13px;">${item.name}</span>
      <span class="p-price">$${item.price||0}</span>
    </div>`).join('');
}

function estAddItem(id){
  const item = ALL_ITEMS.find(i=>i.id===id);
  if(!item) return;
  const existing = currentEstimate.items.find(i=>i.id===id);
  if(existing){ existing.qty++; }
  else { currentEstimate.items.push({id, name:item.name, emoji:item.emoji, price:item.price||0, qty:1, customPrice:item.price||0}); }
  document.getElementById('est-item-search').value='';
  document.getElementById('est-search-result').style.display='none';
  renderEstItems();
  showToast(`✅ 已加入：${item.name}`);
}

function estRemoveItem(idx){
  currentEstimate.items.splice(idx,1);
  renderEstItems();
}
function estChangeQty(idx,delta){
  currentEstimate.items[idx].qty = Math.max(1, currentEstimate.items[idx].qty+delta);
  renderEstItems();
}
function estChangePrice(idx,val){
  const p = parseInt(val)||0;
  currentEstimate.items[idx].customPrice = p;
  renderEstTotals();
}

function renderEstItems(){
  const list  = document.getElementById('est-item-list');
  const count = document.getElementById('est-item-count');
  if(!currentEstimate.items.length){
    list.innerHTML = '<div class="order-empty">尚未加入品項</div>';
    count.textContent = '0 項';
    renderEstTotals(); return;
  }
  count.textContent = currentEstimate.items.length + ' 項';
  list.innerHTML = currentEstimate.items.map((item,idx)=>`
    <div class="order-row" style="flex-wrap:wrap;gap:6px;">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">${item.id}</div>
      </div>
      <div class="order-qty-ctrl">
        <button class="qty-edit-btn minus" onclick="estChangeQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-edit-btn plus"  onclick="estChangeQty(${idx},1)">＋</button>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:13px;color:var(--text3);">$</span>
        <input type="number" value="${item.customPrice}" min="0"
          style="width:72px;padding:6px 8px;font-size:14px;font-weight:600;border:1px solid var(--border);border-radius:6px;text-align:right;background:var(--surface);color:var(--text);"
          onchange="estChangePrice(${idx},this.value)" />
      </div>
      <div style="font-size:14px;font-weight:700;color:var(--text);min-width:60px;text-align:right;">
        $${item.customPrice * item.qty}
      </div>
      <button class="order-del" onclick="estRemoveItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`).join('');
  renderEstTotals();
}

function renderEstTotals(){
  const sub   = currentEstimate.items.reduce((s,i)=>s+i.customPrice*i.qty,0);
  const total = Math.round(sub*(1-estDiscount/100));
  document.getElementById('est-subtotal').textContent = '$'+sub;
  document.getElementById('est-total').textContent    = '$'+total;
  currentEstimate.discount = estDiscount;
}

function estChangeDiscount(delta){
  estDiscount = Math.max(0,Math.min(100,estDiscount+delta));
  document.getElementById('est-discount-label').textContent = estDiscount+'%';
  renderEstTotals();
}

function _collectEstimate(){
  const sub   = currentEstimate.items.reduce((s,i)=>s+i.customPrice*i.qty,0);
  const total = Math.round(sub*(1-estDiscount/100));
  currentEstimate.expire   = document.getElementById('est-expire').value;
  currentEstimate.remark   = document.getElementById('est-remark').value.trim();
  currentEstimate.discount = estDiscount;
  currentEstimate.delivery = estDelivery;
  currentEstimate.subtotal = sub;
  currentEstimate.total    = total;
  return total;
}

function saveEstimateDraft(){
  if(!currentEstimate.items.length){ showToast('⚠️ 請先加入品項'); return; }
  _collectEstimate();
  currentEstimate.status = 'draft';
  _upsertEstimate();
  showToast('📝 草稿已儲存：'+currentEstimate.no);
}


// ── 一步確認並建立生產訂單 ──
function confirmAndCreateProcess(){
  if(!currentEstimate.customerId){ showToast('⚠️ 請先選擇客戶'); return; }
  if(!currentEstimate.items.length){ showToast('⚠️ 請先加入品項'); return; }
  _collectEstimate();
  currentEstimate.status = 'proc';
  if(!currentEstimate.id) currentEstimate.id = 'E'+Date.now();
  _upsertEstimate();
  // 直接建立生產訂單並跳轉
  if(typeof estimateToProcess === 'function'){
    estimateToProcess(currentEstimate.id);
  }
}

function confirmEstimate(){
  if(!currentEstimate.customerId){ showToast('⚠️ 請先選擇客戶'); return; }
  if(!currentEstimate.items.length){ showToast('⚠️ 請先加入品項'); return; }
  _collectEstimate();
  currentEstimate.status = 'pending';
  _upsertEstimate();
  showToast('✅ 估價單已確認：'+currentEstimate.no);
  previewEstimate();
}

function _upsertEstimate(){
  if(!currentEstimate.id) currentEstimate.id = 'E'+Date.now();
  const idx = estimates.findIndex(e=>e.id===currentEstimate.id);
  if(idx>=0) estimates[idx] = JSON.parse(JSON.stringify(currentEstimate));
  else estimates.push(JSON.parse(JSON.stringify(currentEstimate)));
  saveEstimates();
  renderEstimateList('all');
}

// 列表渲染
function filterEstimates(status){
  ['all','pending','done','cancel'].forEach(s=>{
    document.getElementById('ef-'+s)?.classList.toggle('active',s===status);
  });
  renderEstimateList(status);
}

function renderEstimateList(status){
  const list = document.getElementById('estimate-list');
  // 'pending' 狀態視同 'proc'（相容舊資料）
  let items = status==='all' ? estimates :
    status==='proc' ? estimates.filter(e=>e.status==='proc'||e.status==='pending') :
    estimates.filter(e=>e.status===status);
  items = items.slice().reverse();
  if(!items.length){
    list.innerHTML='<div class="order-empty" style="padding:30px;text-align:center;color:var(--text3);">沒有符合的估價單</div>';
    return;
  }
  list.innerHTML = items.map(e=>{
    const c = customers.find(x=>x.id===e.customerId);
    return `<div class="est-list-row" onclick="viewEstimate('${e.id}')">
      <div class="est-list-left">
        <div class="est-list-no">${e.no}</div>
        <div class="est-list-cust">${c?c.name:'—'}</div>
        <div class="est-list-date">${fmtDate(e.date)} ・ 有效至 ${fmtDate(e.expire)}</div>
      </div>
      <div class="est-list-right">
        <div class="est-list-total">$${e.total||0}</div>
        <div class="est-list-status" style="color:${statusColor(e.status)}">${statusIcon(e.status)} ${statusLabel(e.status)}</div>
      </div>
    </div>`;
  }).join('');
}

// 預覽 / PDF
function previewEstimate(){
  _collectEstimate();
  const c   = customers.find(x=>x.id===currentEstimate.customerId);
  const sub = currentEstimate.subtotal||0;
  const total = currentEstimate.total||0;
  const itemsHTML = currentEstimate.items.map(item=>`
    <tr>
      <td>${item.emoji} ${item.name}</td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:right;">$${item.customPrice}</td>
      <td style="text-align:right;">$${item.customPrice*item.qty}</td>
    </tr>`).join('');
  document.getElementById('est-preview-content').innerHTML = `
    <div class="est-pdf-wrap" id="est-pdf-body">
      <div class="est-pdf-header">
        <div class="est-pdf-title">估　價　單</div>
        <div class="est-pdf-company">工廠直售</div>
      </div>
      <div class="est-pdf-meta">
        <div class="est-pdf-meta-col">
          <div class="est-pdf-meta-row"><span>客戶</span><strong>${c?c.name:'—'}</strong></div>
          ${c&&c.contact?`<div class="est-pdf-meta-row"><span>承辦人</span><span>${c.contact}</span></div>`:''}
          ${c&&c.tel?`<div class="est-pdf-meta-row"><span>承辦電話</span><span>${c.tel}</span></div>`:''}
          ${c&&c.fax?`<div class="est-pdf-meta-row"><span>傳真</span><span>${c.fax}</span></div>`:''}
          ${c&&c.companyTitle?`<div class="est-pdf-meta-row"><span>發票抬頭</span><span>${c.companyTitle}</span></div>`:''}
          ${c&&c.taxId?`<div class="est-pdf-meta-row"><span>統一編號</span><span>${c.taxId}</span></div>`:''}
          ${c&&c.receiver?`<div class="est-pdf-meta-row"><span>收件人</span><span>${c.receiver}</span></div>`:''}
          ${c&&c.receiverTel?`<div class="est-pdf-meta-row"><span>收件電話</span><span>${c.receiverTel}</span></div>`:''}
          ${c&&c.addr?`<div class="est-pdf-meta-row"><span>收件地址</span><span>${c.addr}</span></div>`:''}
        </div>
        <div class="est-pdf-meta-col right">
          <div class="est-pdf-meta-row"><span>單號</span><strong>${currentEstimate.no}</strong></div>
          <div class="est-pdf-meta-row"><span>送貨方式</span><span>${DELIVERY_LABELS[currentEstimate.delivery||'pickup']}</span></div>
          <div class="est-pdf-meta-row"><span>日期</span><span>${fmtDate(currentEstimate.date)}</span></div>
          <div class="est-pdf-meta-row"><span>有效期限</span><span>${fmtDate(currentEstimate.expire)}</span></div>
        </div>
      </div>
      <table class="est-pdf-table">
        <thead><tr><th>品項</th><th>數量</th><th>單價</th><th>小計</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="est-pdf-totals">
        <div class="est-pdf-total-row"><span>小計</span><span>$${sub}</span></div>
        ${estDiscount?`<div class="est-pdf-total-row"><span>折扣 ${estDiscount}%</span><span>-$${sub-total}</span></div>`:''}
        <div class="est-pdf-total-row grand"><span>報價總金額</span><span>$${total}</span></div>
      </div>
      ${currentEstimate.remark?`<div class="est-pdf-remark"><strong>備註：</strong>${currentEstimate.remark}</div>`:''}
      <div class="est-pdf-footer">本估價單有效期限至 ${fmtDate(currentEstimate.expire)}，如有問題請聯絡我們。</div>
    </div>`;
  const actEl = document.getElementById('est-confirm-actions');
  actEl.style.display = currentEstimate.status==='pending' ? 'block' : 'none';
  showPage('estimate-preview');
}

function printEstimate(){
  const content = document.getElementById('est-pdf-body').innerHTML;
  const win = window.open('','_blank','width=800,height=900');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${currentEstimate.no}</title>
  <style>
    body{font-family:-apple-system,sans-serif;padding:24px;color:#1a1a18;max-width:700px;margin:0 auto;}
    .est-pdf-header{text-align:center;border-bottom:2px solid #1D9E75;padding-bottom:12px;margin-bottom:16px;}
    .est-pdf-title{font-size:26px;font-weight:700;color:#1D9E75;}
    .est-pdf-company{font-size:14px;color:#6B6B68;margin-top:4px;}
    .est-pdf-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;background:#F5F5F3;padding:12px;border-radius:8px;}
    .est-pdf-meta-row{display:flex;gap:8px;font-size:13px;padding:3px 0;}
    .est-pdf-meta-row span:first-child{color:#6B6B68;min-width:60px;}
    .est-pdf-meta-row strong{color:#1a1a18;}
    .est-pdf-meta.right{text-align:right;}
    .est-pdf-table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    .est-pdf-table th{background:#1D9E75;color:white;padding:8px 10px;font-size:13px;}
    .est-pdf-table td{padding:8px 10px;font-size:13px;border-bottom:1px solid #eee;}
    .est-pdf-totals{text-align:right;margin-bottom:12px;}
    .est-pdf-total-row{display:flex;justify-content:flex-end;gap:24px;font-size:14px;padding:3px 0;}
    .est-pdf-total-row.grand{font-size:20px;font-weight:700;color:#1D9E75;border-top:2px solid #1D9E75;padding-top:8px;margin-top:4px;}
    .est-pdf-remark{font-size:13px;color:#6B6B68;background:#FAEEDA;padding:10px;border-radius:6px;margin-bottom:12px;}
    .est-pdf-footer{font-size:12px;color:#9B9B98;text-align:center;border-top:1px solid #eee;padding-top:12px;}
    @media print{body{padding:0;}}
  </style></head><body>${content}</body></html>`);
  win.document.close();
  setTimeout(()=>{ win.focus(); win.print(); },400);
}

// 轉 POS 收款
function estimateToPos(){
  if(!currentEstimate.items.length){ showToast('⚠️ 估價單沒有品項'); return; }
  clearPOS();
  currentEstimate.items.forEach(item=>{
    const found = ALL_ITEMS.find(i=>i.id===item.id);
    if(!found) return;
    posCart.push({id:item.id, name:item.name, emoji:item.emoji, price:item.customPrice, qty:item.qty});
  });
  posDiscount = currentEstimate.discount||0;
  document.getElementById('posDiscountLabel').textContent = posDiscount+'%';
  renderPOSCart();
  // 標記已轉換
  currentEstimate.status = 'done';
  _upsertEstimate();
  showToast('✅ 已載入 POS，請確認後收款');
  showPage('pos');
}

// 轉出貨單
function estimateToShipment(){
  if(!currentEstimate.items.length){ showToast('⚠️ 估價單沒有品項'); return; }
  clearOrder('shipment');
  currentEstimate.items.forEach(item=>{
    const found = ALL_ITEMS.find(i=>i.id===item.id);
    if(!found) return;
    orders.shipment.items.push({...found, qty:item.qty});
  });
  renderOrderList('shipment');
  currentEstimate.status = 'done';
  _upsertEstimate();
  showToast('✅ 已載入出貨單，請確認後送出');
  showPage('shipment');
}

function cancelEstimate(){
  if(!confirm('確定取消此估價單？')) return;
  currentEstimate.status = 'cancel';
  _upsertEstimate();
  showToast('❌ 估價單已取消');
  showPage('estimate');
}

// 初始化
document.addEventListener('DOMContentLoaded', ()=>{
  renderEstimateList('all');
  renderCustomerList('');
});
