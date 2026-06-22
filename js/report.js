// ============================================================
// report.js — 報表：銷貨明細、進貨明細、財務總覽、週報
// ============================================================

// ════════════════════════════════
// 銷貨明細
// ════════════════════════════════
function renderSaleReport(){
  const page = document.getElementById('page-sale-report');
  if(!page) return;
  const custId  = document.getElementById('sr-customer')?.value  || '';
  const itemQ   = document.getElementById('sr-item')?.value.trim() || '';
  const dateFrom= document.getElementById('sr-date-from')?.value  || '';
  const dateTo  = document.getElementById('sr-date-to')?.value    || '';

  // 門市 POS（排除外展個別銷售，改用外展結算彙總顯示）+ 訂單出貨 + 外展結算
  let rows = logs.filter(l =>
    (l.op === 'pos_sale' && !l.eventId) ||
    l.op === 'order_ship' ||
    l.op === 'event_settle'
  );
  if(custId)  rows = rows.filter(l => l.customerId === custId || l.op === 'event_settle');
  if(itemQ)   rows = rows.filter(l =>
    l.productName?.toLowerCase().includes(itemQ.toLowerCase()) ||
    l.productId?.toLowerCase().includes(itemQ.toLowerCase()) ||
    l.eventName?.toLowerCase().includes(itemQ.toLowerCase()));
  rows = filterLogsByDate(rows, dateFrom, dateTo);

  const totalQty = rows.reduce((s,l)=>s+(l.qty||0),0);
  const totalAmt = rows.reduce((s,l)=>s+(l.amount||0),0);

  document.getElementById('sr-stats').innerHTML = `
    <div class="report-stat"><div class="rs-num" style="color:var(--purple);">${rows.length}</div><div class="rs-label">筆記錄</div></div>
    <div class="report-stat"><div class="rs-num">${totalQty}</div><div class="rs-label">總數量</div></div>
    <div class="report-stat"><div class="rs-num" style="color:var(--purple);">${fmtMoney(totalAmt)}</div><div class="rs-label">總金額</div></div>`;

  document.getElementById('sr-list').innerHTML = rows.length
    ? rows.slice().reverse().map(l => {
        if(l.op === 'event_settle'){
          const breakdown = (l.items||[]).map(i=>`${i.productName} x${i.qty}`).join('、');
          return `<div class="inv-warn-row" style="cursor:pointer;" onclick="showEventDetail('${l.eventId}')">
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:600;"><i class="ti ti-map-pin" style="color:var(--purple);margin-right:4px;"></i>${l.eventName||''} 外展結算</div>
              <div style="font-size:12px;color:var(--text3);">${l.time||'—'}${breakdown?'・'+breakdown:''}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:16px;font-weight:700;color:var(--purple);">${fmtMoney(l.amount||0)}</div>
              <div style="font-size:12px;color:var(--text3);">${l.qty||0} 個</div>
            </div>
          </div>`;
        }
        const cust    = l.customerId ? getCustomer(l.customerId) : null;
        const editBtn = l._ts
          ? `<button style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 9px;color:var(--text2);font-size:13px;flex-shrink:0;cursor:pointer;margin-left:8px;"
              onclick="event.stopPropagation();requireManager(()=>openEditSaleModal(${l._ts}),'修改記錄需要主管驗證')">
              <i class="ti ti-pencil"></i>
            </button>`
          : '';
        return `<div class="inv-warn-row" style="cursor:default;">
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:600;">${l.emoji||''} ${l.productName||'—'}</div>
            <div style="font-size:12px;color:var(--text3);">
              ${cust?cust.name+' ・ ':''}${l.time||'—'}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:16px;font-weight:700;color:var(--purple);">${fmtMoney(l.amount||0)}</div>
            <div style="font-size:12px;color:var(--text3);">${l.qty||0} 個</div>
          </div>
          ${editBtn}
        </div>`;
      }).join('')
    : '<div class="order-empty">沒有符合的記錄</div>';
}

