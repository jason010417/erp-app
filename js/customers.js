// ============================================================
// customers.js — 客戶管理
// ============================================================

let customers = JSON.parse(localStorage.getItem('erp_customers') || '[]');
function saveCustomers(){
  localStorage.setItem('erp_customers', JSON.stringify(customers));
  if(typeof pushToFirebase === 'function') pushToFirebase('customers', customers);
}

// ── 查詢 ──
function getCustomer(id){ return customers.find(c => c.id === id) || null; }

// ── 列表渲染 ──
function renderCustomerList(q = ''){
  const el = document.getElementById('customer-list');
  if(!el) return;
  let list = q
    ? customers.filter(c =>
        c.name?.includes(q) || c.contact?.includes(q) || c.tel?.includes(q))
    : customers;
  list = list.slice().sort((a,b) => a.name?.localeCompare(b.name,'zh-TW'));
  if(!list.length){
    el.innerHTML = `<div class="order-empty">${q?'找不到符合的客戶':'尚未建立客戶，點右上角新增'}</div>`;
    return;
  }
  el.innerHTML = list.map(c => `
    <div class="list-card" onclick="showCustomerDetail('${c.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${c.name}</span>
        ${c.source ? `<span class="status-badge badge-active" style="font-size:11px;">${sourceLabel(c.source)}</span>` : ''}
      </div>
      <div class="list-card-meta">
        ${c.contact ? `<span><i class="ti ti-user"></i>${c.contact}</span>` : ''}
        ${c.tel     ? `<span><i class="ti ti-phone"></i>${c.tel}</span>` : ''}
        ${c.email   ? `<span><i class="ti ti-mail"></i>${c.email}</span>` : ''}
      </div>
    </div>`).join('');
}

function sourceLabel(s){
  return { phone:'電話', online:'網路', walkin:'門市', exhibition:'外展' }[s] || s;
}

// ── 新增 / 編輯 ──
let _editCustomerId = null;
let _custFromContext = null; // 從哪個頁面來的

function newCustomer(fromContext){
  _editCustomerId  = null;
  _custFromContext = fromContext || null;
  resetCustomerForm();
  document.getElementById('customer-form-title').textContent = '新增客戶';
  showPage('customer-edit');
}

function editCustomer(id){
  const c = getCustomer(id);
  if(!c) return;
  _editCustomerId = id;
  fillCustomerForm(c);
  document.getElementById('customer-form-title').textContent = '編輯客戶';
  showPage('customer-edit');
}

function resetCustomerForm(){
  ['nc-name','nc-contact','nc-tel','nc-email','nc-fax',
   'nc-invoice-title','nc-tax-id','nc-receiver','nc-receiver-tel','nc-addr']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('nc-source').value = 'phone';
}

function fillCustomerForm(c){
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
  setVal('nc-name',          c.name);
  setVal('nc-source',        c.source || 'phone');
  setVal('nc-contact',       c.contact);
  setVal('nc-tel',           c.tel);
  setVal('nc-email',         c.email);
  setVal('nc-fax',           c.fax);
  setVal('nc-invoice-title', c.invoiceTitle);
  setVal('nc-tax-id',        c.taxId);
  setVal('nc-receiver',      c.receiver);
  setVal('nc-receiver-tel',  c.receiverTel);
  setVal('nc-addr',          c.address);
}

function saveCustomer(){
  const name = document.getElementById('nc-name')?.value.trim();
  if(!name){ showToast('⚠️ 請填寫公司名稱或客戶姓名'); return; }
  const data = {
    name,
    source:       document.getElementById('nc-source')?.value         || 'phone',
    contact:      document.getElementById('nc-contact')?.value.trim() || '',
    tel:          document.getElementById('nc-tel')?.value.trim()     || '',
    email:        document.getElementById('nc-email')?.value.trim()   || '',
    fax:          document.getElementById('nc-fax')?.value.trim()     || '',
    invoiceTitle: document.getElementById('nc-invoice-title')?.value.trim() || '',
    taxId:        document.getElementById('nc-tax-id')?.value.trim()  || '',
    receiver:     document.getElementById('nc-receiver')?.value.trim()     || '',
    receiverTel:  document.getElementById('nc-receiver-tel')?.value.trim() || '',
    address:      document.getElementById('nc-addr')?.value.trim()    || '',
  };
  if(_editCustomerId){
    const idx = customers.findIndex(c => c.id === _editCustomerId);
    if(idx >= 0) customers[idx] = { ...customers[idx], ...data };
    saveCustomers();
    showToast('✅ 客戶資料已更新');
    showCustomerDetail(_editCustomerId);
  } else {
    const c = { id:'C'+Date.now(), ...data, createdAt: todayStr() };
    customers.push(c);
    saveCustomers();
    showToast('✅ 客戶已新增：' + name);
    if(_custFromContext === 'estimate'){
      selectCustomerForEstimate(c.id);
    } else if(_custFromContext === 'order'){
      selectCustomerForOrder(c.id);
    } else {
      showCustomerDetail(c.id);
    }
  }
}

