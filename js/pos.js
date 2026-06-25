// ============================================================
// pos.js — A 門市 POS 收款
// 也支援外展模式（由 events.js 切換）
// ============================================================

let _posCart       = [];       // 購物車品項
let _posPayMethod  = 'cash';
let _posEventId    = null;     // 外展模式時設定
let _posDiscount   = { type:'none', value:0 };

// ── 初始化 ──
function initPOS(eventId){
  _posCart      = [];
  _posPayMethod = 'cash';
  _posEventId   = eventId || null;
  _posDiscount  = { type:'none', value:0 };

  // 重設表單
  const searchEl = document.getElementById('pos-search');
  if(searchEl) searchEl.value = '';
  const resEl = document.getElementById('pos-search-result');
  if(resEl) resEl.style.display = 'none';
  const discType = document.getElementById('pos-discount-type');
  if(discType) discType.value = 'none';
  const discVal = document.getElementById('pos-discount-value');
  if(discVal) discVal.value = '0';

  selectPayMethod('cash');
  renderCart();
  calcPOSTotal();

  // 外展 banner
  const banner = document.getElementById('event-pos-banner');
  if(banner) banner.style.display = _posEventId ? 'block' : 'none';
}

// ── 加入商品 ──
function addPOSItem(productId){
  const item = getItem(productId);
  if(!item) return;

  // 外展模式：檢查帶貨量
  if(_posEventId){
    const event    = typeof events !== 'undefined' ? events.find(e=>e.id===_posEventId) : null;
    const evItem   = event?.items?.find(i=>i.id===productId);
    if(evItem){
      const soldQty = typeof calcEventItemSoldQty==='function'
        ? calcEventItemSoldQty(_posEventId, productId) : 0;
      const remain  = Math.max(0, (evItem.takeQty||0) - soldQty);
      // 目前購物車中已有幾個
      const inCart  = _posCart.find(i=>i.id===productId)?.qty || 0;
      if(inCart + 1 > remain){
        showToast(`⚠️ ${item.name} 帶貨數量不足（剩 ${remain} 個）`);
        return;
      }
    }
  }

  const existing = _posCart.find(i => i.id === productId);
  if(existing){
    existing.qty++;
  } else {
    _posCart.push({
      id:            productId,
      name:          item.name,
      emoji:         item.emoji,
      qty:           1,
      originalPrice: item.salePrice,
      unitPrice:     item.salePrice,
    });
  }
  renderCart();
  calcPOSTotal();
}

// 讓 smartsearch 可以呼叫
window.addPOSItem = addPOSItem;

// 取得購物車中某商品的數量（供外展快捷格使用）
function getPOSCartQty(itemId){
  return _posCart.find(i => i.id === itemId)?.qty || 0;
}
window.getPOSCartQty = getPOSCartQty;

// 從購物車中移除一個某商品（供外展快捷格 − 鍵使用）
function removePOSItemById(productId){
  const idx = _posCart.findIndex(i => i.id === productId);
  if(idx < 0) return;
  if(_posCart[idx].qty > 1) _posCart[idx].qty--;
  else _posCart.splice(idx, 1);
  renderCart(); calcPOSTotal();
}
window.removePOSItemById = removePOSItemById;

function removePOSItem(idx){ _posCart.splice(idx,1); renderCart(); calcPOSTotal(); }
function changePOSQty(idx, delta){
  const item = _posCart[idx];
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart(); calcPOSTotal();
}
function changePOSItemPrice(idx, val){
  const item = _posCart[idx];
  if(!item) return;
  item.unitPrice = parseInt(val) || 0;
  calcPOSTotal();
}

function clearPOS(){
  _posCart = [];
  renderCart();
  calcPOSTotal();
  showToast('🗑️ 購物車已清空');
}

// ── 渲染購物車 ──
function renderCart(){
  const el    = document.getElementById('pos-cart');
  const count = document.getElementById('pos-count');
  if(!el) return;
  const total = _posCart.reduce((s,i)=>s+i.qty,0);
  if(count) count.textContent = total + ' 項';
  if(!_posCart.length){
    el.innerHTML = '<div class="order-empty">請搜尋或輸入編號加入商品</div>'; return;
  }
  el.innerHTML = _posCart.map((item, idx) => {
    const isDis = item.unitPrice !== item.originalPrice;
    return `<div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id" style="display:flex;align-items:center;gap:6px;">
          ${isDis?`<span style="text-decoration:line-through;color:var(--text3);font-size:11px;">$${item.originalPrice}</span>`:''}
          <input type="number" class="unit-price-input ${isDis?'discounted':''}"
            value="${item.unitPrice}" min="0"
            onchange="changePOSItemPrice(${idx},this.value)"
            onclick="this.select()" />
        </div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changePOSQty(${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changePOSQty(${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removePOSItem(${idx})"><i class="ti ti-x"></i></button>
    </div>`;
  }).join('');
}

// ── 計算金額 ──
function calcPOSTotal(){
  const subtotal  = _posCart.reduce((s,i) => s + i.unitPrice * i.qty, 0);
  const discType  = document.getElementById('pos-discount-type')?.value  || 'none';
  let discValue   = parseInt(document.getElementById('pos-discount-value')?.value) || 0;

  // 百分比折扣限制在 0~100 之間，避免輸入超過 100% 導致總金額變成負數
  if(discType === 'percent') discValue = Math.min(100, Math.max(0, discValue));

  let total = subtotal;
  if(discType==='percent') total = Math.round(subtotal*(1-discValue/100));
  if(discType==='amount')  total = Math.max(0, subtotal-discValue);
  _posDiscount = { type:discType, value:discValue };

  const subEl   = document.getElementById('pos-subtotal');
  const totalEl = document.getElementById('pos-total');
  if(subEl)   subEl.textContent   = fmtMoney(subtotal);
  if(totalEl) totalEl.textContent = fmtMoney(total);

  calcChange();
  return total;
}

