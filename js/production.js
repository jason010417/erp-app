// ============================================================
// production.js — 生產管理
// 來源：訂單自動建立 / 手動建立（提前備貨）
// ============================================================

let productionOrders = JSON.parse(localStorage.getItem('erp_production_orders') || '[]');

function saveProdOrders(){
  localStorage.setItem('erp_production_orders', JSON.stringify(productionOrders));
  if(typeof pushToFirebase === 'function') pushToFirebase('productionOrders', productionOrders);
}

function getProdOrder(id){ return productionOrders.find(p => p.id === id) || null; }

function genProdNo(){ return genNo('P', productionOrders, 'no'); }

// ── 製程狀態 ──
const PROD_STEPS = [
  { key:'prepare',   label:'備料中', icon:'ti-packages',     color:'#BA7517', bg:'#FAEEDA' },
  { key:'producing', label:'生產中', icon:'ti-player-play',  color:'#185FA5', bg:'#E6F1FB' },
  { key:'done',      label:'已完成', icon:'ti-circle-check', color:'#1D9E75', bg:'#E1F5EE' },
  { key:'shipped',   label:'已出貨', icon:'ti-truck',        color:'#6B4FBB', bg:'#EDE9F8' },
];
function stepOf(key)   { return PROD_STEPS.find(s => s.key === key) || PROD_STEPS[0]; }
function stepIndex(key){ return PROD_STEPS.findIndex(s => s.key === key); }
function nextStep(key) {
  const i = stepIndex(key);
  return i < PROD_STEPS.length - 1 ? PROD_STEPS[i + 1] : null;
}

function prodStatusBadge(status){
  const s = stepOf(status);
  return `<span class="status-badge" style="background:${s.bg};color:${s.color};">
    <i class="ti ${s.icon}"></i> ${s.label}
  </span>`;
}

// ── 列表 ──
let _prodFilter = 'all';

function renderProductionList(filter){
  _prodFilter = filter || 'all';
  document.querySelectorAll('#page-production .ftab').forEach((btn, i) => {
    const filters = ['all','prepare','producing','done','shipped'];
    btn.classList.toggle('active', filters[i] === _prodFilter);
  });

  const el = document.getElementById('production-list');
  if(!el) return;
  let list = _prodFilter === 'all'
    ? productionOrders
    : productionOrders.filter(p => p.status === _prodFilter);
  list = list.slice().reverse();

  if(!list.length){
    el.innerHTML = `<div class="order-empty">沒有符合的生產單</div>`;
    return;
  }

  el.innerHTML = list.map(p => {
    const cust     = getCustomer(p.customerId);
    const itemsStr = (p.items||[]).slice(0,2).map(i=>i.name).join('、')
      + ((p.items||[]).length > 2 ? ` 等${p.items.length}項` : '');
    return `<div class="list-card" onclick="showProdDetail('${p.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${p.no}</span>
        ${prodStatusBadge(p.status)}
      </div>
      <div class="list-card-meta">
        ${cust ? `<span><i class="ti ti-user"></i>${cust.name}</span>` : ''}
        ${p.sourceOrderNo ? `<span><i class="ti ti-link"></i>${p.sourceOrderNo}</span>` : ''}
        <span><i class="ti ti-calendar"></i>${fmtDate(p.createdAt)}</span>
        ${p.deadline ? `<span><i class="ti ti-clock"></i>期限 ${fmtDate(p.deadline)}</span>` : ''}
      </div>
      <div class="list-card-items">${itemsStr || '無品項'}</div>
      <!-- 迷你進度條 -->
      <div class="prod-mini-bar">
        ${PROD_STEPS.map((s, i) => `
          <div class="prod-mini-step ${stepIndex(p.status) >= i ? 'active' : ''}">
            <div class="prod-mini-dot" style="${stepIndex(p.status)>=i?'background:'+s.color:''}"></div>
            <div class="prod-mini-label">${s.label}</div>
          </div>
          ${i < PROD_STEPS.length-1
            ? `<div class="prod-mini-line ${stepIndex(p.status)>i?'active':''}"></div>`
            : ''}`).join('')}
      </div>
    </div>`;
  }).join('');
}

