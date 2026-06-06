// ===== 外展離線模式 + 審核上傳 =====

// ── 狀態 ──
// 每個外展活動的離線狀態獨立存儲
function getOfflineState(eventId){
  return JSON.parse(localStorage.getItem('erp_offline_'+eventId) || '{}');
}
function saveOfflineState(eventId, state){
  localStorage.setItem('erp_offline_'+eventId, JSON.stringify(state));
}

// 取得本裝置針對某外展的未上傳記錄
function getLocalEventLogs(eventId){
  return logs.filter(l => l.eventId===eventId && !l._uploaded);
}

// ── 在外展詳細頁渲染離線模式區塊 ──
function renderOfflineSection(ev){
  const el = document.getElementById('event-offline-section');
  if(!el) return;
  const state    = getOfflineState(ev.id);
  const isOffline= !!state.offlineMode;
  const localLogs= getLocalEventLogs(ev.id);
  const hasLocal = localLogs.length > 0;
  const uploaded = !!state.uploaded;

  if(uploaded){
    // 已上傳：顯示已鎖定
    el.innerHTML = `
      <div class="offline-mode-card uploaded">
        <i class="ti ti-cloud-check"></i>
        <div>
          <div class="om-title">已上傳至雲端</div>
          <div class="om-sub">上傳時間：${state.uploadedAt||'—'}</div>
        </div>
        <button class="small-btn" onclick="showPage('event-review');initReviewPage('${ev.id}')">
          <i class="ti ti-eye"></i> 查看記錄
        </button>
      </div>`;
    return;
  }

  if(isOffline){
    // 離線模式中
    el.innerHTML = `
      <div class="offline-mode-card active">
        <i class="ti ti-wifi-off"></i>
        <div style="flex:1;">
          <div class="om-title">外展離線模式中</div>
          <div class="om-sub">本機有 ${localLogs.length} 筆未上傳記錄</div>
        </div>
      </div>
      <div class="offline-actions">
        ${hasLocal ? `
          <button class="offline-review-btn" onclick="showPage('event-review');initReviewPage('${ev.id}')">
            <i class="ti ti-clipboard-check"></i> 清點並審核上傳
          </button>` : ''}
        <button class="offline-exit-btn" onclick="confirmExitOffline('${ev.id}')">
          <i class="ti ti-wifi"></i> 結束離線模式
        </button>
      </div>`;
  } else {
    // 正常模式：顯示「進入外展模式」按鈕
    el.innerHTML = `
      <div class="offline-mode-card normal">
        <i class="ti ti-device-mobile"></i>
        <div style="flex:1;">
          <div class="om-title">外展離線模式</div>
          <div class="om-sub">出門前開啟，銷售記錄存本機，回來後審核上傳</div>
        </div>
        <button class="small-btn green-btn" onclick="enterOfflineMode('${ev.id}')">
          <i class="ti ti-power"></i> 開啟
        </button>
      </div>`;
  }
}

function enterOfflineMode(eventId){
  if(!confirm('確定進入外展離線模式？\n\n開啟後銷售記錄會存在本機，回來連網後可審核上傳至雲端。')){return;}
  saveOfflineState(eventId, { offlineMode:true, startedAt: new Date().toLocaleString('zh-TW') });
  showToast('✅ 已進入外展離線模式');
  viewEvent(eventId);
}

function confirmExitOffline(eventId){
  const localLogs = getLocalEventLogs(eventId);
  if(localLogs.length > 0){
    if(!confirm(`本機還有 ${localLogs.length} 筆未上傳記錄。\n確定要結束離線模式嗎？\n（記錄不會消失，之後仍可上傳）`)) return;
  }
  const state = getOfflineState(eventId);
  state.offlineMode = false;
  saveOfflineState(eventId, state);
  showToast('已結束離線模式');
  viewEvent(eventId);
}

// ── 審核頁面 ──
let _reviewEventId = null;
let _reviewItems   = [];  // [{id, name, emoji, price, takeQty, soldQty, remaining, amount, actualRemaining}]

