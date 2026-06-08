// ============================================================
// home.js — 首頁儀表板
// ============================================================

function renderHome(){
  renderInventorySummary();
  renderHomePendingOrders();
  renderHomeTodaySales();
}

// ── 待處理訂單 ──
function renderHomePendingOrders(){
  const el = document.getElementById('home-pending-orders');
  if(!el) return;

  const pending = (typeof orders !== 'undefined' ? orders : [])
    .filter(o => ['pending','producing','ready'].includes(o.status))
    .slice(0,5);

  if(!pending.length){
    el.innerHTML = `<div class="inv-ok"><i class="ti ti-circle-check"></i> 沒有待處理訂單</div>`;
    return;
  }

  const statusLabels = {
    pending:   '待處理',
    producing: '生產中',
    ready:     '待出貨',
  };
  const statusCls = {
    pending:   'badge-pending',
    producing: 'badge-active',
    ready:     'badge-done',
  };

  el.innerHTML = pending.map(o => `
    <div class="inv-warn-row" onclick="showOrderDetail('${o.id}')">
      <div>
        <div style="font-size:14px;font-weight:600;">${o.no}</div>
        <div style="font-size:12px;color:var(--text3);">${getCustomer(o.customerId)?.name || '—'}</div>
      </div>
      <div style="text-align:right;">
        <span class="status-badge ${statusCls[o.status]}">${statusLabels[o.status]}</span>
        ${o.deliveryDate ? `<div style="font-size:11px;color:var(--text3);margin-top:3px;">交期 ${fmtDate(o.deliveryDate)}</div>` : ''}
      </div>
    </div>`).join('');
}

// ── 今日銷售 ──
function renderHomeTodaySales(){
  const el = document.getElementById('home-today-sales');
  if(!el) return;

  const today = todayStr();
  const todayLogs = (typeof logs !== 'undefined' ? logs : []).filter(l => {
    if(!l.time) return false;
    const parts = l.time.match(/(\d+)\/(\d+)/);
    if(!parts) return false;
    const m = String(parts[1]).padStart(2,'0');
    const d = String(parts[2]).padStart(2,'0');
    return today.endsWith(`-${m}-${d}`) &&
      ['pos_sale','order_ship','event_sale'].includes(l.op);
  });

  // 計算今日金額
  const totalAmt = todayLogs.reduce((s,l) => {
    const item = getItem(l.productId);
    return s + (item?.salePrice || 0) * (l.qty || 0);
  }, 0);
  const txCount = [...new Set(todayLogs.map(l => l._ts ? Math.floor(l._ts/1000) : l.time))].length;

  el.innerHTML = `
    <div class="form-card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="text-align:center;padding:12px;background:var(--amber-light);border-radius:var(--radius-sm);">
          <div style="font-size:26px;font-weight:700;color:var(--amber);">$${totalAmt.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">今日銷售額</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--green-light);border-radius:var(--radius-sm);">
          <div style="font-size:26px;font-weight:700;color:var(--green);">${txCount}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;">交易筆數</div>
        </div>
      </div>
    </div>`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderHome, 200);
});
