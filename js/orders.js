// ============================================================
// orders.js — 正式訂單管理
// ============================================================

let orders = JSON.parse(localStorage.getItem('erp_orders') || '[]');

function saveOrders(){
  localStorage.setItem('erp_orders', JSON.stringify(orders));
  if(typeof pushToFirebase === 'function') pushToFirebase('orders', orders);
}

function getOrder(id){ return orders.find(o => o.id === id) || null; }

function genOrderNo(){
  return genNo('SO', orders, 'no');
}

// ── 訂單狀態 ──
const ORDER_STATUS = {
  pending:   { label:'待處理', cls:'badge-pending',   icon:'ti-clock' },
  producing: { label:'生產中', cls:'badge-active',    icon:'ti-player-play' },
  ready:     { label:'待出貨', cls:'badge-done',      icon:'ti-package' },
  shipped:   { label:'已出貨', cls:'badge-shipped',   icon:'ti-truck' },
  archived:  { label:'已結案', cls:'badge-archived',  icon:'ti-archive' },
};

const PAY_STATUS = {
  unpaid:  { label:'未收款',   cls:'pay-badge-unpaid' },
  partial: { label:'部分收款', cls:'pay-badge-partial' },
  paid:    { label:'已收款',   cls:'pay-badge-paid' },
};

// ── 訂單類型 ──
const ORDER_TYPE_CFG = {
  retail:  { label:'零售', icon:'ti-receipt',   color:'#BA7517', bg:'#FAEEDA' },
  project: { label:'專案', icon:'ti-briefcase', color:'#6B4FBB', bg:'#EDE9F8' },
};

function orderTypeBadge(type){
  const t = ORDER_TYPE_CFG[type] || ORDER_TYPE_CFG.project;
  return `<span style="font-size:11px;padding:2px 8px;border-radius:20px;
    background:${t.bg};color:${t.color};font-weight:600;white-space:nowrap;">
    <i class="ti ${t.icon}"></i> ${t.label}
  </span>`;
}

function orderStatusBadge(status){
  const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return `<span class="status-badge ${s.cls}"><i class="ti ${s.icon}"></i> ${s.label}</span>`;
}

function payStatusBadge(status){
  const s = PAY_STATUS[status] || PAY_STATUS.unpaid;
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── 列表 ──
let _orderFilter     = 'all';
let _orderTypeFilter = 'all';  // 'all' | 'retail' | 'project'

function renderOrderList(filter, typeFilter){
  _orderFilter     = filter     || _orderFilter     || 'all';
  _orderTypeFilter = typeFilter || _orderTypeFilter || 'all';

  // 狀態 tabs
  document.querySelectorAll('#page-orders .ftab').forEach((btn, i) => {
    const filters = ['all','pending','producing','ready','shipped','archived'];
    btn.classList.toggle('active', filters[i] === _orderFilter);
  });

  // 類型篩選（動態插入一次）
  _ensureOrderTypeBar();
  document.querySelectorAll('#order-type-bar .type-ftab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === _orderTypeFilter);
  });

  const el = document.getElementById('order-list');
  if(!el) return;

  let list = _orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === _orderFilter);

  if(_orderTypeFilter !== 'all'){
    list = list.filter(o => (o.orderType || 'project') === _orderTypeFilter);
  }

  list = list.slice().reverse();

  if(!list.length){
    el.innerHTML = `<div class="order-empty">沒有符合的訂單</div>`;
    return;
  }

  el.innerHTML = list.map(o => {
    const cust     = getCustomer(o.customerId);
    const itemsStr = (o.items||[]).slice(0,2).map(i=>i.name).join('、')
      + ((o.items||[]).length > 2 ? ` 等${o.items.length}項` : '');
    return `<div class="list-card" onclick="showOrderDetail('${o.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${o.no}</span>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${orderTypeBadge(o.orderType || 'project')}
          ${orderStatusBadge(o.status)}
          ${payStatusBadge(o.payStatus)}
        </div>
      </div>
      <div class="list-card-meta">
        ${cust ? `<span><i class="ti ti-user"></i>${cust.name}</span>` : ''}
        <span><i class="ti ti-calendar"></i>${fmtDate(o.createdAt)}</span>
        ${o.deliveryDate ? `<span><i class="ti ti-clock"></i>交期 ${fmtDate(o.deliveryDate)}</span>` : ''}
        ${o.estimateRef  ? `<span><i class="ti ti-link"></i>${o.estimateRef}</span>` : ''}
      </div>
      <div class="list-card-items">${itemsStr || '無品項'}</div>
      <div class="list-card-footer">
        <span class="list-card-amount">${fmtMoney(o.totalAmount)}</span>
        <span style="font-size:12px;color:var(--text3);">${deliveryLabel(o.delivery)}</span>
      </div>
    </div>`;
  }).join('');
}

