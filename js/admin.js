// admin.js - Backend management: Products, BOM, Suppliers, Locations, Data Export

// ================================
// Product Management
// ================================
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
        <div class="admin-item-sub">${item.id} / $${item.salePrice||0} / 庫存 ${getTotalStock(item.id)}</div>
      </div>
      <span class="status-badge ${item.active===false?'badge-cancelled':'badge-done'}" style="font-size:11px;">
        ${item.active===false?'停用':'啟用'}
      </span>
    </div>`).join('') || '<div class="order-empty">沒有符合的商品</div>';
}

function openProductEditor(id){
  const item  = getItem(id);
  if(!item) return;
  const flags = computeItemFlags(item);
  document.getElementById('pe-title').textContent        = item.name;
  document.getElementById('pe-sale-price').value         = item.salePrice || 0;
  document.getElementById('pe-cost-price').value         = item.costPrice || 0;
  document.getElementById('pe-safety-stock').value       = item.safetyStock || 0;
  document.getElementById('pe-item-id').value            = id;
  document.getElementById('pe-can-sell').checked         = flags.canSell;
  document.getElementById('pe-can-material').checked     = flags.canBeMaterial;
  document.getElementById('pe-can-purchase').checked     = flags.canPurchase;
  document.getElementById('productEditorModal').style.display = 'flex';
}
function saveProductEdit(){
  const id   = document.getElementById('pe-item-id').value;
  const item = ITEM_INDEX[id];
  if(!item) return;
  item.salePrice   = parseInt(document.getElementById('pe-sale-price').value)   || 0;
  item.costPrice   = parseInt(document.getElementById('pe-cost-price').value)   || 0;
  item.safetyStock = parseInt(document.getElementById('pe-safety-stock').value) || 0;
  // 儲存旗標覆寫（只在與自動判斷不同時才寫入，避免冗余）
  const autoFlags = computeItemFlags(item);
  const newFlags  = {
    canSell:       document.getElementById('pe-can-sell').checked,
    canBeMaterial: document.getElementById('pe-can-material').checked,
    canPurchase:   document.getElementById('pe-can-purchase').checked,
  };
  const changed = Object.keys(newFlags).some(k => newFlags[k] !== autoFlags[k]);
  if(changed){
    setItemFlags(id, newFlags);
  } else {
    // 清除手動覆寫，讓系統重新自動計算
    const all = JSON.parse(localStorage.getItem('erp_item_flags') || '{}');
    delete all[id];
    localStorage.setItem('erp_item_flags', JSON.stringify(all));
    if(typeof pushToFirebase === 'function') pushToFirebase('itemFlags', all);
  }
  _saveProductOverrides();
  document.getElementById('productEditorModal').style.display = 'none';
  showToast('商品已更新');
  renderAdminProducts(document.getElementById('ap-search')?.value || '');
}
function buildProductOverrides(){
  const obj = {};
  ALL_ITEMS.forEach(i => {
    obj[i.id] = { salePrice:i.salePrice, costPrice:i.costPrice, safetyStock:i.safetyStock, active:i.active };
  });
  return obj;
}
function _saveProductOverrides(){
  const ov = buildProductOverrides();
  localStorage.setItem('erp_product_overrides', JSON.stringify(ov));
  if(typeof pushToFirebase === 'function') pushToFirebase('productOverrides', ov);
}
function clearProductOverrides(){
  localStorage.removeItem('erp_product_overrides');
  if(typeof pushToFirebase === 'function') pushToFirebase('productOverrides', null);
  showToast('✅ 商品售價覆寫已清除，請重新整理頁面後重新匯入商品售價');
}

function toggleProductActive(id){
  const item = ITEM_INDEX[id];
  if(!item) return;
  item.active = !item.active;
  _saveProductOverrides();
  document.getElementById('productEditorModal').style.display = 'none';
  showToast(item.active ? '商品已啟用' : '商品已停用');
  renderAdminProducts('');
}

// ================================
// BOM Management
// ================================
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
  // 顯示：有售價的成品 + 有 BOM 設定的半成品（雙重身份品項）
  let list = ALL_ITEMS.filter(i =>
    i.active !== false && (i.salePrice > 0 || (BOM[i.id]?.length ?? 0) > 0)
  );
  if(q) list = list.filter(i => i.name.includes(q) || i.id.includes(q));
  const withBom    = list.filter(i => (BOM[i.id]||[]).length > 0);
  const withoutBom = list.filter(i => !(BOM[i.id]||[]).length);
  el.innerHTML = `<div style="font-size:12px;color:var(--text2);padding:6px 0;margin-bottom:4px;">
    已設定 ${withBom.length} / 未設定 ${withoutBom.length}</div>` +
  [...withBom, ...withoutBom].map(item => {
    const bom = BOM[item.id] || [];
    return `<div class="admin-item" onclick="openBomEditor('${item.id}')">
      <span style="font-size:28px;">${item.emoji}</span>
      <div style="flex:1;">
        <div class="admin-item-name">${item.name}</div>
        <div class="admin-item-sub">${item.id}</div>
      </div>
      ${bom.length
        ? `<span class="status-badge badge-done" style="font-size:11px;">${bom.length} 種材料</span>`
        : `<span class="status-badge badge-draft" style="font-size:11px;">未設定</span>`}
    </div>`;
  }).join('');
}

let _bomEditorId = null, _bomEditorItems = [];
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
  const pool = typeof getMaterialItems==='function' ? getMaterialItems() : ALL_ITEMS.filter(i => !i.salePrice);
  const results = pool.filter(i => i.name?.includes(q) || i.id?.includes(q)).slice(0,8);
  if(!results.length){ res.style.display='none'; return; }
  res.style.display = 'block';
  res.innerHTML = results.map(m => {
    const safeName = m.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div class="ss-item" onmousedown="bomEditorAddMat('${m.id}','${safeName}')">
      <span class="ss-emoji">${m.emoji||'📦'}</span>
      <div class="ss-info"><div class="ss-name">${m.name}</div><div class="ss-sub">${m.id}</div></div>
    </div>`;
  }).join('');
}
function bomEditorAddMat(id, name){
  if(_bomEditorItems.find(i=>i.id===id||i.materialId===id)){ showToast('已在清單中'); return; }
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
  showToast('BOM 已儲存');
  renderBomList(document.getElementById('bom-search')?.value || '');
}