// ── 付款方式 ──
function selectPayMethod(method){
  _posPayMethod = method;
  ['cash','card','transfer'].forEach(m =>
    document.getElementById(`pay-${m}`)?.classList.toggle('active', m===method));
  const cashSection = document.getElementById('cash-change-section');
  if(cashSection) cashSection.style.display = method==='cash' ? 'block' : 'none';
}

function calcChange(){
  const total    = parseInt(document.getElementById('pos-total')?.textContent?.replace(/[^0-9]/g,'')) || 0;
  const received = parseInt(document.getElementById('pos-cash-received')?.value) || 0;
  const change   = Math.max(0, received - total);
  const el       = document.getElementById('pos-change');
  if(el) el.textContent = fmtMoney(change);
}

// ── 返回 ──
function posBack(){
  if(_posEventId){
    showPage('event-detail');
  } else {
    showPage('sales-menu');
  }
}

// ── 確認收款 ──
function confirmPOS(){
  if(!_posCart.length){ showToast('⚠️ 購物車是空的'); return; }
  const total    = calcPOSTotal();
  const locId    = _posEventId
    ? ('event_'+_posEventId)
    : (getMainLocation()?.id || 'store_A');
  const now      = nowStr();
  const refId    = 'POS' + Date.now();

  // 扣庫存（門市模式）
  if(!_posEventId){
    const storeLocId = getMainLocation()?.id || 'store_A';
    _posCart.forEach(item => {
      adjustStock(item.id, storeLocId, -item.qty, {
        op:      'pos_sale',
        refId,
        refType: 'pos',
        note:    'A 門市 POS',
      });
    });
  }

  // 寫銷售記錄（每個品項一筆）
  _posCart.forEach(item => {
    addLog({
      op:          'pos_sale',
      locationId:  locId,
      productId:   item.id,
      productName: item.name,
      qty:         item.qty,
      unitPrice:   item.unitPrice,
      amount:      item.unitPrice * item.qty,
      payMethod:   _posPayMethod,
      eventId:     _posEventId || null,
      refId,
    });
  });

  // 外展模式：通知 events.js 更新剩餘數量
  if(_posEventId && typeof onEventSale === 'function'){
    onEventSale(_posEventId, _posCart);
  }

  // 在清空購物車之前，先把購物車快照傳給 showReceipt，
  // 確保收據內的品項明細是這筆交易的資料，而非清空後的空陣列
  showReceipt(total, _posCart.slice());
  _posCart = [];
  renderCart();
  calcPOSTotal();
}

// ── 收據 Modal ──
// 參數說明：
//   total    — 應收總金額（Number）
//   cartItems — 購物車快照陣列（Array），由 confirmPOS() 在清空前傳入
//               這樣即使 _posCart 已被清空，收據仍能正確顯示品項明細
function showReceipt(total, cartItems){
  const cashReceived = parseInt(document.getElementById('pos-cash-received')?.value) || 0;
  const change       = Math.max(0, cashReceived - total);

  // 建立品項明細列（HTML 格式，每項一行）
  const itemRows = (cartItems || []).map(i => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:7px 0;border-bottom:1px solid var(--border);font-size:14px;">
      <span>${i.emoji} ${i.name} <span style="color:var(--text3);">x${i.qty}</span></span>
      <span style="font-weight:600;">${fmtMoney(i.unitPrice * i.qty)}</span>
    </div>`).join('');

  // 找零區塊（只在現金付款且有輸入收款金額時才顯示）
  const changeBlock = (_posPayMethod === 'cash' && cashReceived > 0) ? `
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text2);">
      <span>收款</span><span>${fmtMoney(cashReceived)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text2);">
      <span>找零</span><span style="color:var(--green);font-weight:600;">${fmtMoney(change)}</span>
    </div>` : '';

  // 動態建立收據 Modal（風格與其他模組的 modal-overlay 一致）
  const existing = document.getElementById('pos-receipt-modal');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id        = 'pos-receipt-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card" style="padding:0;overflow:hidden;max-width:340px;width:92%;">
      <!-- 標題列 -->
      <div style="display:flex;align-items:center;gap:8px;padding:16px 18px 12px;
        border-bottom:1px solid var(--border);background:var(--green);color:#fff;">
        <i class="ti ti-receipt" style="font-size:22px;"></i>
        <div style="flex:1;font-size:17px;font-weight:700;">收款完成</div>
        <button onclick="document.getElementById('pos-receipt-modal').remove()"
          style="background:none;border:none;font-size:22px;color:rgba(255,255,255,0.8);
          cursor:pointer;line-height:1;"><i class="ti ti-x"></i></button>
      </div>
      <!-- 品項明細 -->
      <div style="padding:12px 16px;">
        ${itemRows || '<div style="color:var(--text3);text-align:center;padding:12px;">（無品項資料）</div>'}
      </div>
      <!-- 合計區 -->
      <div style="padding:10px 16px 4px;border-top:2px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:baseline;
          padding:6px 0;font-size:18px;font-weight:700;">
          <span>總計</span>
          <span style="color:var(--green);">${fmtMoney(total)}</span>
        </div>
        ${changeBlock}
      </div>
      <!-- 關閉按鈕 -->
      <div style="padding:12px 16px 16px;">
        <button class="confirm-btn" style="background:var(--green);"
          onclick="document.getElementById('pos-receipt-modal').remove()">
          <i class="ti ti-check"></i> 確認
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  initPOS();
});