function _ensureOrderTypeBar(){
  if(document.getElementById('order-type-bar')) return;
  const bar = document.createElement('div');
  bar.id        = 'order-type-bar';
  bar.style.cssText = 'display:flex;gap:6px;padding:0 4px 8px;';
  bar.innerHTML = `
    <button class="type-ftab active" data-type="all"
      onclick="renderOrderList(null,'all')"
      style="font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid var(--border);
      background:var(--surface);color:var(--text2);cursor:pointer;">全部類型</button>
    <button class="type-ftab" data-type="retail"
      onclick="renderOrderList(null,'retail')"
      style="font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid #FAEEDA;
      background:var(--bg);color:#BA7517;cursor:pointer;">
      <i class="ti ti-receipt"></i> 零售</button>
    <button class="type-ftab" data-type="project"
      onclick="renderOrderList(null,'project')"
      style="font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid #EDE9F8;
      background:var(--bg);color:#6B4FBB;cursor:pointer;">
      <i class="ti ti-briefcase"></i> 專案</button>`;
  const orderList = document.getElementById('order-list');
  if(orderList) orderList.before(bar);
}

// ── 從估價單建立訂單（固定為專案類型）──
function newOrderFromEstimate(estimate){
  const o = {
    id:          null,
    no:          genOrderNo(),
    orderType:   'project',
    source:      'phone',
    estimateRef: estimate.no,
    estimateId:  estimate.id,
    customerId:  estimate.customerId,
    items:       estimate.items.map(i => ({
      id:            i.id,
      name:          i.name,
      emoji:         i.emoji,
      qty:           i.qty,
      originalPrice: i.originalPrice,
      unitPrice:     i.unitPrice,
      discount:      i.discount || null,
      shippedQty:    0,
      producedQty:   0,
    })),
    subtotal:      estimate.subtotal,
    totalAmount:   estimate.total,
    orderDiscount: estimate.discount,
    deposit:       0,
    depositPaid:   false,
    paidAmount:    0,
    payStatus:     'unpaid',
    delivery:      estimate.delivery,
    logistics:     '',
    trackingNo:    '',
    deliveryDate:  '',
    shippedAt:     '',
    remark:        estimate.remark || '',
    status:        'pending',
    createdAt:     todayStr(),
    updatedAt:     todayStr(),
  };

  _currentOrder = o;

  // 注意：此處「不」提前儲存估價單狀態
  // 原因：訂單此時尚無 id 也未寫入 localStorage，若使用者中途離開，
  //       估價單會永遠停在 'converted' 但對應訂單不存在，形成孤兒資料。
  // 正確做法：等 upsertOrder() 將訂單存入後，再由 upsertOrder() 內部
  //           更新估價單的 convertedOrderId，同步呼叫 saveEstimates()。
  // 這裡只在記憶體暫存，不呼叫 saveEstimates()。
  const est = typeof estimates !== 'undefined' ? estimates.find(e => e.id === estimate.id) : null;
  if(est){
    est.status           = 'converted';
    est.convertedOrderId = null; // 佔位，upsertOrder() 執行後才會填入真正的 id
    est.convertedOrderNo = o.no;
    // 不在這裡呼叫 saveEstimates()，避免訂單未存入就先標記估價單
  }

  renderOrderEditPage();
  showPage('order-edit');
}

