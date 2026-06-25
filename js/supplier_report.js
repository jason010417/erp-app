// supplier_report.js — 廠商銷售報表（寄賣結算）

function initSupplierReportPage(){
  const page = document.getElementById('page-supplier-report');
  if(!page) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('sales-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-building-store" style="color:var(--purple);"></i> 廠商銷售報表</div>
      <button class="small-btn" onclick="exportSupplierReport()"><i class="ti ti-download"></i> 匯出</button>
    </div>
    <div class="form-card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="cust-field"><label>廠商</label>
          <select id="spr-supplier" onchange="renderSupplierReport()">
            <option value="">全部廠商</option>
            ${SUPPLIERS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="cust-field"><label>合作方式</label>
          <select id="spr-type" onchange="renderSupplierReport()">
            <option value="">全部</option>
            <option value="consignment">僅寄賣</option>
          </select>
        </div>
        <div class="cust-field"><label>開始日期</label>
          <input type="date" id="spr-date-from" onchange="renderSupplierReport()" /></div>
        <div class="cust-field"><label>結束日期</label>
          <input type="date" id="spr-date-to" onchange="renderSupplierReport()" /></div>
      </div>
    </div>
    <div id="spr-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;"></div>
    <div id="spr-list"></div>`;
  renderSupplierReport();
}

function renderSupplierReport(){
  const supFilter  = document.getElementById('spr-supplier')?.value || '';
  const typeFilter = document.getElementById('spr-type')?.value || '';
  const dateFrom   = document.getElementById('spr-date-from')?.value || '';
  const dateTo     = document.getElementById('spr-date-to')?.value || '';

  let rows = logs.filter(l =>
    (l.op === 'pos_sale' && !l.eventId) || l.op === 'order_ship'
  );
  if(typeof filterLogsByDate === 'function') rows = filterLogsByDate(rows, dateFrom, dateTo);

  const bySupplier = {};
  rows.forEach(l => {
    const item = typeof getItem === 'function' ? getItem(l.productId) : null;
    if(!item) return;
    const supId = item.supplierId || 'unknown';
    if(supFilter && supId !== supFilter) return;
    const sup = SUPPLIERS.find(s => s.id === supId);
    const extra = sup ? JSON.parse(localStorage.getItem('erp_sup_' + supId) || '{}') : {};
    if(typeFilter === 'consignment' && extra.consignmentType !== 'consignment') return;
    if(!bySupplier[supId]) bySupplier[supId] = { sup, extra, items: [], totalAmt: 0, totalQty: 0 };
    bySupplier[supId].items.push(l);
    bySupplier[supId].totalAmt += (l.amount||0);
    bySupplier[supId].totalQty += (l.qty||0);
  });

  const groups = Object.values(bySupplier).sort((a,b) => b.totalAmt - a.totalAmt);
  const grandTotal = groups.reduce((s,g) => s + g.totalAmt, 0);
  const grandQty   = groups.reduce((s,g) => s + g.totalQty, 0);

  const statsEl = document.getElementById('spr-stats');
  if(statsEl) statsEl.innerHTML = `
    <div class="report-stat"><div class="rs-num">${groups.length}</div><div class="rs-label">廠商數</div></div>
    <div class="report-stat"><div class="rs-num">${grandQty}</div><div class="rs-label">總數量</div></div>
    <div class="report-stat"><div class="rs-num" style="color:var(--purple);">${fmtMoney(grandTotal)}</div><div class="rs-label">總銷售額</div></div>`;

  const listEl = document.getElementById('spr-list');
  if(!listEl) return;
  if(!groups.length){ listEl.innerHTML = '<div class="order-empty">沒有符合的記錄</div>'; return; }

  listEl.innerHTML = groups.map(g => {
    const supName = g.sup?.name || '未知廠商';
    const isConsignment = g.extra?.consignmentType === 'consignment';
    const itemMap = {};
    g.items.forEach(l => {
      if(!itemMap[l.productId]) itemMap[l.productId] = { name: l.productName, emoji: l.emoji||'', qty:0, amt:0 };
      itemMap[l.productId].qty += (l.qty||0);
      itemMap[l.productId].amt += (l.amount||0);
    });
    const itemRows = Object.values(itemMap).sort((a,b) => b.amt - a.amt);
    return `<div class="list-card" style="margin-bottom:12px;">
      <div class="list-card-top">
        <span class="list-card-no">${supName}</span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${isConsignment ? `<span class="status-badge badge-pending" style="font-size:10px;">寄賣</span>` : ''}
          <span style="font-weight:700;color:var(--purple);">${fmtMoney(g.totalAmt)}</span>
        </div>
      </div>
      <div style="margin-top:8px;">
        ${itemRows.map(it => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span>${it.emoji} ${it.name}</span>
            <span style="color:var(--text2);">×${it.qty} &nbsp; ${fmtMoney(it.amt)}</span>
          </div>`).join('')}
      </div>
      ${isConsignment ? `
        <div style="margin-top:8px;padding:6px 10px;background:var(--amber-light);border-radius:6px;font-size:12px;color:var(--amber);">
          <i class="ti ti-receipt"></i> 寄賣應付：<strong>${fmtMoney(g.totalAmt)}</strong>（需依合約比例計算）
        </div>` : ''}
    </div>`;
  }).join('');
}

function exportSupplierReport(){
  const dateFrom = document.getElementById('spr-date-from')?.value || '';
  const dateTo   = document.getElementById('spr-date-to')?.value || '';
  let rows = logs.filter(l =>
    (l.op === 'pos_sale' && !l.eventId) || l.op === 'order_ship'
  );
  if(typeof filterLogsByDate === 'function') rows = filterLogsByDate(rows, dateFrom, dateTo);

  const csvRows = [['廠商ID','廠商名稱','合作方式','商品ID','商品名稱','數量','金額','時間']];
  rows.forEach(l => {
    const item  = typeof getItem === 'function' ? getItem(l.productId) : null;
    const supId = item?.supplierId || '';
    const sup   = SUPPLIERS.find(s => s.id === supId);
    const extra = sup ? JSON.parse(localStorage.getItem('erp_sup_' + supId) || '{}') : {};
    csvRows.push([
      supId, sup?.name||'', extra.consignmentType==='consignment'?'寄賣':'買斷',
      l.productId||'', l.productName||'', l.qty||0, l.amount||0, l.time||''
    ]);
  });

  const csv  = csvRows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`廠商銷售報表_${todayStr()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV 已下載');
}
