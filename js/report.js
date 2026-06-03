// ===== 銷貨明細 + 進貨明細查詢 =====

// ── 銷貨相關操作類型 ──
const SALE_OPS     = ['ship', 'POS出售', 'pos'];
const PURCHASE_OPS = ['add', 'purchase', '進貨'];

// ── 頁面初始化（每次進入時呼叫）──
function initSaleReport(){
  // 填入客戶下拉
  const sel = document.getElementById('sale-filter-customer');
  sel.innerHTML = '<option value="">全部客戶</option>';
  // 從 estimate.js 共用的 customers 陣列
  if(typeof customers !== 'undefined'){
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name;
      sel.appendChild(opt);
    });
  }
  renderSaleReport();
}

function initPurchaseReport(){
  // 填入廠商下拉
  const sel = document.getElementById('purchase-filter-supplier');
  sel.innerHTML = '<option value="">全部廠商</option>';
  SUPPLIERS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    sel.appendChild(opt);
  });
  renderPurchaseReport();
}

// ── 銷貨明細渲染 ──
function renderSaleReport(){
  const custFilter = document.getElementById('sale-filter-customer').value;
  const itemFilter = document.getElementById('sale-filter-item').value.trim().toLowerCase();
  const dateFrom   = document.getElementById('sale-date-from').value;
  const dateTo     = document.getElementById('sale-date-to').value;

  // 篩選：op 為 ship / POS出售 的記錄
  let rows = logs.filter(l =>
    l.op === 'ship' || l.op_label === 'POS出售' || l.op_label === '出貨'
  );

  // 客戶篩選（估價單轉出貨時會帶 customerId）
  if(custFilter){
    rows = rows.filter(l => l.customerId === custFilter);
  }

  // 品項篩選
  if(itemFilter){
    rows = rows.filter(l =>
      (l.name||'').toLowerCase().includes(itemFilter) ||
      (l.id||'').toLowerCase().includes(itemFilter)
    );
  }

  // 日期篩選
  rows = filterByDate(rows, dateFrom, dateTo);

  // 統計
  const totalQty   = rows.reduce((s,l) => s + (l.qty||0), 0);
  const totalItems = rows.length;
  renderReportStats('sale-stats', totalItems, totalQty, null, '#BA7517');

  // 渲染列表
  renderReportList('sale-report-list', rows, 'sale');
}

// ── 進貨明細渲染 ──
function renderPurchaseReport(){
  const supFilter  = document.getElementById('purchase-filter-supplier').value;
  const itemFilter = document.getElementById('purchase-filter-item').value.trim().toLowerCase();
  const dateFrom   = document.getElementById('purchase-date-from').value;
  const dateTo     = document.getElementById('purchase-date-to').value;

  // 篩選：op 為 add / 進貨 的記錄
  let rows = logs.filter(l =>
    l.op === 'add' || l.op_label === '進貨' || l.op_label === '加入庫存'
  );

  // 廠商篩選
  if(supFilter){
    rows = rows.filter(l => l.supplierId === supFilter);
  }

  // 品項篩選
  if(itemFilter){
    rows = rows.filter(l =>
      (l.name||'').toLowerCase().includes(itemFilter) ||
      (l.id||'').toLowerCase().includes(itemFilter)
    );
  }

  // 日期篩選
  rows = filterByDate(rows, dateFrom, dateTo);

  // 統計
  const totalQty   = rows.reduce((s,l) => s + (l.qty||0), 0);
  const totalItems = rows.length;
  renderReportStats('purchase-stats', totalItems, totalQty, null, '#1D9E75');

  // 渲染列表
  renderReportList('purchase-report-list', rows, 'purchase');
}

// ── 工具：日期篩選 ──
function filterByDate(rows, from, to){
  if(!from && !to) return rows;
  return rows.filter(l => {
    if(!l.time) return true;
    // time 格式：M/D HH:MM，需要加年份比較
    const year = new Date().getFullYear();
    // 嘗試解析
    try {
      const parts = l.time.match(/(\d+)\/(\d+)/);
      if(!parts) return true;
      const m = parts[1].padStart(2,'0');
      const d = parts[2].padStart(2,'0');
      const dateStr = `${year}-${m}-${d}`;
      if(from && dateStr < from) return false;
      if(to   && dateStr > to)   return false;
    } catch(e){ return true; }
    return true;
  });
}

// ── 統計列 ──
function renderReportStats(elId, totalItems, totalQty, totalAmt, color){
  const el = document.getElementById(elId);
  el.innerHTML = `
    <div class="report-stat-item">
      <div class="report-stat-num" style="color:${color}">${totalItems}</div>
      <div class="report-stat-label">筆記錄</div>
    </div>
    <div class="report-stat-item">
      <div class="report-stat-num" style="color:${color}">${totalQty}</div>
      <div class="report-stat-label">總數量</div>
    </div>
    ${totalAmt!==null ? `
    <div class="report-stat-item">
      <div class="report-stat-num" style="color:${color}">$${totalAmt}</div>
      <div class="report-stat-label">總金額</div>
    </div>` : ''}`;
}

