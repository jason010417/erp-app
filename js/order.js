// ===== ORDER MODULE (進貨單 / 出貨單) =====

const orders = {
  purchase: { items:[], curItem:null, curBarcode:'', numStr:'0', scanActive:false, animFrame:null, submitted:false },
  shipment:  { items:[], curItem:null, curBarcode:'', numStr:'0', scanActive:false, animFrame:null, submitted:false },
};

function toggleOrderScan(type) {
  const o = orders[type];
  if (o.scanActive) { stopOrderScan(type); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast('⚠️ 請手動輸入條碼'); return; }
  const video = document.getElementById(type+'ScanVideo');
  const box   = document.getElementById(type+'ScanBox');
  const ph    = document.getElementById(type+'ScanPlaceholder');
  const line  = document.getElementById(type+'ScanLine');
  o.scanActive = true;
  box.classList.add('scanning');
  navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } })
    .then(stream => {
      video.srcObject = stream; video.style.display = 'block';
      ph.style.display = 'none'; line.style.display = 'block';
      video.play(); orderScanLoop(type, video);
    }).catch(() => { showToast('⚠️ 無法開啟相機，請手動輸入'); stopOrderScan(type); });
}

function orderScanLoop(type, video) {
  const o = orders[type];
  if (!o.scanActive) return;
  const canvas = document.getElementById(type+'ScanCanvas');
  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:'dontInvert'});
      if (code?.data) {
        document.getElementById(type+'BarcodeInput').value = code.data;
        o.curBarcode = code.data;
        orderLookup(type); stopOrderScan(type); return;
      }
    }
  }
  o.animFrame = requestAnimationFrame(() => orderScanLoop(type, video));
}

function stopOrderScan(type) {
  const o = orders[type];
  if (!o.scanActive) return;
  o.scanActive = false;
  if (o.animFrame) { cancelAnimationFrame(o.animFrame); o.animFrame = null; }
  const video = document.getElementById(type+'ScanVideo');
  if (video?.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null; }
  video.style.display = 'none';
  document.getElementById(type+'ScanPlaceholder').style.display = 'flex';
  document.getElementById(type+'ScanLine').style.display = 'none';
  document.getElementById(type+'ScanBox').classList.remove('scanning');
}

function orderBarcodeType(type, val) { orders[type].curBarcode = val; }

function orderLookup(type) {
  const o = orders[type];
  const code = o.curBarcode || document.getElementById(type+'BarcodeInput').value.trim();
  if (!code) return;
  o.curBarcode = code;
  const item = BARCODE_INDEX[code];
  const foundEl = document.getElementById(type+'ItemFound');
  const nfEl    = document.getElementById(type+'NotFound');
  const numSec  = document.getElementById(type+'NumSection');
  if (item) {
    o.curItem = item;
    const q = inventory[item.id] ?? item.qty;
    document.getElementById(type+'FoundEmoji').textContent = item.emoji;
    document.getElementById(type+'FoundName').textContent  = item.name;
    document.getElementById(type+'FoundQty').textContent   = q;
    foundEl.style.display = 'flex'; nfEl.style.display = 'none';
    numSec.style.display = 'block';
    o.numStr = '0';
    document.getElementById(type+'QtyDisplay').textContent = '0';
    stopOrderScan(type);
  } else {
    o.curItem = null;
    foundEl.style.display = 'none'; nfEl.style.display = 'flex'; numSec.style.display = 'none';
  }
}

function orderNumPress(type, k) {
  const o = orders[type];
  if (k === 'del')      { o.numStr = o.numStr.length > 1 ? o.numStr.slice(0,-1) : '0'; }
  else if (k === '00')  { if (o.numStr !== '0' && o.numStr.length < 4) o.numStr += '00'; }
  else { o.numStr = o.numStr === '0' ? k : o.numStr.length < 5 ? o.numStr+k : o.numStr; }
  document.getElementById(type+'QtyDisplay').textContent = parseInt(o.numStr) || 0;
}