// ── 詳細頁 ──
function showCustomerDetail(id){
  const c = getCustomer(id);
  if(!c) return;
  _editCustomerId = id;
  const el = document.getElementById('customer-detail-content');
  if(el) el.innerHTML = `
    <div class="cust-detail-name">${c.name}</div>
    <div class="cust-info-block">
      <div class="cust-section-label">聯絡資訊</div>
      ${c.source    ? `<div class="cust-info-row"><i class="ti ti-tag"></i>來源：${sourceLabel(c.source)}</div>` : ''}
      ${c.contact   ? `<div class="cust-info-row"><i class="ti ti-user"></i>承辦人：${c.contact}</div>` : ''}
      ${c.tel       ? `<div class="cust-info-row"><i class="ti ti-phone"></i>${c.tel}</div>` : ''}
      ${c.email     ? `<div class="cust-info-row"><i class="ti ti-mail"></i>${c.email}</div>` : ''}
      ${c.fax       ? `<div class="cust-info-row"><i class="ti ti-device-fax"></i>傳真：${c.fax}</div>` : ''}
      ${c.invoiceTitle||c.taxId ? '<div class="cust-section-label" style="margin-top:10px;">發票資訊</div>' : ''}
      ${c.invoiceTitle ? `<div class="cust-info-row"><i class="ti ti-receipt"></i>${c.invoiceTitle}</div>` : ''}
      ${c.taxId        ? `<div class="cust-info-row"><i class="ti ti-hash"></i>統編：${c.taxId}</div>` : ''}
      ${c.receiver||c.address ? '<div class="cust-section-label" style="margin-top:10px;">收件資訊</div>' : ''}
      ${c.receiver    ? `<div class="cust-info-row"><i class="ti ti-package"></i>收件人：${c.receiver}</div>` : ''}
      ${c.receiverTel ? `<div class="cust-info-row"><i class="ti ti-phone"></i>${c.receiverTel}</div>` : ''}
      ${c.address     ? `<div class="cust-info-row"><i class="ti ti-map-pin"></i>${c.address}</div>` : ''}
    </div>`;
  document.getElementById('customer-detail-title').textContent = c.name;
  showPage('customer-detail');
}

function deleteCustomer(id){
  requireManager(() => {
    // 刪除前先檢查此客戶是否有未結案訂單
    // 若有，刪除後訂單卡片的客戶名稱會消失，帳目會不清楚
    // orders 為 orders.js 中的全域陣列，透過 window.orders 存取以避免命名衝突
    const hasOrders = (window.orders || []).filter(o =>
      o.customerId === id && o.status !== 'archived'
    ).length > 0;
    if(hasOrders){
      showToast('⚠️ 此客戶有未結案訂單，請先結案後再刪除');
      return;
    }

    if(!confirm('確定刪除此客戶？')) return;
    customers = customers.filter(c => c.id !== id);
    saveCustomers();
    showToast('🗑️ 客戶已刪除');
    showPage('customers');
  }, '刪除客戶需要主管權限');
}

// ── 客戶選擇器（估價單/訂單用）──
let _customerPickerCallback = null;

function openCustomerPicker(context){
  _customerPickerCallback = context;
  renderCustomerPickerList('');
  document.getElementById('customer-picker-search').value = '';
  document.getElementById('customerPickerModal').style.display = 'flex';
}

function closeCustomerPicker(e){
  if(!e || e.target === document.getElementById('customerPickerModal'))
    document.getElementById('customerPickerModal').style.display = 'none';
}

