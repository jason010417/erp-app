// ============================================================
// auth.js — 權限系統（方案B）
// 預設操作員身份，需要時提升權限
// ============================================================

const SESSION_KEY   = 'erp_session';
const SESSION_HOURS = 8;

// ── Session ──
function getSession(){
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if(!s) return null;
    if(Date.now() - s.loginAt > SESSION_HOURS * 3600 * 1000){
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch(e){ return null; }
}
function setSession(role){
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, loginAt: Date.now() }));
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

// ── 角色判斷 ──
function currentRole(){ return getSession()?.role || 'operator'; }
function isLoggedIn()  { return true; } // 永遠可以用操作員身份
function isOperator()  { return true; } // 操作員功能全員開放
function isManager()   { return ['manager','admin'].includes(currentRole()); }
function isAdmin()     { return currentRole() === 'admin'; }

// ── PIN 管理 ──
let _pins = {
  manager: localStorage.getItem('erp_pin_manager') || '1234',
  admin:   localStorage.getItem('erp_pin_admin')   || '876300',
};

function loadPinsFromFirebase(){
  if(typeof _db === 'undefined' || !_db) return;
  _db.ref('erp/config/pins').once('value').then(snap => {
    const data = snap.val();
    if(!data) return;
    if(data.manager){ _pins.manager = data.manager; localStorage.setItem('erp_pin_manager', data.manager); }
    if(data.admin)  { _pins.admin   = data.admin;   localStorage.setItem('erp_pin_admin',   data.admin);   }
  }).catch(() => {});
}
function savePinsToFirebase(){
  if(typeof _db === 'undefined' || !_db) return;
  _db.ref('erp/config/pins').set(_pins).catch(() => {});
}

// ── 權限檢查 ──
const MANAGER_PAGES = [
  'admin','admin-products','admin-bom','admin-bom-edit',
  'admin-suppliers','admin-system','admin-locations','admin-import',
  'finance','unpaid','event-review',
];
const ADMIN_PAGES = ['admin-system'];

function canAccess(pageName){
  if(ADMIN_PAGES.includes(pageName))   return isAdmin();
  if(MANAGER_PAGES.includes(pageName)) return isManager();
  return true;
}

// 需要主管才能執行的操作（inline，不跳頁）
function requireManager(callback, reason){
  if(isManager()){
    if(typeof callback === 'function') callback();
    return true;
  }
  // 彈出提升權限 Modal
  openEscalateModal('manager', callback, reason);
  return false;
}
function requireAdmin(callback, reason){
  if(isAdmin()){
    if(typeof callback === 'function') callback();
    return true;
  }
  openEscalateModal('admin', callback, reason);
  return false;
}

// ── 提升權限 Modal（方案B 核心）──
let _escalateCallback = null;
let _escalateTarget   = null;

function openEscalateModal(targetRole, callback, reason){
  _escalateTarget   = targetRole;
  _escalateCallback = callback;

  const labels = { manager:'👔 主管', admin:'👑 管理員' };
  document.getElementById('escalate-title').textContent =
    labels[targetRole] + ' 權限驗證';
  document.getElementById('escalate-reason').textContent =
    reason || '此操作需要更高權限';
  document.getElementById('escalate-pin-input').value = '';
  document.getElementById('escalate-pin-error').style.display = 'none';
  document.getElementById('escalateModal').style.display = 'flex';
  setTimeout(() => document.getElementById('escalate-pin-input').focus(), 200);
}

function submitEscalatePin(){
  const val        = document.getElementById('escalate-pin-input').value.trim();
  const correctPin = _pins[_escalateTarget];

  if(val === correctPin){
    // 提升 Session
    setSession(_escalateTarget);
    document.getElementById('escalateModal').style.display = 'none';
    applyRoleUI();
    const labels = { manager:'👔 已切換為主管模式', admin:'👑 已切換為管理員模式' };
    showToast(labels[_escalateTarget]);
    // 執行原本要做的事
    if(typeof _escalateCallback === 'function'){
      _escalateCallback();
      _escalateCallback = null;
    }
  } else {
    document.getElementById('escalate-pin-error').style.display = 'block';
    document.getElementById('escalate-pin-input').value = '';
    document.getElementById('escalate-pin-input').focus();
  }
}
function closeEscalateModal(e){
  if(!e || e.target === document.getElementById('escalateModal')){
    document.getElementById('escalateModal').style.display = 'none';
    _escalateCallback = null;
  }
}

// ── 降回操作員 ──
function downgradeToOperator(){
  setSession('operator');
  applyRoleUI();
  showToast('👷 已切換回操作員模式');
  if(typeof renderKioskHome === 'function') renderKioskHome();
  if(typeof showPage === 'function') showPage('kiosk-home');
}

// ── 套用角色 UI ──
function applyRoleUI(){
  const role   = currentRole();
  const labels = { operator:'👷 操作員', manager:'👔 主管', admin:'👑 管理員' };
  const el     = document.getElementById('header-role');
  if(el) el.textContent = labels[role] || '👷 操作員';

  // Kiosk mode: hide nav for operators
  const nav = document.querySelector('.bottom-nav');
  if(nav) nav.style.display = isManager() ? '' : 'none';
}

// ── 修改 PIN（管理員專用）──
function openChangePinModal(){
  if(!requireAdmin(null, '修改 PIN 碼需要管理員權限')) return;
  document.getElementById('change-pin-role').value         = 'manager';
  document.getElementById('new-pin-val').value             = '';
  document.getElementById('new-pin-confirm-val').value     = '';
  document.getElementById('pin-change-error').style.display = 'none';
  document.getElementById('changePinModal').style.display   = 'flex';
}
function closeChangePinModal(e){
  if(!e || e.target === document.getElementById('changePinModal'))
    document.getElementById('changePinModal').style.display = 'none';
}
function submitChangePin(){
  const role   = document.getElementById('change-pin-role').value;
  const nw     = document.getElementById('new-pin-val').value.trim();
  const nwc    = document.getElementById('new-pin-confirm-val').value.trim();
  const errEl  = document.getElementById('pin-change-error');
  const minLen = role === 'admin' ? 6 : 4;
  if(nw.length < minLen){ errEl.textContent = `至少 ${minLen} 位`; errEl.style.display='block'; return; }
  if(nw !== nwc)        { errEl.textContent = '兩次輸入不一致';     errEl.style.display='block'; return; }
  _pins[role] = nw;
  localStorage.setItem(`erp_pin_${role}`, nw);
  savePinsToFirebase();
  document.getElementById('changePinModal').style.display = 'none';
  showToast(`✅ ${role === 'admin' ? '管理員' : '主管'} PIN 已更新`);
}

// ── 初始化：預設操作員，不需要登入 ──
document.addEventListener('DOMContentLoaded', () => {
  if(!getSession()) setSession('operator');
  applyRoleUI();
  loadPinsFromFirebase();

  // 操作員模式：啟動後直接進入 Kiosk 主頁
  if(!isManager()){
    if(typeof renderKioskHome === 'function') renderKioskHome();
    if(typeof showPage === 'function') showPage('kiosk-home');
  }

  document.getElementById('escalate-pin-input')?.addEventListener('keydown', e => {
    if(e.key === 'Enter') submitEscalatePin();
  });
});