// ================================
// Supplier Management
// ================================
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
        <div class="admin-item-sub">${s.id}</div>
      </div>
      <i class="ti ti-chevron-right" style="color:var(--text3);"></i>
    </div>`).join('') || '<div class="order-empty">找不到廠商</div>';
}

function openSupplierEditor(id){
  const s = SUPPLIERS.find(sup => sup.id === id);
  if(!s) return;
  const extra = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
  const merged = { ...s, ...extra };
  document.getElementById('se-id').textContent   = merged.id;
  document.getElementById('se-name').textContent = merged.name;
  ['contact','tel','email','line','bankName','bankBranch','bankCode','accountName','accountNo'].forEach(f => {
    const el = document.getElementById('se-' + f);
    if(el) el.value = merged[f] || '';
  });
  document.getElementById('se-hidden-id').value = id;
  document.getElementById('supplierEditorModal').style.display = 'flex';
}
function saveSupplierEditor(){
  const id = document.getElementById('se-hidden-id').value;
  const data = {};
  ['contact','tel','email','line','bankName','bankBranch','bankCode','accountName','accountNo']
    .forEach(f => { data[f] = document.getElementById('se-'+f)?.value.trim() || ''; });
  localStorage.setItem('erp_sup_' + id, JSON.stringify(data));
  if(typeof _db !== 'undefined' && _db){
    _db.ref('erp/supplierDetails/' + id).set(data).catch(()=>{});
  }
  document.getElementById('supplierEditorModal').style.display = 'none';
  showToast('廠商資料已儲存');
  renderAdminSuppliers(document.getElementById('sup-search')?.value || '');
}

// ================================
// Location Management
// ================================
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
    <div class="admin-item" style="gap:8px;">
      <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;
        background:${loc.isMain?'var(--green-light)':'var(--blue-light)'};
        display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-building-store" style="font-size:20px;color:${loc.isMain?'var(--green)':'var(--blue)'};"></i>
      </div>
      <div style="flex:1;">
        <div class="admin-item-name">${loc.name}</div>
        <div class="admin-item-sub">${typeLabel[loc.type]||loc.type} / ID: ${loc.id}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        <span class="status-badge ${loc.active?'badge-done':'badge-cancelled'}" style="font-size:11px;">
          ${loc.active?'啟用':'停用'}
        </span>
        <button class="small-btn" onclick="openEditLocationModal('${loc.id}')"
          style="padding:6px 10px;font-size:12px;">
          <i class="ti ti-edit"></i>
        </button>
        ${!loc.isMain?`<button class="small-btn" onclick="deleteLocation('${loc.id}')"
          style="padding:6px 10px;font-size:12px;background:var(--red-light);color:var(--red);border-color:var(--red);">
          <i class="ti ti-trash"></i>
        </button>`:''}
      </div>
    </div>`).join('') || '<div class="order-empty">尚未設定地點</div>';
}