function initReviewPage(eventId){
  _reviewEventId = eventId;
  const ev       = events.find(e=>e.id===eventId);
  if(!ev) return;

  const state    = getOfflineState(eventId);
  const localLogs= getLocalEventLogs(eventId);
  const uploaded = !!state.uploaded;

  // 活動資訊
  document.getElementById('review-meta').innerHTML = `
    <div class="review-meta-card">
      <div class="review-meta-title">${ev.name}</div>
      <div class="review-meta-sub">
        <span><i class="ti ti-map-pin"></i>${ev.location}</span>
        <span><i class="ti ti-calendar"></i>${fmtDate(ev.startDate)}</span>
        <span><i class="ti ti-device-mobile"></i>裝置 ${DEVICE_ID.slice(-4)}</span>
      </div>
    </div>`;

  // 離線標示
  const offlineBadge = document.getElementById('offline-badge');
  if(state.offlineMode){
    offlineBadge.style.display = 'flex';
    document.getElementById('offline-record-count').textContent =
      `｜${localLogs.length} 筆本機記錄`;
  } else {
    offlineBadge.style.display = 'none';
  }

  // 計算每個商品的銷售數據
  const evLogs = getLocalEventLogs(eventId);
  _reviewItems = (ev.items||[]).filter(i=>(i.takeQty||0)>0).map(item=>{
    const soldQty  = evLogs.filter(l=>l.id===item.id).reduce((s,l)=>s+(l.qty||0),0);
    const remaining= Math.max(0,(item.takeQty||0)-soldQty);
    const amount   = soldQty * (item.price||0);
    return {
      id: item.id, name: item.name, emoji: item.emoji,
      price: item.price||0,
      takeQty:   item.takeQty||0,
      soldQty,
      remaining,
      amount,
      actualRemaining: remaining, // 主管輸入的實際清點數量，預設跟系統一樣
    };
  });

  renderReviewItems(uploaded);
  renderReviewTotal();
  renderDiffWarning();

  // 顯示/隱藏確認或已上傳區塊
  document.getElementById('review-confirm-section').style.display  = uploaded ? 'none' : 'block';
  document.getElementById('review-uploaded-section').style.display = uploaded ? 'block' : 'none';
  if(uploaded){
    document.getElementById('review-uploaded-time').textContent = '上傳時間：' + (state.uploadedAt||'—');
  }
}