// ── 從訂單建立生產單（自動）──
function newProductionFromOrder(order, itemsNeedProduction){
  const now = nowStr();
  const p = {
    id:           'PO' + Date.now(),
    no:           genProdNo(),
    sourceOrderId: order.id,
    sourceOrderNo: order.no,
    customerId:    order.customerId,
    items:         itemsNeedProduction.map(i => ({
      id:    i.id,
      name:  i.name,
      emoji: i.emoji,
      qty:   i.produceQty || i.qty,
    })),
    deadline:    order.deliveryDate || '',
    remark:      `由訂單 ${order.no} 自動建立`,
    status:      'prepare',
    statusLog:   [{ status:'prepare', label:'備料中', time:now, note:`由訂單 ${order.no} 建立` }],
    createdAt:   todayStr(),
  };
  productionOrders.push(p);
  saveProdOrders();
  renderProductionList(_prodFilter);
  return p;
}

// ── 手動新增生產單 ──
let _currentProd = null;

function newProductionOrder(){
  _currentProd = {
    id:           null,
    no:           genProdNo(),
    sourceOrderId: null,
    sourceOrderNo: '',
    customerId:    null,
    items:         [],
    deadline:      '',
    remark:        '',
    status:        'prepare',
    statusLog:     [],
    createdAt:     todayStr(),
  };
  renderProdEditPage();
  showPage('production-edit');
}