let _editLocId = null;
function openAddLocationModal(){
  _editLocId = null;
  document.getElementById('addLocModal-title').textContent = '新增地點';
  document.getElementById('loc-id').value    = '';
  document.getElementById('loc-id').disabled = false;
  document.getElementById('loc-name').value  = '';
  document.getElementById('loc-type').value  = 'store_sub';
  document.getElementById('loc-active-row').style.display = 'none';
  document.getElementById('addLocModal').style.display = 'flex';
}
function openEditLocationModal(id){
  _editLocId = id;
  const loc = locations.find(l => l.id === id);
  if(!loc) return;
  document.getElementById('addLocModal-title').textContent = '編輯地點';
  document.getElementById('loc-id').value    = loc.id;
  document.getElementById('loc-id').disabled = true;
  document.getElementById('loc-name').value  = loc.name;
  document.getElementById('loc-type').value  = loc.type;
  document.getElementById('loc-active-row').style.display = 'flex';
  document.getElementById('loc-active').checked = loc.active !== false;
  document.getElementById('addLocModal').style.display = 'flex';
}
function saveNewLocation(){
  const id     = document.getElementById('loc-id')?.value.trim().replace(/\s/g,'_');
  const name   = document.getElementById('loc-name')?.value.trim();
  const type   = document.getElementById('loc-type')?.value;
  const active = document.getElementById('loc-active')?.checked ?? true;
  if(!id||!name){ showToast('請填寫地點ID和名稱'); return; }
  if(_editLocId){
    updateLocation(_editLocId, { name, type, isMain:type==='store_main', active });
    showToast('地點已更新：' + name);
  } else {
    if(locations.find(l=>l.id===id)){ showToast('此ID已存在'); return; }
    addLocation({ id, name, type, isMain:type==='store_main', active:true });
    showToast('地點已新增：' + name);
  }
  document.getElementById('addLocModal').style.display = 'none';
  renderLocationList();
}
function deleteLocation(id){
  const loc = locations.find(l => l.id === id);
  if(!loc) return;
  if(loc.isMain){ showToast('主倉儲不可刪除'); return; }
  const hasStock = ALL_ITEMS.some(i => (inventory[i.id]?.[id]||0) > 0);
  if(hasStock){ showToast('此地點尚有庫存，請先調貨再刪除'); return; }
  if(!confirm('確定刪除地點「' + loc.name + '」？')) return;
  locations = locations.filter(l => l.id !== id);
  saveLocations();
  showToast('地點已刪除');
  renderLocationList();
}

