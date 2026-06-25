// cash_reconcile.js — 每日現金對帳

function _loadCashRecords(){
  return JSON.parse(localStorage.getItem('erp_cash_reconcile') || '[]');
}
function _saveCashRecords(arr){
  localStorage.setItem('erp_cash_reconcile', JSON.stringify(arr));
  if(typeof pushToFirebase === 'function') pushToFirebase('cashReconcile', arr);
}

function initCashReconcilePage(){
  const page = document.getElementById('page-cash-reconcile');
  if(!page) return;
  const today = todayStr();
  const todayCashLogs = logs.filter(l => {
    if(l.op !== 'pos_sale' || l.eventId) return false;
    if(l.payMethod && l.payMethod !== 'cash') return false;
    const d = getLogDate(l);
    if(!d) return false;
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return ds === today;
  });
  const expectedCash = todayCashLogs.reduce((s,l) => s + (l.amount||0), 0);
  const records = _loadCashRecords();
  const todayRecord = records.find(r => r.date === today);

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('sales-menu')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-cash" style="color:var(--green);"></i> 每日現金對帳</div>
    </div>

    <div class="form-card">
      <div style="font-size:12px;color:var(--text3);margin-bottom:4px;">今日（${today}）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div class="report-stat" style="background:var(--green-light);">
          <div class="rs-num" style="color:var(--green);">${fmtMoney(expectedCash)}</div>
          <div class="rs-label">系統現金銷售</div>
        </div>
        <div class="report-stat" style="background:${todayRecord?.difference<0?'var(--red-light)':'var(--surface)'};">
          <div class="rs-num" style="color:${todayRecord?.difference<0?'var(--red)':'var(--text2)'};">
            ${todayRecord ? fmtMoney(todayRecord.actualCash) : '—'}
          </div>
          <div class="rs-label">實收現金</div>
        </div>
      </div>
      ${todayRecord ? `
        <div style="padding:10px;border-radius:8px;background:${todayRecord.difference===0?'var(--green-light)':todayRecord.difference>0?'var(--blue-light)':'var(--red-light)'};margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;">差額：
            <span style="color:${todayRecord.difference===0?'var(--green)':todayRecord.difference>0?'var(--blue)':'var(--red)'};">
              ${todayRecord.difference >= 0 ? '+' : ''}${fmtMoney(todayRecord.difference)}
            </span>
            <span style="font-size:12px;color:var(--text3);margin-left:6px;">
              ${todayRecord.difference===0?'✅ 吻合':todayRecord.difference>0?'⬆️ 多收':'⬇️ 短收'}
            </span>
          </div>
          ${todayRecord.note ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;">${todayRecord.note}</div>` : ''}
        </div>` : ''}

      <div class="cust-form">
        <div class="cust-field">
          <label>實收現金金額（$）</label>
          <input type="number" id="cr-actual" placeholder="輸入實際點收金額"
            value="${todayRecord?.actualCash ?? ''}" min="0" />
        </div>
        <div class="cust-field">
          <label>備註（可選）</label>
          <input type="text" id="cr-note" placeholder="差額說明..."
            value="${todayRecord?.note ?? ''}" />
        </div>
      </div>
      <button class="modal-ok-btn" onclick="saveCashReconcile(${expectedCash})" style="width:100%;margin-top:8px;">
        <i class="ti ti-check"></i> 儲存今日對帳
      </button>
    </div>

    <div class="section-title" style="margin-top:4px;"><i class="ti ti-history"></i> 歷史對帳記錄</div>
    <div id="cr-history">${_renderCashHistory(records)}</div>`;
}

function _renderCashHistory(records){
  if(!records.length) return '<div class="order-empty">尚無對帳記錄</div>';
  return records.slice().reverse().slice(0,30).map(r => `
    <div class="inv-warn-row">
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:600;">${r.date}</div>
        ${r.note ? `<div style="font-size:12px;color:var(--text3);">${r.note}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;color:var(--text2);">系統 ${fmtMoney(r.expectedCash)} / 實收 ${fmtMoney(r.actualCash)}</div>
        <div style="font-size:14px;font-weight:700;color:${r.difference===0?'var(--green)':r.difference>0?'var(--blue)':'var(--red)'};">
          差額 ${r.difference>=0?'+':''}${fmtMoney(r.difference)}
        </div>
      </div>
    </div>`).join('');
}

function saveCashReconcile(expectedCash){
  const actual = parseInt(document.getElementById('cr-actual')?.value) || 0;
  const note   = document.getElementById('cr-note')?.value.trim() || '';
  const today  = todayStr();
  const records = _loadCashRecords();
  const idx    = records.findIndex(r => r.date === today);
  const entry  = { date: today, expectedCash, actualCash: actual, difference: actual - expectedCash, note };
  if(idx >= 0) records[idx] = entry;
  else records.push(entry);
  _saveCashRecords(records);
  showToast(`✅ 對帳已儲存！差額 ${entry.difference >= 0 ? '+' : ''}${fmtMoney(entry.difference)}`);
  initCashReconcilePage();
}
