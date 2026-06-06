// ===== 智慧搜尋元件（全域共用）=====
// 輸入編號前幾碼、名稱、分類關鍵字 → 即時跳出選項
// 用法：SmartSearch.attach(inputEl, onSelect, options)

const SmartSearch = (() => {

  let _dropdown  = null;   // 目前顯示的下拉
  let _onSelect  = null;
  let _items     = [];
  let _active    = -1;
  let _inputEl   = null;
  let _opts      = {};

  // 分類說明（用於提示）
  const CAT_HINT = {
    '001':'清潔','002':'果乾/梅','003':'爆米花',
    '004':'咖啡','005':'茶葉','006':'無咖啡因',
    '007':'米糧','008':'零嘴','100':'包材','200':'物料'
  };

  function getCatHint(id){
    const prefix = id.slice(0,3);
    return CAT_HINT[prefix] || '';
  }

  // 建立下拉 DOM
  function createDropdown(){
    const el = document.createElement('div');
    el.id = 'ss-dropdown';
    el.className = 'ss-dropdown';
    document.body.appendChild(el);
    // 點其他地方關閉
    document.addEventListener('mousedown', e=>{
      if(!el.contains(e.target) && e.target !== _inputEl) hide();
    });
    return el;
  }

  function getDropdown(){
    return document.getElementById('ss-dropdown') || createDropdown();
  }

  // 定位下拉到 input 下方
  function positionDropdown(inputEl){
    const rect = inputEl.getBoundingClientRect();
    const dd   = getDropdown();
    dd.style.left   = rect.left + window.scrollX + 'px';
    dd.style.top    = rect.bottom + window.scrollY + 4 + 'px';
    dd.style.width  = Math.max(rect.width, 300) + 'px';
  }

  // 搜尋邏輯
  function search(q, pool){
    if(!q) return [];
    q = q.toLowerCase().trim();
    // 精確前綴優先，再模糊比對
    const exact  = pool.filter(i =>
      i.id.toLowerCase().startsWith(q) ||
      i.barcode?.toLowerCase().startsWith(q)
    );
    const fuzzy  = pool.filter(i =>
      !exact.includes(i) && (
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        (i.cat||'').toLowerCase().includes(q) ||
        getCatHint(i.id).toLowerCase().includes(q)
      )
    );
    return [...exact, ...fuzzy].slice(0, 12);
  }

  function render(results){
    const dd = getDropdown();
    if(!results.length){ hide(); return; }
    _items  = results;
    _active = -1;

    dd.innerHTML = results.map((item, idx) => {
      const qty    = inventory?.[item.id] ?? item.qty ?? 0;
      const hint   = getCatHint(item.id);
      const qCls   = qty <= 0 ? 'ss-qty-empty' : qty <= (item.min||0) ? 'ss-qty-low' : 'ss-qty-ok';
      return `<div class="ss-item" data-idx="${idx}" onmousedown="SmartSearch._pick(${idx})">
        <span class="ss-emoji">${item.emoji||'📦'}</span>
        <div class="ss-info">
          <div class="ss-name">${highlight(item.name, _inputEl?.value||'')}</div>
          <div class="ss-sub">${item.id}${hint?' · '+hint:''}</div>
        </div>
        <div class="${qCls} ss-stock">${qty}<span class="ss-unit">個</span></div>
      </div>`;
    }).join('');

    dd.style.display = 'block';
    positionDropdown(_inputEl);
  }

  function highlight(text, q){
    if(!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if(idx < 0) return text;
    return text.slice(0,idx) +
      `<mark class="ss-mark">${text.slice(idx, idx+q.length)}</mark>` +
      text.slice(idx+q.length);
  }

  function hide(){
    const dd = document.getElementById('ss-dropdown');
    if(dd) dd.style.display = 'none';
    _items = []; _active = -1;
  }

  function _pick(idx){
    const item = _items[idx];
    if(!item) return;
    hide();
    if(typeof _onSelect === 'function') _onSelect(item);
  }

  // 鍵盤導航
  function handleKey(e){
    const dd = document.getElementById('ss-dropdown');
    if(!dd || dd.style.display==='none') return;
    if(e.key==='ArrowDown'){
      e.preventDefault();
      _active = Math.min(_active+1, _items.length-1);
      updateActive();
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      _active = Math.max(_active-1, 0);
      updateActive();
    } else if(e.key==='Enter' && _active >= 0){
      e.preventDefault();
      _pick(_active);
    } else if(e.key==='Escape'){
      hide();
    }
  }

  function updateActive(){
    const dd = document.getElementById('ss-dropdown');
    if(!dd) return;
    dd.querySelectorAll('.ss-item').forEach((el,i)=>{
      el.classList.toggle('ss-item-active', i===_active);
    });
  }

  // ── 公開 API ──
  function attach(inputEl, onSelect, opts={}){
    _onSelect = onSelect;
    _opts     = opts;

    inputEl.addEventListener('input', e=>{
      _inputEl = inputEl;
      const q   = e.target.value.trim();
      const pool = opts.pool || ALL_ITEMS;
      if(!q){ hide(); return; }
      const results = search(q, pool);
      render(results);
      positionDropdown(inputEl);
    });

    inputEl.addEventListener('keydown', handleKey);

    inputEl.addEventListener('focus', e=>{
      _inputEl = inputEl;
      const q = inputEl.value.trim();
      if(q){
        const pool = opts.pool || ALL_ITEMS;
        const results = search(q, pool);
        render(results);
        positionDropdown(inputEl);
      }
    });
  }

  return { attach, hide, _pick };
})();

// ── 初始化：把所有搜尋欄都接上 SmartSearch ──
document.addEventListener('DOMContentLoaded', () => {

  // 進貨單
  const purchaseInput = document.getElementById('purchaseBarcodeInput');
  if(purchaseInput) SmartSearch.attach(purchaseInput, item => {
    purchaseInput.value = item.barcode || item.id;
    orders.purchase.curBarcode = item.barcode || item.id;
    orderLookup('purchase');
  }, { pool: ALL_ITEMS });

  // 出貨單
  const shipmentInput = document.getElementById('shipmentBarcodeInput');
  if(shipmentInput) SmartSearch.attach(shipmentInput, item => {
    shipmentInput.value = item.barcode || item.id;
    orders.shipment.curBarcode = item.barcode || item.id;
    orderLookup('shipment');
  }, { pool: FINISHED });

  // 加工生產單
  const prodInput = document.getElementById('prodBarcodeInput');
  if(prodInput) SmartSearch.attach(prodInput, item => {
    prodInput.value = item.barcode || item.id;
    prodLookup();
  }, { pool: FINISHED });

  // 估價單
  const estInput = document.getElementById('est-item-search');
  if(estInput) SmartSearch.attach(estInput, item => {
    estAddItem(item.id);
    estInput.value = '';
    SmartSearch.hide();
  }, { pool: FINISHED });

  // POS 搜尋
  const posInput = document.getElementById('posSearch');
  if(posInput) SmartSearch.attach(posInput, item => {
    addPOSItemById(item.id);
    posInput.value = '';
    SmartSearch.hide();
  }, { pool: FINISHED });

  // 查看庫存
  const invInput = document.getElementById('invBarcodeInput');
  if(invInput) SmartSearch.attach(invInput, item => {
    invBarcodeInput.value = item.barcode || item.id;
    invLookup();
  }, { pool: ALL_ITEMS });

  // 製程進度新增
  const procItemSearch = document.getElementById('proc-item-search');
  if(procItemSearch) SmartSearch.attach(procItemSearch, item => {
    procAddItem(item.id);
    procItemSearch.value = '';
    SmartSearch.hide();
  }, { pool: FINISHED });

});
