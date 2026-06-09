// ============================================================
// admin.js — 後台管理：商品、BOM、廠商、地點、Excel匯入
// ============================================================

// ════════════════════════════════
// 商品管理
// ════════════════════════════════
function initAdminProductsPage(){
  const page = document.getElementById('page-admin-products');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-package" style="color:var(--purple);"></i> 商品管理</div>
    </div>
    <div class="search-bar">
      <i class="ti ti-search"></i>
      <input type="search" id="ap-search" placeholder="搜尋商品名稱或編號..."
        oninput="renderAdminProducts(this.value)" />
    </div>
    <div class="filter-tabs" style="margin-bottom:8px;">
      <button class="ftab active" onclick="filterAdminProducts('all',this)">全部</button>
      ${Object.entries(CATEGORIES).map(([k,v])=>
        `<button class="ftab" onclick="filterAdminProducts('${k}',this)">${v.emoji} ${v.name}</button>`
      ).join('')}
    </div>
    <div id="ap-list"></div>`;
  renderAdminProducts('');
}

let _apFilter = 'all';
function filterAdminProducts(cat, btn){
  _apFilter = cat;
  document.querySelectorAll('#page-admin-products .ftab')
    .forEach(b => b.classList.toggle('active', b === btn));
  renderAdminProducts(document.getElementById('ap-search')?.value || '');
}

function renderAdminProducts(q = ''){
  const el = document.getElementById('ap-list');
  if(!el) return;
  let list = ALL_ITEMS;
  if(_apFilter !== 'all') list = list.filter(i => i.category === _apFilter);
  if(q) list = list.filter(i => i.name.includes(q) || i.id.includes(q));
  el.innerHTML = list.map(item => `
    <div class="admin-item" style="gap:10px;" onclick="openProductEditor('${item.id}')">
      <span style="font-size:28px;">${item.emoji}</span>
      <div style="flex:1;min-width:0;">
        <div class="admin-item-name">${item.name}</div>
        <div class="admin-item-sub">${item.id} ・ 售價 $${item.salePrice||0} ・ 庫存 ${getTotalStock(item.id)}</div>
      </div>
      <span class="status-badge ${item.active===false?'badge-cancelled':'badge-done'}" style="font-size:11px;">
        ${item.active===false?'停用':'啟用'}
      </span>
    </div>`).join('') || '<div class="order-empty">沒有符合的商品</div>';
}

function openProductEditor(id){
  const item = getItem(id);
  if(!item) return;
  const modal = document.getElementById('productEditorModal');
  document.getElementById('pe-title').textContent   = item.name;
  document.getElementById('pe-sale-price').value    = item.salePrice || 0;
  document.getElementById('pe-cost-price').value    = item.costPrice || 0;
  document.getElementById('pe-safety-stock').value  = item.safetyStock || 0;
  document.getElementById('pe-item-id').value       = id;
  modal.style.display = 'flex';
}
function saveProductEdit(){
  const id   = document.getElementById('pe-item-id').value;
  const item = ITEM_INDEX[id];
  if(!item) return;
  item.salePrice   = parseInt(document.getElementById('pe-sale-price').value)   || 0;
  item.costPrice   = parseInt(document.getElementById('pe-cost-price').value)   || 0;
  item.safetyStock = parseInt(document.getElementById('pe-safety-stock').value) || 0;
  // 同步 Firebase
  if(typeof pushToFirebase === 'function') pushToFirebase('productOverrides', buildProductOverrides());
  document.getElementById('productEditorModal').style.display = 'none';
  showToast('✅ 商品已更新');
  renderAdminProducts(document.getElementById('ap-search')?.value || '');
}
function buildProductOverrides(){
  const obj = {};
  ALL_ITEMS.forEach(i => {
    obj[i.id] = { salePrice:i.salePrice, costPrice:i.costPrice, safetyStock:i.safetyStock, active:i.active };
  });
  return obj;
}
function toggleProductActive(id){
  const item = ITEM_INDEX[id];
  if(!item) return;
  item.active = !item.active;
  if(typeof pushToFirebase === 'function') pushToFirebase('productOverrides', buildProductOverrides());
  document.getElementById('productEditorModal').style.display = 'none';
  showToast(item.active ? '✅ 商品已啟用' : '🚫 商品已停用');
  renderAdminProducts('');
}

// ════════════════════════════════
// BOM 管理
// ════════════════════════════════
function initAdminBomPage(){
  const page = document.getElementById('page-admin-bom');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-git-merge" style="color:var(--purple);"></i> BOM 加工組合</div>
    </div>
    <div class="search-bar">
      <i class="ti ti-search"></i>
      <input type="search" id="bom-search" placeholder="搜尋成品..."
        oninput="renderBomList(this.value)" />
    </div>
    <div id="bom-list"></div>`;
  renderBomList('');
}