function addToOrder(type) {
  const o = orders[type];
  const qty = parseInt(o.numStr) || 0;
  if (!o.curItem || qty <= 0) { showToast('⚠️ 請先掃碼並輸入數量'); return; }
  if (type === 'shipment') {
    const stock = inventory[o.curItem.id] ?? 0;
    if (qty > stock) { showToast(`⚠️ 庫存不足！現有 ${stock} 個`); return; }
  }
  const existing = o.items.find(i => i.id === o.curItem.id);
  if (existing) { existing.qty += qty; showToast(`✏️ 已更新：${o.curItem.name} 共 ${existing.qty} 個`); }
  else          { o.items.push({...o.curItem, qty}); showToast(`✅ 加入：${o.curItem.name} × ${qty}`); }
  o.curItem = null; o.curBarcode = ''; o.numStr = '0';
  document.getElementById(type+'BarcodeInput').value = '';
  document.getElementById(type+'ItemFound').style.display = 'none';
  document.getElementById(type+'NumSection').style.display = 'none';
  renderOrderList(type);
}

function renderOrderList(type) {
  const o = orders[type];
  const listEl     = document.getElementById(type+'List');
  const countEl    = document.getElementById(type+'Count');
  const totalEl    = document.getElementById(type+'Total');
  const totalQtyEl = document.getElementById(type+'TotalQty');
  const btnEl      = document.getElementById(type+'ConfirmBtn');

  // 出貨單已送出：顯示鎖定提示
  if(type==='shipment' && o.submitted){
    listEl.innerHTML = `<div class="order-locked-banner">
      <i class="ti ti-lock"></i> 出貨單已送出並鎖定
    </div>`;
    countEl.textContent = '已送出';
    if(btnEl){ btnEl.disabled=true; btnEl.style.opacity='0.4'; }
    return;
  }

  if (!o.items.length) {
    listEl.innerHTML = '<div class="order-empty">還沒有品項，請掃描條碼加入</div>';
    countEl.textContent = '0 項'; totalEl.textContent = '0'; totalQtyEl.textContent = '0';
    btnEl.disabled = true; return;
  }
  const totalQty = o.items.reduce((s,i) => s+i.qty, 0);
  countEl.textContent = o.items.length + ' 項';
  totalEl.textContent = o.items.length;
  totalQtyEl.textContent = totalQty;
  btnEl.disabled = false;
  listEl.innerHTML = o.items.map((item,idx) => `
    <div class="order-row">
      <div class="order-emoji">${item.emoji}</div>
      <div class="order-info">
        <div class="order-name">${item.name}</div>
        <div class="order-id">${item.id}</div>
      </div>
      <div class="order-qty-ctrl">
        <button class="qty-edit-btn minus" onclick="changeOrderQty('${type}',${idx},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-edit-btn plus"  onclick="changeOrderQty('${type}',${idx},1)">＋</button>
      </div>
      <button class="order-del" onclick="removeOrderItem('${type}',${idx})">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join('');
}

function changeOrderQty(type, idx, delta) {
  const item = orders[type].items[idx];
  item.qty = Math.max(1, item.qty + delta);
  if (type === 'shipment') {
    const stock = inventory[item.id] ?? 0;
    if (item.qty > stock) { item.qty = stock; showToast(`⚠️ 最多 ${stock} 個`); }
  }
  renderOrderList(type);
}

function removeOrderItem(type, idx) {
  orders[type].items.splice(idx, 1);
  renderOrderList(type);
  showToast('🗑️ 已移除品項');
}

function clearOrder(type) {
  orders[type].items = [];
  orders[type].curItem = null;
  orders[type].submitted = false;
  document.getElementById(type+'BarcodeInput').value = '';
  document.getElementById(type+'ItemFound').style.display = 'none';
  document.getElementById(type+'NumSection').style.display = 'none';
  renderOrderList(type);
  showToast('🗑️ 清單已清空');
}

function submitOrder(type) {
  const o = orders[type];
  if (!o.items.length) return;
  const now = new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  o.items.forEach(item => {
    const old = inventory[item.id] ?? 0;
    inventory[item.id] = type === 'purchase' ? old + item.qty : Math.max(0, old - item.qty);
    logs.push({
      op: type === 'purchase' ? 'add' : 'ship',
      op_label: type === 'purchase' ? '進貨' : '出貨',
      id: item.id, name: item.name, emoji: item.emoji, qty: item.qty, time: now
    });
  });
  saveInventory(); saveLogs();
  const total = o.items.reduce((s,i) => s+i.qty, 0);
  // 出貨單送出後標記鎖定
  if(type === 'shipment') o.submitted = true;
  showToast(type === 'purchase'
    ? `✅ 進貨完成！${o.items.length} 種 共 ${total} 個`
    : `✅ 出貨完成！${o.items.length} 種 共 ${total} 個`);
  clearOrder(type);
  renderHome(); renderFinished(); renderMaterials(); renderLogs();
  setTimeout(() => showPage('home'), 1400);
}

// ===== 加工生產單 =====
let prodItem = null;
let prodQty = '0';

function startProd() {
  prodItem = null; prodQty = '0';
  document.getElementById('prodBarcodeInput').value = '';
  document.getElementById('prodItemFound').style.display = 'none';
  document.getElementById('prodNotFound').style.display = 'none';
  document.getElementById('prodBomSection').style.display = 'none';
  document.getElementById('prodQtyDisplay').textContent = '0';
  showPage('prod');
}

function prodBarcodeType(val) { prodItem = null; }

function prodLookup() {
  const code = document.getElementById('prodBarcodeInput').value.trim();
  if (!code) return;
  const item = BARCODE_INDEX[code];
  const foundEl = document.getElementById('prodItemFound');
  const nfEl    = document.getElementById('prodNotFound');
  const bomSec  = document.getElementById('prodBomSection');
  if (item) {
    prodItem = item;
    document.getElementById('prodFoundEmoji').textContent = item.emoji;
    document.getElementById('prodFoundName').textContent  = item.name;
    document.getElementById('prodFoundQty').textContent   = inventory[item.id] ?? item.qty;
    foundEl.style.display = 'flex'; nfEl.style.display = 'none';
    // 顯示BOM
    const bom = BOM[item.id];
    if (bom && bom.length > 0) {
      bomSec.style.display = 'block';
      renderBomPreview(bom, 1);
    } else {
      bomSec.style.display = 'none';
    }
    prodQty = '0';
    document.getElementById('prodQtyDisplay').textContent = '0';
  } else {
    prodItem = null;
    foundEl.style.display = 'none'; nfEl.style.display = 'flex'; bomSec.style.display = 'none';
  }
}

function renderBomPreview(bom, makeQty) {
  const list = document.getElementById('bomList');
  list.innerHTML = bom.map(m => {
    const need = Math.ceil(m.qty * makeQty);
    const have = m.id ? (inventory[m.id] ?? 0) : 0;
    const ok   = have >= need;
    const cls  = ok ? 'bom-row ok' : 'bom-row ng';
    const icon = ok ? '✅' : '⚠️';
    return `<div class="${cls}">
      <span class="bom-name">${m.name}</span>
      <span class="bom-qty">${icon} 需要 <strong>${need}</strong> 個／現有 <strong>${have}</strong> 個</span>
    </div>`;
  }).join('');
}

function prodNumPress(k) {
  if (k === 'del')     { prodQty = prodQty.length > 1 ? prodQty.slice(0,-1) : '0'; }
  else if (k === '00') { if (prodQty !== '0' && prodQty.length < 4) prodQty += '00'; }
  else { prodQty = prodQty === '0' ? k : prodQty.length < 5 ? prodQty+k : prodQty; }
  const n = parseInt(prodQty) || 0;
  document.getElementById('prodQtyDisplay').textContent = n;
  // 更新BOM用量
  if (prodItem && BOM[prodItem.id]) renderBomPreview(BOM[prodItem.id], n);
}

function confirmProd() {
  if (!prodItem) { showToast('⚠️ 請先掃描成品條碼'); return; }
  const qty = parseInt(prodQty) || 0;
  if (qty <= 0) { showToast('⚠️ 請輸入生產數量'); return; }
  const bom = BOM[prodItem.id];
  // 檢查材料是否足夠
  if (bom && bom.length > 0) {
    const short = bom.filter(m => {
      if (!m.id) return false;
      const need = Math.ceil(m.qty * qty);
      return (inventory[m.id] ?? 0) < need;
    });
    if (short.length > 0) {
      showToast(`⚠️ 材料不足：${short.map(m=>m.name).join('、')}`);
      return;
    }
    // 扣除材料
    bom.forEach(m => {
      if (!m.id) return;
      const need = Math.ceil(m.qty * qty);
      inventory[m.id] = Math.max(0, (inventory[m.id] ?? 0) - need);
    });
  }
  // 增加成品
  inventory[prodItem.id] = (inventory[prodItem.id] ?? 0) + qty;
  const now = new Date().toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  logs.push({ op:'prod', op_label:'加工生產', id:prodItem.id, name:prodItem.name, emoji:prodItem.emoji, qty, time:now });
  saveInventory(); saveLogs();
  showToast(`✅ 生產完成！${prodItem.name} ×${qty}`);
  renderHome(); renderFinished(); renderMaterials(); renderLogs();
  setTimeout(() => showPage('home'), 1400);
}

// 生產單相機掃碼
let prodScanActive = false, prodAnimFrame = null;
function toggleProdScan() {
  if (prodScanActive) { stopProdScan(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast('⚠️ 請手動輸入條碼'); return; }
  const video = document.getElementById('prodScanVideo');
  const box   = document.getElementById('prodScanBox');
  const ph    = document.getElementById('prodScanPlaceholder');
  const line  = document.getElementById('prodScanLine');
  prodScanActive = true; box.classList.add('scanning');
  navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } })
    .then(stream => {
      video.srcObject = stream; video.style.display = 'block';
      ph.style.display = 'none'; line.style.display = 'block';
      video.play(); prodScanLoop(video);
    }).catch(() => { showToast('⚠️ 無法開啟相機'); stopProdScan(); });
}
function prodScanLoop(video) {
  if (!prodScanActive) return;
  const canvas = document.getElementById('prodScanCanvas');
  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:'dontInvert'});
      if (code?.data) {
        document.getElementById('prodBarcodeInput').value = code.data;
        prodLookup(); stopProdScan(); return;
      }
    }
  }
  prodAnimFrame = requestAnimationFrame(() => prodScanLoop(video));
}
function stopProdScan() {
  if (!prodScanActive) return;
  prodScanActive = false;
  if (prodAnimFrame) { cancelAnimationFrame(prodAnimFrame); prodAnimFrame = null; }
  const video = document.getElementById('prodScanVideo');
  if (video?.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null; }
  video.style.display = 'none';
  document.getElementById('prodScanPlaceholder').style.display = 'flex';
  document.getElementById('prodScanLine').style.display = 'none';
  document.getElementById('prodScanBox').classList.remove('scanning');
}

// ===== 廠商選擇 =====
let selectedSupplier = null;

function openSupplierPicker() {
  renderSupplierList('');
  document.getElementById('supplierSearch').value = '';
  document.getElementById('supplierModal').style.display = 'flex';
}
function closeSupplierPicker(e) {
  if (e.target === document.getElementById('supplierModal'))
    document.getElementById('supplierModal').style.display = 'none';
}
function filterSuppliers(val) { renderSupplierList(val); }
function renderSupplierList(q) {
  const list = document.getElementById('supplierList');
  const items = q ? SUPPLIERS.filter(s => s.name.includes(q) || s.id.includes(q) || (s.contact||'').includes(q)) : SUPPLIERS;
  list.innerHTML = items.map(s => `
    <div class="supplier-item" onclick="selectSupplier('${s.id}')">
      <div style="flex:1;">
        <div class="sup-name">${s.name}</div>
        <div class="sup-tel">${s.tel||''} ${s.contact ? '・'+s.contact : ''}</div>
      </div>
      <div class="sup-id">${s.id}</div>
    </div>`).join('');
}
function selectSupplier(id) {
  const base = SUPPLIERS.find(s => s.id === id);
  // 合併 localStorage 裡的補充資料（後台管理輸入的）
  const extra = JSON.parse(localStorage.getItem('erp_sup_' + id) || '{}');
  selectedSupplier = { ...base, ...extra };
  document.getElementById('supplierModal').style.display = 'none';
  document.getElementById('purchaseSupplierName').textContent = selectedSupplier.name;
  const info = document.getElementById('purchaseSupplierInfo');
  const detail = document.getElementById('purchaseSupplierDetail');
  const callBtn = document.getElementById('purchaseSupplierCallBtn');
  let lines = [];
  if (selectedSupplier.contact) lines.push(`👤 聯絡人：${selectedSupplier.contact}`);
  if (selectedSupplier.tel)     lines.push(`📞 電話：${selectedSupplier.tel}`);
  if (selectedSupplier.email)   lines.push(`✉️ Email：${selectedSupplier.email}`);
  if (selectedSupplier.bank)    lines.push(`🏦 銀行：${selectedSupplier.bank}`);
  if (selectedSupplier.account) lines.push(`💳 帳號：${selectedSupplier.account}`);
  if (!lines.length) lines.push('📝 尚未填寫聯絡資料，請至後台管理編輯');
  detail.innerHTML = lines.join('<br>');
  info.style.display = 'block';
  callBtn.style.display = selectedSupplier.tel ? 'flex' : 'none';
}
function callSupplier() {
  if (selectedSupplier?.tel) window.location.href = 'tel:' + selectedSupplier.tel.replace(/[^0-9+]/g,'');
}

// 進貨送出時一併記錄廠商
const _origSubmitOrder = submitOrder;
submitOrder = function(type) {
  if (type === 'purchase' && selectedSupplier) {
    orders.purchase.supplierId   = selectedSupplier.id;
    orders.purchase.supplierName = selectedSupplier.name;
  }
  _origSubmitOrder(type);
  if (type === 'purchase') {
    selectedSupplier = null;
    document.getElementById('purchaseSupplierName').textContent = '請選擇廠商 ▾';
    document.getElementById('purchaseSupplierInfo').style.display = 'none';
  }
};

// ===== 查看庫存頁 =====
let invScanActive = false, invAnimFrame = null;
let currentInvItem = null;

const CATEGORIES = [
  {key:'清潔',  icon:'🧴', label:'清潔'},
  {key:'果乾/梅',icon:'🍋', label:'果乾/梅'},
  {key:'爆米花',icon:'🍿', label:'爆米花'},
  {key:'咖啡',  icon:'☕', label:'咖啡'},
  {key:'茶葉',  icon:'🍵', label:'茶葉'},
  {key:'無咖啡因',icon:'🌾',label:'無咖啡因'},
  {key:'米糧',  icon:'🌾', label:'米糧'},
  {key:'零嘴',  icon:'🫘', label:'零嘴'},
  {key:'pack',  icon:'📦', label:'包材'},
  {key:'semi',  icon:'🧱', label:'物料'},
];

function initInventoryPage() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = CATEGORIES.map(cat => {
    const items = ALL_ITEMS.filter(i => (i.cat||i.type) === cat.key);
    const alerts = items.filter(i => (inventory[i.id]??i.qty) <= i.min && i.min > 0).length;
    return `<div class="cat-card" onclick="showCatItems('${cat.key}','${cat.label}')">
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-info">
        <div class="cat-name">${cat.label}</div>
        <div class="cat-count">${items.length} 種品項</div>
        ${alerts ? `<div class="cat-alert">⚠️ ${alerts} 項需補貨</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleInvScan() {
  if (invScanActive) { stopInvScan(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast('⚠️ 請手動輸入條碼'); return; }
  const video = document.getElementById('invScanVideo');
  invScanActive = true;
  document.getElementById('invScanBox').classList.add('scanning');
  navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } })
    .then(stream => {
      video.srcObject = stream; video.style.display = 'block';
      document.getElementById('invScanPlaceholder').style.display = 'none';
      document.getElementById('invScanLine').style.display = 'block';
      video.play(); invScanLoop(video);
    }).catch(() => { showToast('⚠️ 無法開啟相機'); stopInvScan(); });
}
function invScanLoop(video) {
  if (!invScanActive) return;
  const canvas = document.getElementById('invScanCanvas');
  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:'dontInvert'});
      if (code?.data) {
        document.getElementById('invBarcodeInput').value = code.data;
        invLookup(); stopInvScan(); return;
      }
    }
  }
  invAnimFrame = requestAnimationFrame(() => invScanLoop(video));
}
function stopInvScan() {
  if (!invScanActive) return;
  invScanActive = false;
  if (invAnimFrame) { cancelAnimationFrame(invAnimFrame); invAnimFrame = null; }
  const video = document.getElementById('invScanVideo');
  if (video?.srcObject) { video.srcObject.getTracks().forEach(t=>t.stop()); video.srcObject = null; }
  video.style.display = 'none';
  document.getElementById('invScanPlaceholder').style.display = 'flex';
  document.getElementById('invScanLine').style.display = 'none';
  document.getElementById('invScanBox').classList.remove('scanning');
}
function invLookup() {
  const code = document.getElementById('invBarcodeInput').value.trim();
  if (!code) return;
  const item = BARCODE_INDEX[code];
  const card = document.getElementById('invResultCard');
  const nf   = document.getElementById('invNotFound');
  if (item) {
    currentInvItem = item;
    const q = inventory[item.id] ?? item.qty;
    document.getElementById('invEmoji').textContent = item.emoji;
    document.getElementById('invName').textContent  = item.name;
    document.getElementById('invId').textContent    = '編號：' + item.id;
    document.getElementById('invCat').textContent   = item.cat || (item.type==='semi'?'物料':'包材');
    document.getElementById('invQtyNum').textContent  = q;
    document.getElementById('invMinNum').textContent  = item.min || 0;
    const statusEl = document.getElementById('invStatus');
    if (q <= 0)       { statusEl.textContent='缺貨'; statusEl.className='inv-status empty'; }
    else if (q<=item.min) { statusEl.textContent='偏少'; statusEl.className='inv-status low'; }
    else              { statusEl.textContent='正常'; statusEl.className='inv-status ok'; }
    card.style.display='block'; nf.style.display='none';
  } else {
    currentInvItem = null;
    card.style.display='none'; nf.style.display='flex';
  }
}
function quickAdd() {
  if (!currentInvItem) return;
  startOp('add'); 
  setTimeout(() => {
    document.getElementById('barcodeInput').value = currentInvItem.barcode;
    curBarcode = currentInvItem.barcode;
    doLookup();
  }, 100);
}
function quickShip() {
  if (!currentInvItem) return;
  startOp('ship');
  setTimeout(() => {
    document.getElementById('barcodeInput').value = currentInvItem.barcode;
    curBarcode = currentInvItem.barcode;
    doLookup();
  }, 100);
}
function showCatItems(key, label) {
  const items = ALL_ITEMS.filter(i => (i.cat||i.type) === key);
  showToast(`${label}：共 ${items.length} 種品項`);
}
