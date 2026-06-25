// expiry.js — 效期批次追蹤（食品類庇護工廠商品）

let _batches = [];

function loadBatches(){
  _batches = JSON.parse(localStorage.getItem('erp_batches') || '[]');
}

function saveBatches(){
  localStorage.setItem('erp_batches', JSON.stringify(_batches));
  if(typeof pushToFirebase === 'function') pushToFirebase('batches', _batches);
}

function _batchDiffDays(expiryDate){
  if(!expiryDate) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.floor((new Date(expiryDate) - now) / 86400000);
}

function _batchStatusInfo(expiryDate){
  const diff = _batchDiffDays(expiryDate);
  if(diff === null)  return { color:'var(--text2)',   label:'' };
  if(diff < 0)       return { color:'var(--red)',     label:`已過期 ${-diff} 天` };
  if(diff === 0)     return { color:'var(--red)',     label:'今天到期' };
  if(diff <= 7)      return { color:'var(--amber)',   label:`還有 ${diff} 天` };
  if(diff <= 30)     return { color:'#e6a817',        label:`還有 ${diff} 天` };
  return                    { color:'var(--green)',   label:`還有 ${diff} 天` };
}

function getExpiryAlertCount(){
  loadBatches();
  const cutoff = new Date(); cutoff.setHours(0,0,0,0);
  cutoff.setDate(cutoff.getDate() + 30);
  return _batches.filter(b => !b.consumed && b.expiryDate && new Date(b.expiryDate) <= cutoff).length;
}

function initExpiryPage(){
  loadBatches();
  const page = document.getElementById('page-expiry');
  if(!page) return;

  const now = new Date(); now.setHours(0,0,0,0);
  const active  = _batches.filter(b => !b.consumed);
  const expired = active.filter(b => b.expiryDate && new Date(b.expiryDate) < now);
  const soon7   = active.filter(b => b.expiryDate && _batchDiffDays(b.expiryDate) <= 7 && _batchDiffDays(b.expiryDate) >= 0);

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('factory-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-calendar-event" style="color:var(--amber);"></i> 效期管理</div>
      <button class="small-btn green-btn" onclick="openAddBatchModal()">
        <i class="ti ti-plus"></i> 新增
      </button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
      <div class="form-card" style="text-align:center;background:${expired.length ? 'var(--red-light)' : 'var(--surface)'};">
        <div style="font-size:22px;font-weight:700;color:${expired.length ? 'var(--red)' : 'var(--text2)'};">${expired.length}</div>
        <div style="font-size:12px;color:var(--text2);">已過期</div>
      </div>
      <div class="form-card" style="text-align:center;background:${soon7.length ? 'rgba(230,168,23,0.1)' : 'var(--surface)'};">
        <div style="font-size:22px;font-weight:700;color:${soon7.length ? 'var(--amber)' : 'var(--text2)'};">${soon7.length}</div>
        <div style="font-size:12px;color:var(--text2);">7天內到期</div>
      </div>
      <div class="form-card" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;">${active.length}</div>
        <div style="font-size:12px;color:var(--text2);">追蹤中</div>
      </div>
    </div>

    <div class="filter-tabs" style="margin-bottom:10px;">
      <button class="ftab active" onclick="renderExpiryList('active',this)">追蹤中</button>
      <button class="ftab" onclick="renderExpiryList('expired-only',this)">已過期</button>
      <button class="ftab" onclick="renderExpiryList('consumed',this)">已消耗</button>
    </div>

    <div id="expiry-list"></div>`;

  renderExpiryList('active', page.querySelector('.ftab.active'));
}

function renderExpiryList(filter, btn){
  const el = document.getElementById('expiry-list');
  if(!el) return;
  if(btn){
    document.querySelectorAll('#page-expiry .ftab')
      .forEach(b => b.classList.toggle('active', b === btn));
  }
  loadBatches();
  const now = new Date(); now.setHours(0,0,0,0);
  let list;
  if(filter === 'consumed'){
    list = _batches.filter(b => b.consumed);
  } else if(filter === 'expired-only'){
    list = _batches.filter(b => !b.consumed && b.expiryDate && new Date(b.expiryDate) < now);
  } else {
    list = _batches.filter(b => !b.consumed && (!b.expiryDate || new Date(b.expiryDate) >= now));
  }
  list.sort((a,b) => (a.expiryDate||'9999') < (b.expiryDate||'9999') ? -1 : 1);

  if(!list.length){
    el.innerHTML = '<div class="order-empty">沒有符合的批次記錄</div>'; return;
  }

  el.innerHTML = list.map(b => {
    const { color, label } = _batchStatusInfo(b.expiryDate);
    return `<div class="list-card" style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:28px;flex-shrink:0;">${b.emoji||'📦'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:600;">${b.productName}</div>
          <div style="font-size:12px;color:var(--text3);">效期：${b.expiryDate || '未設定'}</div>
          ${b.note ? `<div style="font-size:12px;color:var(--text3);">${b.note}</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:700;">${b.qty} ${b.unit||'個'}</div>
          ${label ? `<div style="font-size:12px;font-weight:600;color:${color};">${label}</div>` : ''}
        </div>
      </div>
      ${!b.consumed ? `
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="small-btn" onclick="markBatchConsumed('${b.id}')" style="flex:1;font-size:12px;">
            <i class="ti ti-check"></i> 已消耗/移除
          </button>
          <button class="small-btn" onclick="deleteBatch('${b.id}')"
            style="padding:6px 10px;font-size:12px;background:var(--red-light);color:var(--red);border-color:var(--red);">
            <i class="ti ti-trash"></i>
          </button>
        </div>` : `
        <div style="font-size:12px;color:var(--text3);margin-top:6px;">已消耗 ${b.consumedAt||''}</div>`}
    </div>`;
  }).join('');
}

