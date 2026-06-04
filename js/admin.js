// ===== 後台管理系統 =====

// ── 廠商（補充資料存 localStorage） ──
function getSupExtra(id){ return JSON.parse(localStorage.getItem('erp_sup_'+id)||'{}'); }
function saveSupExtra(id,data){ localStorage.setItem('erp_sup_'+id, JSON.stringify(data)); }

// ── 廠商列表 ──
function renderAdminSuppliers(q){
  const el = document.getElementById('admin-supplier-list');
  const items = q ? SUPPLIERS.filter(s=>s.name.includes(q)||s.id.includes(q)) : SUPPLIERS;
  el.innerHTML = items.map(s=>{
    const ex = getSupExtra(s.id);
    const tel = ex.tel || s.tel || '';
    return `<div class="catdetail-row" onclick="editSupplier('${s.id}')">
      <div style="font-size:26px;flex-shrink:0;">🏭</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${s.name}</div>
        <div class="catdetail-id">${s.id}${tel?' ・ '+tel:''}</div>
      </div>
      <i class="ti ti-chevron-right" style="color:var(--text3);"></i>
    </div>`;
  }).join('') || '<div class="order-empty">找不到廠商</div>';
}

// 新增廠商 Modal（先用 openNewSupplierForm 占位）
let _editSupId = null;
function openNewSupplierForm(){ _editSupId=null; openSupEditModal({id:'',name:'',contact:'',tel:'',email:'',fax:'',bank:'',account:'',note:''}); }
function editSupplier(id){
  _editSupId = id;
  const s = SUPPLIERS.find(x=>x.id===id)||{};
  const ex = getSupExtra(id);
  openSupEditModal({...s,...ex});
}
function openSupEditModal(data){
  const fields = ['sup-id','sup-name','sup-contact','sup-tel','sup-email','sup-fax','sup-bank','sup-account','sup-note'];
  const keys   = ['id','name','contact','tel','email','fax','bank','account','note'];
  fields.forEach((f,i)=>{ const el=document.getElementById(f); if(el) el.value=data[keys[i]]||''; });
  if(document.getElementById('sup-id')) document.getElementById('sup-id').readOnly = !!_editSupId;
  document.getElementById('supEditModal').style.display = 'flex';
}
function closeSupEditModal(e){ if(!e||e.target===document.getElementById('supEditModal')) document.getElementById('supEditModal').style.display='none'; }
function saveSupplier(){
  const id      = document.getElementById('sup-id').value.trim();
  const name    = document.getElementById('sup-name').value.trim();
  if(!name){ showToast('⚠️ 請填寫廠商名稱'); return; }
  const extra = {
    contact: document.getElementById('sup-contact').value.trim(),
    tel:     document.getElementById('sup-tel').value.trim(),
    email:   document.getElementById('sup-email').value.trim(),
    fax:     document.getElementById('sup-fax').value.trim(),
    bank:    document.getElementById('sup-bank').value.trim(),
    account: document.getElementById('sup-account').value.trim(),
    note:    document.getElementById('sup-note').value.trim(),
  };
  if(_editSupId){
    saveSupExtra(_editSupId, extra);
    // 更新 SUPPLIERS 陣列的 name（若有變動）
    const idx = SUPPLIERS.findIndex(s=>s.id===_editSupId);
    if(idx>=0) SUPPLIERS[idx].name = name;
  } else {
    if(!id){ showToast('⚠️ 請填寫廠商編號'); return; }
    if(SUPPLIERS.find(s=>s.id===id)){ showToast('⚠️ 此編號已存在'); return; }
    SUPPLIERS.push({id, name, ...Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,'']))});
    saveSupExtra(id, extra);
  }
  document.getElementById('supEditModal').style.display='none';
  showToast('✅ 廠商資料已儲存');
  renderAdminSuppliers('');
}