// ── 生產單編輯頁 ──
function renderProdEditPage(){
  const page = document.getElementById('page-production-edit');
  if(!page) return;
  const p = _currentProd;

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('production')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${p.id ? p.no : '新增生產單'}</div>
      <button class="small-btn green-btn" onclick="saveProdDraft()">
        <i class="ti ti-device-floppy"></i> 儲存
      </button>
    </div>
    <div class="form-card">
      <div class="form-meta-row">
        <span class="form-no">${p.no}</span>
        <span class="form-date">${fmtDate(p.createdAt)}</span>
      </div>
      ${p.sourceOrderNo ? `
      <div style="padding:8px 12px;background:var(--purple-light);border-radius:var(--radius-sm);
        font-size:13px;color:var(--purple);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
        <i class="ti ti-link"></i> 來源訂單：${p.sourceOrderNo}
      </div>` : ''}

      <div class="form-section-title">品項（成品）</div>
      <div class="search-bar">
        <i class="ti ti-search"></i>
        <input type="search" id="prod-item-search" placeholder="搜尋成品加入..."
          oninput="searchItemsFor('production',this.value)" />
      </div>
      <div id="prod-item-search-result" style="display:none;"></div>
      <div class="order-list-header">
        <span class="order-list-title">生產品項</span>
        <span class="order-count" id="prod-item-count">${p.items.length} 項</span>
      </div>
      <div class="order-list" id="prod-item-list"></div>

      <div class="cust-field" style="margin-top:12px;">
        <label>完成期限</label>
        <input type="date" id="prod-deadline" value="${p.deadline||''}" />
      </div>
      <div class="cust-field">
        <label>備註</label>
        <textarea id="prod-remark" rows="2">${p.remark||''}</textarea>
      </div>
    </div>
    <button class="confirm-btn" onclick="confirmProdOrder()">
      <i class="ti ti-check"></i> 確認建立生產單
    </button>`;

  renderProdItems();
}

// ── 品項管理 ──
function addProductionItem(productId){
  const item = getItem(productId);
  if(!item) return;
  if(!_currentProd) return;
  const existing = _currentProd.items.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    _currentProd.items.push({ id:productId, name:item.name, emoji:item.emoji, qty:1 });
  }
  renderProdItems();
}

function removeProdItem(idx){ _currentProd.items.splice(idx,1); renderProdItems(); }
function changeProdItemQty(idx, delta){
  const item = _currentProd.items[idx];
  if(item) item.qty = Math.max(1, item.qty + delta);
  renderProdItems();
}

function renderProdItems(){
  const el    = document.getElementById('prod-item-list');
  const count = document.getElementById('prod-item-count');
  if(!el || !_currentProd) return;
  const items = _currentProd.items;
  if(count) count.textContent = items.length + ' 項';
  if(!items.length){
    el.innerHTML = `<div class="order-empty">尚未加入成品</div>`; return;
  }
  el.innerHTML = items.map((item, idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">${item.id}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeProdItemQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeProdItemQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeProdItem(${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

function collectProdForm(){
  if(!_currentProd) return;
  _currentProd.deadline = document.getElementById('prod-deadline')?.value || '';
  _currentProd.remark   = document.getElementById('prod-remark')?.value.trim() || '';
}

function saveProdDraft(){
  collectProdForm();
  upsertProdOrder();
  showToast('📝 生產單已儲存：' + _currentProd.no);
}

function confirmProdOrder(){
  if(!_currentProd.items.length){ showToast('⚠️ 請先加入成品'); return; }
  collectProdForm();
  const now = nowStr();
  if(!_currentProd.statusLog?.length){
    _currentProd.statusLog = [{
      status:'prepare', label:'備料中', time:now, note:'生產單建立'
    }];
  }
  _currentProd.status = 'prepare';
  upsertProdOrder();
  showToast('✅ 生產單已建立：' + _currentProd.no);
  showProdDetail(_currentProd.id);
}

function upsertProdOrder(){
  if(!_currentProd.id) _currentProd.id = 'PO' + Date.now();
  const idx  = productionOrders.findIndex(p => p.id === _currentProd.id);
  const copy = JSON.parse(JSON.stringify(_currentProd));
  if(idx >= 0) productionOrders[idx] = copy;
  else         productionOrders.push(copy);
  saveProdOrders();
  renderProductionList(_prodFilter);
}

// ── 生產單詳細 ──
function showProdDetail(id){
  const p = getProdOrder(id);
  if(!p) return;
  _currentProd = JSON.parse(JSON.stringify(p));
  renderProdDetailPage();
  showPage('production-detail');
}

function renderProdDetailPage(){
  const page = document.getElementById('page-production-detail');
  if(!page) return;
  const p    = _currentProd;
  const cust = getCustomer(p.customerId);
  const curIdx = stepIndex(p.status);
  const next   = nextStep(p.status);

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('production')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${p.no}</div>
    </div>

    <!-- 進度條 -->
    <div class="form-card">
      <div class="prod-progress-steps">
        ${PROD_STEPS.map((s, i) => `
          <div class="prod-step-col ${i <= curIdx ? 'active' : ''}">
            <div class="prod-step-circle"
              style="${i<=curIdx?`background:${s.color};border-color:${s.color}`:''}">
              <i class="ti ${s.icon}" style="color:${i<=curIdx?'white':'var(--text3)'}"></i>
            </div>
            <div class="prod-step-label"
              style="${i===curIdx?`color:${s.color};font-weight:700`:''}">
              ${s.label}${i===curIdx?' ←':''}
            </div>
          </div>
          ${i < PROD_STEPS.length-1
            ? `<div class="prod-step-line ${i<curIdx?'active':''}"></div>`
            : ''}`).join('')}
      </div>
    </div>

    <!-- 資訊 -->
    <div class="form-card" style="margin-top:8px;">
      ${cust ? `<div class="cust-info-row"><i class="ti ti-user"></i>${cust.name}</div>` : ''}
      ${p.sourceOrderNo ? `<div class="cust-info-row"><i class="ti ti-link"></i>來源訂單：${p.sourceOrderNo}</div>` : ''}
      ${p.deadline ? `<div class="cust-info-row"><i class="ti ti-calendar"></i>完成期限：${fmtDate(p.deadline)}</div>` : ''}
      ${p.remark   ? `<div class="cust-info-row"><i class="ti ti-notes"></i>${p.remark}</div>` : ''}
    </div>

    <!-- 品項 -->
    <div class="section-title" style="margin-top:12px;"><i class="ti ti-package"></i> 生產品項</div>
    ${(p.items||[]).map(item => {
      const bom = BOM[item.id] || [];
      return `<div class="inv-item" style="cursor:default;margin-bottom:6px;">
        <div class="inv-item-emoji">${item.emoji}</div>
        <div class="inv-item-info">
          <div class="inv-item-name">${item.name}</div>
          <div class="inv-item-id">${bom.length?`需要 ${bom.length} 種材料`:'無 BOM 設定'}</div>
        </div>
        <div class="inv-item-right">
          <div class="inv-qty ok" style="font-size:22px;">${item.qty}</div>
          <div class="inv-unit">個</div>
        </div>
      </div>`;
    }).join('') || '<div class="order-empty">無品項</div>'}

    <!-- 狀態推進按鈕 -->
    <div style="margin-top:14px;">
      ${next && p.status !== 'shipped' ? `
      <button class="confirm-btn" style="background:${next.color};"
        onclick="advanceProdStatus('${p.id}')">
        <i class="ti ${next.icon}"></i> 推進到「${next.label}」
      </button>` : ''}
      ${p.status === 'shipped' ? `
      <div style="text-align:center;padding:14px;color:var(--green);font-size:15px;font-weight:600;">
        <i class="ti ti-circle-check"></i> 此生產單已完成出貨
      </div>` : ''}
      ${isAdmin() ? `
      <button class="redit-btn" style="margin-top:8px;color:var(--red);border-color:var(--red);"
        onclick="requireAdmin(()=>hardDeleteProduction('${p.id}'),'永久刪除生產單需要管理員權限')">
        <i class="ti ti-trash"></i> 永久刪除生產單
      </button>` : ''}
    </div>

    <!-- 狀態記錄 -->
    <div class="section-title" style="margin-top:14px;"><i class="ti ti-history"></i> 狀態記錄</div>
    ${(p.statusLog||[]).slice().reverse().map(l => {
      const s = stepOf(l.status);
      return `<div class="inv-warn-row" style="cursor:default;">
        <div>
          <div style="font-size:14px;font-weight:600;">${s.label}</div>
          <div style="font-size:12px;color:var(--text3);">${l.note || ''}</div>
        </div>
        <div style="font-size:12px;color:var(--text3);">${l.time}</div>
      </div>`;
    }).join('') || '<div class="order-empty">尚無記錄</div>'}`;
}