function renderBomList(q = ''){
  const el = document.getElementById('bom-list');
  if(!el) return;
  let list = ALL_ITEMS.filter(i => i.salePrice > 0); // 只顯示有售價的（成品）
  if(q) list = list.filter(i => i.name.includes(q) || i.id.includes(q));
  const withBom    = list.filter(i => (BOM[i.id]||[]).length > 0);
  const withoutBom = list.filter(i => !(BOM[i.id]||[]).length);
  el.innerHTML = `<div style="font-size:12px;color:var(--text2);padding:6px 0;margin-bottom:4px;">
    已設定 ${withBom.length} 個 ／ 未設定 ${withoutBom.length} 個</div>` +
  [...withBom, ...withoutBom].map(item => {
    const bom = BOM[item.id] || [];
    return `<div class="admin-item" onclick="openBomEditor('${item.id}')">
      <span style="font-size:28px;">${item.emoji}</span>
      <div style="flex:1;">
        <div class="admin-item-name">${item.name}</div>
        <div class="admin-item-sub">${item.id}</div>
      </div>
      ${bom.length
        ? `<span class="status-badge badge-done" style="font-size:11px;">✅ ${bom.length} 種材料</span>`
        : `<span class="status-badge badge-draft" style="font-size:11px;">未設定</span>`}
    </div>`;
  }).join('');
}

let _bomEditorId    = null;
let _bomEditorItems = [];
function openBomEditor(id){
  _bomEditorId    = id;
  const item      = getItem(id);
  _bomEditorItems = JSON.parse(JSON.stringify(BOM[id] || []));
  document.getElementById('bom-editor-title').textContent = (item?.name || id) + ' 的材料';
  renderBomEditorList();
  document.getElementById('bomEditorModal').style.display = 'flex';
}
function renderBomEditorList(){
  const el = document.getElementById('bom-editor-list');
  if(!el) return;
  if(!_bomEditorItems.length){
    el.innerHTML = '<div class="order-empty">尚未設定材料，請搜尋加入</div>'; return;
  }
  el.innerHTML = _bomEditorItems.map((b, idx) => {
    const m = getItem(b.materialId) || { emoji:'📦', name: b.materialName || b.materialId };
    return `<div class="order-row">
      <span style="font-size:24px;">${m.emoji}</span>
      <div class="order-info">
        <div class="order-name">${m.name}</div>
        <div class="order-id">${b.materialId}</div>
      </div>
      <input type="number" value="${b.qty}" min="0.1" step="0.1"
        style="width:64px;padding:6px;font-size:15px;font-weight:700;text-align:center;
        border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);"
        onchange="_bomEditorItems[${idx}].qty=parseFloat(this.value)||1" />
      <button class="order-del" onclick="_bomEditorItems.splice(${idx},1);renderBomEditorList()">
        <i class="ti ti-x"></i>
      </button>
    </div>`;
  }).join('');
}
function bomEditorSearch(q){
  const res = document.getElementById('bom-editor-search-result');
  if(!res||!q){ if(res) res.style.display='none'; return; }
  const pool = ALL_ITEMS.filter(i => !i.salePrice || i.salePrice === 0 || i.id.startsWith('MAT_'));
  const results = pool.filter(i => i.name?.includes(q) || i.id?.includes(q)).slice(0,8);
  if(!results.length){ res.style.display='none'; return; }
  res.style.display = 'block';
  res.innerHTML = results.map(m => `
    <div class="ss-item" onmousedown="bomEditorAddMat('${m.id}','${m.name.replace(/'/g,"\\'")}')">
      <span class="ss-emoji">${m.emoji||'📦'}</span>
      <div class="ss-info"><div class="ss-name">${m.name}</div><div class="ss-sub">${m.id}</div></div>
    </div>`).join('');
}
function bomEditorAddMat(id, name){
  if(_bomEditorItems.find(i=>i.id===id||i.materialId===id)){showToast('已在清單中');return;}
  _bomEditorItems.push({ materialId:id, materialName:name, qty:1 });
  document.getElementById('bom-editor-search').value = '';
  document.getElementById('bom-editor-search-result').style.display = 'none';
  renderBomEditorList();
}
function saveBomEditor(){
  BOM[_bomEditorId] = JSON.parse(JSON.stringify(_bomEditorItems));
  localStorage.setItem('erp_bom', JSON.stringify(BOM));
  if(typeof pushToFirebase === 'function') pushToFirebase('bom', BOM);
  document.getElementById('bomEditorModal').style.display = 'none';
  showToast('✅ BOM 已儲存');
  renderBomList(document.getElementById('bom-search')?.value || '');
}