function markBatchConsumed(id){
  loadBatches();
  const b = _batches.find(b => b.id === id);
  if(!b) return;
  if(!confirm(`確認標記「${b.productName}」批次（效期 ${b.expiryDate}）已消耗？`)) return;
  b.consumed   = true;
  b.consumedAt = todayStr();
  saveBatches();
  showToast('✅ 批次已標記消耗');
  initExpiryPage();
}

function deleteBatch(id){
  loadBatches();
  const b = _batches.find(b => b.id === id);
  if(!b || !confirm(`確認刪除「${b.productName}」批次記錄？`)) return;
  _batches = _batches.filter(x => x.id !== id);
  saveBatches();
  showToast('已刪除批次記錄');
  initExpiryPage();
}

function openAddBatchModal(){
  const modal = document.getElementById('expiryAddModal');
  if(!modal) return;
  document.getElementById('eb-product-name').textContent = '請選擇商品';
  document.getElementById('eb-hidden-id').value          = '';
  document.getElementById('eb-search').value             = '';
  document.getElementById('eb-expiry').value             = '';
  document.getElementById('eb-qty').value                = '1';
  document.getElementById('eb-note').value               = '';
  document.getElementById('eb-search-result').style.display = 'none';
  modal.style.display = 'flex';
}

function expiryProductSearch(q){
  const res = document.getElementById('eb-search-result');
  if(!res || !q){ if(res) res.style.display='none'; return; }
  const results = (typeof FINISHED !== 'undefined' ? FINISHED : ALL_ITEMS).filter(i =>
    i.active !== false && (i.name.includes(q) || i.id.includes(q))
  ).slice(0, 8);
  if(!results.length){ res.style.display='none'; return; }
  res.style.display = 'block';
  res.innerHTML = results.map(i =>
    `<div class="ss-item" onmousedown="expiryPickProduct('${i.id}')">
      <span class="ss-emoji">${i.emoji||'📦'}</span>
      <div class="ss-info"><div class="ss-name">${i.name}</div><div class="ss-sub">${i.id}</div></div>
    </div>`
  ).join('');
}

function expiryPickProduct(id){
  const item = typeof getItem === 'function' ? getItem(id) : null;
  if(!item) return;
  document.getElementById('eb-hidden-id').value          = id;
  document.getElementById('eb-product-name').textContent = `${item.emoji} ${item.name}`;
  document.getElementById('eb-search').value             = '';
  document.getElementById('eb-search-result').style.display = 'none';
}

function saveExpiryBatch(){
  const productId  = document.getElementById('eb-hidden-id').value;
  const expiryDate = document.getElementById('eb-expiry').value;
  const qty        = parseInt(document.getElementById('eb-qty').value) || 0;
  const note       = document.getElementById('eb-note')?.value.trim() || '';

  if(!productId)  { showToast('⚠️ 請先選擇商品'); return; }
  if(!expiryDate) { showToast('⚠️ 請輸入效期日期'); return; }
  if(qty <= 0)    { showToast('⚠️ 數量需大於 0'); return; }

  const item = typeof getItem === 'function' ? getItem(productId) : null;
  loadBatches();
  _batches.push({
    id:          'B' + Date.now(),
    productId,
    productName: item?.name  || productId,
    emoji:       item?.emoji || '📦',
    unit:        item?.unit  || '個',
    expiryDate,
    qty,
    note,
    addedAt:     todayStr(),
    consumed:    false,
  });
  saveBatches();
  document.getElementById('expiryAddModal').style.display = 'none';
  showToast('✅ 效期批次已新增');
  initExpiryPage();
}

document.addEventListener('DOMContentLoaded', () => {
  loadBatches();
  const modal = document.createElement('div');
  modal.id        = 'expiryAddModal';
  modal.className = 'modal-overlay';
  modal.style.display = 'none';
  modal.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-title">
        <i class="ti ti-calendar-event" style="color:var(--amber);"></i> 新增效期批次
      </div>
      <div class="cust-form">
        <div class="cust-field">
          <label>商品</label>
          <div id="eb-product-name" style="font-size:14px;font-weight:600;padding:4px 0;color:var(--text2);">請選擇商品</div>
          <div class="search-bar" style="margin-top:6px;">
            <i class="ti ti-search"></i>
            <input type="search" id="eb-search" placeholder="輸入商品名稱搜尋..."
              oninput="expiryProductSearch(this.value)" />
          </div>
          <div id="eb-search-result"
            style="display:none;max-height:200px;overflow-y:auto;
            border:1px solid var(--border);border-radius:8px;background:var(--surface);"></div>
          <input type="hidden" id="eb-hidden-id" />
        </div>
        <div class="cust-field">
          <label>效期日期</label>
          <input type="date" id="eb-expiry" />
        </div>
        <div class="cust-field">
          <label>數量</label>
          <input type="number" id="eb-qty" min="1" value="1" />
        </div>
        <div class="cust-field">
          <label>備註（批次說明，可選）</label>
          <input type="text" id="eb-note" placeholder="例：2025-11 到貨批次" />
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" onclick="saveExpiryBatch()">
          <i class="ti ti-check"></i> 儲存
        </button>
        <button class="modal-cancel-btn"
          onclick="document.getElementById('expiryAddModal').style.display='none'">
          取消
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
});
