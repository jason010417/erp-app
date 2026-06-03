// ===== 分類品項明細 =====
let catDetailItems = [], catDetailSort = 'default', catDetailSearch = '';

function showCatItems(key, label) {
  catDetailItems = ALL_ITEMS.filter(i => (i.cat || i.type) === key);
  catDetailSort = 'default'; catDetailSearch = '';
  document.getElementById('catdetail-title').textContent = label;
  document.getElementById('catdetail-badge').textContent = catDetailItems.length + ' 種';
  document.getElementById('catdetail-search').value = '';
  ['sort-default','sort-low','sort-name'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById('sort-default').classList.add('active');
  renderCatDetail();
  showPage('catdetail');
}

function filterCatDetail(val) { catDetailSearch = val; renderCatDetail(); }

function sortCatDetail(mode) {
  catDetailSort = mode;
  ['sort-default','sort-low','sort-name'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById('sort-'+mode).classList.add('active');
  renderCatDetail();
}

function renderCatDetail() {
  let items = catDetailItems.filter(i => !catDetailSearch || i.name.includes(catDetailSearch) || i.id.includes(catDetailSearch));
  if (catDetailSort === 'low') {
    items = [...items].sort((a,b) => {
      const qa = inventory[a.id] ?? a.qty, qb = inventory[b.id] ?? b.qty;
      return qa - qb;
    });
  } else if (catDetailSort === 'name') {
    items = [...items].sort((a,b) => a.name.localeCompare(b.name, 'zh-TW'));
  }
  const list = document.getElementById('catdetail-list');
  if (!items.length) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);">找不到品項</div>'; return; }
  list.innerHTML = items.map(item => {
    const q = inventory[item.id] ?? item.qty;
    const cls = q <= 0 ? 'empty' : q <= item.min && item.min > 0 ? 'low' : 'ok';
    return `<div class="catdetail-row" onclick="catDetailTap('${item.id}')">
      <div class="catdetail-emoji">${item.emoji}</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${item.name}</div>
        <div class="catdetail-id">${item.id}</div>
      </div>
      <div class="catdetail-right">
        <div class="catdetail-qty ${cls}">${q}</div>
        <div class="catdetail-unit">個</div>
      </div>
    </div>`;
  }).join('');
}

function catDetailTap(id) {
  const item = ALL_ITEMS.find(i => i.id === id);
  if (!item) return;
  const q = inventory[id] ?? item.qty;
  const status = q <= 0 ? '🔴 缺貨' : q <= item.min && item.min > 0 ? '⚠️ 偏少' : '✅ 正常';
  showToast(`${item.emoji} ${item.name}\n庫存：${q} 個 ${status}`);
}

// ===== POS 系統 =====
let posCart = [];
let posDiscount = 0;
let posPayMethod = 'cash';
let posCashStr = '0';
let posScanActive = false, posAnimFrame = null;

function togglePosScan() {
  if (posScanActive) { stopPosScan(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast('⚠️ 請手動搜尋商品'); return; }
  const video = document.getElementById('posScanVideo');
  posScanActive = true;
  document.getElementById('posScanBox').classList.add('scanning');
  navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } })
    .then(stream => {
      video.srcObject = stream; video.style.display = 'block';
      document.getElementById('posScanPlaceholder').style.display = 'none';
      document.getElementById('posScanLine').style.display = 'block';
      video.play(); posScanLoop(video);
    }).catch(() => { showToast('⚠️ 無法開啟相機'); stopPosScan(); });
}
function posScanLoop(video) {
  if (!posScanActive) return;
  const canvas = document.getElementById('posScanCanvas');
  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:'dontInvert'});
      if (code?.data) { addPOSItem(code.data); stopPosScan(); return; }
    }
  }
  posAnimFrame = requestAnimationFrame(() => posScanLoop(video));
}
function stopPosScan() {
  if (!posScanActive) return;
  posScanActive = false;
  if (posAnimFrame) { cancelAnimationFrame(posAnimFrame); posAnimFrame = null; }
  const video = document.getElementById('posScanVideo');
  if (video?.srcObject) { video.srcObject.getTracks().forEach(t=>t.stop()); video.srcObject = null; }
  video.style.display = 'none';
  document.getElementById('posScanPlaceholder').style.display = 'flex';
  document.getElementById('posScanLine').style.display = 'none';
  document.getElementById('posScanBox').classList.remove('scanning');
}