// ── 手動新增訂單：先選類型 ──
function newOrder(){
  const existing = document.getElementById('orderTypeModal');
  if(existing) existing.remove();
  const modal = document.createElement('div');
  modal.className     = 'modal-overlay';
  modal.id            = 'orderTypeModal';
  modal.style.display = 'flex';
  modal.onclick = e => { if(e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-card" style="max-width:340px;">
      <div class="modal-title"><i class="ti ti-plus"></i> 新增訂單</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:14px;">請選擇訂單類型</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;">
        <button onclick="document.getElementById('orderTypeModal').remove();_createNewOrder('retail')"
          style="padding:18px 12px;border-radius:var(--radius);border:2px solid #FAEEDA;
          background:#FFFDF7;color:#7B341E;cursor:pointer;text-align:center;">
          <i class="ti ti-receipt" style="font-size:28px;display:block;margin-bottom:6px;color:#BA7517;"></i>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">零售訂單</div>
          <div style="font-size:11px;color:#975A16;">電話/門市接單<br>現貨出貨</div>
        </button>
        <button onclick="document.getElementById('orderTypeModal').remove();_createNewOrder('project')"
          style="padding:18px 12px;border-radius:var(--radius);border:2px solid #EDE9F8;
          background:#F9F7FE;color:#44337A;cursor:pointer;text-align:center;">
          <i class="ti ti-briefcase" style="font-size:28px;display:block;margin-bottom:6px;color:#6B4FBB;"></i>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">專案接單</div>
          <div style="font-size:11px;color:#553C9A;">客製/大宗/禮盒<br>需生產或交期</div>
        </button>
      </div>
      <button class="modal-cancel-btn" style="margin-top:10px;width:100%;"
        onclick="document.getElementById('orderTypeModal').remove()">取消</button>
    </div>`;
  document.body.appendChild(modal);
}

function _createNewOrder(type){
  _currentOrder = {
    id:            null,
    no:            genOrderNo(),
    orderType:     type,
    source:        'phone',
    estimateRef:   '',
    estimateId:    null,
    customerId:    null,
    items:         [],
    subtotal:      0,
    totalAmount:   0,
    orderDiscount: { type:'none', value:0 },
    deposit:       0,
    depositPaid:   false,
    paidAmount:    0,
    payStatus:     'unpaid',
    delivery:      type === 'retail' ? 'pickup' : 'delivery',
    logistics:     '',
    trackingNo:    '',
    deliveryDate:  '',
    shippedAt:     '',
    remark:        '',
    status:        'pending',
    createdAt:     todayStr(),
    updatedAt:     todayStr(),
  };
  renderOrderEditPage();
  showPage('order-edit');
}

// ── 訂單編輯頁 ──
let _currentOrder = null;

function renderOrderEditPage(){
  const page = document.getElementById('page-order-edit');
  if(!page) return;
  const o        = _currentOrder;
  const cust     = getCustomer(o.customerId);
  const isRetail = (o.orderType || 'project') === 'retail';
  const isLocked     = o.status === 'archived' && !isManager();
  const isItemLocked = o.status !== 'pending' && !isAdmin();  // 確認後品項鎖定，管理員可解
  // 管理員強制編輯中（非草稿狀態）
  const adminOverride = isAdmin() && o.status !== 'pending';

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('orders')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${o.id ? o.no : '新增訂單'}</div>
      ${!isLocked
        ? `<button class="small-btn green-btn" onclick="saveOrderDraft()">
             <i class="ti ti-device-floppy"></i> 儲存
           </button>`
        : `<span class="status-badge badge-archived" style="font-size:12px;">
             <i class="ti ti-lock"></i> 已結案
           </span>`}
    </div>

    ${adminOverride ? `
    <div style="padding:8px 12px;background:#FFF3CD;border-radius:var(--radius-sm);
      font-size:12px;color:#856404;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
      <i class="ti ti-shield-lock"></i> 管理員覆寫模式 — 所有欄位與品項均可修改
    </div>` : ''}

    <div class="form-card">
      <!-- 單號 / 類型 -->
      <div class="form-meta-row">
        <span class="form-no">${o.no}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${orderTypeBadge(o.orderType || 'project')}
          <span class="form-date">${fmtDate(o.createdAt)}</span>
        </div>
      </div>
      ${o.estimateRef ? `
      <div style="padding:8px 12px;background:var(--purple-light);border-radius:var(--radius-sm);
        font-size:13px;color:var(--purple);margin-bottom:10px;
        display:flex;align-items:center;gap:6px;cursor:pointer;"
        onclick="openEstimateById('${o.estimateId}')">
        <i class="ti ti-link"></i> 來源估價單：${o.estimateRef}
        <i class="ti ti-chevron-right" style="margin-left:auto;"></i>
      </div>` : ''}

      <!-- 訂單來源 -->
      <div class="cust-field">
        <label>訂單來源</label>
        <select id="ord-source" ${isLocked?'disabled':''}>
          <option value="phone"  ${o.source==='phone'  ?'selected':''}>電話</option>
          <option value="online" ${o.source==='online' ?'selected':''}>網路</option>
          <option value="walkin" ${o.source==='walkin' ?'selected':''}>門市</option>
        </select>
      </div>

      <!-- 客戶 -->
      <div class="form-section-title">客戶</div>
      <button class="customer-select-btn" ${isLocked?'disabled':''}
        onclick="openCustomerPicker('order')">
        <i class="ti ti-user"></i>
        <span id="ord-customer-name">${cust ? cust.name : '選擇客戶'}</span>
        <i class="ti ti-chevron-right" style="margin-left:auto;"></i>
      </button>
      ${cust ? `<div class="customer-info-box" style="margin-top:6px;">
        ${[cust.contact?`👤 ${cust.contact}`:'', cust.tel?`📞 ${cust.tel}`:''].filter(Boolean).join('<br>')}
      </div>` : ''}

      <!-- 品項 -->
      <div class="form-section-title" style="margin-top:14px;">品項</div>
      ${!isItemLocked ? `<div class="search-bar">
        <i class="ti ti-search"></i>
        <input type="search" id="order-item-search" placeholder="搜尋商品加入..."
          oninput="searchItemsFor('order',this.value)" />
      </div>
      <div id="order-item-search-result" style="display:none;"></div>` : `
      <div style="padding:8px 12px;background:var(--amber-light);border-radius:var(--radius-sm);
        font-size:12px;color:var(--amber);display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <i class="ti ti-lock"></i> 訂單已確認，品項與金額已鎖定。如需修改請聯絡管理員。
      </div>`}
      <div class="order-list-header">
        <span class="order-list-title">品項清單</span>
        <span class="order-count" id="ord-item-count">${o.items.length} 項</span>
      </div>
      <div class="order-list" id="ord-item-list"></div>

      <!-- 金額 -->
      <div class="form-section-title" style="margin-top:14px;">金額</div>
      <div class="amount-section">
        <div class="amount-row"><span>小計</span><span id="ord-subtotal">${fmtMoney(o.subtotal)}</span></div>
        <div class="amount-row discount-row">
          <span>整單折扣</span>
          <div class="discount-ctrl">
            <select id="ord-discount-type" ${isItemLocked||isLocked?'disabled':''} onchange="calcOrderTotal()">
              <option value="none"    ${o.orderDiscount?.type==='none'   ?'selected':''}>無折扣</option>
              <option value="percent" ${o.orderDiscount?.type==='percent'?'selected':''}>% 折扣</option>
              <option value="amount"  ${o.orderDiscount?.type==='amount' ?'selected':''}>$ 折抵</option>
            </select>
            <input type="number" id="ord-discount-value"
              value="${o.orderDiscount?.value||0}" min="0"
              ${isItemLocked||isLocked?'disabled':''} onchange="calcOrderTotal()"
              style="width:70px;" />
          </div>
        </div>
        <div class="amount-row grand">
          <span>訂單總金額</span><strong id="ord-total">${fmtMoney(o.totalAmount)}</strong>
        </div>
      </div>

      <!-- 付款 -->
      <div class="form-section-title" style="margin-top:14px;">付款</div>
      <div class="amount-section">
        ${!isRetail ? `
        <div class="amount-row">
          <span>訂金</span>
          <input type="number" id="ord-deposit" value="${o.deposit||0}" min="0"
            ${isLocked?'disabled':''} onchange="updateOrderPay()"
            style="width:100px;padding:5px 8px;font-size:15px;border:1px solid var(--border);
            border-radius:6px;text-align:right;background:var(--bg);color:var(--text);" />
        </div>
        <div class="amount-row">
          <span>訂金已收</span>
          <label style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="ord-deposit-paid" ${o.depositPaid?'checked':''}
              ${isLocked?'disabled':''} onchange="updateOrderPay()" />
            <span>已收</span>
          </label>
        </div>` : ''}
        <div class="amount-row">
          <span>付款狀態</span>
          <div style="display:flex;gap:6px;">
            ${['unpaid','partial','paid'].map(ps => {
              const labels = { unpaid:'未收款', partial:'部分收款', paid:'已收款' };
              return `<button class="pay-status-btn ${o.payStatus===ps?'active':''}"
                id="ord-pay-${ps}" ${isLocked?'disabled':''}
                onclick="setOrderPayStatus('${ps}')">
                ${labels[ps]}
              </button>`;
            }).join('')}
          </div>
        </div>
        <div id="ord-partial-row" style="display:${o.payStatus==='partial'?'flex':'none'};"
          class="amount-row">
          <span>已收金額</span>
          <input type="number" id="ord-paid-amount" value="${o.paidAmount||0}" min="0"
            ${isLocked?'disabled':''}
            style="width:100px;padding:5px 8px;font-size:15px;border:1px solid var(--border);
            border-radius:6px;text-align:right;background:var(--bg);color:var(--text);" />
        </div>
      </div>

      <!-- 出貨資訊 -->
      <div class="form-section-title" style="margin-top:14px;">出貨資訊</div>
      <div class="delivery-btns">
        <button class="delivery-btn ${o.delivery==='pickup'  ?'active':''}"
          id="ord-dm-pickup"   ${isLocked?'disabled':''} onclick="setOrderDelivery('pickup')">
          <i class="ti ti-walk"></i> 自取
        </button>
        <button class="delivery-btn ${o.delivery==='delivery'?'active':''}"
          id="ord-dm-delivery" ${isLocked?'disabled':''} onclick="setOrderDelivery('delivery')">
          <i class="ti ti-truck"></i> 宅配
        </button>
        <button class="delivery-btn ${o.delivery==='personal'?'active':''}"
          id="ord-dm-personal" ${isLocked?'disabled':''} onclick="setOrderDelivery('personal')">
          <i class="ti ti-user-check"></i> 親送
        </button>
      </div>
      <div class="cust-field" style="margin-top:10px;">
        <label>客戶要求交期</label>
        <input type="date" id="ord-delivery-date" value="${o.deliveryDate||''}"
          ${isLocked?'disabled':''} />
      </div>
      <div class="cust-field">
        <label>物流平台</label>
        <input type="text" id="ord-logistics" value="${o.logistics||''}"
          placeholder="黑貓 / 7-11 / 蝦皮 / 郵局..."
          ${isLocked?'disabled':''} />
      </div>
      <div class="cust-field">
        <label>物流單號</label>
        <input type="text" id="ord-tracking" value="${o.trackingNo||''}"
          placeholder="填入物流追蹤單號..."
          ${isLocked?'disabled':''} />
      </div>
      <div class="cust-field">
        <label>備註</label>
        <textarea id="ord-remark" rows="2" ${isLocked?'disabled':''}>${o.remark||''}</textarea>
      </div>
    </div>

    <!-- 生產單連結（僅專案訂單）-->
    ${!isRetail ? (() => {
      const relProd = typeof productionOrders !== 'undefined'
        ? productionOrders.filter(p => p.sourceOrderId === o.id)
        : [];
      if(!relProd.length) return '';
      return `<div class="section-title" style="margin-top:14px;">
        <i class="ti ti-player-play"></i> 相關生產單
      </div>` + relProd.map(p => {
        const step = typeof stepOf === 'function' ? stepOf(p.status) : {label:p.status,color:'#666',bg:'#eee'};
        return `<div class="inv-warn-row" onclick="showProdDetail('${p.id}')">
          <div>
            <div style="font-size:14px;font-weight:600;">${p.no}</div>
            <div style="font-size:12px;color:var(--text3);">${(p.items||[]).map(i=>i.name).join('、')}</div>
          </div>
          <span class="status-badge" style="background:${step.bg};color:${step.color};">
            ${step.label}
          </span>
        </div>`;
      }).join('');
    })() : ''}

    <!-- 操作按鈕 -->
    ${o.status === 'pending' ? `
    <button class="confirm-btn" style="background:var(--purple);margin-top:8px;"
      onclick="confirmOrder()">
      <i class="ti ti-check"></i> 確認訂單
    </button>` : ''}
    ${o.status === 'ready' ? `
    <button class="confirm-btn" style="background:var(--green);margin-top:8px;"
      onclick="shipOrder('${o.id}')">
      <i class="ti ti-truck"></i> 標記出貨
    </button>` : ''}
    ${o.status === 'shipped' ? `
    <button class="confirm-btn" style="background:#185FA5;margin-top:8px;"
      onclick="archiveOrder('${o.id}')">
      <i class="ti ti-archive"></i> 結案
    </button>` : ''}
    ${isLocked && isManager() ? `
    <button class="redit-btn" style="margin-top:8px;"
      onclick="requireManager(()=>forceUnlockOrder('${o.id}'),'解鎖訂單需要主管權限')">
      <i class="ti ti-lock-open"></i> 主管解鎖訂單
    </button>` : ''}
    ${!isLocked && isManager() ? `
    <button class="redit-btn" style="margin-top:8px;color:var(--amber);border-color:var(--amber);"
      onclick="requireManager(()=>cancelOrder('${o.id}'),'取消訂單需要主管權限')">
      <i class="ti ti-ban"></i> 取消訂單（保留記錄）
    </button>` : ''}
    ${isAdmin() ? `
    <button class="redit-btn" style="margin-top:8px;color:var(--red);border-color:var(--red);"
      onclick="requireAdmin(()=>hardDeleteOrder('${o.id}'))">
      <i class="ti ti-trash"></i> 永久刪除訂單
    </button>` : ''}`;

  renderOrderItems();
}

// ── 客戶選擇（給 order）──
function selectCustomerForOrder(id){
  if(!_currentOrder) return;
  _currentOrder.customerId = id;
  renderOrderEditPage();
}

// ── 品項管理 ──
function addOrderItem(productId){
  const item = getItem(productId);
  if(!item) return;
  const existing = _currentOrder.items.find(i => i.id === productId);
  if(existing){ existing.qty++; }
  else {
    const price = item.salePrice || 0;
    _currentOrder.items.push({
      id:            productId,
      name:          item.name,
      emoji:         item.emoji,
      qty:           1,
      originalPrice: price,
      unitPrice:     price,
      discount:      null,
      shippedQty:    0,
      producedQty:   0,
    });
    if(!price){
      showToast('⚠️ 此品項尚未設定售價，請手動填入單價');
    }
  }
  renderOrderItems();
  calcOrderTotal();
}

function removeOrderItem(idx){
  _currentOrder.items.splice(idx, 1);
  renderOrderItems();
  calcOrderTotal();
}

function changeOrderItemQty(idx, delta){
  const item = _currentOrder.items[idx];
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderOrderItems();
  calcOrderTotal();
}

function changeOrderItemPrice(idx, val){
  const item  = _currentOrder.items[idx];
  if(!item) return;
  item.unitPrice = parseInt(val) || 0;
  item.discount  = item.unitPrice !== item.originalPrice
    ? { type:'item', value: item.originalPrice - item.unitPrice, reason:'手動改價' }
    : null;
  calcOrderTotal();
}

function renderOrderItems(){
  const el    = document.getElementById('ord-item-list');
  const count = document.getElementById('ord-item-count');
  if(!el || !_currentOrder) return;
  const items        = _currentOrder.items;
  const isLocked     = _currentOrder.status === 'archived' && !isManager();
  const isItemLocked = _currentOrder.status !== 'pending' && !isAdmin();
  if(count) count.textContent = items.length + ' 項';
  if(!items.length){
    el.innerHTML = `<div class="order-empty">尚未加入品項</div>`;
    return;
  }
  el.innerHTML = items.map((item, idx) => {
    const isDis = item.unitPrice !== item.originalPrice;
    return `<div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="display:flex;align-items:center;gap:6px;">
          ${isDis?`<span style="text-decoration:line-through;color:var(--text3);font-size:11px;">$${item.originalPrice}</span>`:''}
          ${isLocked
            ? `<span style="font-weight:700;${item.unitPrice===0?'color:var(--red);':''}">${item.unitPrice===0?'⚠️ ':''}$${item.unitPrice}</span>`
            : `<input type="number" class="unit-price-input ${isDis?'discounted':''}"
                value="${item.unitPrice}" min="0"
                style="${(!item.unitPrice && item.unitPrice!==undefined)?'border-color:var(--amber);background:#FFFBF0;':''}"
                onchange="changeOrderItemPrice(${idx},this.value)"
                onclick="this.select()" title="${!item.unitPrice?'尚未設定售價，請填入':''}" />`}
        </div>
      </div>
      <div class="qty-ctrl">
        ${isLocked||isItemLocked
          ? `<span class="qty-num">${item.qty}</span>`
          : `<button class="qty-btn" onclick="changeOrderItemQty(${idx},-1)">−</button>
             <span class="qty-num">${item.qty}</span>
             <button class="qty-btn" onclick="changeOrderItemQty(${idx},1)">＋</button>`}
      </div>
      ${isLocked||isItemLocked ? '' : `<button class="order-del" onclick="removeOrderItem(${idx})"><i class="ti ti-x"></i></button>`}
    </div>`;
  }).join('');
}

// ── 計算金額 ──
function calcOrderTotal(){
  if(!_currentOrder) return;
  const subtotal  = _currentOrder.items.reduce((s,i) => s + i.unitPrice * i.qty, 0);
  const discType  = document.getElementById('ord-discount-type')?.value  || 'none';
  let discValue   = parseInt(document.getElementById('ord-discount-value')?.value) || 0;

  // 百分比折扣限制在 0~100 之間，避免輸入超過 100% 導致訂單總金額變成負數
  if(discType === 'percent') discValue = Math.min(100, Math.max(0, discValue));

  let total       = subtotal;
  if(discType === 'percent') total = Math.round(subtotal * (1 - discValue/100));
  if(discType === 'amount')  total = Math.max(0, subtotal - discValue);

  _currentOrder.subtotal      = subtotal;
  _currentOrder.totalAmount   = total;
  _currentOrder.orderDiscount = { type: discType, value: discValue };

  const subEl   = document.getElementById('ord-subtotal');
  const totalEl = document.getElementById('ord-total');
  if(subEl)   subEl.textContent   = fmtMoney(subtotal);
  if(totalEl) totalEl.textContent = fmtMoney(total);
}

// ── 付款狀態 ──
function setOrderPayStatus(status){
  if(!_currentOrder) return;

  // 更新記憶體中的付款狀態
  _currentOrder.payStatus = status;

  // 更新 DOM：切換三個按鈕的 active 樣式
  ['unpaid','partial','paid'].forEach(s => {
    document.getElementById(`ord-pay-${s}`)?.classList.toggle('active', s === status);
  });

  // 控制「已收金額」欄位的顯示（只有「部分收款」才顯示）
  const partialRow = document.getElementById('ord-partial-row');
  if(partialRow) partialRow.style.display = status === 'partial' ? 'flex' : 'none';

  // 立即持久化到 localStorage / Firebase，避免使用者未按儲存就離頁而遺失狀態
  // 注意：若訂單尚未建立（id 為 null），upsertOrder() 會自動產生 id 並新增到陣列
  // upsertOrder() 使用記憶體中的 _currentOrder，不從 DOM 讀取，不會覆蓋未填完的欄位
  if(_currentOrder.id){
    // 已存在的訂單：直接更新陣列中的那筆，再儲存
    const idx = orders.findIndex(o => o.id === _currentOrder.id);
    if(idx >= 0){
      orders[idx].payStatus  = status;
      orders[idx].updatedAt  = todayStr();
      _currentOrder.updatedAt = todayStr();
      saveOrders();
    }
  }
  // 新訂單尚未儲存時（id 為 null）不自動建立，讓使用者按「儲存」時一併存入
  // 這樣可避免產生不完整的草稿訂單

  showToast('💳 付款狀態已更新');
}

function updateOrderPay(){
  if(!_currentOrder) return;
  _currentOrder.deposit      = parseInt(document.getElementById('ord-deposit')?.value) || 0;
  _currentOrder.depositPaid  = document.getElementById('ord-deposit-paid')?.checked || false;
}

// ── 送貨方式 ──
function setOrderDelivery(method){
  if(!_currentOrder) return;
  _currentOrder.delivery = method;
  ['pickup','delivery','personal'].forEach(m =>
    document.getElementById(`ord-dm-${m}`)?.classList.toggle('active', m === method));
}

// ── 收集表單資料 ──
function collectOrderForm(){
  if(!_currentOrder) return;
  _currentOrder.source       = document.getElementById('ord-source')?.value       || 'phone';
  _currentOrder.deliveryDate = document.getElementById('ord-delivery-date')?.value || '';
  _currentOrder.logistics    = document.getElementById('ord-logistics')?.value.trim()    || '';
  _currentOrder.trackingNo   = document.getElementById('ord-tracking')?.value.trim()     || '';
  _currentOrder.remark       = document.getElementById('ord-remark')?.value.trim()       || '';
  _currentOrder.paidAmount   = parseInt(document.getElementById('ord-paid-amount')?.value) || 0;
  _currentOrder.updatedAt    = todayStr();
  calcOrderTotal();
  updateOrderPay();
}

// ── 儲存 ──
function upsertOrder(){
  if(!_currentOrder.id) _currentOrder.id = 'O' + Date.now();
  const idx = orders.findIndex(o => o.id === _currentOrder.id);
  const copy = JSON.parse(JSON.stringify(_currentOrder));
  if(idx >= 0) orders[idx] = copy;
  else         orders.push(copy);
  saveOrders();
  renderOrderList(_orderFilter);

  // 回頭更新對應估價單的 convertedOrderId（確保連結正確）
  if(_currentOrder.estimateId && typeof estimates !== 'undefined'){
    const est = estimates.find(e => e.id === _currentOrder.estimateId);
    if(est && est.status === 'converted' && !est.convertedOrderId){
      est.convertedOrderId = _currentOrder.id;
      est.convertedOrderNo = _currentOrder.no;
      if(typeof saveEstimates === 'function') saveEstimates();
    }
  }
}

function saveOrderDraft(){
  collectOrderForm();
  upsertOrder();
  showToast('📝 訂單已儲存：' + _currentOrder.no);
}

function confirmOrder(){
  if(!_currentOrder.customerId){ showToast('⚠️ 請先選擇客戶'); return; }
  if(!_currentOrder.items.length){ showToast('⚠️ 請先加入品項'); return; }
  if(_currentOrder.id){
    const existing = getOrder(_currentOrder.id);
    if(existing && existing.status !== 'pending'){
      showToast('⚠️ 此訂單已確認，請勿重複操作'); return;
    }
  }
  collectOrderForm();

  // 零售訂單：不做庫存生產檢查，直接進待出貨
  if((_currentOrder.orderType || 'project') === 'retail'){
    _currentOrder.status = 'ready';
    upsertOrder();
    showToast('✅ 零售訂單已確認，進入待出貨：' + _currentOrder.no);
    showOrderDetail(_currentOrder.id);
    return;
  }

  // 專案訂單：① 先算庫存缺口，不存檔
  const locId = getMainLocation()?.id || 'store_A';
  const needProduction = _currentOrder.items
    .map(item => {
      const stock = getStock(item.id, locId);
      return stock < item.qty
        ? { ...item, stock, produceQty: item.qty - stock }
        : null;
    })
    .filter(Boolean);

  if(needProduction.length){
    // ② 有缺料 → 顯示 Modal 讓使用者確認再動作
    _showConfirmProductionModal(_currentOrder, needProduction);
  } else {
    // ③ 全部現貨 → 直接存一次，進待出貨
    _currentOrder.status = 'ready';
    upsertOrder();
    showToast('✅ 現貨充足，訂單進入待出貨：' + _currentOrder.no);
    showOrderDetail(_currentOrder.id);
  }
}

// ── 缺料確認 Modal ──
function _showConfirmProductionModal(order, needProduction){
  const existing = document.getElementById('confirmProdModal');
  if(existing) existing.remove();

  const rows = needProduction.map(i => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:8px 12px;border-bottom:1px solid var(--border);font-size:13px;">
      <span>${i.emoji} ${i.name}</span>
      <span style="color:var(--red);font-weight:600;">
        需 ${i.qty}，現貨 ${i.stock}，缺 <strong>${i.produceQty}</strong>
      </span>
    </div>`).join('');

  const modal = document.createElement('div');
  modal.className    = 'modal-overlay';
  modal.id           = 'confirmProdModal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-card" style="max-width:380px;">
      <div class="modal-title" style="color:var(--amber);">
        <i class="ti ti-alert-triangle"></i> 庫存不足，需建立生產單
      </div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:10px;">
        以下 ${needProduction.length} 項商品庫存不足，確認後將自動建立生產單：
      </div>
      <div style="border:1px solid var(--border);border-radius:var(--radius-sm);
        margin-bottom:14px;overflow:hidden;">
        ${rows}
      </div>
      <div class="modal-actions">
        <button class="modal-ok-btn" style="background:var(--amber);"
          onclick="_doConfirmWithProduction()">
          <i class="ti ti-player-play"></i> 確認並建立生產單
        </button>
        <button class="modal-cancel-btn"
          onclick="document.getElementById('confirmProdModal').remove()">
          取消
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // 暫存待確認的缺料清單
  modal._needProduction = needProduction;
}

function _doConfirmWithProduction(){
  const modal = document.getElementById('confirmProdModal');
  if(!modal) return;
  const needProduction = modal._needProduction || [];
  modal.remove();

  // ④ 確認後只存一次，設最終狀態
  _currentOrder.status = 'producing';
  upsertOrder();
  if(typeof newProductionFromOrder === 'function'){
    newProductionFromOrder(_currentOrder, needProduction);
  }
  showToast(`🏭 已建立生產單（${needProduction.length} 項不足），訂單進入生產中`);
  showOrderDetail(_currentOrder.id);
}

// ── 出貨 ──
function shipOrder(id){
  const o = getOrder(id) || _currentOrder;
  if(!o) return;
  if(!confirm(`確定出貨訂單 ${o.no}？\n出貨後將扣除 A 門市庫存。`)) return;

  const locId = getMainLocation()?.id || 'store_A';
  const now   = nowStr();

  // 扣庫存，並補寫一筆含 amount 的 order_ship 銷售 log
  // 說明：adjustStock() 內部寫入的 log 主要記錄庫存異動（before/after/qty），
  //       但缺少 amount 欄位。報表查 SALE_OPS（含 order_ship）計算銷售額時
  //       會讀取 l.amount，所以需要額外呼叫 addLog 補一筆帶金額的銷售記錄。
  o.items.forEach(item => {
    adjustStock(item.id, locId, -item.qty, {
      op:      'order_ship',
      refId:   o.id,
      refType: 'order',
      note:    `訂單出貨 ${o.no}`,
    });

    // 補寫銷售 log，供報表正確累計訂單出貨金額
    addLog({
      op:          'order_ship',
      productId:   item.id,
      productName: item.name,
      qty:         item.qty,
      unitPrice:   item.unitPrice,
      amount:      item.unitPrice * item.qty, // 報表需要的金額欄位
      refId:       o.id,
      refType:     'order',
      note:        `訂單出貨 ${o.no}`,
    });

    item.shippedQty = item.qty;
  });

  o.status    = 'shipped';
  o.shippedAt = now;
  o.updatedAt = todayStr();

  const idx = orders.findIndex(ord => ord.id === o.id);
  if(idx >= 0) orders[idx] = o;
  saveOrders();
  renderOrderList(_orderFilter);
  showToast('🚚 出貨完成：' + o.no);
  showOrderDetail(o.id);
}

// ── 結案（付款完成 + 已出貨）──
function archiveOrder(id){
  const o = getOrder(id) || _currentOrder;
  if(!o) return;
  if(o.payStatus !== 'paid'){
    if(!confirm('款項尚未全數收到，確定結案？')) return;
  }
  o.status    = 'archived';
  o.updatedAt = todayStr();
  const idx = orders.findIndex(ord => ord.id === o.id);
  if(idx >= 0) orders[idx] = o;
  saveOrders();
  showToast('✅ 訂單已結案：' + o.no);
  renderOrderList(_orderFilter);
  showPage('orders');
}

// ── 訂單詳細頁 ──
function showOrderDetail(id){
  const o = getOrder(id);
  if(!o) return;
  _currentOrder = JSON.parse(JSON.stringify(o));
  renderOrderEditPage();
  showPage('order-edit');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderOrderList('all');
});

// ── 主管解鎖訂單（可修改已結案訂單）──
function forceUnlockOrder(id){
  const o = getOrder(id);
  if(!o) return;
  if(!confirm(`確定解鎖訂單 ${o.no}？\n解鎖後可以修改資料，修改完請重新結案。`)) return;
  o.status    = 'shipped'; // 退回到已出貨狀態
  o.updatedAt = todayStr();
  const idx   = orders.findIndex(ord => ord.id === o.id);
  if(idx >= 0) orders[idx] = o;
  saveOrders();
  _currentOrder = JSON.parse(JSON.stringify(o));
  renderOrderEditPage();
  showToast('🔓 訂單已解鎖，可進行修改');
}

// ── 主管取消訂單 ──
function cancelOrder(id){
  const o = getOrder(id || _currentOrder?.id);
  if(!o) return;

  // 若訂單正在生產中，提醒使用者手動關閉生產單
  // 不自動取消生產單，因為生產單可能已部分完成，自動取消容易誤刪生產進度
  if(o.status === 'producing'){
    if(!confirm('此訂單有進行中的生產單，取消後請手動關閉生產單。\n確定要取消訂單嗎？')) return;
  }

  if(!confirm(`確定取消訂單 ${o.no}？\n此操作無法復原。`)) return;
  // 如果已出貨，歸還庫存
  if(o.status === 'shipped'){
    const locId = getMainLocation()?.id || 'store_A';
    o.items.forEach(item => {
      adjustStock(item.id, locId, item.shippedQty || 0, {
        op:'stock_in', refId:o.id, refType:'order_cancel', note:`取消訂單歸還 ${o.no}`
      });
    });
  }
  o.status    = 'archived';
  o.cancelled = true;
  o.updatedAt = todayStr();
  const idx   = orders.findIndex(ord => ord.id === o.id);
  if(idx >= 0) orders[idx] = o;
  saveOrders();
  showToast('❌ 訂單已取消');
  renderOrderList(_orderFilter);
  showPage('orders');
}

// ── 管理員永久刪除訂單 ──
function hardDeleteOrder(id){
  if(!confirm('確定永久刪除此訂單？\n此操作無法復原，所有記錄將消失。')) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders();
  showToast('🗑️ 訂單已永久刪除');
  renderOrderList(_orderFilter);
  showPage('orders');
}

// ── 從估價單ID開啟估價單 ──
function openEstimateById(id){
  if(!id) return;
  const e = typeof getEstimate === 'function' ? getEstimate(id) : null;
  if(e){ openEstimateDetail(id); }
  else { showToast('找不到對應的估價單'); }
}