// ── 記錄列表 ──
function renderReportList(elId, rows, type){
  const el = document.getElementById(elId);
  if(!rows.length){
    el.innerHTML = '<div class="report-empty">沒有符合條件的記錄</div>';
    return;
  }

  // 最新的在最上面
  const sorted = rows.slice().reverse();

  el.innerHTML = sorted.map(l => {
    const isOut = type === 'sale';
    const iconCls = isOut ? 'ti-truck' : 'ti-truck-loading';
    const dotColor = isOut ? '#BA7517' : '#1D9E75';

    // 附加資訊：客戶或廠商
    let extra = '';
    if(type === 'sale' && l.customerId && typeof customers !== 'undefined'){
      const c = customers.find(x=>x.id===l.customerId);
      if(c) extra = `<span class="report-tag customer-tag"><i class="ti ti-user"></i>${c.name}</span>`;
    }
    if(type === 'purchase' && l.supplierId){
      const s = SUPPLIERS.find(x=>x.id===l.supplierId);
      if(s) extra = `<span class="report-tag supplier-tag"><i class="ti ti-building-store"></i>${s.name}</span>`;
    }

    return `
      <div class="report-row">
        <div class="report-dot" style="background:${dotColor}"></div>
        <div class="report-row-info">
          <div class="report-row-name">${l.emoji||''} ${l.name||'—'}</div>
          <div class="report-row-meta">
            <span class="report-id">${l.id||''}</span>
            ${extra}
            <span class="report-time"><i class="ti ti-clock"></i>${l.time||'—'}</span>
          </div>
        </div>
        <div class="report-row-right">
          <div class="report-row-qty" style="color:${dotColor}">
            ${isOut ? '-' : '+'}${l.qty||0}
          </div>
          <div class="report-row-unit">個</div>
        </div>
      </div>`;
  }).join('');
}

// ── 清除篩選 ──
function clearReportFilter(type){
  if(type === 'sale'){
    document.getElementById('sale-filter-customer').value = '';
    document.getElementById('sale-filter-item').value     = '';
    document.getElementById('sale-date-from').value       = '';
    document.getElementById('sale-date-to').value         = '';
    renderSaleReport();
  } else {
    document.getElementById('purchase-filter-supplier').value = '';
    document.getElementById('purchase-filter-item').value     = '';
    document.getElementById('purchase-date-from').value       = '';
    document.getElementById('purchase-date-to').value         = '';
    renderPurchaseReport();
  }
}

// ── 匯出 CSV ──
function exportReport(type){
  const rows = type === 'sale'
    ? logs.filter(l => l.op==='ship' || l.op_label==='POS出售' || l.op_label==='出貨')
    : logs.filter(l => l.op==='add'  || l.op_label==='進貨'    || l.op_label==='加入庫存');

  if(!rows.length){ showToast('⚠️ 沒有記錄可匯出'); return; }

  const header = type === 'sale'
    ? '時間,品項編號,品項名稱,數量,客戶\n'
    : '時間,品項編號,品項名稱,數量,廠商\n';

  const body = rows.map(l => {
    let extra = '';
    if(type === 'sale' && l.customerId && typeof customers !== 'undefined'){
      const c = customers.find(x=>x.id===l.customerId);
      extra = c ? c.name : '';
    }
    if(type === 'purchase' && l.supplierId){
      const s = SUPPLIERS.find(x=>x.id===l.supplierId);
      extra = s ? s.name : '';
    }
    return `${l.time||''},${l.id||''},${l.name||''},${l.qty||0},${extra}`;
  }).join('\n');

  const blob = new Blob(['\uFEFF' + header + body], {type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const fname = type === 'sale' ? '銷貨明細' : '進貨明細';
  a.href = url;
  a.download = `${fname}_${new Date().toLocaleDateString('zh-TW')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV 已下載！');
}

// ── 升級記錄頁（加入操作標籤篩選）──
let historyFilter = 'all';
function setHistoryFilter(f){
  historyFilter = f;
  ['hf-all','hf-purchase','hf-sale','hf-prod'].forEach(id=>{
    document.getElementById(id)?.classList.remove('active');
  });
  document.getElementById('hf-'+f)?.classList.add('active');
  renderLogsFiltered();
}
function renderLogsFiltered(){
  const c = document.getElementById('log-list');
  if(!c) return;
  let items = logs.slice().reverse();
  if(historyFilter === 'purchase') items = items.filter(l => l.op==='add' || l.op_label==='進貨');
  if(historyFilter === 'sale')     items = items.filter(l => l.op==='ship'|| l.op_label==='POS出售'|| l.op_label==='出貨');
  if(historyFilter === 'prod')     items = items.filter(l => l.op==='prod');
  if(!items.length){
    c.innerHTML='<div class="order-empty" style="padding:20px;text-align:center;color:var(--text3);">沒有符合的記錄</div>';
    return;
  }
  const iconMap  = {add:'ti-plus',take:'ti-minus',prod:'ti-player-play',ship:'ti-truck'};
  const clsMap   = {add:'in',take:'out',prod:'prod',ship:'out'};
  c.innerHTML = items.slice(0,100).map(l=>`
    <div class="log-row">
      <div class="log-icon ${clsMap[l.op]||'in'}"><i class="ti ${iconMap[l.op]||'ti-edit'}"></i></div>
      <div class="log-text">
        <div class="log-name">${l.emoji||''} ${l.name}</div>
        <div class="log-time">${l.op_label} ・ ${l.time}</div>
      </div>
      <div class="log-qty ${l.op==='add'||l.op==='prod'?'pos':'neg'}">${l.op==='add'||l.op==='prod'?'+':'-'}${l.qty}</div>
    </div>`).join('');
}