// ════════════════════════════════
// 廠商管理
// ════════════════════════════════
function initAdminSuppliersPage(){
  const page = document.getElementById('page-admin-suppliers');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-building-store" style="color:var(--purple);"></i> 廠商管理</div>
    </div>
    <div class="search-bar">
      <i class="ti ti-search"></i>
      <input type="search" id="sup-search" placeholder="搜尋廠商名稱..."
        oninput="renderAdminSuppliers(this.value)" />
    </div>
    <div id="sup-list"></div>`;
  renderAdminSuppliers('');
}

function renderAdminSuppliers(q = ''){
  const el = document.getElementById('sup-list');
  if(!el) return;
  let list = SUPPLIERS;
  if(q) list = list.filter(s => s.name.includes(q) || s.id.includes(q));
  el.innerHTML = list.map(s => `
    <div class="admin-item" onclick="openSupplierEditor('${s.id}')">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--purple-light);
        display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;
        color:var(--purple);flex-shrink:0;">${s.phonetic||'?'}</div>
      <div style="flex:1;min-width:0;">
        <div class="admin-item-name">${s.name}</div>
        <div class="admin-item-sub">${s.id}${s.tel?' ・ '+s.tel:''}</div>
      </div>
      <i class="ti ti-chevron-right" style="color:var(--text3);"></i>
    </div>`).join('') || '<div class="order-empty">找不到廠商</div>';
}

function openSupplierEditor(id){
  const s = SUPPLIERS.find(sup => sup.id === id);
  if(!s) return;
  // 合併 Firebase/localStorage 裡的額外聯絡資料
  const extra = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
  const merged = { ...s, ...extra };
  document.getElementById('se-id').textContent   = merged.id;
  document.getElementById('se-name').textContent = merged.name;
  const fields = ['contact','tel','email','line','bankName','bankBranch','bankCode','accountName','accountNo'];
  fields.forEach(f => {
    const el = document.getElementById('se-' + f);
    if(el) el.value = merged[f] || '';
  });
  document.getElementById('se-hidden-id').value = id;
  document.getElementById('supplierEditorModal').style.display = 'flex';
}
function saveSupplierEditor(){
  const id = document.getElementById('se-hidden-id').value;
  const fields = ['contact','tel','email','line','bankName','bankBranch','bankCode','accountName','accountNo'];
  const data = {};
  fields.forEach(f => { data[f] = document.getElementById('se-'+f)?.value.trim() || ''; });
  // 存到 localStorage
  localStorage.setItem('erp_sup_' + id, JSON.stringify(data));
  // 同步到 Firebase
  if(typeof _db !== 'undefined' && _db){
    _db.ref(`erp/supplierDetails/${id}`).set(data).catch(()=>{});
  }
  document.getElementById('supplierEditorModal').style.display = 'none';
  showToast('✅ 廠商資料已儲存');
  renderAdminSuppliers(document.getElementById('sup-search')?.value || '');
}

// ════════════════════════════════
// 地點管理
// ════════════════════════════════
function initLocationPage(){
  const page = document.getElementById('page-admin-locations');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-map-2" style="color:var(--purple);"></i> 門市地點設定</div>
      <button class="small-btn green-btn" onclick="openAddLocationModal()">
        <i class="ti ti-plus"></i> 新增
      </button>
    </div>
    <div id="location-list"></div>`;
  renderLocationList();
}

function renderLocationList(){
  const el = document.getElementById('location-list');
  if(!el) return;
  const typeLabel = { store_main:'主倉儲', store_sub:'子門市', event:'外展' };
  el.innerHTML = locations.map(loc => `
    <div class="admin-item">
      <div style="width:40px;height:40px;border-radius:50%;
        background:${loc.isMain?'var(--green-light)':'var(--blue-light)'};
        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i class="ti ti-building-store" style="font-size:20px;color:${loc.isMain?'var(--green)':'var(--blue)'};"></i>
      </div>
      <div style="flex:1;">
        <div class="admin-item-name">${loc.name}</div>
        <div class="admin-item-sub">${typeLabel[loc.type]||loc.type} ・ ID: ${loc.id}</div>
      </div>
      <span class="status-badge ${loc.active?'badge-done':'badge-cancelled'}" style="font-size:11px;">
        ${loc.active?'啟用':'停用'}
      </span>
    </div>`).join('') || '<div class="order-empty">尚未設定地點</div>';
}

