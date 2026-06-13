// ============================================================
// utils.js — 共用工具函式
// ============================================================

// ── 日期時間 ──
function todayStr(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nowStr(){
  const d = new Date();
  return d.toLocaleString('zh-TW', {
    month:  'numeric',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function fmtDate(dateStr){
  if(!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function fmtDateFull(dateStr){
  if(!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

function addDays(dateStr, n){
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

// ── 單號產生 ──
function genNo(prefix, existingList, noField = 'no'){
  const d  = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0');
  const pre = `${prefix}${ym}-`;
  const same = (existingList || []).filter(x => x[noField]?.startsWith(pre)).length;
  return pre + String(same + 1).padStart(3, '0');
}

// ── 格式化金額 ──
function fmtMoney(n){
  if(isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString();
}

// ── Toast 提示 ──
function showToast(msg, duration = 2000){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

// ── 確認對話框（Promise 版）──
function confirmDialog(msg){
  return new Promise(resolve => resolve(confirm(msg)));
}

// ── 深拷貝 ──
function deepCopy(obj){
  return JSON.parse(JSON.stringify(obj));
}

// ── 計算折扣後金額 ──
function calcItemTotal(originalPrice, qty, unitPrice){
  // unitPrice 可能是被改過的單品價格
  const price = unitPrice ?? originalPrice;
  return price * qty;
}

function calcOrderTotal(items, orderDiscount){
  const subtotal = items.reduce((s, item) => {
    return s + calcItemTotal(item.originalPrice, item.qty, item.unitPrice);
  }, 0);

  if(!orderDiscount) return subtotal;

  if(orderDiscount.type === 'percent'){
    return Math.round(subtotal * (1 - orderDiscount.value / 100));
  }
  if(orderDiscount.type === 'amount'){
    return Math.max(0, subtotal - orderDiscount.value);
  }
  return subtotal;
}

// ── 折扣說明文字 ──
function discountLabel(discount){
  if(!discount) return '';
  if(discount.type === 'percent') return `${discount.value}% off`;
  if(discount.type === 'amount')  return `折 $${discount.value}`;
  return '';
}

// ── 分頁顯示 ──
function showPage(name){
  // 攔截：權限檢查
  if(typeof canAccess === 'function' && !canAccess(name)){
    showToast('⚠️ 權限不足');
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if(pg) pg.classList.add('active');
  window.scrollTo(0, 0);

  // 觸發各頁面初始化
  const initMap = {
    'inventory':       () => typeof renderInventoryPage    === 'function' && renderInventoryPage(),
    'estimates':       () => typeof renderEstimateList     === 'function' && renderEstimateList('all'),
    'orders':          () => typeof renderOrderList        === 'function' && renderOrderList('all'),
    'production':      () => typeof renderProductionList   === 'function' && renderProductionList('all'),
    'events':          () => typeof renderEventList        === 'function' && renderEventList(),
    'customers':       () => typeof renderCustomerList     === 'function' && renderCustomerList(),
    'finance':         () => typeof renderFinance          === 'function' && renderFinance(),
    'unpaid':          () => typeof renderUnpaid           === 'function' && renderUnpaid(),
    'sale-report':     () => typeof renderSaleReport       === 'function' && renderSaleReport(),
    'purchase-report': () => typeof renderPurchaseReport   === 'function' && renderPurchaseReport(),
    'admin-products':  () => typeof renderAdminProducts    === 'function' && renderAdminProducts(),
    'admin-bom':       () => typeof renderBomList          === 'function' && renderBomList(''),
    'admin-suppliers': () => typeof renderAdminSuppliers   === 'function' && renderAdminSuppliers(''),
    'admin-locations': () => typeof renderLocationList     === 'function' && renderLocationList(),
    'purchase':        () => typeof initPurchasePage       === 'function' && initPurchasePage(),
    'purchase-edit':   () => {},
    'transfer':        () => typeof renderTransferList     === 'function' && renderTransferList(),
    'pos-a':           () => typeof initPOS                === 'function' && initPOS(),
    'store-b-sales':   () => typeof initStoreBPage         === 'function' && initStoreBPage(),
    'events':          () => typeof renderEventList        === 'function' && renderEventList(),
    'event-detail':    () => {},
    'sale-report':     () => typeof initSaleReportPage     === 'function' && initSaleReportPage(),
    'purchase-report': () => typeof initPurchaseReportPage === 'function' && initPurchaseReportPage(),
    'finance':         () => typeof initFinancePage        === 'function' && initFinancePage(),
    'unpaid':          () => typeof initUnpaidPage         === 'function' && initUnpaidPage(),
    'admin-products':  () => typeof initAdminProductsPage  === 'function' && initAdminProductsPage(),
    'admin-bom':       () => typeof initAdminBomPage       === 'function' && initAdminBomPage(),
    'admin-suppliers': () => typeof initAdminSuppliersPage === 'function' && initAdminSuppliersPage(),
    'admin-locations': () => typeof initLocationPage       === 'function' && initLocationPage(),
    'admin-import':    () => typeof initImportPage         === 'function' && initImportPage(),
    'production':      () => typeof renderProductionList   === 'function' && renderProductionList('all'),
  };
  if(initMap[name]) initMap[name]();
}

// ── 角色下拉 ──
function toggleRoleMenu(){
  const dd = document.getElementById('role-dropdown');
  if(!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  if(!isOpen){
    const cur = document.getElementById('role-dropdown-current');
    if(cur){
      const labels = { operator:'👷 目前：操作員', manager:'👔 目前：主管', admin:'👑 目前：管理員' };
      cur.textContent = labels[currentRole()] || '';
    }
    // 點外面關閉
    setTimeout(() => {
      document.addEventListener('click', function closeDD(e){
        if(!document.getElementById('role-dropdown-wrap')?.contains(e.target)){
          dd.style.display = 'none';
          document.removeEventListener('click', closeDD);
        }
      });
    }, 10);
  }
}

function escalateRole(targetRole){
  document.getElementById('role-dropdown').style.display = 'none';
  if(targetRole === 'manager' && isManager()){
    showToast('已是主管模式'); return;
  }
  if(targetRole === 'admin' && isAdmin()){
    showToast('已是管理員模式'); return;
  }
  openEscalateModal(targetRole, null,
    targetRole === 'admin' ? '切換為管理員模式' : '切換為主管模式');
}

// ── 底部導覽列高亮 ──
function updateNavActive(pageName){
  const navMap = {
    'home':         'nav-home',
    'factory-menu': 'nav-factory',
    'inventory':    'nav-inventory',
    'sales-menu':   'nav-sales',
    'admin':        'nav-admin',
  };
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navId = navMap[pageName];
  if(navId) document.getElementById(navId)?.classList.add('active');
}

// 覆寫 showPage 加入 nav 高亮
const _origShowPage = window.showPage;
if(_origShowPage){
  window.showPage = function(name){
    _origShowPage(name);
    updateNavActive(name);
  };
}

// 初始化：第一次渲染首頁
document.addEventListener('DOMContentLoaded', () => {
  // 確保所有模組都載入完後才渲染首頁
  setTimeout(() => {
    renderHome();
    renderInventorySummary();
    updateNavActive('home');
  }, 300);
});

// ── 照片放大 lightbox ──
function showFullImage(src){
  let overlay = document.getElementById('lightbox-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<img src="${src}" />`;
  overlay.style.display = 'flex';
}

// ── 長按持續增減 ──
let _lpTimer = null, _lpInterval = null;
function startLongPress(idx, delta, ctx){
  stopLongPress();
  // 長按 600ms 後開始連續觸發
  _lpTimer = setTimeout(() => {
    _lpInterval = setInterval(() => {
      if(ctx === 'ev' && typeof changeEvItemQty === 'function') changeEvItemQty(idx, delta);
    }, 80);
  }, 600);
}
function stopLongPress(){
  if(_lpTimer)    { clearTimeout(_lpTimer);    _lpTimer    = null; }
  if(_lpInterval) { clearInterval(_lpInterval); _lpInterval = null; }
}
