// ===== 權限系統 =====

// ── Session ──
const SESSION_KEY = 'erp_session';
const SESSION_HOURS = 8;

function getSession(){
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if(!s) return null;
    // 超過 8 小時自動登出
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
function currentRole(){
  return getSession()?.role || null;
}
function isOperator(){ return ['operator','manager','admin'].includes(currentRole()); }
function isManager() { return ['manager','admin'].includes(currentRole()); }
function isAdmin()   { return currentRole() === 'admin'; }

// ── PIN 管理（存 Firebase + localStorage 備份）──
let _pins = {
  manager: localStorage.getItem('erp_pin_manager') || '1234',
  admin:   '876300',  // 管理員 PIN 固定，不存本機
};

function loadPinsFromFirebase(){
  if(typeof _db === 'undefined' || !_db) return;
  _db.ref('erp/config/pins').once('value').then(snap=>{
    const data = snap.val();
    if(!data) return;
    if(data.manager){ _pins.manager = data.manager; localStorage.setItem('erp_pin_manager', data.manager); }
    if(data.admin)  { _pins.admin   = data.admin; }
  }).catch(()=>{});
}
function savePinsToFirebase(){
  if(typeof _db === 'undefined' || !_db) return;
  _db.ref('erp/config/pins').set({ manager: _pins.manager, admin: _pins.admin }).catch(()=>{});
}

// ── 權限檢查 ──
function checkRole(required, callback){
  // required: 'manager' | 'admin'
  if(required === 'manager' && isManager()){ if(callback) callback(); return true; }
  if(required === 'admin'   && isAdmin())  { if(callback) callback(); return true; }
  showToast('⚠️ 權限不足');
  return false;
}

// ── 登入頁面 ──
function showLoginPage(){
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  loadPinsFromFirebase();
}
function hideLoginPage(){
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function loginAs(role){
  if(role === 'operator'){
    setSession('operator');
    hideLoginPage();
    applyRoleUI();
    showToast('👷 操作員模式');
    return;
  }
  // 主管 / 管理員需要 PIN
  _loginTarget = role;
  document.getElementById('login-pin-title').textContent =
    role === 'admin' ? '👑 管理員登入' : '👔 主管登入';
  document.getElementById('login-pin-input').value = '';
  document.getElementById('login-pin-error').style.display = 'none';
  document.getElementById('loginPinModal').style.display = 'flex';
  setTimeout(()=>document.getElementById('login-pin-input').focus(), 200);
}

let _loginTarget = null;
function submitLoginPin(){
  const val = document.getElementById('login-pin-input').value.trim();
  const correctPin = _loginTarget === 'admin' ? _pins.admin : _pins.manager;
  if(val === correctPin){
    setSession(_loginTarget);
    document.getElementById('loginPinModal').style.display = 'none';
    hideLoginPage();
    applyRoleUI();
    showToast(_loginTarget==='admin' ? '👑 管理員模式' : '👔 主管模式');
  } else {
    document.getElementById('login-pin-error').style.display = 'block';
    document.getElementById('login-pin-input').value = '';
    document.getElementById('login-pin-input').focus();
  }
}
function closeLoginPinModal(){
  document.getElementById('loginPinModal').style.display = 'none';
}

// ── 登出 ──
function logout(){
  if(!confirm('確定要登出嗎？')) return;
  clearSession();
  applyRoleUI();
  showLoginPage();
}

// ── 套用角色 UI ──
function applyRoleUI(){
  const role = currentRole() || 'operator';
  // 更新 header 顯示角色
  const roleEl = document.getElementById('header-role');
  if(roleEl){
    const labels = { operator:'👷 操作員', manager:'👔 主管', admin:'👑 管理員' };
    roleEl.textContent = labels[role] || '';
  }
}

// ── requestAdmin 改為根據角色要求 ──
// 覆蓋舊的 requestAdmin，改為彈出登入而非 PIN
window.requestAdmin = function(callback, reason){
  if(isManager()){
    if(typeof callback === 'function') callback();
    return;
  }
  // 需要登入主管
  showToast('⚠️ 權限不足，請先以主管身份登入');
};

// ── PIN 修改（管理員專用）──
function openChangePinModal(){
  if(!checkRole('admin')) return;
  document.getElementById('change-pin-role').value = 'manager';
  document.getElementById('new-pin-val').value = '';
  document.getElementById('new-pin-confirm-val').value = '';
  document.getElementById('pin-change-error').style.display = 'none';
  document.getElementById('changePinModal').style.display = 'flex';
}
function closeChangePinModal(e){
  if(!e || e.target===document.getElementById('changePinModal'))
    document.getElementById('changePinModal').style.display = 'none';
}
function submitChangePin(){
  const role = document.getElementById('change-pin-role').value;
  const nw   = document.getElementById('new-pin-val').value.trim();
  const nwc  = document.getElementById('new-pin-confirm-val').value.trim();
  const errEl= document.getElementById('pin-change-error');
  const minLen = role === 'admin' ? 6 : 4;
  if(nw.length < minLen){ errEl.textContent=`至少需要 ${minLen} 位數字`; errEl.style.display='block'; return; }
  if(nw !== nwc){ errEl.textContent='兩次輸入不一致'; errEl.style.display='block'; return; }
  _pins[role] = nw;
  if(role === 'manager') localStorage.setItem('erp_pin_manager', nw);
  savePinsToFirebase();
  document.getElementById('changePinModal').style.display = 'none';
  showToast(`✅ ${role==='admin'?'管理員':'主管'} PIN 已更新`);
}

// ── Enter 鍵 ──
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('login-pin-input')?.addEventListener('keydown', e=>{
    if(e.key==='Enter') submitLoginPin();
  });
  // 檢查是否已登入
  if(getSession()){
    hideLoginPage();
    applyRoleUI();
  } else {
    showLoginPage();
  }
});
