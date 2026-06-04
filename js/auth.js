// ===== 主管權限系統 =====

// 預設主管密碼（可在後台管理修改）
let ADMIN_PIN = localStorage.getItem('erp_admin_pin') || '1234';
function saveAdminPin(){ localStorage.setItem('erp_admin_pin', ADMIN_PIN); }

// 解鎖狀態（本次登入有效，關閉頁面後失效）
let _adminUnlocked = false;
let _adminTimer    = null;

function isAdmin(){ return _adminUnlocked; }

// ── 主管驗證 Modal ──
// callback: 驗證成功後要做的事
let _adminCallback = null;

function requestAdmin(callback, reason){
  _adminCallback = callback;
  document.getElementById('admin-reason').textContent = reason || '此操作需要主管權限';
  document.getElementById('admin-pin-input').value = '';
  document.getElementById('admin-pin-error').style.display = 'none';
  document.getElementById('adminAuthModal').style.display = 'flex';
  setTimeout(()=>document.getElementById('admin-pin-input').focus(), 200);
}

function submitAdminPin(){
  const val = document.getElementById('admin-pin-input').value.trim();
  if(val === ADMIN_PIN){
    document.getElementById('adminAuthModal').style.display = 'none';
    _adminUnlocked = true;
    // 5 分鐘後自動鎖定
    clearTimeout(_adminTimer);
    _adminTimer = setTimeout(()=>{ _adminUnlocked = false; }, 5 * 60 * 1000);
    showToast('🔓 主管權限已解鎖（5分鐘內有效）');
    if(typeof _adminCallback === 'function'){
      _adminCallback();
      _adminCallback = null;
    }
  } else {
    document.getElementById('admin-pin-error').style.display = 'block';
    document.getElementById('admin-pin-input').value = '';
    document.getElementById('admin-pin-input').focus();
  }
}

function closeAdminModal(){
  document.getElementById('adminAuthModal').style.display = 'none';
  _adminCallback = null;
}

// ── 主管密碼修改 ──
function openChangePinModal(){
  document.getElementById('old-pin').value = '';
  document.getElementById('new-pin').value = '';
  document.getElementById('new-pin-confirm').value = '';
  document.getElementById('pin-change-error').style.display = 'none';
  document.getElementById('changePinModal').style.display = 'flex';
}
function closeChangePinModal(e){
  if(!e || e.target===document.getElementById('changePinModal'))
    document.getElementById('changePinModal').style.display = 'none';
}
function submitChangePin(){
  const old   = document.getElementById('old-pin').value.trim();
  const nw    = document.getElementById('new-pin').value.trim();
  const nwc   = document.getElementById('new-pin-confirm').value.trim();
  const errEl = document.getElementById('pin-change-error');
  if(old !== ADMIN_PIN){ errEl.textContent='舊密碼不正確'; errEl.style.display='block'; return; }
  if(nw.length < 4)    { errEl.textContent='新密碼至少需要 4 位數'; errEl.style.display='block'; return; }
  if(nw !== nwc)       { errEl.textContent='兩次輸入的新密碼不一致'; errEl.style.display='block'; return; }
  ADMIN_PIN = nw;
  saveAdminPin();
  document.getElementById('changePinModal').style.display = 'none';
  showToast('✅ 主管密碼已更新');
}

// Enter 鍵送出
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('admin-pin-input')?.addEventListener('keydown', e=>{
    if(e.key==='Enter') submitAdminPin();
  });
});
