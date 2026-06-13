// ============================================================
// estimates.js — 估價單管理（純報價，不含付款）
// ============================================================

let estimates = JSON.parse(localStorage.getItem('erp_estimates') || '[]');

function saveEstimates(){
  localStorage.setItem('erp_estimates', JSON.stringify(estimates));
  if(typeof pushToFirebase === 'function') pushToFirebase('estimates', estimates);
}

function getEstimate(id){ return estimates.find(e => e.id === id) || null; }

// ── 單號產生 ──
function genEstimateNo(){
  return genNo('Q', estimates, 'no');
}

// ── 狀態設定 ──
const EST_STATUS = {
  draft:     { label:'草稿',    cls:'badge-draft',     icon:'ti-pencil' },
  pending:   { label:'待確認',  cls:'badge-pending',   icon:'ti-clock' },
  converted: { label:'已轉單',  cls:'badge-converted', icon:'ti-check' },
  cancelled: { label:'已取消',  cls:'badge-cancelled', icon:'ti-x' },
};

function estStatusBadge(status){
  const s = EST_STATUS[status] || EST_STATUS.draft;
  return `<span class="status-badge ${s.cls}"><i class="ti ${s.icon}"></i> ${s.label}</span>`;
}

// ── 列表渲染 ──
let _estFilter = 'all';

function renderEstimateList(filter){
  _estFilter = filter || 'all';
  // 更新 tab active
  document.querySelectorAll('#page-estimates .ftab').forEach((btn, i) => {
    const filters = ['all','draft','pending','converted','cancelled'];
    btn.classList.toggle('active', filters[i] === _estFilter);
  });

  const el   = document.getElementById('estimate-list');
  if(!el) return;
  let list   = _estFilter === 'all' ? estimates : estimates.filter(e => e.status === _estFilter);
  list       = list.slice().reverse();

  if(!list.length){
    el.innerHTML = `<div class="order-empty">沒有符合的估價單</div>`;
    return;
  }

  el.innerHTML = list.map(e => {
    const cust   = getCustomer(e.customerId);
    const itemsStr = (e.items||[]).slice(0,2).map(i=>i.name).join('、')
      + ((e.items||[]).length > 2 ? ` 等${e.items.length}項` : '');
    return `<div class="list-card" onclick="openEstimateDetail('${e.id}')">
      <div class="list-card-top">
        <span class="list-card-no">${e.no}</span>
        ${estStatusBadge(e.status)}
      </div>
      <div class="list-card-meta">
        ${cust ? `<span><i class="ti ti-user"></i>${cust.name}</span>` : ''}
        <span><i class="ti ti-calendar"></i>${fmtDate(e.createdAt)}</span>
        ${e.validUntil ? `<span><i class="ti ti-clock"></i>效期 ${fmtDate(e.validUntil)}</span>` : ''}
      </div>
      <div class="list-card-items">${itemsStr || '無品項'}</div>
      <div class="list-card-footer">
        <span class="list-card-amount">${fmtMoney(e.total)}</span>
        <span style="font-size:12px;color:var(--text3);">${deliveryLabel(e.delivery)}</span>
      </div>
    </div>`;
  }).join('');
}

function deliveryLabel(d){
  return { pickup:'自取', delivery:'宅配', personal:'親送' }[d] || '';
}

// ── 新增估價單 ──
let _currentEst     = null;
let _estDelivery    = 'pickup';
let _estDiscountType  = 'none';

function newEstimate(){
  _currentEst = {
    id:        null,
    no:        genEstimateNo(),
    customerId:null,
    items:     [],
    subtotal:  0,
    discount:  { type:'none', value:0, reason:'' },
    total:     0,
    delivery:  'pickup',
    validUntil:'',
    remark:    '',
    status:    'draft',
    createdAt: todayStr(),
  };
  _estDelivery    = 'pickup';
  _estDiscountType = 'none';
  renderEstEditForm();
  showPage('estimate-edit');
}