// ── 推進製程狀態 ──
function advanceProdStatus(id){
  const p    = getProdOrder(id);
  if(!p) return;
  const next = nextStep(p.status);
  if(!next) return;
  const now  = nowStr();

  p.status = next.key;
  p.statusLog = p.statusLog || [];
  p.statusLog.push({ status:next.key, label:next.label, time:now, note:'' });

  let orderSynced = false;

  // 完成時：BOM 扣料，成品入庫，並同步訂單狀態
  if(next.key === 'done'){
    const locId = getMainLocation()?.id || 'store_A';
    p.items.forEach(item => {
      const bom = BOM[item.id] || [];
      bom.forEach(b => {
        adjustStock(b.materialId, locId, -(b.qty * item.qty), {
          op:'produce_deduct', refId:p.id, refType:'production',
          note:`生產 ${item.name} x${item.qty}`,
        });
      });
      adjustStock(item.id, locId, item.qty, {
        op:'produce', refId:p.id, refType:'production', note:'生產完成入庫',
      });
    });
    if(p.sourceOrderId){
      const ord = getOrder(p.sourceOrderId);
      if(ord && ord.status === 'producing'){
        ord.status    = 'ready';
        ord.updatedAt = todayStr();
        const oidx = orders.findIndex(o => o.id === ord.id);
        if(oidx >= 0) orders[oidx] = ord;
        saveOrders();
        orderSynced = true;
      }
    }
  }

  const idx = productionOrders.findIndex(po => po.id === p.id);
  if(idx >= 0) productionOrders[idx] = p;
  saveProdOrders();
  _currentProd = JSON.parse(JSON.stringify(p));
  renderProdDetailPage();
  renderProductionList(_prodFilter);
  if(next.key === 'done'){
    showToast('✅ 生產完成！成品已入庫' + (orderSynced ? '，訂單已更新為待出貨' : ''));
  } else {
    showToast(`✅ 狀態已更新為「${next.label}」`);
  }
}

// ── 管理員永久刪除生產單 ──
function hardDeleteProduction(id){
  if(!confirm('確定永久刪除此生產單？此操作無法復原。')) return;
  productionOrders = productionOrders.filter(p => p.id !== id);
  saveProdOrders();
  showToast('🗑️ 生產單已刪除');
  renderProductionList(_prodFilter);
  showPage('production');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderProductionList('all');
});