function posSearchItems(val) {
  const res = document.getElementById('posSearchResult');
  if (!val || val.length < 1) { res.style.display = 'none'; return; }
  const items = FINISHED.filter(i => i.name.includes(val) || i.id.includes(val)).slice(0,6);
  if (!items.length) { res.style.display = 'none'; return; }
  res.style.display = 'block';
  res.innerHTML = items.map(item => {
    const stock = inventory[item.id] ?? item.qty;
    return `<div class="pos-search-result-item" onclick="addPOSItemById('${item.id}')">
      <span>${item.emoji}</span>
      <span style="flex:1;font-size:13px;">${item.name}</span>
      <span style="font-size:11px;color:var(--text3);">庫存${stock}</span>
      <span class="p-price">$${item.price||0}</span>
    </div>`;
  }).join('');
}

function addPOSItem(barcode) {
  const item = BARCODE_INDEX[barcode];
  if (!item) { showToast('⚠️ 找不到此條碼'); return; }
  if (!item.price) { showToast('⚠️ 此品項無售價'); return; }
  addPOSItemById(item.id);
}

function addPOSItemById(id) {
  const item = ALL_ITEMS.find(i => i.id === id);
  if (!item || !item.price) { showToast('⚠️ 此品項無售價，無法加入'); return; }
  const stock = inventory[id] ?? item.qty;
  const existing = posCart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= stock) { showToast(`⚠️ 庫存只剩 ${stock} 個`); return; }
    existing.qty++;
  } else {
    if (stock <= 0) { showToast('⚠️ 此品項庫存不足'); return; }
    posCart.push({ id, name:item.name, emoji:item.emoji, price:item.price, qty:1 });
  }
  document.getElementById('posSearch').value = '';
  document.getElementById('posSearchResult').style.display = 'none';
  renderPOSCart();
  showToast(`✅ 加入：${item.name}`);
}

function renderPOSCart() {
  const cart = document.getElementById('posCart');
  const countEl = document.getElementById('posCartCount');
  if (!posCart.length) {
    cart.innerHTML = '<div class="order-empty">還沒有商品，請掃碼或搜尋加入</div>';
    countEl.textContent = '0 項';
    updatePOSTotals(); return;
  }
  countEl.textContent = posCart.length + ' 項';
  cart.innerHTML = posCart.map((item,idx) => `
    <div class="pos-cart-row">
      <div class="pos-cart-emoji">${item.emoji}</div>
      <div style="flex:1;">
        <div class="pos-cart-name">${item.name}</div>
        <div class="pos-cart-price">單價 $${item.price}</div>
      </div>
      <div class="pos-cart-ctrl">
        <button class="pos-nk minus" onclick="posChangeQty(${idx},-1)">−</button>
        <span class="pos-cart-qty">${item.qty}</span>
        <button class="pos-nk plus"  onclick="posChangeQty(${idx},1)">＋</button>
      </div>
      <div class="pos-cart-subtotal">$${item.price * item.qty}</div>
      <button class="pos-cart-del" onclick="posRemove(${idx})"><i class="ti ti-x"></i></button>
    </div>`).join('');
  updatePOSTotals();
}

function posChangeQty(idx, delta) {
  posCart[idx].qty = Math.max(1, posCart[idx].qty + delta);
  const stock = inventory[posCart[idx].id] ?? 0;
  if (posCart[idx].qty > stock) { posCart[idx].qty = stock; showToast(`⚠️ 最多 ${stock} 個`); }
  renderPOSCart();
}
function posRemove(idx) { posCart.splice(idx, 1); renderPOSCart(); }

function updatePOSTotals() {
  const sub = posCart.reduce((s,i) => s + i.price * i.qty, 0);
  const total = Math.round(sub * (1 - posDiscount/100));
  document.getElementById('posSubtotal').textContent = '$' + sub;
  document.getElementById('posTotal').textContent = '$' + total;
  updateChange();
}

function changeDiscount(delta) {
  posDiscount = Math.max(0, Math.min(100, posDiscount + delta));
  document.getElementById('posDiscountLabel').textContent = posDiscount + '%';
  updatePOSTotals();
}