// ── 開啟估價單（已確認的→唯讀預覽）──
function openEstimateDetail(id){
  const e = getEstimate(id);
  if(!e) return;

  if(e.status === 'pending' || e.status === 'converted' || e.status === 'cancelled'){
    // 待確認/已轉單/已取消：唯讀預覽頁（待確認可以轉單）
    _currentEst = JSON.parse(JSON.stringify(e));
    renderEstDetailPage();
    showPage('estimate-detail');
    return;
  }

  // 草稿：開編輯頁
  _currentEst      = JSON.parse(JSON.stringify(e));
  _estDelivery     = e.delivery || 'pickup';
  _estDiscountType = e.discount?.type || 'none';
  renderEstEditForm();
  showPage('estimate-edit');
}

// ── 渲染編輯表單 ──
function renderEstEditForm(){
  if(!_currentEst) return;
  const e = _currentEst;

  document.getElementById('est-edit-title').textContent = e.id ? e.no : '新增估價單';
  document.getElementById('est-no').textContent   = e.no;
  document.getElementById('est-date').textContent = fmtDate(e.createdAt);

  // 客戶
  const cust = getCustomer(e.customerId);
  const custBtn = document.getElementById('est-customer-btn');
  if(custBtn) document.getElementById('est-customer-name').textContent = cust ? cust.name : '選擇客戶';
  const custInfo = document.getElementById('est-customer-info');
  if(custInfo){
    if(cust){
      custInfo.style.display = 'block';
      custInfo.innerHTML = [
        cust.contact ? `👤 ${cust.contact}` : '',
        cust.tel     ? `📞 ${cust.tel}`     : '',
        cust.email   ? `✉️ ${cust.email}`   : '',
        cust.address ? `📍 ${cust.address}` : '',
      ].filter(Boolean).join('<br>');
    } else {
      custInfo.style.display = 'none';
    }
  }

  // 送貨方式
  ['pickup','delivery','personal'].forEach(m => {
    document.getElementById(`dm-${m}`)?.classList.toggle('active', m === _estDelivery);
  });

  // 折扣
  const discType = document.getElementById('est-discount-type');
  const discVal  = document.getElementById('est-discount-value');
  if(discType) discType.value = e.discount?.type  || 'none';
  if(discVal)  discVal.value  = e.discount?.value || 0;

  // 有效期限 / 備註
  const validEl  = document.getElementById('est-valid-until');
  const remarkEl = document.getElementById('est-remark');
  if(validEl)  validEl.value  = e.validUntil || '';
  if(remarkEl) remarkEl.value = e.remark     || '';

  renderEstItems();
  calcEstTotal();
}

// ── 客戶選擇 ──
function selectCustomerForEstimate(id){
  if(!_currentEst) return;
  _currentEst.customerId = id;
  renderEstEditForm();
}

// ── 品項管理 ──
function addEstimateItem(productId){
  const item = getItem(productId);
  if(!item) return;
  const existing = _currentEst.items.find(i => i.id === productId);
  if(existing){
    existing.qty++;
  } else {
    _currentEst.items.push({
      id:            productId,
      name:          item.name,
      emoji:         item.emoji,
      qty:           1,
      originalPrice: item.salePrice,
      unitPrice:     item.salePrice,  // 可手動改
      discount:      null,
    });
  }
  renderEstItems();
  calcEstTotal();
}

function removeEstimateItem(idx){
  _currentEst.items.splice(idx, 1);
  renderEstItems();
  calcEstTotal();
}

function changeEstItemQty(idx, delta){
  const item = _currentEst.items[idx];
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderEstItems();
  calcEstTotal();
}

function changeEstItemPrice(idx, val){
  const item  = _currentEst.items[idx];
  if(!item) return;
  const price = parseInt(val) || 0;
  item.unitPrice = price;
  item.discount  = price !== item.originalPrice
    ? { type:'item', value: item.originalPrice - price, reason:'手動改價' }
    : null;
  calcEstTotal();
}

