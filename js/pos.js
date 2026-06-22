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

// 取得供應商附加資訊（故事、寄賣等）
function getSupplierExtra(supplierId){
  if(!supplierId) return {};
  return JSON.parse(localStorage.getItem('erp_sup_' + supplierId) || '{}');
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
    const supExtra = getSupplierExtra(item.supplierId);
    _posCart.push({
      id:            productId,
      name:          item.name,
      emoji:         item.emoji,
      qty:           1,
      originalPrice: item.salePrice,
      unitPrice:     item.salePrice,
      supplierId:    item.supplierId || null,
      story:         supExtra.story || '',
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

function showPOSStory(idx){
  const item = _posCart[idx];
  if(!item?.story) return;
  const sup = typeof SUPPLIERS !== 'undefined' ? SUPPLIERS.find(s => s.id === item.supplierId) : null;
  const title = sup ? sup.name : '工廠故事';
  // 動態建立故事 Modal
  let overlay = document.getElementById('pos-story-modal');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'pos-story-modal';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:none;';
    overlay.onclick = e => { if(e.target === overlay) overlay.style.display = 'none'; };
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:340px;">
      <div class="modal-title"><i class="ti ti-book" style="color:var(--purple);"></i> 📖 ${title}</div>
      <p style="font-size:14px;line-height:1.7;color:var(--text);white-space:pre-wrap;margin:0 0 16px;">${item.story}</p>
      <button class="modal-ok-btn" onclick="document.getElementById('pos-story-modal').style.display='none'">
        <i class="ti ti-check"></i> 關閉
      </button>
    </div>`;
  overlay.style.display = 'flex';
}
window.showPOSStory = showPOSStory;

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
    const safeStory = item.story ? item.story.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    const storyBtn = item.story
      ? `<button class="qty-btn" title="${safeStory}"
           onclick="showPOSStory(${idx})" style="color:var(--purple);font-size:13px;">
           <i class="ti ti-info-circle"></i>
         </button>`
      : '';
    return `<div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}${storyBtn}</div>
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
  const discValue = parseInt(document.getElementById('pos-discount-value')?.value) || 0;
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

  showToast(`✅ 收款完成！${fmtMoney(total)}`);
  showReceipt(total);
  _posCart = [];
  renderCart();
  calcPOSTotal();
}

// ── 收據（簡易）──
function showReceipt(total){
  const cashReceived = parseInt(document.getElementById('pos-cash-received')?.value) || 0;
  const change       = Math.max(0, cashReceived - total);
  const lines        = _posCart.map(i =>
    `${i.emoji} ${i.name} x${i.qty}  ${fmtMoney(i.unitPrice*i.qty)}`
  ).join('\n');
  const msg = `✅ 收款完成\n\n${lines}\n\n總計：${fmtMoney(total)}` +
    (_posPayMethod==='cash' && cashReceived ? `\n收款：${fmtMoney(cashReceived)}\n找零：${fmtMoney(change)}` : '');
  // 簡易 Toast 就夠了，未來可改成正式收據頁面
  setTimeout(() => showToast('🧾 ' + fmtMoney(total) + ' 已記錄'), 500);
}

document.addEventListener('DOMContentLoaded', () => {
  initPOS();
});