function selectPay(method) {
  posPayMethod = method;
  ['cash','card','transfer','line'].forEach(m => document.getElementById('pay-'+m).classList.toggle('active', m === method));
  document.getElementById('cashSection').style.display = method === 'cash' ? 'block' : 'none';
}

function cashPress(k) {
  if (k === 'del')     { posCashStr = posCashStr.length > 1 ? posCashStr.slice(0,-1) : '0'; }
  else if (k === '00') { if (posCashStr !== '0' && posCashStr.length < 6) posCashStr += '00'; }
  else { posCashStr = posCashStr === '0' ? k : posCashStr.length < 6 ? posCashStr+k : posCashStr; }
  document.getElementById('cashDisplay').textContent = parseInt(posCashStr) || 0;
  updateChange();
}

function updateChange() {
  const total = parseInt(document.getElementById('posTotal').textContent.replace('$','')) || 0;
  const cash  = parseInt(posCashStr) || 0;
  const change = cash - total;
  const row = document.getElementById('changeRow');
  if (posPayMethod === 'cash' && cash > 0) {
    row.style.display = 'block';
    document.getElementById('changeAmt').textContent = change >= 0 ? '$'+change : '⚠️ 不足 $'+Math.abs(change);
    document.getElementById('changeAmt').style.color = change >= 0 ? '#1D9E75' : '#E24B4A';
  } else { row.style.display = 'none'; }
}

function clearPOS() {
  posCart = []; posDiscount = 0; posPayMethod = 'cash'; posCashStr = '0';
  document.getElementById('posDiscountLabel').textContent = '0%';
  document.getElementById('cashDisplay').textContent = '0';
  document.getElementById('changeRow').style.display = 'none';
  ['cash','card','transfer','line'].forEach(m => document.getElementById('pay-'+m).classList.toggle('active', m === 'cash'));
  document.getElementById('cashSection').style.display = 'block';
  renderPOSCart();
}

function confirmPOS() {
  if (!posCart.length) { showToast('⚠️ 購物車是空的'); return; }
  const total = parseInt(document.getElementById('posTotal').textContent.replace('$','')) || 0;
  if (posPayMethod === 'cash') {
    const cash = parseInt(posCashStr) || 0;
    if (cash < total) { showToast('⚠️ 現金不足，請重新輸入'); return; }
  }
  // 扣庫存、寫記錄
  const now = new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  posCart.forEach(item => {
    inventory[item.id] = Math.max(0, (inventory[item.id] ?? 0) - item.qty);
    logs.push({ op:'ship', op_label:'POS出售', id:item.id, name:item.name, emoji:item.emoji, qty:item.qty, time:now });
  });
  saveInventory(); saveLogs();
  renderHome(); renderFinished(); renderMaterials(); renderLogs();
  // 顯示收據
  showReceipt(total, now);
}

function showReceipt(total, time) {
  const sub = posCart.reduce((s,i) => s + i.price * i.qty, 0);
  const payLabels = { cash:'現金', card:'刷卡', transfer:'轉帳', line:'Line Pay' };
  const cash = parseInt(posCashStr) || 0;
  const change = posPayMethod === 'cash' ? cash - total : 0;
  const itemsHTML = posCart.map(item => `
    <div class="receipt-item">
      <span>${item.emoji} ${item.name} ×${item.qty}</span>
      <span>$${item.price * item.qty}</span>
    </div>`).join('');
  document.getElementById('receiptCard').innerHTML = `
    <div class="receipt-header">
      <div class="receipt-shop">🏪 工廠直售</div>
      <div class="receipt-date">${time}</div>
    </div>
    ${itemsHTML}
    <div class="receipt-footer">
      <div class="receipt-total-row"><span>小計</span><span>$${sub}</span></div>
      ${posDiscount ? `<div class="receipt-total-row"><span>折扣 ${posDiscount}%</span><span>-$${sub-total}</span></div>` : ''}
      <div class="receipt-total-row receipt-grand"><span>總計</span><span>$${total}</span></div>
      <div class="receipt-pay">付款方式：${payLabels[posPayMethod]}</div>
      ${posPayMethod==='cash' && change>=0 ? `<div class="receipt-change">找零 $${change}</div>` : ''}
    </div>`;
  showPage('receipt');
}

function newSale() {
  clearPOS();
  showPage('pos');
}