// ── 商品管理 ──
let adminProductType = 'finished';
function filterAdminProducts(type){
  adminProductType = type;
  ['finished','semi','pack'].forEach(t=>document.getElementById('pf-'+t)?.classList.toggle('active',t===type));
  renderAdminProducts();
}
function renderAdminProducts(){
  const q  = (document.getElementById('admin-product-search')?.value||'').toLowerCase();
  const el = document.getElementById('admin-product-list');
  let items = adminProductType==='finished' ? FINISHED : MATERIALS.filter(m=>m.type===adminProductType);
  if(q) items = items.filter(i=>i.name.toLowerCase().includes(q)||i.id.toLowerCase().includes(q));
  el.innerHTML = items.map(item=>{
    const qty = inventory[item.id]??item.qty;
    const cls = qty<=0?'empty':qty<=item.min&&item.min>0?'low':'ok';
    return `<div class="catdetail-row" onclick="editProduct('${item.id}')">
      <div class="catdetail-emoji">${item.emoji}</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${item.name}</div>
        <div class="catdetail-id">${item.id} ・ 安全庫存 ${item.min}</div>
      </div>
      <div class="catdetail-right">
        <div class="catdetail-qty ${cls}">${qty}</div>
        <div class="catdetail-unit">個</div>
      </div>
    </div>`;
  }).join('') || '<div class="order-empty">找不到商品</div>';
}

let _editProductId = null;
function editProduct(id){
  _editProductId = id;
  const item = ALL_ITEMS.find(i=>i.id===id);
  if(!item) return;
  document.getElementById('prod-edit-id').value       = item.id;
  document.getElementById('prod-edit-name').value     = item.name;
  document.getElementById('prod-edit-emoji').value    = item.emoji;
  document.getElementById('prod-edit-min').value      = item.min||0;
  document.getElementById('prod-edit-price').value    = item.price||0;
  document.getElementById('prod-edit-qty').value      = inventory[item.id]??item.qty;
  document.getElementById('productEditModal').style.display = 'flex';
}
function openNewProductForm(){
  _editProductId = null;
  ['prod-edit-id','prod-edit-name','prod-edit-emoji','prod-edit-min','prod-edit-price','prod-edit-qty']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('prod-edit-emoji').value='📦';
  document.getElementById('productEditModal').style.display='flex';
}
function closeProductEditModal(e){ if(!e||e.target===document.getElementById('productEditModal')) document.getElementById('productEditModal').style.display='none'; }
function saveProduct(){
  const id    = document.getElementById('prod-edit-id').value.trim();
  const name  = document.getElementById('prod-edit-name').value.trim();
  const emoji = document.getElementById('prod-edit-emoji').value.trim()||'📦';
  const min   = parseInt(document.getElementById('prod-edit-min').value)||0;
  const price = parseInt(document.getElementById('prod-edit-price').value)||0;
  const qty   = parseInt(document.getElementById('prod-edit-qty').value)||0;
  if(!id||!name){ showToast('⚠️ 請填寫編號和名稱'); return; }
  if(_editProductId){
    const arr = adminProductType==='finished'?FINISHED:MATERIALS;
    const idx = arr.findIndex(i=>i.id===_editProductId);
    if(idx>=0){ arr[idx].name=name; arr[idx].emoji=emoji; arr[idx].min=min; arr[idx].price=price; }
    // 更新 ALL_ITEMS
    const ai = ALL_ITEMS.findIndex(i=>i.id===_editProductId);
    if(ai>=0){ ALL_ITEMS[ai].name=name; ALL_ITEMS[ai].emoji=emoji; ALL_ITEMS[ai].min=min; ALL_ITEMS[ai].price=price; }
    // 更新 BARCODE_INDEX
    if(BARCODE_INDEX[id]) { BARCODE_INDEX[id].name=name; BARCODE_INDEX[id].emoji=emoji; }
    inventory[_editProductId] = qty;
  } else {
    const newItem = {id, barcode:id, name, emoji, qty, min, price, type:adminProductType==='finished'?undefined:adminProductType, cat:adminProductType==='finished'?'其他':undefined};
    if(adminProductType==='finished') FINISHED.push(newItem);
    else { newItem.type=adminProductType; MATERIALS.push(newItem); }
    ALL_ITEMS.push(newItem);
    BARCODE_INDEX[id] = newItem;
    inventory[id] = qty;
  }
  saveInventory();
  document.getElementById('productEditModal').style.display='none';
  showToast('✅ 商品資料已儲存');
  renderAdminProducts();
}

