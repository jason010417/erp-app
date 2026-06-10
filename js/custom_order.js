// ============================================================
// custom_order.js — 客製化商品（用於估價單/訂單）
// ============================================================

// ── 客製化商品 Modal 狀態 ──
let _customItem = null;
let _customEditIdx = null;   // 正在編輯哪個品項（null = 新增）
let _customContext = null;   // 'estimate' | 'order'
let _customImages = [];      // base64 圖片陣列

// ── 開啟客製化商品 Modal ──
function openCustomItemModal(context, editIdx){
  _customContext = context || 'estimate';
  _customEditIdx = editIdx ?? null;
  _customImages  = [];

  // 如果是編輯現有的客製商品
  const srcList = context === 'estimate' ? _currentEst?.items : _currentOrder?.items;
  if(editIdx !== null && editIdx !== undefined && srcList){
    const existing = srcList[editIdx];
    if(existing?.isCustom){
      _customItem = JSON.parse(JSON.stringify(existing));
      _customImages = existing.images || [];
    } else { _customItem = null; }
  } else {
    _customItem = null;
  }

  renderCustomItemModal();
  document.getElementById('customItemModal').style.display = 'flex';
}

function renderCustomItemModal(){
  const modal = document.getElementById('customItemModal');
  if(!modal) return;
  const ci = _customItem;

  modal.innerHTML = `
    <div class="modal-card" style="max-height:92vh;overflow-y:auto;">
      <div class="modal-title">
        <i class="ti ti-pencil-plus" style="color:var(--purple);"></i>
        ${_customEditIdx !== null ? '編輯客製化商品' : '新增客製化商品'}
      </div>

      <!-- 基本資訊 -->
      <div class="cust-field">
        <label>客製商品名稱 *</label>
        <input type="text" id="ci-name" value="${ci?.name||''}"
          placeholder="例：企業春節禮盒、客製耳掛咖啡組合" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="cust-field">
          <label>數量</label>
          <input type="number" id="ci-qty" value="${ci?.qty||1}" min="1" />
        </div>
        <div class="cust-field">
          <label>單價（$）</label>
          <input type="number" id="ci-price" value="${ci?.unitPrice||0}" min="0" />
        </div>
      </div>

      <!-- 材料組合（臨時 BOM）-->
      <div class="form-section-title" style="margin-top:12px;">
        材料組合
        <span style="font-weight:400;color:var(--text3);font-size:11px;">（生產時依此扣料）</span>
      </div>
      <div class="search-bar" style="margin-bottom:8px;">
        <i class="ti ti-search"></i>
        <input type="search" id="ci-mat-search" placeholder="搜尋材料加入..."
          oninput="searchCustomMaterial(this.value)" />
      </div>
      <div id="ci-mat-search-result" style="display:none;max-height:160px;overflow-y:auto;"></div>
      <div id="ci-mat-list"></div>

      <!-- 備註（印製說明等）-->
      <div class="cust-field" style="margin-top:12px;">
        <label>備註（印製說明、特殊要求等）</label>
        <textarea id="ci-remark" rows="3"
          placeholder="例：委外印LOGO，交期7天；或：換紅色提繩">${ci?.remark||''}</textarea>
      </div>

      <!-- 照片上傳 -->
      <div class="form-section-title" style="margin-top:4px;">
        樣品照片 / 注意事項
        <span style="font-weight:400;color:var(--text3);font-size:11px;">（最多5張，每張限3MB）</span>
      </div>
      <input type="file" id="ci-img-upload" accept="image/*" multiple
        style="display:none;" onchange="handleCustomImages(this)" />
      <button onclick="document.getElementById('ci-img-upload').click()"
        style="width:100%;padding:12px;border:1.5px dashed var(--border);
        border-radius:var(--radius-sm);background:var(--bg);color:var(--text2);
        font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;">
        <i class="ti ti-photo-plus" style="font-size:20px;"></i>
        點擊上傳照片
      </button>
      <div id="ci-img-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>

      <!-- 按鈕 -->
      <div class="modal-actions" style="margin-top:16px;">
        <button class="modal-ok-btn" onclick="saveCustomItem()">
          <i class="ti ti-check"></i> 加入估價單
        </button>
        <button class="modal-cancel-btn"
          onclick="document.getElementById('customItemModal').style.display='none'">
          取消
        </button>
      </div>
    </div>`;

  // 初始化材料清單
  window._ciMaterials = ci?.materials ? JSON.parse(JSON.stringify(ci.materials)) : [];
  renderCiMatList();
  renderCiImgPreview();
}