function renderCustomerPickerList(q){
  const el   = document.getElementById('customer-picker-list');
  const list = q
    ? customers.filter(c => c.name?.includes(q) || c.contact?.includes(q))
    : customers;
  if(!list.length){
    el.innerHTML = `<div class="order-empty">${q?'找不到':'尚未建立客戶'}</div>
      <button class="confirm-btn" style="background:var(--green);margin-top:8px;"
        onclick="newCustomer('${_customerPickerCallback}')">
        <i class="ti ti-plus"></i> 新增客戶
      </button>`;
    return;
  }
  el.innerHTML = list.map(c => `
    <div class="catdetail-row" onclick="pickCustomer('${c.id}')">
      <div class="catdetail-info">
        <div class="catdetail-name">${c.name}</div>
        <div class="catdetail-id">${c.contact || ''} ${c.tel ? '・'+c.tel : ''}</div>
      </div>
    </div>`).join('')
    + `<div style="padding:12px;">
        <button class="redit-btn" onclick="newCustomer('${_customerPickerCallback}')">
          <i class="ti ti-plus"></i> 新增客戶
        </button>
      </div>`;
}

function pickCustomer(id){
  document.getElementById('customerPickerModal').style.display = 'none';
  if(_customerPickerCallback === 'estimate' && typeof selectCustomerForEstimate === 'function'){
    selectCustomerForEstimate(id);
  } else if(_customerPickerCallback === 'order' && typeof selectCustomerForOrder === 'function'){
    selectCustomerForOrder(id);
  }
}

// ── 客戶編輯頁 HTML 插入（動態建立）──
function initCustomerEditPage(){
  const page = document.getElementById('page-customer-edit');
  if(!page || page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('customers')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title" id="customer-form-title">新增客戶</div>
      <button class="small-btn green-btn" onclick="saveCustomer()"><i class="ti ti-check"></i> 儲存</button>
    </div>
    <div class="form-card">
      <div class="cust-form-section" style="border-top:none;padding-top:0;margin-top:0;">聯絡資訊</div>
      <div class="cust-field"><label>公司名稱 / 客戶姓名 *</label>
        <input type="text" id="nc-name" placeholder="公司名稱或客戶姓名" /></div>
      <div class="cust-field"><label>客戶來源</label>
        <select id="nc-source">
          <option value="phone">電話</option>
          <option value="online">網路</option>
          <option value="walkin">門市</option>
          <option value="exhibition">外展</option>
        </select></div>
      <div class="cust-field"><label>承辦人</label>
        <input type="text" id="nc-contact" placeholder="承辦人姓名" /></div>
      <div class="cust-field"><label>承辦電話</label>
        <input type="tel" id="nc-tel" placeholder="02-xxxx-xxxx 或 09xx-xxxxxx" /></div>
      <div class="cust-field"><label>E-mail</label>
        <input type="email" id="nc-email" placeholder="email@example.com" /></div>
      <div class="cust-field"><label>傳真號碼</label>
        <input type="tel" id="nc-fax" placeholder="02-xxxx-xxxx" /></div>
      <div class="cust-form-section">發票資訊</div>
      <div class="cust-field"><label>公司抬頭</label>
        <input type="text" id="nc-invoice-title" placeholder="發票抬頭（公司全名）" /></div>
      <div class="cust-field"><label>統一編號</label>
        <input type="text" id="nc-tax-id" placeholder="12345678" maxlength="8" /></div>
      <div class="cust-form-section">收件資訊</div>
      <div class="cust-field"><label>收件人</label>
        <input type="text" id="nc-receiver" placeholder="收件人姓名" /></div>
      <div class="cust-field"><label>收件電話</label>
        <input type="tel" id="nc-receiver-tel" placeholder="09xx-xxxxxx" /></div>
      <div class="cust-field"><label>收件地址</label>
        <input type="text" id="nc-addr" placeholder="完整收件地址" /></div>
    </div>
    <button class="confirm-btn" onclick="saveCustomer()"><i class="ti ti-check"></i> 儲存</button>`;
}

function initCustomerDetailPage(){
  const page = document.getElementById('page-customer-detail');
  if(!page || page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('customers')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title" id="customer-detail-title"></div>
      <button class="small-btn" onclick="editCustomer(_editCustomerId)"><i class="ti ti-edit"></i> 編輯</button>
    </div>
    <div id="customer-detail-content"></div>
    <button class="redit-btn" style="margin-top:10px;color:var(--red);border-color:var(--red);"
      onclick="deleteCustomer(_editCustomerId)">
      <i class="ti ti-trash"></i> 刪除客戶
    </button>`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initCustomerEditPage();
  initCustomerDetailPage();
});