function initSaleReportPage(){
  const page = document.getElementById('page-sale-report');
  if(!page||page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('sales-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-chart-bar" style="color:var(--amber);"></i> 銷貨明細</div>
      <button class="small-btn" onclick="exportSaleReport()"><i class="ti ti-download"></i> 匯出</button>
    </div>
    <div class="form-card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="cust-field"><label>客戶</label>
          <select id="sr-customer" onchange="renderSaleReport()">
            <option value="">全部客戶</option>
            ${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
          </select></div>
        <div class="cust-field"><label>品項</label>
          <input type="search" id="sr-item" placeholder="品名或編號..."
            oninput="renderSaleReport()" /></div>
        <div class="cust-field"><label>開始日期</label>
          <input type="date" id="sr-date-from" onchange="renderSaleReport()" /></div>
        <div class="cust-field"><label>結束日期</label>
          <input type="date" id="sr-date-to" onchange="renderSaleReport()" /></div>
      </div>
      <button onclick="clearReportFilter('sale')"
        style="width:100%;padding:8px;font-size:13px;background:var(--bg);
        color:var(--text2);border:1px solid var(--border);border-radius:6px;margin-top:4px;">
        <i class="ti ti-x"></i> 清除篩選
      </button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;" id="sr-stats"></div>
    <div id="sr-list"></div>`;
  renderSaleReport();
}

// ════════════════════════════════
// 進貨明細
// ════════════════════════════════
function renderPurchaseReport(){
  const supId   = document.getElementById('pr-supplier')?.value  || '';
  const itemQ   = document.getElementById('pr-item')?.value.trim() || '';
  const dateFrom= document.getElementById('pr-date-from')?.value  || '';
  const dateTo  = document.getElementById('pr-date-to')?.value    || '';

  let list = purchases;
  if(supId) list = list.filter(p => p.supplierId === supId);
  if(dateFrom||dateTo) list = list.filter(p => {
    if(dateFrom && p.createdAt < dateFrom) return false;
    if(dateTo   && p.createdAt > dateTo)   return false;
    return true;
  });

  const totalCost = list.reduce((s,p)=>s+(p.totalCost||0),0);
  document.getElementById('pr-stats').innerHTML = `
    <div class="report-stat"><div class="rs-num">${list.length}</div><div class="rs-label">筆進貨</div></div>
    <div class="report-stat"><div class="rs-num" style="color:var(--green);">${fmtMoney(totalCost)}</div><div class="rs-label">進貨金額</div></div>`;

  const unpaidTotal = list
    .filter(p => (p.status==='ordered'||p.status==='received'||p.status==='completed') && p.payStatus!=='paid')
    .reduce((s,p)=>s+(p.totalCost||0),0);
  const unpaidEl = document.getElementById('pr-unpaid-stat');
  if(unpaidEl) unpaidEl.innerHTML = unpaidTotal
    ? `<div class="report-stat"><div class="rs-num" style="color:var(--red);">${fmtMoney(unpaidTotal)}</div><div class="rs-label">未付款金額</div></div>`
    : '';

  document.getElementById('pr-list').innerHTML = list.length
    ? list.slice().reverse().map(pu => {
        const sup     = SUPPLIERS.find(s=>s.id===pu.supplierId);
        const showPay = pu.status==='ordered'||pu.status==='received'||pu.status==='completed';
        const payBadge= showPay
          ? (pu.payStatus==='paid'
              ? `<span class="status-badge pay-badge-paid">已付款</span>`
              : `<span class="status-badge pay-badge-unpaid">未付款</span>`)
          : '';
        const statusMap = { draft:'草稿', ordered:'待收貨', received:'已入庫', completed:'已入庫', cancelled:'已取消' };
        return `<div class="list-card" style="margin-bottom:8px;cursor:pointer;"
          onclick="showPurchaseDetail&&showPurchaseDetail('${pu.id}')">
          <div class="list-card-top">
            <span class="list-card-no">${pu.no}</span>
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:11px;color:var(--text3);">${statusMap[pu.status]||''}</span>
              ${payBadge}
            </div>
          </div>
          <div class="list-card-meta">
            ${sup?`<span><i class="ti ti-building-store"></i>${sup.name}</span>`:''}
            <span><i class="ti ti-package"></i>${pu.items.length} 種</span>
            <span><i class="ti ti-calendar"></i>${fmtDate(pu.createdAt)}</span>
          </div>
          <div class="list-card-footer">
            <span>${pu.items.slice(0,2).map(i=>i.name).join('、')}</span>
            <span style="font-weight:700;">${fmtMoney(pu.totalCost||0)}</span>
          </div>
        </div>`;
      }).join('')
    : '<div class="order-empty">沒有符合的記錄</div>';
}

function initPurchaseReportPage(){
  const page = document.getElementById('page-purchase-report');
  if(!page||page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('factory-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-chart-line" style="color:var(--green);"></i> 進貨明細</div>
    </div>
    <div class="form-card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="cust-field"><label>廠商</label>
          <select id="pr-supplier" onchange="renderPurchaseReport()">
            <option value="">全部廠商</option>
            ${SUPPLIERS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
          </select></div>
        <div class="cust-field"><label>品項</label>
          <input type="search" id="pr-item" placeholder="品名..." oninput="renderPurchaseReport()" /></div>
        <div class="cust-field"><label>開始日期</label>
          <input type="date" id="pr-date-from" onchange="renderPurchaseReport()" /></div>
        <div class="cust-field"><label>結束日期</label>
          <input type="date" id="pr-date-to" onchange="renderPurchaseReport()" /></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;" id="pr-stats"></div>
    <div id="pr-unpaid-stat" style="margin-bottom:8px;"></div>
    <div id="pr-list"></div>`;
  renderPurchaseReport();
}

// ════════════════════════════════
// 財務總覽
// ════════════════════════════════
let _financeYear = new Date().getFullYear();
let _financeMonth= new Date().getMonth();

function initFinancePage(){
  const page = document.getElementById('page-finance');
  if(!page||page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-chart-pie" style="color:var(--purple);"></i> 財務總覽</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;
      padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:12px;">
      <button onclick="changeFinanceMonth(-1)"
        style="width:36px;height:36px;border-radius:50%;background:var(--bg);border:1px solid var(--border);
        display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-chevron-left" style="font-size:18px;"></i>
      </button>
      <span id="finance-month-label" style="font-size:18px;font-weight:700;min-width:130px;text-align:center;"></span>
      <button onclick="changeFinanceMonth(1)"
        style="width:36px;height:36px;border-radius:50%;background:var(--bg);border:1px solid var(--border);
        display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-chevron-right" style="font-size:18px;"></i>
      </button>
    </div>
    <div id="finance-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;"></div>
    <div class="section-title"><i class="ti ti-trending-up"></i> 每日趨勢</div>
    <div id="finance-chart" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;overflow-x:auto;margin-bottom:12px;"></div>
    <div class="section-title"><i class="ti ti-trophy"></i> 暢銷品項 TOP 10</div>
    <div id="finance-ranking"></div>`;
  renderFinance();
}

function changeFinanceMonth(delta){
  _financeMonth += delta;
  if(_financeMonth > 11){ _financeMonth=0; _financeYear++; }
  if(_financeMonth < 0) { _financeMonth=11; _financeYear--; }
  renderFinance();
}

function renderFinance(){
  const monthNames=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const labelEl = document.getElementById('finance-month-label');
  if(labelEl) labelEl.textContent = `${_financeYear} 年 ${monthNames[_financeMonth]}`;

  // 篩選當月銷售記錄
  const saleLogs = logs.filter(l => {
    if(l.op!=='pos_sale'&&l.op!=='order_ship') return false;
    const date = getLogDate(l);
    if(!date) return false;
    return date.getFullYear()===_financeYear && date.getMonth()===_financeMonth;
  });

  const totalAmt = saleLogs.reduce((s,l)=>s+(l.amount||0),0);
  const totalQty = saleLogs.reduce((s,l)=>s+(l.qty||0),0);
  const txCount  = new Set(saleLogs.map(l=>l.refId||l.time)).size;

  const statsEl = document.getElementById('finance-stats');
  if(statsEl) statsEl.innerHTML = `
    <div class="form-card" style="text-align:center;">
      <div style="font-size:24px;font-weight:700;color:var(--purple);">${fmtMoney(totalAmt)}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">銷售總額</div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:24px;font-weight:700;">${txCount}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">交易筆數</div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:24px;font-weight:700;color:var(--green);">${totalQty}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">銷售數量</div>
    </div>`;

  // 每日趨勢
  const daysInMonth = new Date(_financeYear, _financeMonth+1, 0).getDate();
  const daily = Array(daysInMonth).fill(0);
  saleLogs.forEach(l => {
    const d = getLogDate(l);
    if(d) daily[d.getDate()-1] += (l.amount||0);
  });
  const maxDay = Math.max(...daily, 1);
  const chartEl = document.getElementById('finance-chart');
  if(chartEl) chartEl.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:3px;height:80px;min-width:300px;">
      ${daily.map((v,i)=>`
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">
          <div style="width:100%;border-radius:3px 3px 0 0;min-height:4px;
            height:${Math.round(v/maxDay*72)+4}px;
            background:${v>0?'var(--purple)':'var(--border)'};"
            title="${i+1}日 ${fmtMoney(v)}"></div>
          <span style="font-size:9px;color:var(--text3);">${(i+1)%5===0?i+1:''}</span>
        </div>`).join('')}
    </div>`;

  // 品項排行
  const itemMap = {};
  saleLogs.forEach(l => {
    if(!itemMap[l.productId]) itemMap[l.productId]={id:l.productId,name:l.productName,qty:0,amount:0};
    itemMap[l.productId].qty    += l.qty||0;
    itemMap[l.productId].amount += l.amount||0;
  });
  const ranking = Object.values(itemMap).sort((a,b)=>b.amount-a.amount).slice(0,10);
  const maxAmt  = ranking[0]?.amount||1;
  const rankEl  = document.getElementById('finance-ranking');
  if(rankEl) rankEl.innerHTML = ranking.length
    ? ranking.map((item,i)=>{
        const prod = getItem(item.id)||{emoji:'📦'};
        return `<div class="inv-warn-row" style="cursor:default;gap:10px;">
          <span style="font-size:${i<3?22:16}px;">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:600;">${prod.emoji} ${item.name}</div>
            <div style="height:6px;background:var(--border);border-radius:3px;margin-top:4px;overflow:hidden;">
              <div style="height:100%;background:var(--purple);border-radius:3px;
                width:${Math.round(item.amount/maxAmt*100)}%;"></div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:700;color:var(--purple);">${fmtMoney(item.amount)}</div>
            <div style="font-size:11px;color:var(--text3);">${item.qty} 個</div>
          </div>
        </div>`;
      }).join('')
    : '<div class="order-empty">本月尚無銷售記錄</div>';
}

function getLogDate(l){
  if(!l.time) return null;
  try {
    const parts = l.time.match(/(\d+)\/(\d+)/);
    if(!parts) return null;
    const m = parseInt(parts[1])-1;
    const d = parseInt(parts[2]);
    const y = m > new Date().getMonth() ? new Date().getFullYear()-1 : new Date().getFullYear();
    return new Date(y, m, d);
  } catch(e){ return null; }
}

// ════════════════════════════════
// 未收款
// ════════════════════════════════
function initUnpaidPage(){
  const page = document.getElementById('page-unpaid');
  if(!page||page.innerHTML.trim()) return;
  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-receipt-off" style="color:var(--red);"></i> 未收款訂單</div>
    </div>
    <div id="unpaid-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;"></div>
    <div id="unpaid-list"></div>`;
  renderUnpaid();
}

function renderUnpaid(){
  const unpaid  = orders.filter(o=>o.payStatus==='unpaid'  &&o.status!=='archived');
  const partial = orders.filter(o=>o.payStatus==='partial' &&o.status!=='archived');
  const owed    = unpaid.reduce((s,o)=>s+(o.totalAmount||0),0)
                + partial.reduce((s,o)=>s+(o.totalAmount||0)-(o.paidAmount||0),0);

  const statsEl = document.getElementById('unpaid-stats');
  if(statsEl) statsEl.innerHTML = `
    <div class="form-card" style="text-align:center;">
      <div style="font-size:22px;font-weight:700;color:var(--red);">${unpaid.length}</div>
      <div style="font-size:12px;color:var(--text2);">未收款</div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:22px;font-weight:700;color:var(--amber);">${partial.length}</div>
      <div style="font-size:12px;color:var(--text2);">部分收款</div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:22px;font-weight:700;color:var(--red);">${fmtMoney(owed)}</div>
      <div style="font-size:12px;color:var(--text2);">應收總金額</div>
    </div>`;

  const list   = [...unpaid,...partial].sort((a,b)=>a.createdAt<b.createdAt?1:-1);
  const listEl = document.getElementById('unpaid-list');
  if(!listEl) return;
  listEl.innerHTML = list.length
    ? list.map(o => {
        const cust = getCustomer(o.customerId);
        const owe  = o.payStatus==='partial'?(o.totalAmount||0)-(o.paidAmount||0):(o.totalAmount||0);
        return `<div class="list-card" onclick="showOrderDetail('${o.id}')">
          <div class="list-card-top">
            <span class="list-card-no">${o.no}</span>
            ${payStatusBadge(o.payStatus)}
          </div>
          <div class="list-card-meta">
            ${cust?`<span><i class="ti ti-user"></i>${cust.name}</span>`:''}
            <span><i class="ti ti-calendar"></i>${fmtDate(o.createdAt)}</span>
          </div>
          <div class="list-card-footer">
            <span style="color:var(--red);font-size:16px;font-weight:700;">應收 ${fmtMoney(owe)}</span>
          </div>
        </div>`;
      }).join('')
    : '<div class="order-empty" style="background:var(--green-light);color:var(--green-dark);">🎉 沒有未收款訂單</div>';
}

// ── 工具 ──
function filterLogsByDate(rows, from, to){
  if(!from&&!to) return rows;
  return rows.filter(l => {
    const d = getLogDate(l); if(!d) return true;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(from && ds < from) return false;
    if(to   && ds > to)   return false;
    return true;
  });
}
function clearReportFilter(type){
  const ids = type==='sale'
    ? ['sr-customer','sr-item','sr-date-from','sr-date-to']
    : ['pr-supplier','pr-item','pr-date-from','pr-date-to'];
  ids.forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  if(type==='sale')   renderSaleReport();
  else                renderPurchaseReport();
}
function exportSaleReport(){
  const rows = logs.filter(l =>
    (l.op==='pos_sale' && !l.eventId) || l.op==='order_ship' || l.op==='event_settle'
  );
  if(!rows.length){ showToast('沒有記錄可匯出'); return; }
  const csv  = '時間,品項,數量,金額,客戶\n'
    + rows.map(l => {
        const name = l.op==='event_settle' ? (l.eventName||'')+'外展結算' : (l.productName||'');
        return `${l.time||''},${name},${l.qty||0},${l.amount||0},${getCustomer(l.customerId)?.name||''}`;
      }).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`銷貨明細_${todayStr()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV 已下載');
}

// 初始化（每次進入頁面時）
document.addEventListener('DOMContentLoaded', ()=>{});