// ================================
// Data Export & Import
// ================================
function initImportPage(){
  const page = document.getElementById('page-admin-import');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-table-import" style="color:var(--purple);"></i> 資料管理</div>
    </div>
    <div class="form-card">
      <div class="form-section-title">目前資料狀況</div>
      <div class="amount-row"><span>商品</span><strong>${ALL_ITEMS.length} 筆</strong></div>
      <div class="amount-row"><span>廠商</span><strong>${SUPPLIERS.length} 筆</strong></div>
      <div class="amount-row"><span>BOM</span><strong>${Object.keys(BOM).length} 筆</strong></div>
      <div class="amount-row"><span>客戶</span><strong>${typeof customers !== 'undefined' ? customers.length : 0} 筆</strong></div>
      <div class="amount-row"><span>訂單</span><strong>${typeof orders !== 'undefined' ? orders.length : 0} 筆</strong></div>
    </div>
    <div class="section-title" style="margin-top:14px;"><i class="ti ti-download"></i> 下載資料</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
      <button class="admin-item" onclick="exportCSV('products')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-package" style="color:var(--green);font-size:22px;"></i>
        <div class="admin-item-name">商品明細</div>
        <div class="admin-item-sub">含售價/進貨價/庫存</div>
      </button>
      <button class="admin-item" onclick="exportCSV('suppliers')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-building-store" style="color:var(--purple);font-size:22px;"></i>
        <div class="admin-item-name">廠商資料</div>
        <div class="admin-item-sub">含聯絡/銀行帳號</div>
      </button>
      <button class="admin-item" onclick="exportCSV('customers')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-users" style="color:var(--blue);font-size:22px;"></i>
        <div class="admin-item-name">客戶資料</div>
        <div class="admin-item-sub">含聯絡/發票/收件</div>
      </button>
      <button class="admin-item" onclick="exportCSV('inventory')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-packages" style="color:var(--amber);font-size:22px;"></i>
        <div class="admin-item-name">庫存現況</div>
        <div class="admin-item-sub">各地點庫存數量</div>
      </button>
      <button class="admin-item" onclick="exportCSV('orders')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-receipt-2" style="color:var(--purple);font-size:22px;"></i>
        <div class="admin-item-name">訂單記錄</div>
        <div class="admin-item-sub">含品項/金額/狀態</div>
      </button>
      <button class="admin-item" onclick="exportCSV('sales')" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <i class="ti ti-chart-bar" style="color:var(--amber);font-size:22px;"></i>
        <div class="admin-item-name">銷售記錄</div>
        <div class="admin-item-sub">所有銷售明細</div>
      </button>
    </div>
    <div class="section-title" style="margin-top:14px;"><i class="ti ti-upload"></i> 匯入資料</div>
    <div class="filter-tabs" style="margin-bottom:12px;" id="import-type-tabs">
      <button class="ftab active" onclick="switchImportTab('inventory',this)">庫存盤點</button>
      <button class="ftab" onclick="switchImportTab('prices',this)">商品售價</button>
      <button class="ftab" onclick="switchImportTab('customers',this)">客戶</button>
      <button class="ftab" onclick="switchImportTab('suppliers',this)">廠商</button>
    </div>

    <!-- 庫存盤點 -->
    <div id="import-panel-inventory" class="import-panel form-card">
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
        CSV 格式（與下載庫存現況相同）：<br>
        <code>商品編號, 品名, 單位, [地點1數量], [地點2數量], 合計</code><br>
        ※ 直接下載「庫存現況」→ 在 Excel 修改數量 → 重新上傳即可
      </div>
      <input type="file" id="import-inventory-file" accept=".csv"
        style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;font-size:13px;background:var(--bg);"
        onchange="previewImport('inventory',this)" />
      <div id="import-preview-inventory" style="margin-top:10px;"></div>
    </div>

    <!-- 商品售價/進貨價 -->
    <div id="import-panel-prices" class="import-panel form-card" style="display:none;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
        CSV 格式：<code>商品編號, 售價, 進貨價, 安全庫存</code><br>
        ※ 可只填商品編號+售價，其餘留空則保持原值
      </div>
      <input type="file" id="import-prices-file" accept=".csv"
        style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;font-size:13px;background:var(--bg);"
        onchange="previewImport('prices',this)" />
      <div id="import-preview-prices" style="margin-top:10px;"></div>
    </div>

    <!-- 客戶 -->
    <div id="import-panel-customers" class="import-panel form-card" style="display:none;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
        CSV 格式：<code>客戶名稱, 聯絡人, 電話, Email, 地址</code>
      </div>
      <input type="file" id="import-customers-file" accept=".csv"
        style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;font-size:13px;background:var(--bg);"
        onchange="previewImport('customers',this)" />
      <div id="import-preview-customers" style="margin-top:10px;"></div>
    </div>

    <!-- 廠商 -->
    <div id="import-panel-suppliers" class="import-panel form-card" style="display:none;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
        CSV 格式：<code>廠商編號, 廠商名稱, 聯絡人, 電話, Email</code>
      </div>
      <input type="file" id="import-suppliers-file" accept=".csv"
        style="width:100%;padding:10px;border:1px dashed var(--border);border-radius:8px;font-size:13px;background:var(--bg);"
        onchange="previewImport('suppliers',this)" />
      <div id="import-preview-suppliers" style="margin-top:10px;"></div>
    </div>`;
}

function exportCSV(type){
  let headers, rows, filename;
  const BOM_MARK = '\uFEFF';
  switch(type){
    case 'products':
      headers = ['商品編號','品名','類別','單位','售價','進貨價','安全庫存','廠商'];
      rows = ALL_ITEMS.map(i => [i.id, i.name, getCategory(i.category)?.name||'',
        i.unit||'', i.salePrice||0, i.costPrice||0, i.safetyStock||0,
        getSupplier(i.supplierId)?.name||'']);
      filename = '商品明細_' + todayStr() + '.csv';
      break;
    case 'suppliers':
      headers = ['廠商編號','廠商名稱','聯絡人','電話','Email','Line','銀行','分行','代號','戶名','帳號'];
      rows = SUPPLIERS.map(s => {
        const ex = JSON.parse(localStorage.getItem('erp_sup_'+s.id)||'{}');
        const m  = {...s,...ex};
        return [m.id,m.name,m.contact||'',m.tel||'',m.email||'',m.line||'',
          m.bankName||'',m.bankBranch||'',m.bankCode||'',m.accountName||'',m.accountNo||''];
      });
      filename = '廠商資料_' + todayStr() + '.csv';
      break;
    case 'customers':
      headers = ['客戶名稱','來源','承辦人','電話','Email','傳真','抬頭','統編','收件人','收件電話','地址'];
      rows = customers.map(c => [c.name,c.source||'',c.contact||'',c.tel||'',c.email||'',
        c.fax||'',c.invoiceTitle||'',c.taxId||'',c.receiver||'',c.receiverTel||'',c.address||'']);
      filename = '客戶資料_' + todayStr() + '.csv';
      break;
    case 'inventory':
      headers = ['商品編號','品名','單位',...getStoreLocations().map(l=>l.name),'合計'];
      rows = ALL_ITEMS.map(i => {
        const locs = getStoreLocations().map(l => getStock(i.id,l.id));
        return [i.id, i.name, i.unit||'個', ...locs, getTotalStock(i.id)];
      });
      filename = '庫存現況_' + todayStr() + '.csv';
      break;
    case 'orders':
      headers = ['訂單號','客戶','狀態','付款','建立日期','交期','物流','單號','總金額'];
      rows = orders.map(o => {
        const c = getCustomer(o.customerId);
        const ST = {pending:'待處理',producing:'生產中',ready:'待出貨',shipped:'已出貨',archived:'已結案'};
        const PY = {unpaid:'未收款',partial:'部分收款',paid:'已收款'};
        return [o.no,c?.name||'',ST[o.status]||o.status,PY[o.payStatus]||'',
          o.createdAt||'',o.deliveryDate||'',o.logistics||'',o.trackingNo||'',o.totalAmount||0];
      });
      filename = '訂單記錄_' + todayStr() + '.csv';
      break;
    case 'sales':
      headers = ['時間','品項編號','品名','數量','單價','金額','付款方式'];
      rows = logs.filter(l=>l.op==='pos_sale'||l.op==='order_ship').map(l =>
        [l.time||'',l.productId||'',l.productName||'',l.qty||0,l.unitPrice||0,l.amount||0,l.payMethod||'']);
      filename = '銷售記錄_' + todayStr() + '.csv';
      break;
    default: return;
  }
  const csv  = BOM_MARK + [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  showToast(filename + ' 已下載');
}

// ── 匯入 tab 切換 ──
function switchImportTab(type, btn){
  document.querySelectorAll('#import-type-tabs .ftab')
    .forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.import-panel')
    .forEach(p => p.style.display = p.id === 'import-panel-' + type ? '' : 'none');
}

// ── 通用預覽 ──
function previewImport(type, input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    // 移除 BOM 字符
    let text  = e.target.result.replace(/^﻿/, '');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    // 解析 CSV（支援引號欄位）
    const parseCSVLine = l => {
      const result = []; let cur = '', inQ = false;
      for(let i = 0; i < l.length; i++){
        if(l[i] === '"'){ inQ = !inQ; }
        else if(l[i] === ',' && !inQ){ result.push(cur.trim()); cur = ''; }
        else { cur += l[i]; }
      }
      result.push(cur.trim());
      return result;
    };
    const rows = lines.map(parseCSVLine);
    window['_importData_' + type] = rows;

    const el = document.getElementById('import-preview-' + type);
    const labels = { inventory:'庫存', prices:'商品售價', customers:'客戶', suppliers:'廠商' };
    el.innerHTML = `<div style="font-size:13px;color:var(--text2);margin-bottom:8px;">
      預覽（共 ${lines.length} 筆）：</div>` +
      rows.slice(0,4).map(cols =>
        `<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${cols.map(c=>`<span style="margin-right:8px;color:var(--text2);">${c||'—'}</span>`).join('')}
        </div>`
      ).join('') +
      `<button class="confirm-btn" style="margin-top:10px;"
        onclick="doImport('${type}')">
        確認匯入 ${lines.length} 筆${labels[type]||''}資料
      </button>`;
  };
  reader.readAsText(file, 'utf-8');
}

// ── 執行匯入 ──
function doImport(type){
  const rows = window['_importData_' + type] || [];
  let count = 0;

  if(type === 'inventory'){
    // 格式：商品編號, 品名, 單位, [loc1], [loc2], ..., 合計
    // 第一列可能是 header，自動偵測
    const locs = getStoreLocations();
    rows.forEach(cols => {
      const id = cols[0];
      if(!id || id === '商品編號') return;
      const item = getItem(id);
      if(!item) return;
      // 數值從第 3 欄（index 3）開始，與 export 欄位對應
      locs.forEach((loc, i) => {
        const val = parseInt(cols[3 + i]);
        if(!isNaN(val)){
          if(!inventory[id]) inventory[id] = {};
          inventory[id][loc.id] = Math.max(0, val);
          count++;
        }
      });
    });
    saveInventory();
    if(typeof pushToFirebase === 'function') pushToFirebase('inventory', inventory);
    if(typeof renderInventorySummary === 'function') renderInventorySummary();
    if(count === 0){
      showToast('⚠️ 匯入 0 筆庫存，請確認 CSV 格式與商品編號是否正確', 4000);
    } else {
      showToast(`✅ 已更新 ${count} 筆庫存`);
    }

  } else if(type === 'prices'){
    // 支援兩種格式：
    //   商品售價（4欄）：商品編號, 售價, 進貨價, 安全庫存
    //   商品明細（8欄）：商品編號, 品名, 類別, 單位, 售價, 進貨價, 安全庫存, 廠商
    let newCount = 0;
    const _catByName = name =>
      Object.keys(CATEGORIES).find(k => CATEGORIES[k]?.name === name) || '009';

    rows.forEach(cols => {
      const id = cols[0];
      if(!id || id === '商品編號') return;

      const isDetailFormat = cols.length >= 5 && isNaN(parseInt(cols[1]));
      const offset = isDetailFormat ? 4 : 1;

      let item = ITEM_INDEX[id];

      // 商品明細格式 + 系統中沒有此品項 → 自動新增
      if(!item && isDetailFormat){
        const catId = _catByName(cols[2] || '');
        item = {
          id,
          name:        cols[1] || id,
          category:    catId,
          unit:        cols[3] || '個',
          emoji:       CATEGORIES[catId]?.emoji || '📦',
          salePrice:   parseInt(cols[4]) || 0,
          costPrice:   parseInt(cols[5]) || 0,
          safetyStock: parseInt(cols[6]) || 0,
          active:      true,
        };
        ALL_ITEMS.push(item);
        ITEM_INDEX[id] = item;
        // 初始化庫存（各地點設 0）
        if(typeof inventory !== 'undefined' && !inventory[id]){
          inventory[id] = {};
          if(typeof getStoreLocations === 'function')
            getStoreLocations().forEach(l => { inventory[id][l.id] = 0; });
        }
        // 儲存自定義商品清單
        const custom = JSON.parse(localStorage.getItem('erp_custom_items') || '[]');
        const ei = custom.findIndex(c => c.id === id);
        if(ei >= 0) custom[ei] = item; else custom.push(item);
        localStorage.setItem('erp_custom_items', JSON.stringify(custom));
        if(typeof pushToFirebase === 'function') pushToFirebase('customItems', custom);
        newCount++;
        count++;
        return;
      }

      if(!item) return;

      const vSale   = cols[offset];
      const vCost   = cols[offset + 1];
      const vSafety = cols[offset + 2];
      if(vSale   !== '' && vSale   !== undefined) item.salePrice   = parseInt(vSale)   || 0;
      if(vCost   !== '' && vCost   !== undefined) item.costPrice   = parseInt(vCost)   || 0;
      if(vSafety !== '' && vSafety !== undefined) item.safetyStock = parseInt(vSafety) || 0;
      count++;
    });
    _saveProductOverrides();
    if(newCount > 0) saveInventory();
    const _newMsg = newCount > 0 ? `，新增 ${newCount} 筆新商品` : '';
    showToast(`✅ 已更新 ${count - newCount} 筆售價${_newMsg}`, 3000);

  } else if(type === 'customers'){
    // 格式：客戶名稱, 聯絡人, 電話, Email, 地址
    rows.forEach(cols => {
      if(!cols[0] || cols[0] === '客戶名稱') return;
      customers.push({
        id:        'C' + Date.now() + Math.random().toString(36).slice(2,5),
        name:      cols[0]||'', contact: cols[1]||'', tel: cols[2]||'',
        email:     cols[3]||'', address: cols[4]||'',
        source:    'phone', createdAt: todayStr(),
      });
      count++;
    });
    if(typeof saveCustomers === 'function') saveCustomers();
    showToast(`✅ 已匯入 ${count} 筆客戶`);

  } else if(type === 'suppliers'){
    // 格式：廠商編號, 廠商名稱, 聯絡人, 電話, Email
    rows.forEach(cols => {
      if(!cols[0] || cols[0] === '廠商編號') return;
      const id  = cols[0];
      const extra = { contact: cols[2]||'', tel: cols[3]||'', email: cols[4]||'' };
      // 寫到廠商 extra localStorage
      const saved = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
      localStorage.setItem('erp_sup_' + id, JSON.stringify({ ...saved, ...extra }));
      // 若廠商不在 SUPPLIERS 清單中，新增一筆
      if(!SUPPLIERS.find(s => s.id === id)){
        SUPPLIERS.push({ id, name: cols[1]||id });
      } else {
        const s = SUPPLIERS.find(s => s.id === id);
        if(cols[1]) s.name = cols[1];
      }
      count++;
    });
    showToast(`✅ 已更新 ${count} 筆廠商`);
  }

  initImportPage();
}

// ── 舊版相容（保留給其他地方可能呼叫） ──
function previewCustomerImport(input){ previewImport('customers', input); }
function doImportCustomers(){ doImport('customers'); }

// ================================
// Modals (dynamic creation)
// ================================
function createAdminModals(){
  const modals = `
  <div class="modal-overlay" id="productEditorModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card" style="max-width:360px;">
      <div class="modal-title"><i class="ti ti-package"></i> <span id="pe-title"></span></div>
      <input type="hidden" id="pe-item-id" />
      <div class="cust-form">
        <div class="cust-field"><label>售價（$）</label><input type="number" id="pe-sale-price" min="0" /></div>
        <div class="cust-field"><label>進貨價（$）</label><input type="number" id="pe-cost-price" min="0" /></div>
        <div class="cust-field"><label>安全庫存量</label><input type="number" id="pe-safety-stock" min="0" /></div>
        <div class="cust-field" style="flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap;">
          <label style="font-weight:600;color:var(--text2);font-size:12px;min-width:80px;">品項屬性</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px;">
            <input type="checkbox" id="pe-can-sell" />
            <span><i class="ti ti-receipt" style="font-size:12px;"></i> 可銷售</span>
          </label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px;">
            <input type="checkbox" id="pe-can-material" />
            <span><i class="ti ti-git-merge" style="font-size:12px;"></i> 可作為 BOM 材料</span>
          </label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px;">
            <input type="checkbox" id="pe-can-purchase" />
            <span><i class="ti ti-package-import" style="font-size:12px;"></i> 可採購</span>
          </label>
        </div>
        <div style="font-size:11px;color:var(--text3);padding:0 4px;">
          ⚠️ 勾選後會覆蓋系統自動判斷（依售價/進價）
        </div>
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

  <div class="modal-overlay" id="addLocModal" style="display:none;"
    onclick="if(event.target===this)this.style.display='none'">
    <div class="modal-card" style="max-width:360px;">
      <div class="modal-title"><i class="ti ti-map-pin"></i> <span id="addLocModal-title">新增地點</span></div>
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
        <div class="amount-row" id="loc-active-row" style="display:none;">
          <span>狀態</span>
          <label style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="loc-active" checked /> 啟用
          </label>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveNewLocation()"><i class="ti ti-check"></i> 儲存</button>
        <button class="modal-cancel-btn" onclick="document.getElementById('addLocModal').style.display='none'">取消</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modals);
}

document.addEventListener('DOMContentLoaded', () => {
  createAdminModals();
});