function renderReviewItems(readonly){
  const el = document.getElementById('review-items-list');
  el.innerHTML = _reviewItems.map((item,idx)=>{
    const diffQty  = item.actualRemaining - item.remaining;
    const hasDiff  = diffQty !== 0;
    return `
      <div class="review-item-card ${hasDiff?'has-diff':''}">
        <div class="review-item-top">
          <span class="review-item-emoji">${item.emoji}</span>
          <div class="review-item-info">
            <div class="review-item-name">${item.name}</div>
            <div class="review-item-id">${item.id}</div>
          </div>
          <div class="review-item-amount">$${item.amount.toLocaleString()}</div>
        </div>
        <div class="review-item-stats">
          <div class="review-stat"><div class="rs-num">${item.takeQty}</div><div class="rs-label">帶出</div></div>
          <div class="review-stat sold"><div class="rs-num">${item.soldQty}</div><div class="rs-label">賣出</div></div>
          <div class="review-stat remain"><div class="rs-num">${item.remaining}</div><div class="rs-label">系統剩餘</div></div>
          <div class="review-stat actual">
            <div class="rs-label" style="margin-bottom:4px;">實際清點</div>
            ${readonly ? `<div class="rs-num">${item.actualRemaining}</div>` :
              `<input type="number" class="review-actual-input" value="${item.actualRemaining}" min="0"
                onchange="updateActualRemaining(${idx},this.value)"
                style="width:52px;padding:4px;font-size:18px;font-weight:700;text-align:center;
                border:2px solid ${hasDiff?'#E24B4A':'var(--border)'};
                border-radius:8px;background:var(--surface);color:var(--text);" />`
            }
          </div>
        </div>
        ${hasDiff?`<div class="review-diff-row">
          ⚠️ 差異：系統剩 ${item.remaining} 個，實際清點 ${item.actualRemaining} 個
          （差 ${Math.abs(diffQty)} 個${diffQty>0?'，多出':'，少了'}）
        </div>`:''}
      </div>`;
  }).join('') || '<div class="report-empty">沒有帶貨商品記錄</div>';
}

function updateActualRemaining(idx, val){
  const n = parseInt(val);
  if(!isNaN(n) && n >= 0) _reviewItems[idx].actualRemaining = n;
  renderReviewItems(false);
  renderDiffWarning();
}

function renderReviewTotal(){
  const totalSold   = _reviewItems.reduce((s,i)=>s+i.soldQty,0);
  const totalAmount = _reviewItems.reduce((s,i)=>s+i.amount,0);
  const totalTake   = _reviewItems.reduce((s,i)=>s+i.takeQty,0);
  document.getElementById('review-total-card').innerHTML = `
    <div class="review-total-row"><span>帶出總數</span><strong>${totalTake} 個</strong></div>
    <div class="review-total-row"><span>銷售總數</span><strong>${totalSold} 個</strong></div>
    <div class="review-total-row grand"><span>銷售總金額</span><strong style="color:#6B4FBB;">$${totalAmount.toLocaleString()}</strong></div>`;
}

function renderDiffWarning(){
  const diffs = _reviewItems.filter(i=>i.actualRemaining !== i.remaining);
  const el = document.getElementById('review-diff-warning');
  if(!diffs.length){ el.style.display='none'; return; }
  el.style.display = 'block';
  el.innerHTML = `<div class="diff-warning-card">
    <div class="diff-warning-title"><i class="ti ti-alert-triangle"></i> 發現 ${diffs.length} 項數量差異</div>
    <div class="diff-warning-sub">上傳時將以「實際清點數量」為準計算扣除量</div>
    ${diffs.map(i=>`<div class="diff-warning-row">
      ${i.emoji} ${i.name}：系統剩 ${i.remaining}，實際剩 ${i.actualRemaining}
    </div>`).join('')}
  </div>`;
}

// ── 上傳 ──
function submitEventUpload(){
  if(!_fbReady || !_db){
    showToast('⚠️ 請先連上網路再上傳');
    return;
  }
  const ev    = events.find(e=>e.id===_reviewEventId);
  const note  = document.getElementById('review-note')?.value.trim()||'';
  const now   = new Date().toLocaleString('zh-TW',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const localLogs = getLocalEventLogs(_reviewEventId);

  setSyncStatus('syncing', '上傳中...');
  showToast('📤 正在上傳...');

  // 1. 計算每個商品的實際扣除量（以實際清點為準）
  const deductions = {};
  _reviewItems.forEach(item=>{
    // 實際賣出 = 帶出 - 實際清點
    const actualSold = Math.max(0, item.takeQty - item.actualRemaining);
    if(actualSold > 0) deductions[item.id] = actualSold;
  });

  // 2. 用 Firebase Transaction 差異合併庫存（不整份覆蓋）
  const inventoryUpdates = {};
  Object.keys(deductions).forEach(itemId=>{
    const currentStock = inventory[itemId] ?? 0;
    inventoryUpdates[itemId] = Math.max(0, currentStock - deductions[itemId]);
  });

  // 3. 標記本機記錄為已上傳
  localLogs.forEach(l=>{ l._uploaded = true; l._uploadedAt = now; });
  saveLogs();

  // 4. 上傳到 Firebase
  const uploadData = {
    eventId:    _reviewEventId,
    eventName:  ev?.name||'',
    deviceId:   DEVICE_ID,
    uploadedAt: now,
    uploadedBy: note,
    items:      _reviewItems.map(i=>({
      id:i.id, name:i.name,
      takeQty:i.takeQty, soldQty:i.soldQty,
      systemRemaining:i.remaining, actualRemaining:i.actualRemaining,
      amount:i.amount
    })),
    logs:       localLogs,
    deductions,
    totalAmount: _reviewItems.reduce((s,i)=>s+i.amount,0),
  };

  // 分批寫入 Firebase
  const updates = {};
  // 庫存差異更新
  Object.keys(inventoryUpdates).forEach(id=>{
    updates[`erp/inventory/${id}`] = inventoryUpdates[id];
  });
  // 雲端備查記錄
  updates[`erp/eventUploads/${_reviewEventId}/${DEVICE_ID}`] = uploadData;
  // 本機 logs 同步到雲端
  localLogs.forEach(l=>{
    if(l._fbKey) updates[`erp/logs/${l._fbKey}`] = l;
    else {
      const ref = _db.ref('erp/logs').push(l);
      l._fbKey = ref.key;
    }
  });

  _db.ref().update(updates).then(()=>{
    // 更新本機庫存
    Object.keys(inventoryUpdates).forEach(id=>{
      inventory[id] = inventoryUpdates[id];
    });
    localStorage.setItem('erp_inventory', JSON.stringify(inventory));

    // 標記已上傳
    saveOfflineState(_reviewEventId, {
      offlineMode: false,
      uploaded: true,
      uploadedAt: now,
      deviceId: DEVICE_ID,
    });

    setSyncStatus('ok', '上傳完成');
    showToast('✅ 外展資料已成功上傳！');
    renderHome(); renderFinished(); renderMaterials();

    // 重新渲染審核頁
    initReviewPage(_reviewEventId);
    // 更新外展詳細頁
    viewEvent(_reviewEventId);

  }).catch(err=>{
    console.error('上傳失敗:', err);
    setSyncStatus('error', '上傳失敗');
    showToast('⚠️ 上傳失敗，請確認網路連線');
  });
}

// ── 不需要攔截，直接在 event.js 的 viewEvent 呼叫 renderOfflineSection ──
// renderOfflineSection 已在 viewEvent 內透過 showPage 後觸發