// ── 材料搜尋 ──
function searchCustomMaterial(q){
  const res = document.getElementById('ci-mat-search-result');
  if(!res||!q){ if(res) res.style.display='none'; return; }
  const pool = typeof getMaterialItems==='function'
    ? getMaterialItems()
    : ALL_ITEMS;
  const results = pool.filter(i =>
    i.name?.includes(q) || i.id?.toLowerCase().startsWith(q.toLowerCase())
  ).slice(0,10);
  if(!results.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML = results.map(item => {
    const stock = getTotalStock(item.id);
    const cls   = stock<=0?'ss-qty-empty':isLowStock(item.id)?'ss-qty-low':'ss-qty-ok';
    return `<div class="ss-item" onmousedown="addCiMaterial('${item.id}')">
      <span class="ss-emoji">${item.emoji||'📦'}</span>
      <div class="ss-info">
        <div class="ss-name">${item.name}</div>
        <div class="ss-sub">${item.id}</div>
      </div>
      <div class="${cls} ss-stock">${stock}</div>
    </div>`;
  }).join('');
}

function addCiMaterial(id){
  const item = getItem(id);
  if(!item) return;
  const existing = window._ciMaterials.find(m => m.productId === id);
  if(existing){ existing.qty++; }
  else {
    window._ciMaterials.push({
      productId: id,
      name:      item.name,
      emoji:     item.emoji,
      unit:      item.unit || '個',
      qty:       1,
    });
  }
  const s = document.getElementById('ci-mat-search');
  if(s) s.value = '';
  const r = document.getElementById('ci-mat-search-result');
  if(r) r.style.display = 'none';
  renderCiMatList();
}

function removeCiMaterial(idx){
  window._ciMaterials.splice(idx,1);
  renderCiMatList();
}

function changeCiMatQty(idx, delta){
  const m = window._ciMaterials[idx];
  if(m) m.qty = Math.max(0.1, parseFloat((m.qty + delta).toFixed(2)));
  renderCiMatList();
}

function setCiMatQty(idx, val){
  const m = window._ciMaterials[idx];
  if(m){ const n=parseFloat(val); if(n>0) m.qty=n; }
}

function renderCiMatList(){
  const el = document.getElementById('ci-mat-list');
  if(!el) return;
  const mats = window._ciMaterials || [];
  if(!mats.length){
    el.innerHTML = '<div class="order-empty" style="margin-bottom:8px;">尚未加入材料（若無需扣料可留空）</div>';
    return;
  }
  el.innerHTML = mats.map((m, idx) => `
    <div class="order-row" style="margin-bottom:6px;">
      <span style="font-size:24px;">${m.emoji||'📦'}</span>
      <div class="order-info">
        <div class="order-name">${m.name}</div>
        <div class="order-id">${m.productId}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="qty-btn" onclick="changeCiMatQty(${idx},-1)">−</button>
        <input type="number" value="${m.qty}" min="0.1" step="0.1"
          style="width:56px;padding:4px 6px;font-size:15px;font-weight:700;text-align:center;
          border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);"
          onchange="setCiMatQty(${idx},this.value)" />
        <button class="qty-btn" onclick="changeCiMatQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeCiMaterial(${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

// ── 照片處理 ──
function handleCustomImages(input){
  const files = Array.from(input.files).slice(0, 5 - _customImages.length);
  const readers = files.map(file => new Promise((resolve, reject) => {
    if(file.size > 3 * 1024 * 1024){ showToast('⚠️ 每張照片限 3MB'); reject(); return; }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }));
  Promise.allSettled(readers).then(results => {
    results.forEach(r => { if(r.status==='fulfilled') _customImages.push(r.value); });
    renderCiImgPreview();
  });
  input.value = '';
}

function renderCiImgPreview(){
  const el = document.getElementById('ci-img-preview');
  if(!el) return;
  if(!_customImages.length){ el.innerHTML=''; return; }
  el.innerHTML = _customImages.map((img, idx) => `
    <div style="position:relative;width:80px;height:80px;">
      <img src="${img}" style="width:80px;height:80px;object-fit:cover;
        border-radius:8px;border:1px solid var(--border);" />
      <button onclick="removeCiImage(${idx})"
        style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;
        border-radius:50%;background:var(--red);color:white;border:none;
        font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

function removeCiImage(idx){
  _customImages.splice(idx,1);
  renderCiImgPreview();
}

// ── 儲存客製化商品 ──
function saveCustomItem(){
  const name  = document.getElementById('ci-name')?.value.trim();
  const qty   = parseInt(document.getElementById('ci-qty')?.value) || 1;
  const price = parseInt(document.getElementById('ci-price')?.value) || 0;
  const remark= document.getElementById('ci-remark')?.value.trim() || '';

  if(!name){ showToast('⚠️ 請填寫客製商品名稱'); return; }

  const customItem = {
    id:            'CUSTOM_' + Date.now(),
    name,
    emoji:         '🎁',
    qty,
    originalPrice: price,
    unitPrice:     price,
    isCustom:      true,
    materials:     JSON.parse(JSON.stringify(window._ciMaterials||[])),
    remark,
    images:        [..._customImages],
    discount:      null,
  };

  // 加入目標清單
  if(_customContext === 'estimate' && _currentEst){
    if(_customEditIdx !== null){
      _currentEst.items[_customEditIdx] = customItem;
    } else {
      _currentEst.items.push(customItem);
    }
    renderEstItems();
    calcEstTotal();
  } else if(_customContext === 'order' && _currentOrder){
    if(_customEditIdx !== null){
      _currentOrder.items[_customEditIdx] = customItem;
    } else {
      _currentOrder.items.push(customItem);
    }
    renderOrderItems();
    calcOrderTotal();
  }

  document.getElementById('customItemModal').style.display = 'none';
  showToast(`✅ 客製商品已加入：${name}`);
}

// ── 初始化：在 HTML 加入 Modal 和修改估價單/訂單按鈕 ──
document.addEventListener('DOMContentLoaded', () => {
  // 動態加入 customItemModal
  const modal = document.createElement('div');
  modal.className    = 'modal-overlay';
  modal.id           = 'customItemModal';
  modal.style.display= 'none';
  modal.onclick      = e => { if(e.target===modal) modal.style.display='none'; };
  document.body.appendChild(modal);

  // 修改估價單品項搜尋欄：加入「新增客製化」按鈕
  patchEstimateForm();
  patchOrderForm();
});

// 在估價單編輯頁的品項區加入客製化按鈕
function patchEstimateForm(){
  // 估價單頁面是動態渲染的，用 MutationObserver 監聽
  const obs = new MutationObserver(() => {
    const searchBar = document.querySelector('#page-estimate-edit .search-bar');
    if(searchBar && !searchBar.nextElementSibling?.classList?.contains('custom-add-btn-row')){
      const btn = document.createElement('div');
      btn.className = 'custom-add-btn-row';
      btn.style = 'margin-bottom:8px;';
      btn.innerHTML = `<button onclick="openCustomItemModal('estimate')"
        style="width:100%;padding:10px;border:1.5px dashed var(--purple-mid);
        border-radius:var(--radius-sm);background:var(--purple-light);color:var(--purple);
        font-size:13px;font-weight:600;display:flex;align-items:center;
        justify-content:center;gap:8px;cursor:pointer;">
        <i class="ti ti-pencil-plus" style="font-size:18px;"></i>
        新增客製化商品
      </button>`;
      searchBar.after(btn);
    }
  });
  obs.observe(document.getElementById('page-estimate-edit') || document.body,
    { childList:true, subtree:true });
}

function patchOrderForm(){
  const obs = new MutationObserver(() => {
    const searchBar = document.querySelector('#page-order-edit .search-bar');
    if(searchBar && !searchBar.nextElementSibling?.classList?.contains('custom-add-btn-row')){
      const btn = document.createElement('div');
      btn.className = 'custom-add-btn-row';
      btn.style = 'margin-bottom:8px;';
      btn.innerHTML = `<button onclick="openCustomItemModal('order')"
        style="width:100%;padding:10px;border:1.5px dashed var(--purple-mid);
        border-radius:var(--radius-sm);background:var(--purple-light);color:var(--purple);
        font-size:13px;font-weight:600;display:flex;align-items:center;
        justify-content:center;gap:8px;cursor:pointer;">
        <i class="ti ti-pencil-plus" style="font-size:18px;"></i>
        新增客製化商品
      </button>`;
      searchBar.after(btn);
    }
  });
  obs.observe(document.getElementById('page-order-edit') || document.body,
    { childList:true, subtree:true });
}