function renderEstItems(){
  const el    = document.getElementById('est-item-list');
  const count = document.getElementById('est-item-count');
  if(!el) return;
  const items = _currentEst.items;
  if(count) count.textContent = items.length + ' 項';
  if(!items.length){
    el.innerHTML = `<div class="order-empty">尚未加入品項，請搜尋商品</div>`;
    return;
  }
  el.innerHTML = items.map((item, idx) => {
    const isDiscounted = item.unitPrice !== item.originalPrice;
    // 客製化品項
    if(item.isCustom){
      const hasImages = (item.images||[]).length > 0;
      return `<div class="order-row custom-item-row" onclick="openCustomItemModal('estimate',${idx})">
        <div class="order-emoji">🎁</div>
        <div class="order-info" style="flex:1;">
          <div class="order-name" style="display:flex;align-items:center;gap:6px;">
            ${item.name}
            <span style="font-size:10px;padding:2px 6px;background:var(--purple-light);
              color:var(--purple);border-radius:10px;">客製</span>
            ${hasImages?`<i class="ti ti-photo" style="font-size:14px;color:var(--text3);" title="${item.images.length}張照片"></i>`:''}
          </div>
          <div class="order-id">
            ${(item.materials||[]).length}種材料
            ${item.remark?`・${item.remark.slice(0,20)}${item.remark.length>20?'…':''}`:'' }
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:700;">x${item.qty}</div>
          <div style="font-size:13px;color:var(--purple);">$${item.unitPrice}</div>
        </div>
        <button class="order-del" onclick="event.stopPropagation();removeEstimateItem(${idx})">
          <i class="ti ti-x"></i>
        </button>
      </div>`;
    }
    return `<div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="display:flex;align-items:center;gap:8px;">
          <span style="text-decoration:${isDiscounted?'line-through':'none'};color:var(--text3);">
            $${item.originalPrice}
          </span>
          <input type="number" class="unit-price-input ${isDiscounted?'discounted':''}"
            value="${item.unitPrice}" min="0"
            onchange="changeEstItemPrice(${idx},this.value)"
            onclick="this.select()" />
        </div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeEstItemQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeEstItemQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeEstimateItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`;
  }).join('');
}

// ── 計算金額 ──
function calcEstTotal(){
  if(!_currentEst) return;
  const subtotal = (_currentEst.items || []).reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discType = document.getElementById('est-discount-type')?.value || 'none';
  const discVal  = parseInt(document.getElementById('est-discount-value')?.value) || 0;

  let total = subtotal;
  if(discType === 'percent') total = Math.round(subtotal * (1 - discVal / 100));
  if(discType === 'amount')  total = Math.max(0, subtotal - discVal);

  _currentEst.subtotal = subtotal;
  _currentEst.total    = total;
  _currentEst.discount = { type: discType, value: discVal };

  const subEl   = document.getElementById('est-subtotal');
  const totalEl = document.getElementById('est-total');
  if(subEl)   subEl.textContent   = fmtMoney(subtotal);
  if(totalEl) totalEl.textContent = fmtMoney(total);
}

// ── 送貨方式 ──
function selectDelivery(method, ctx){
  if(ctx === 'est' || ctx === undefined){
    _estDelivery = method;
    if(_currentEst) _currentEst.delivery = method;
    ['pickup','delivery','personal'].forEach(m =>
      document.getElementById(`dm-${m}`)?.classList.toggle('active', m === method));
  }
}

// ── 收集表單資料 ──
function collectEstForm(){
  if(!_currentEst) return;
  _currentEst.delivery   = _estDelivery;
  _currentEst.validUntil = document.getElementById('est-valid-until')?.value || '';
  _currentEst.remark     = document.getElementById('est-remark')?.value.trim() || '';
  calcEstTotal();
}

// ── 存草稿 ──
function saveEstimateDraft(){
  if(!_currentEst.customerId && !_currentEst.items.length){
    showToast('⚠️ 請先選擇客戶或加入品項');
    return;
  }
  collectEstForm();
  _currentEst.status = 'draft';
  upsertEstimate();
  showToast('📝 草稿已儲存：' + _currentEst.no);
}

