// ===== ERP APP MAIN =====

// ----- State -----
let curOp = '', curItem = null, curBarcode = '', numStr = '0';
let scanActive = false, scanTimer = null, animFrame = null;
let matTypeFilter = 'all', matSearch = '', finSearch = '';
let logs = JSON.parse(localStorage.getItem('erp_logs') || '[]');
let inventory = JSON.parse(localStorage.getItem('erp_inventory') || 'null');

// 初始化庫存（第一次啟動從 data.js 載入）
if (!inventory) {
  inventory = {};
  ALL_ITEMS.forEach(item => { inventory[item.id] = item.qty; });
  saveInventory();
}

function saveInventory() {
  localStorage.setItem('erp_inventory', JSON.stringify(inventory));
}
function saveLogs() {
  localStorage.setItem('erp_logs', JSON.stringify(logs.slice(0, 500)));
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 30000);
  renderHome();
  renderFinished();
  renderMaterials();
  renderLogs();
  buildDemoButtons();
  registerSW();
  setTimeout(initInventoryPage, 100);
});

function updateClock() {
  const now = new Date();
  const d = now.toLocaleDateString('zh-TW', {month:'numeric',day:'numeric',weekday:'short'});
  const t = now.toLocaleTimeString('zh-TW', {hour:'2-digit',minute:'2-digit'});
  const el = document.getElementById('header-time');
  if (el) el.textContent = `${d} ${t}`;
}

// ----- Navigation -----
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  const nb = document.getElementById('nav-' + name);
  if (pg) pg.classList.add('active');
  if (nb) nb.classList.add('active');
  stopScan();
  window.scrollTo(0, 0);
  if (name !== 'pos') { const b = document.getElementById('event-pos-banner'); if(b) b.style.display='none'; }
  // 頁面進入時初始化
  if (name === 'sale-report'     && typeof initSaleReport     === 'function') initSaleReport();
  if (name === 'purchase-report' && typeof initPurchaseReport === 'function') initPurchaseReport();
  if (name === 'customers'       && typeof renderCustomerList === 'function') renderCustomerList('');
  if (name === 'estimate'        && typeof renderEstimateList === 'function') renderEstimateList('all');
  if (name === 'history'         && typeof renderLogsFiltered === 'function') renderLogsFiltered();
  if (name === 'process-track'   && typeof initProcessTrack  === 'function') initProcessTrack();
  if (name === 'events'          && typeof initEvents        === 'function') initEvents();
  if (name === 'finance'         && typeof initFinance       === 'function') initFinance();
  if (name === 'unpaid'          && typeof initUnpaid        === 'function') initUnpaid();
  if (name === 'admin-products'  && typeof renderAdminProducts=== 'function') renderAdminProducts();
  if (name === 'admin-suppliers' && typeof renderAdminSuppliers==='function') renderAdminSuppliers('');
  if (name === 'admin-bom'       && typeof renderBomList     === 'function') renderBomList('');
  if (name === 'event-detail' && typeof currentEventId !== 'undefined' && currentEventId) viewEvent(currentEventId);
}

// ----- HOME -----
function renderHome() {
  let ok = 0, low = 0, empty = 0;
  ALL_ITEMS.forEach(item => {
    const q = inventory[item.id] ?? item.qty;
    if (q <= 0) empty++;
    else if (q <= item.min) low++;
    else ok++;
  });
  document.getElementById('stat-ok').textContent = ok;
  document.getElementById('stat-low').textContent = low;
  document.getElementById('stat-empty').textContent = empty;

  const c = document.getElementById('alerts-container');
  const alerts = ALL_ITEMS
    .map(item => ({...item, q: inventory[item.id] ?? item.qty}))
    .filter(item => item.q <= item.min)
    .sort((a,b) => a.q - b.q)
    .slice(0, 6);

  if (alerts.length === 0) {
    c.innerHTML = '<div style="padding:14px;text-align:center;color:var(--text3);font-size:14px;">✅ 目前庫存狀況良好</div>';
    return;
  }
  c.innerHTML = alerts.map(item => {
    const cls = item.q <= 0 ? 'danger' : 'warn';
    const icon = item.q <= 0 ? 'ti-alert-circle' : 'ti-alert-triangle';
    const msg = item.q <= 0 ? `庫存為 0，請補貨！` : `剩 ${item.q} 個，快不夠了`;
    return `<div class="alert-item ${cls}"><i class="ti ${icon}"></i>${item.emoji} ${item.name}：${msg}</div>`;
  }).join('');
}