function openAddLocationModal(){
  document.getElementById('addLocModal').style.display = 'flex';
  ['loc-id','loc-name'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('loc-type').value = 'store_sub';
}
function saveNewLocation(){
  const id   = document.getElementById('loc-id')?.value.trim().replace(/\s/g,'_');
  const name = document.getElementById('loc-name')?.value.trim();
  const type = document.getElementById('loc-type')?.value;
  if(!id||!name){ showToast('⚠️ 請填寫地點ID和名稱'); return; }
  if(locations.find(l=>l.id===id)){ showToast('⚠️ 此ID已存在'); return; }
  addLocation({ id, name, type, isMain:type==='store_main', active:true });
  document.getElementById('addLocModal').style.display = 'none';
  showToast('✅ 地點已新增：' + name);
  renderLocationList();
}

// ════════════════════════════════
// Excel 匯入
// ════════════════════════════════
function initImportPage(){
  const page = document.getElementById('page-admin-import');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-table-import" style="color:var(--purple);"></i> Excel 匯入</div>
    </div>
    <div class="form-card">
      <div class="form-section-title">目前資料狀況</div>
      <div class="amount-row"><span>商品數量</span><strong>${ALL_ITEMS.length} 筆</strong></div>
      <div class="amount-row"><span>廠商數量</span><strong>${SUPPLIERS.length} 筆</strong></div>
      <div class="amount-row"><span>BOM 設定</span><strong>${Object.keys(BOM).length} 筆</strong></div>
      <div class="amount-row"><span>客戶數量</span><strong>${customers.length} 筆</strong></div>
    </div>
    <div class="form-card" style="margin-top:10px;">
      <div class="form-section-title">匯入說明</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.8;">
        商品、廠商、BOM 的資料已從 Excel 匯入到程式碼（data.js）。<br>
        如需更新這些資料，請將新的 Excel 上傳給開發者重新匯入。<br><br>
        目前可以從這裡匯入的資料：
      </div>
      <div style="margin-top:12px;">
        <div class="form-section-title">匯入客戶資料（CSV）</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
          格式：客戶名稱,聯絡人,電話,Email,地址
        </div>
        <input type="file" id="import-customer-file" accept=".csv"
          style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;
          font-size:13px;background:var(--bg);"
          onchange="previewCustomerImport(this)" />
        <div id="import-preview" style="margin-top:10px;"></div>
      </div>
    </div>`;
}

function previewCustomerImport(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l=>l.trim());
    const preview = lines.slice(0,5).map(l => l.split(','));
    const el = document.getElementById('import-preview');
    el.innerHTML = `<div style="font-size:13px;color:var(--text2);margin-bottom:8px;">
      預覽（共 ${lines.length} 筆）：</div>` +
      preview.map(cols=>`<div style="padding:6px;border-bottom:1px solid var(--border);font-size:12px;">
        ${cols.map(c=>`<span style="margin-right:8px;">${c.trim()}</span>`).join('')}
      </div>`).join('') +
      `<button class="confirm-btn" style="margin-top:10px;"
        onclick="doImportCustomers()">
        <i class="ti ti-check"></i> 確認匯入 ${lines.length} 筆客戶
      </button>`;
    window._importCustomerData = lines;
  };
  reader.readAsText(file, 'utf-8');
}

function doImportCustomers(){
  const lines = window._importCustomerData || [];
  let count = 0;
  lines.forEach(line => {
    const cols = line.split(',').map(c => c.trim());
    if(!cols[0]) return;
    customers.push({
      id:      'C' + Date.now() + Math.random().toString(36).slice(2,5),
      name:    cols[0] || '',
      contact: cols[1] || '',
      tel:     cols[2] || '',
      email:   cols[3] || '',
      address: cols[4] || '',
      source:  'phone',
      createdAt: todayStr(),
    });
    count++;
  });
  if(typeof saveCustomers === 'function') saveCustomers();
  showToast(`✅ 已匯入 ${count} 筆客戶`);
  initImportPage();
}

// ════════════════════════════════
// 初始化所有後台頁面
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // 動態建立後台所需的 Modals
  createAdminModals();
});

function createAdminModals(){
  const modals = `
  <!-- 商品編輯 Modal -->
  <div class="modal-overlay" id="productEditorModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card" style="max-width:360px;">
      <div class="modal-title"><i class="ti ti-package"></i> <span id="pe-title"></span></div>
      <input type="hidden" id="pe-item-id" />
      <div class="cust-form">
        <div class="cust-field"><label>售價（$）</label>
          <input type="number" id="pe-sale-price" min="0" /></div>
        <div class="cust-field"><label>進貨價（$）</label>
          <input type="number" id="pe-cost-price" min="0" /></div>
        <div class="cust-field"><label>安全庫存量</label>
          <input type="number" id="pe-safety-stock" min="0" /></div>
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveProductEdit()"><i class="ti ti-check"></i> 儲存</button>
        <button class="modal-cancel-btn" onclick="document.getElementById('productEditorModal').style.display='none'">取消</button>
      </div>
      <button class="redit-btn" style="margin-top:8px;"
        onclick="requireManager(()=>toggleProductActive(document.getElementById('pe-item-id').value))">
        <i class="ti ti-power"></i> 切換啟用/停用
      </button>
    </div>
  </div>

  <!-- BOM 編輯 Modal -->
  <div class="modal-overlay" id="bomEditorModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card">
      <div class="modal-title"><i class="ti ti-git-merge"></i> <span id="bom-editor-title"></span></div>
      <div class="search-bar" style="margin-bottom:10px;">
        <i class="ti ti-search"></i>
        <input type="search" id="bom-editor-search" placeholder="搜尋材料加入..."
          oninput="bomEditorSearch(this.value)" />
      </div>
      <div id="bom-editor-search-result" style="display:none;max-height:200px;overflow-y:auto;"></div>
      <div id="bom-editor-list" style="max-height:40vh;overflow-y:auto;"></div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveBomEditor()"><i class="ti ti-check"></i> 儲存</button>
        <button class="modal-cancel-btn" onclick="document.getElementById('bomEditorModal').style.display='none'">取消</button>
      </div>
    </div>
  </div>

  <!-- 廠商編輯 Modal -->
  <div class="modal-overlay" id="supplierEditorModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card" style="max-height:90vh;overflow-y:auto;">
      <div class="modal-title"><i class="ti ti-building-store"></i>
        <span id="se-name"></span>
        <span style="font-size:13px;color:var(--text3);margin-left:8px;" id="se-id"></span>
      </div>
      <input type="hidden" id="se-hidden-id" />
      <div class="cust-form">
        <div class="cust-field"><label>聯絡人</label><input type="text" id="se-contact" /></div>
        <div class="cust-field"><label>電話</label><input type="tel" id="se-tel" /></div>
        <div class="cust-field"><label>Email</label><input type="email" id="se-email" /></div>
        <div class="cust-field"><label>Line</label><input type="text" id="se-line" /></div>
        <div class="cust-form-section">銀行資訊</div>
        <div class="cust-field"><label>銀行名稱</label><input type="text" id="se-bankName" /></div>
        <div class="cust-field"><label>分行</label><input type="text" id="se-bankBranch" /></div>
        <div class="cust-field"><label>代號</label><input type="text" id="se-bankCode" /></div>
        <div class="cust-field"><label>戶名</label><input type="text" id="se-accountName" /></div>
        <div class="cust-field"><label>帳號</label><input type="text" id="se-accountNo" /></div>
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveSupplierEditor()"><i class="ti ti-check"></i> 儲存</button>
        <button class="modal-cancel-btn" onclick="document.getElementById('supplierEditorModal').style.display='none'">取消</button>
      </div>
    </div>
  </div>

  <!-- 新增地點 Modal -->
  <div class="modal-overlay" id="addLocModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card" style="max-width:360px;">
      <div class="modal-title"><i class="ti ti-map-pin"></i> 新增地點</div>
      <div class="cust-form">
        <div class="cust-field"><label>地點ID（英文，不能有空格）</label>
          <input type="text" id="loc-id" placeholder="例：store_C" /></div>
        <div class="cust-field"><label>地點名稱</label>
          <input type="text" id="loc-name" placeholder="例：C 門市" /></div>
        <div class="cust-field"><label>類型</label>
          <select id="loc-type">
            <option value="store_sub">子門市</option>
            <option value="store_main">主倉儲</option>
          </select></div>
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveNewLocation()"><i class="ti ti-check"></i> 新增</button>
        <button class="modal-cancel-btn" onclick="document.getElementById('addLocModal').style.display='none'">取消</button>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modals);
}