// ── BOM 管理 ──
let bomEditId = null;
let bomEditItems = [];
function renderBomList(q){
  const el = document.getElementById('bom-list');
  const items = (q?FINISHED.filter(i=>i.name.includes(q)||i.id.includes(q)):FINISHED);
  el.innerHTML = items.map(item=>{
    const bom = BOM[item.id]||[];
    return `<div class="catdetail-row" onclick="editBom('${item.id}')">
      <div class="catdetail-emoji">${item.emoji}</div>
      <div class="catdetail-info">
        <div class="catdetail-name">${item.name}</div>
        <div class="catdetail-id">${item.id} ・ 已設定 ${bom.length} 種材料</div>
      </div>
      <i class="ti ti-chevron-right" style="color:var(--text3);"></i>
    </div>`;
  }).join('');
}
function editBom(id){
  bomEditId = id;
  const item = FINISHED.find(i=>i.id===id);
  if(!item) return;
  document.getElementById('bom-edit-title').textContent = item.name;
  document.getElementById('bom-edit-hint').textContent  = `${item.emoji} ${item.name} 需要哪些材料？`;
  bomEditItems = JSON.parse(JSON.stringify(BOM[id]||[]));
  document.getElementById('bom-mat-search').value='';
  document.getElementById('bom-mat-result').style.display='none';
  renderBomEditList();
  showPage('admin-bom-edit');
}
function bomSearchMat(q){
  const res = document.getElementById('bom-mat-result');
  if(!q){ res.style.display='none'; return; }
  const items = MATERIALS.filter(i=>i.name.includes(q)||i.id.includes(q)).slice(0,8);
  if(!items.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML = items.map(m=>`
    <div class="pos-search-result-item" onclick="bomAddMat('${m.id}')">
      <span>${m.emoji}</span>
      <span style="flex:1;font-size:13px;">${m.name}</span>
      <span class="p-tag ${m.type==='semi'?'semi':'pack'}">${m.type==='semi'?'半成品':'包材'}</span>
    </div>`).join('');
}
function bomAddMat(id){
  const m = MATERIALS.find(i=>i.id===id);
  if(!m) return;
  if(bomEditItems.find(i=>i.id===id)){ showToast('⚠️ 已在清單中'); return; }
  bomEditItems.push({id, name:m.name, qty:1});
  document.getElementById('bom-mat-search').value='';
  document.getElementById('bom-mat-result').style.display='none';
  renderBomEditList();
}
function bomRemoveMat(id){ bomEditItems=bomEditItems.filter(i=>i.id!==id); renderBomEditList(); }
function bomChangeQty(id,delta){
  const m = bomEditItems.find(i=>i.id===id);
  if(m) m.qty = Math.max(0.1, parseFloat((m.qty+delta).toFixed(1)));
  renderBomEditList();
}
function renderBomEditList(){
  const el = document.getElementById('bom-mat-list');
  const cnt= document.getElementById('bom-mat-count');
  cnt.textContent = bomEditItems.length+'項';
  if(!bomEditItems.length){ el.innerHTML='<div class="order-empty">尚未設定材料</div>'; return; }
  const mat = (id)=>MATERIALS.find(i=>i.id===id)||{emoji:'📦',name:id};
  el.innerHTML = bomEditItems.map(item=>{
    const m = mat(item.id);
    return `<div class="order-row">
      <div class="order-emoji">${m.emoji}</div>
      <div class="order-info"><div class="order-name">${item.name||m.name}</div><div class="order-id">${item.id}</div></div>
      <div class="order-qty-ctrl">
        <button class="qty-edit-btn minus" onclick="bomChangeQty('${item.id}',-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-edit-btn plus" onclick="bomChangeQty('${item.id}',1)">＋</button>
      </div>
      <button class="order-del" onclick="bomRemoveMat('${item.id}')"><i class="ti ti-x"></i></button>
    </div>`;
  }).join('');
}
function saveBomEdit(){
  if(!bomEditId) return;
  BOM[bomEditId] = JSON.parse(JSON.stringify(bomEditItems));
  // 同步更新 BOM_RAW（轉成 name 格式存回）
  const nameIndex = {};
  MATERIALS.forEach(m=>{ nameIndex[m.id]=m.name; });
  BOM_RAW[bomEditId] = bomEditItems.map(i=>({n:nameIndex[i.id]||i.id, q:i.qty}));
  showToast('✅ BOM 已更新');
  showPage('admin-bom');
  renderBomList('');
}

// ══════════════════════════════
// 估價單付款狀態
// ══════════════════════════════
let estPayStatus = 'unpaid';
const PAY_LABELS = { unpaid:'未收款', partial:'部分收款', paid:'已收款' };
const PAY_COLORS = { unpaid:'#E24B4A', partial:'#BA7517', paid:'#1D9E75' };

function selectPayStatus(status){
  estPayStatus = status;
  ['unpaid','partial','paid'].forEach(s=>{
    document.getElementById('ps-'+s)?.classList.toggle('active', s===status);
  });
  document.getElementById('partial-amount-row').style.display = status==='partial' ? 'flex' : 'none';
}

// 在 _collectEstimate 後補充付款欄位（由 estimate.js 呼叫）
function collectPayStatus(){
  return {
    payStatus:  estPayStatus,
    paidAmount: estPayStatus==='paid' ? (parseInt(document.getElementById('est-total')?.textContent?.replace('$',''))||0)
                : estPayStatus==='partial' ? (parseInt(document.getElementById('est-paid-amount')?.value)||0)
                : 0,
  };
}
function applyPayStatus(e){
  estPayStatus = e.payStatus||'unpaid';
  ['unpaid','partial','paid'].forEach(s=>{
    document.getElementById('ps-'+s)?.classList.toggle('active',s===estPayStatus);
  });
  document.getElementById('partial-amount-row').style.display = estPayStatus==='partial'?'flex':'none';
  if(document.getElementById('est-paid-amount'))
    document.getElementById('est-paid-amount').value = e.paidAmount||0;
}

// ══════════════════════════════
// 未收款頁面
// ══════════════════════════════
function initUnpaid(){
  const el     = document.getElementById('unpaid-list');
  const statsEl= document.getElementById('unpaid-stats');
  const unpaid = (typeof estimates!=='undefined' ? estimates : []).filter(e=>
    (e.payStatus==='unpaid'||!e.payStatus) && e.status!=='cancel' && e.status!=='draft'
  );
  const partial= (typeof estimates!=='undefined' ? estimates : []).filter(e=>e.payStatus==='partial');
  const totalOwed = unpaid.reduce((s,e)=>s+(e.total||0),0)
                  + partial.reduce((s,e)=>s+(e.total||0)-(e.paidAmount||0),0);
  statsEl.innerHTML = `
    <div class="finance-stat-card"><div class="finance-stat-num" style="color:#E24B4A;">${unpaid.length}</div><div class="finance-stat-label">未收款單</div></div>
    <div class="finance-stat-card"><div class="finance-stat-num" style="color:#BA7517;">${partial.length}</div><div class="finance-stat-label">部分收款</div></div>
    <div class="finance-stat-card"><div class="finance-stat-num" style="color:#E24B4A;">$${totalOwed.toLocaleString()}</div><div class="finance-stat-label">應收總金額</div></div>`;
  const all = [...unpaid.map(e=>({...e,_type:'unpaid'})), ...partial.map(e=>({...e,_type:'partial'}))];
  all.sort((a,b)=>a.date<b.date?1:-1);
  if(!all.length){ el.innerHTML='<div class="report-empty">沒有未收款訂單 🎉</div>'; return; }
  const cusMap = {};
  if(typeof customers!=='undefined') customers.forEach(c=>{ cusMap[c.id]=c.name; });
  el.innerHTML = all.map(e=>{
    const owed = e._type==='partial'?(e.total||0)-(e.paidAmount||0):(e.total||0);
    const col  = e._type==='partial'?'#BA7517':'#E24B4A';
    return `<div class="est-list-row" onclick="viewEstimate('${e.id}')">
      <div class="est-list-left">
        <div class="est-list-no">${e.no}</div>
        <div class="est-list-cust">${cusMap[e.customerId]||'—'}</div>
        <div class="est-list-date">${fmtDate(e.date)}</div>
      </div>
      <div class="est-list-right">
        <div class="est-list-total" style="color:${col};">應收 $${owed.toLocaleString()}</div>
        <div class="est-list-status" style="color:${col};">${PAY_LABELS[e._type]}</div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════
// 財務總覽
// ══════════════════════════════
let financeMonth = new Date().getMonth();
let financeYear  = new Date().getFullYear();

function initFinance(){ renderFinance(); }
function changeMonth(delta){
  financeMonth += delta;
  if(financeMonth>11){ financeMonth=0; financeYear++; }
  if(financeMonth<0) { financeMonth=11; financeYear--; }
  renderFinance();
}

function renderFinance(){
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  document.getElementById('finance-month-label').textContent = `${financeYear} 年 ${monthNames[financeMonth]}`;

  // 篩選當月銷售記錄
  const monthLogs = logs.filter(l=>{
    if(l.op!=='ship' && l.op_label!=='POS出售') return false;
    if(!l.time) return false;
    try{
      const parts = l.time.match(/(\d+)\/(\d+)/);
      if(!parts) return false;
      const m = parseInt(parts[1])-1;
      // 假設年份為當前或上一年
      const y = m > new Date().getMonth() ? financeYear-1 : financeYear;
      return m===financeMonth && y===financeYear;
    } catch(e){ return false; }
  });

  // 計算銷售額（用商品售價）
  const totalSales = monthLogs.reduce((s,l)=>{
    const item = ALL_ITEMS.find(i=>i.id===l.id);
    return s+(item?.price||0)*(l.qty||0);
  },0);
  const totalQty   = monthLogs.reduce((s,l)=>s+(l.qty||0),0);
  const txCount    = [...new Set(monthLogs.map(l=>l.time))].length;

  // 統計卡
  document.getElementById('finance-stats').innerHTML = `
    <div class="finance-stat-card">
      <div class="finance-stat-num" style="color:#6B4FBB;">$${totalSales.toLocaleString()}</div>
      <div class="finance-stat-label">銷售總額</div>
    </div>
    <div class="finance-stat-card">
      <div class="finance-stat-num">${txCount}</div>
      <div class="finance-stat-label">交易筆數</div>
    </div>
    <div class="finance-stat-card">
      <div class="finance-stat-num">${totalQty}</div>
      <div class="finance-stat-label">銷售數量</div>
    </div>`;

  // 每日趨勢（最多31天）
  const daysInMonth = new Date(financeYear, financeMonth+1, 0).getDate();
  const dailySales  = Array(daysInMonth).fill(0);
  monthLogs.forEach(l=>{
    const parts = l.time?.match(/(\d+)\/(\d+)/);
    if(!parts) return;
    const d = parseInt(parts[2])-1;
    if(d>=0&&d<daysInMonth){
      const item = ALL_ITEMS.find(i=>i.id===l.id);
      dailySales[d] += (item?.price||0)*(l.qty||0);
    }
  });
  const maxDay = Math.max(...dailySales,1);
  const chartEl = document.getElementById('finance-daily-chart');
  chartEl.innerHTML = `
    <div class="finance-bar-chart">
      ${dailySales.map((v,i)=>`
        <div class="finance-bar-col" title="${i+1}日 $${v.toLocaleString()}">
          <div class="finance-bar" style="height:${Math.round(v/maxDay*80)+4}px;background:${v>0?'#6B4FBB':'var(--border)'}"></div>
          <div class="finance-bar-label">${(i+1)%5===0?i+1:''}</div>
        </div>`).join('')}
    </div>
    <div style="text-align:center;font-size:11px;color:var(--text3);margin-top:4px;">（每格代表1天，數字為日期）</div>`;

  // 品項排行 TOP 10
  const itemMap = {};
  monthLogs.forEach(l=>{
    if(!itemMap[l.id]) itemMap[l.id]={id:l.id,name:l.name,emoji:l.emoji||'📦',qty:0,amount:0};
    const item = ALL_ITEMS.find(i=>i.id===l.id);
    itemMap[l.id].qty    += l.qty||0;
    itemMap[l.id].amount += (item?.price||0)*(l.qty||0);
  });
  const ranking = Object.values(itemMap).sort((a,b)=>b.amount-a.amount).slice(0,10);
  const maxAmt  = ranking[0]?.amount||1;
  const rankEl  = document.getElementById('finance-ranking');
  rankEl.innerHTML = ranking.length ? ranking.map((item,i)=>`
    <div class="event-rank-row">
      <div class="event-rank-num ${i<3?'top':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">${item.emoji} ${item.name}</div>
        <div class="event-rank-bar-wrap"><div class="event-rank-bar" style="width:${Math.round(item.amount/maxAmt*100)}%;background:#6B4FBB;"></div></div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:15px;font-weight:700;color:#6B4FBB;">$${item.amount.toLocaleString()}</div>
        <div style="font-size:11px;color:var(--text3);">${item.qty} 個</div>
      </div>
    </div>`).join('') : '<div class="report-empty">本月尚無銷售記錄</div>';
}

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', ()=>{
  renderBomList('');
  renderAdminSuppliers('');
  renderAdminProducts();
});