// ----- FINISHED PRODUCTS -----
function renderFinished() {
  const g = document.getElementById('grid-finished');
  const q = finSearch.toLowerCase();
  const items = FINISHED.filter(item => !q || item.name.toLowerCase().includes(q));
  g.innerHTML = items.map(item => productCard(item)).join('');
}

function filterItems(type, val) {
  if (type === 'finished') { finSearch = val; renderFinished(); }
  else { matSearch = val; renderMaterials(); }
}

// ----- MATERIALS -----
function renderMaterials() {
  const g = document.getElementById('grid-materials');
  const q = matSearch.toLowerCase();
  let items = MATERIALS;
  if (matTypeFilter !== 'all') items = items.filter(i => i.type === matTypeFilter);
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
  const shown = items.slice(0, 60);
  g.innerHTML = shown.map(item => productCard(item)).join('');
  if (items.length > 60) {
    g.innerHTML += `<div style="grid-column:1/-1;text-align:center;padding:10px;color:var(--text3);font-size:12px;">顯示 60 / ${items.length} 筆，請用搜尋找更多</div>`;
  }
}

function filterByType(type) {
  matTypeFilter = type;
  ['all','semi','pack'].forEach(t => {
    document.getElementById('ftab-'+t).classList.toggle('active', t === type);
  });
  renderMaterials();
}

function productCard(item) {
  const q = inventory[item.id] ?? item.qty;
  const cls = q <= 0 ? 'empty' : q <= item.min ? 'low' : 'ok';
  const tag = item.type === 'semi' ? '<span class="p-tag semi">半成品</span>'
            : item.type === 'pack' ? '<span class="p-tag pack">包材</span>' : '';
  return `<div class="product-card" onclick="quickInfo('${item.id}')">
    <div class="p-emoji">${item.emoji}</div>
    <div class="p-name">${item.name.replace(/（.*）/,'')}</div>
    <div class="p-id">${item.id}</div>
    <div class="p-qty ${cls}">${q}</div>
    <div class="p-unit">${tag || '個'}</div>
  </div>`;
}

function quickInfo(id) {
  const item = ALL_ITEMS.find(i => i.id === id);
  if (!item) return;
  const q = inventory[id] ?? item.qty;
  showToast(`${item.emoji} ${item.name} 庫存：${q} 個`);
}

// ----- HISTORY LOG -----
function renderLogs() {
  const c = document.getElementById('log-list');
  if (!logs.length) {
    c.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);">尚無操作記錄</div>';
    return;
  }
  const iconMap = { add:'ti-plus', take:'ti-minus', prod:'ti-player-play', ship:'ti-truck' };
  const clsMap  = { add:'in', take:'out', prod:'prod', ship:'out' };
  c.innerHTML = logs.slice().reverse().slice(0,100).map(log => `
    <div class="log-row">
      <div class="log-icon ${clsMap[log.op]||'in'}"><i class="ti ${iconMap[log.op]||'ti-edit'}"></i></div>
      <div class="log-text">
        <div class="log-name">${log.emoji||''} ${log.name}</div>
        <div class="log-time">${log.op_label} ・ ${log.time}</div>
      </div>
      <div class="log-qty ${log.op==='add'||log.op==='prod'?'pos':'neg'}">${log.op==='add'||log.op==='prod'?'+':'-'}${log.qty}</div>
    </div>`).join('');
}