// ── 送出估價單（待確認）──
function confirmEstimate(){
  if(!_currentEst.customerId){ showToast('⚠️ 請先選擇客戶'); return; }
  if(!_currentEst.items.length){ showToast('⚠️ 請先加入品項'); return; }
  collectEstForm();
  _currentEst.status = 'pending';
  upsertEstimate();
  showToast('✅ 估價單已送出：' + _currentEst.no);
  showPage('estimates');
}

// ── 儲存 ──
function upsertEstimate(){
  if(!_currentEst.id) _currentEst.id = 'E' + Date.now();
  const idx = estimates.findIndex(e => e.id === _currentEst.id);
  const copy = JSON.parse(JSON.stringify(_currentEst));
  if(idx >= 0) estimates[idx] = copy;
  else         estimates.push(copy);
  saveEstimates();
  renderEstimateList(_estFilter);
}

// ── 取消估價單 ──
function cancelEstimate(id){
  const e = getEstimate(id || _currentEst?.id);
  if(!e) return;
  if(!confirm(`確定取消估價單 ${e.no}？`)) return;
  e.status = 'cancelled';
  saveEstimates();
  showToast('❌ 估價單已取消');
  renderEstimateList(_estFilter);
  showPage('estimates');
}

// ── 轉為正式訂單 ──
function convertEstimateToOrder(id){
  const e = getEstimate(id || _currentEst?.id);
  if(!e) return;
  if(e.status !== 'pending'){
    showToast('⚠️ 只有「待確認」狀態的估價單才能轉單'); return;
  }
  // 建立正式訂單（由 orders.js 處理）
  if(typeof newOrderFromEstimate === 'function'){
    newOrderFromEstimate(e);
  } else {
    showToast('⚠️ 訂單模組尚未載入');
  }
}