function exportCSV() {
  if (!logs.length) { showToast('⚠️ 尚無記錄可匯出'); return; }
  const header = '時間,操作,品項編號,品項名稱,數量\n';
  const rows = logs.map(l => `${l.time},${l.op_label},${l.id},${l.name},${l.qty}`).join('\n');
  const blob = new Blob(['\uFEFF'+header+rows], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `庫存記錄_${new Date().toLocaleDateString('zh-TW')}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('✅ CSV 已下載！');
}

// ----- OPERATION FLOW -----
function startOp(op, section) {
  curOp = op; curItem = null; curBarcode = ''; numStr = '0';
  document.getElementById('op-title').textContent = OP_LABELS[op] || op;
  document.getElementById('barcodeInput').value = '';
  document.getElementById('itemFound').style.display = 'none';
  document.getElementById('notFound').style.display = 'none';
  document.getElementById('btn-to-step2').disabled = true;
  document.getElementById('qtyDisplay').textContent = '0';
  goStep(1);
  showPage('op');
}

function cancelOp() {
  stopScan();
  showPage('home');
}

function goStep(n) {
  ['op-step1','op-step2','op-step3'].forEach((id,i) => {
    document.getElementById(id).style.display = (i===n-1) ? 'block' : 'none';
  });
  for (let i=1; i<=3; i++) {
    const el = document.getElementById('op-s'+i);
    el.className = 'step-item' + (i < n ? ' done' : i === n ? ' active' : '');
  }
  if (n !== 1) stopScan();
  if (n === 3) fillConfirm();
  window.scrollTo(0,0);
}

// ----- BARCODE SCAN -----
function buildDemoButtons() {
  const demos = [
    {code:'F01-0001',label:'成品A'},
    {code:'F03-0003',label:'成品C(缺貨)'},
    {code:'S005-001',label:'半成品'},
    {code:'P002-001',label:'包材'},
  ];
  document.getElementById('demo-btns').innerHTML = demos.map(d =>
    `<button class="demo-btn" onclick="applyBarcode('${d.code}')">${d.code} ${d.label}</button>`
  ).join('');
}

function applyBarcode(code) {
  document.getElementById('barcodeInput').value = code;
  curBarcode = code;
  doLookup();
}

function onBarcodeType(val) {
  curBarcode = val;
}

function doLookup() {
  const code = curBarcode || document.getElementById('barcodeInput').value.trim();
  if (!code) return;
  curBarcode = code;
  const item = BARCODE_INDEX[code];
  if (item) {
    curItem = item;
    const q = inventory[item.id] ?? item.qty;
    document.getElementById('foundEmoji').textContent = item.emoji;
    document.getElementById('foundName').textContent = item.name;
    document.getElementById('foundCode').textContent = `條碼：${code}  |  編號：${item.id}`;
    document.getElementById('foundQty').textContent = q;
    document.getElementById('itemFound').style.display = 'flex';
    document.getElementById('notFound').style.display = 'none';
    document.getElementById('btn-to-step2').disabled = false;
    stopScan();
  } else {
    curItem = null;
    document.getElementById('itemFound').style.display = 'none';
    document.getElementById('notFound').style.display = 'flex';
    document.getElementById('btn-to-step2').disabled = true;
  }
}

// 相機掃碼
function toggleScan() {
  if (scanActive) { stopScan(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('⚠️ 此瀏覽器不支援相機，請手動輸入');
    return;
  }
  const box = document.getElementById('scanBox');
  const video = document.getElementById('scanVideo');
  const placeholder = document.getElementById('scanPlaceholder');
  const line = document.getElementById('scanLine');
  scanActive = true;
  box.classList.add('scanning');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      video.srcObject = stream;
      video.style.display = 'block';
      placeholder.style.display = 'none';
      line.style.display = 'block';
      video.play();
      scanLoop(video);
    })
    .catch(() => {
      showToast('⚠️ 無法開啟相機，請手動輸入條碼');
      stopScan();
    });
}

function scanLoop(video) {
  if (!scanActive) return;
  const canvas = document.getElementById('scanCanvas');
  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {inversionAttempts:'dontInvert'});
      if (code && code.data) {
        document.getElementById('barcodeInput').value = code.data;
        curBarcode = code.data;
        doLookup();
        stopScan();
        return;
      }
    }
  }
  animFrame = requestAnimationFrame(() => scanLoop(video));
}

function stopScan() {
  if (!scanActive) return;
  scanActive = false;
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  const video = document.getElementById('scanVideo');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  const box = document.getElementById('scanBox');
  const placeholder = document.getElementById('scanPlaceholder');
  const line = document.getElementById('scanLine');
  if (box) box.classList.remove('scanning');
  if (video) video.style.display = 'none';
  if (placeholder) placeholder.style.display = 'flex';
  if (line) line.style.display = 'none';
}

// ----- NUMPAD -----
function numPress(k) {
  if (k === 'del') {
    numStr = numStr.length > 1 ? numStr.slice(0, -1) : '0';
  } else if (k === '00') {
    if (numStr !== '0') numStr = numStr.length < 4 ? numStr + '00' : numStr;
  } else {
    if (numStr === '0') numStr = k;
    else if (numStr.length < 5) numStr += k;
  }
  document.getElementById('qtyDisplay').textContent = parseInt(numStr) || 0;
}

// ----- CONFIRM -----
function fillConfirm() {
  document.getElementById('c-op').textContent = OP_LABELS[curOp] || curOp;
  document.getElementById('c-item').textContent = curItem ? curItem.name : '—';
  document.getElementById('c-barcode').textContent = curBarcode;
  document.getElementById('c-qty').textContent = (parseInt(numStr) || 0) + ' 個';
}

function doConfirm() {
  if (!curItem) return;
  const qty = parseInt(numStr) || 0;
  if (qty <= 0) { showToast('⚠️ 請輸入數量'); goStep(2); return; }

  // 更新庫存
  const old = inventory[curItem.id] ?? 0;
  if (curOp === 'add' || curOp === 'prod') {
    inventory[curItem.id] = old + qty;
  } else {
    const newQty = Math.max(0, old - qty);
    inventory[curItem.id] = newQty;
  }
  saveInventory();

  // 記錄 log
  const now = new Date().toLocaleString('zh-TW', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  logs.push({ op:curOp, op_label:OP_LABELS[curOp], id:curItem.id, name:curItem.name, emoji:curItem.emoji, qty, time:now });
  saveLogs();

  // 重新渲染
  renderHome();
  renderFinished();
  renderMaterials();
  renderLogs();

  const msgs = { add:`✅ 已加入 ${qty} 個！`, take:`✅ 已取出 ${qty} 個！`, prod:`✅ 生產單建立！×${qty}`, ship:`✅ 出貨完成 ${qty} 個！` };
  showToast(msgs[curOp] || '✅ 完成！');
  setTimeout(() => showPage('home'), 1200);
}

// ----- UTILS -----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ----- PWA Service Worker -----
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ===== 架構輔助函式 =====
function comingSoon(name) {
  showToast(`🚧 「${name}」功能開發中，敬請期待！`);
}

function confirmResetInventory() {
  if (confirm('確定要重設所有庫存數量嗎？\n將會重新載入 data.js 的初始數量，此操作無法復原！')) {
    inventory = {};
    ALL_ITEMS.forEach(item => { inventory[item.id] = item.qty; });
    saveInventory();
    renderHome(); renderFinished(); renderMaterials();
    showToast('✅ 庫存已重設（套用 data.js 初始數量）');
  }
}

// ===== 權限攔截 =====
// 覆蓋 showPage，加入權限檢查
const _origShowPage = window.showPage;
window.showPage = function(name){
  // 需要主管以上的頁面
  const managerPages = ['admin','admin-products','admin-bom','admin-bom-edit',
    'admin-suppliers','admin-system','finance','unpaid','event-review'];
  // 需要管理員的頁面
  const adminPages = [];

  if(managerPages.includes(name) && !isManager()){
    showToast('⚠️ 權限不足');
    return;
  }
  if(adminPages.includes(name) && !isAdmin()){
    showToast('⚠️ 權限不足');
    return;
  }
  _origShowPage(name);
};

// 外展審核上傳需要主管
const _origInitReviewPage = window.initReviewPage;
window.initReviewPage = function(eventId){
  if(!isManager()){ showToast('⚠️ 權限不足'); return; }
  if(typeof _origInitReviewPage === 'function') _origInitReviewPage(eventId);
};

// 重設庫存需要管理員
const _origConfirmReset = window.confirmResetInventory;
window.confirmResetInventory = function(){
  if(!isAdmin()){ showToast('⚠️ 權限不足'); return; }
  _origConfirmReset();
};