// ── 詳細頁（唯讀）──
function renderEstDetailPage(){
  const e  = _currentEst;
  const el = document.getElementById('page-estimate-detail');
  if(!el) return;
  const cust = getCustomer(e.customerId);

  el.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('estimates')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title">${e.no}</div>
      ${e.status === 'pending'
        ? `<button class="small-btn green-btn" onclick="convertEstimateToOrder('${e.id}')">
             <i class="ti ti-receipt-2"></i> 轉正式訂單
           </button>`
        : ''}
    </div>

    <div class="form-card">
      <div class="form-meta-row">
        <span class="form-no">${e.no}</span>
        ${estStatusBadge(e.status)}
      </div>

      ${cust ? `<div class="cust-info-block" style="margin-bottom:12px;">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px;">${cust.name}</div>
        ${cust.contact   ? `<div class="cust-info-row"><i class="ti ti-user"></i>${cust.contact}</div>` : ''}
        ${cust.tel       ? `<div class="cust-info-row"><i class="ti ti-phone"></i>${cust.tel}</div>` : ''}
        ${cust.address   ? `<div class="cust-info-row"><i class="ti ti-map-pin"></i>${cust.address}</div>` : ''}
      </div>` : ''}

      <div class="section-title"><i class="ti ti-package"></i> 品項</div>
      ${(e.items||[]).map(item => {
        if(item.isCustom){
          return `<div style="background:var(--purple-light);border:1px solid var(--purple-mid);
            border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:24px;">🎁</span>
              <div style="flex:1;">
                <div style="font-size:15px;font-weight:700;">${item.name}
                  <span style="font-size:11px;background:var(--purple);color:white;
                    padding:2px 6px;border-radius:10px;margin-left:6px;">客製</span>
                </div>
                ${item.remark?`<div style="font-size:12px;color:var(--text2);margin-top:2px;">${item.remark}</div>`:''}
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:700;">x${item.qty}</div>
                <div style="font-size:13px;color:var(--purple);font-weight:700;">${fmtMoney(item.unitPrice*item.qty)}</div>
              </div>
            </div>
            ${(item.materials||[]).length?`
            <div style="font-size:12px;color:var(--text2);margin-bottom:6px;">材料組合：</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${(item.materials||[]).map(m=>`
                <span style="padding:3px 8px;background:white;border:1px solid var(--border);
                  border-radius:10px;font-size:11px;">${m.emoji||'📦'} ${m.name} x${m.qty}</span>
              `).join('')}
            </div>`:''}
            ${(item.images||[]).length?`
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
              ${(item.images||[]).map(img=>`
                <img src="${img}" style="width:64px;height:64px;object-fit:cover;
                  border-radius:6px;border:1px solid var(--border);cursor:pointer;"
                  onclick="showFullImage(this.src)" />
              `).join('')}
            </div>`:''}
          </div>`;
        }
        return `<div class="order-row" style="cursor:default;">
          <div class="order-emoji">${item.emoji}</div>
          <div class="order-info">
            <div class="order-name">${item.name}</div>
            <div class="order-id">單價 ${fmtMoney(item.unitPrice)}
              ${item.unitPrice !== item.originalPrice
                ? `<span style="color:var(--amber);font-size:11px;">（原價 $${item.originalPrice}）</span>`
                : ''}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:16px;font-weight:700;">${item.qty} 個</div>
            <div style="font-size:13px;color:var(--text2);">${fmtMoney(item.unitPrice*item.qty)}</div>
          </div>
        </div>`;
      }).join('')}

      <div class="amount-section" style="margin-top:10px;">
        <div class="amount-row"><span>小計</span><span>${fmtMoney(e.subtotal)}</span></div>
        ${e.discount?.type !== 'none' ? `
        <div class="amount-row">
          <span>折扣（${discountLabel(e.discount)}）</span>
          <span style="color:var(--red);">-${fmtMoney(e.subtotal - e.total)}</span>
        </div>` : ''}
        <div class="amount-row grand"><span>報價總金額</span><strong>${fmtMoney(e.total)}</strong></div>
      </div>

      <div class="amount-row" style="margin-top:10px;">
        <span>送貨方式</span><span>${deliveryLabel(e.delivery)}</span>
      </div>
      ${e.validUntil ? `<div class="amount-row"><span>有效期限</span><span>${fmtDate(e.validUntil)}</span></div>` : ''}
      ${e.remark     ? `<div class="amount-row"><span>備註</span><span>${e.remark}</span></div>` : ''}
    </div>

    ${e.status === 'pending' ? `
    <button class="confirm-btn" style="background:var(--purple);"
      onclick="convertEstimateToOrder('${e.id}')">
      <i class="ti ti-receipt-2"></i> 客戶確認，轉為正式訂單
    </button>
    <button class="redit-btn" onclick="cancelEstimate('${e.id}')">
      <i class="ti ti-x"></i> 取消此估價單
    </button>` : ''}

    ${e.status === 'converted' ? `
    <div class="form-card" style="margin-top:10px;background:var(--green-light);border-color:var(--green-mid);">
      <div style="font-size:13px;color:var(--green-dark);font-weight:600;margin-bottom:8px;">
        <i class="ti ti-circle-check"></i> 此估價單已轉為正式訂單
      </div>
      ${e.convertedOrderId ? `<button class="confirm-btn" style="background:var(--purple);margin-bottom:8px;"
        onclick="showOrderDetail('${e.convertedOrderId}')">
        <i class="ti ti-receipt-2"></i> 查看正式訂單 ${e.convertedOrderNo||''}
      </button>` : `<div style="font-size:12px;color:var(--text2);">訂單資料同步中，請稍後再查看</div>`}
    </div>` : ''}
    ${isAdmin() ? `
    <button class="redit-btn" style="margin-top:8px;color:var(--red);border-color:var(--red);"
      onclick="requireAdmin(()=>hardDeleteEstimate('${e.id}'),'刪除估價單需要管理員權限')">
      <i class="ti ti-trash"></i> 永久刪除估價單
    </button>` : ''}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderEstimateList('all');
});

// ── 管理員永久刪除估價單 ──
function hardDeleteEstimate(id){
  if(!confirm('確定永久刪除此估價單？此操作無法復原。')) return;
  estimates = estimates.filter(e => e.id !== id);
  saveEstimates();
  showToast('🗑️ 估價單已刪除');
  renderEstimateList(_estFilter);
  showPage('estimates');
}
