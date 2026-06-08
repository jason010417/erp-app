// ============================================================
// smartsearch.js — 智慧搜尋元件（全域共用）
// 輸入編號前幾碼、名稱、分類關鍵字 → 即時跳出選項
// ============================================================

const SmartSearch = (() => {
  let _dropdown = null;
  let _callback = null;
  let _pool     = ALL_ITEMS;
  let _inputEl  = null;
  let _active   = -1;
  let _results  = [];

  // 分類提示
  const CAT_HINT = {
    '001':'清潔','002':'果乾/梅','003':'爆米花',
    '004':'咖啡','005':'茶葉',  '006':'無咖啡因',
    '007':'米糧','008':'零嘴',
  };

  function hint(item){
    return CAT_HINT[item.category] || (item.type === 'semi' ? '半成品' : item.type === 'packaging' ? '包材' : '');
  }

  function search(q, pool){
    if(!q) return [];
    q = q.toLowerCase().trim();
    const exact = pool.filter(i =>
      i.id?.toLowerCase().startsWith(q) ||
      i.barcode?.toLowerCase().startsWith(q)
    );
    const fuzzy = pool.filter(i =>
      !exact.includes(i) && (
        i.name?.toLowerCase().includes(q) ||
        hint(i).toLowerCase().includes(q)
      )
    );
    return [...exact, ...fuzzy].slice(0, 12);
  }

  function highlight(text, q){
    if(!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if(idx < 0) return text;
    return text.slice(0,idx)
      + `<mark class="ss-mark">${text.slice(idx,idx+q.length)}</mark>`
      + text.slice(idx+q.length);
  }

  function getDropdown(inputEl){
    if(!_dropdown){
      _dropdown = document.createElement('div');
      _dropdown.className = 'ss-dropdown';
      document.body.appendChild(_dropdown);
      document.addEventListener('mousedown', e => {
        if(!_dropdown.contains(e.target) && e.target !== _inputEl) hide();
      });
    }
    // 定位
    const rect = inputEl.getBoundingClientRect();
    _dropdown.style.position = 'fixed';
    _dropdown.style.left     = rect.left + 'px';
    _dropdown.style.top      = (rect.bottom + 4) + 'px';
    _dropdown.style.width    = Math.max(rect.width, 280) + 'px';
    return _dropdown;
  }

  function render(results, q, locationId){
    _results = results;
    _active  = -1;
    const dd = _dropdown;
    dd.innerHTML = results.map((item, idx) => {
      const stock = locationId
        ? getStock(item.id, locationId)
        : getTotalStock(item.id);
      const qCls = stock <= 0 ? 'ss-qty-empty' : isLowStock(item.id) ? 'ss-qty-low' : 'ss-qty-ok';
      return `<div class="ss-item" data-idx="${idx}" onmousedown="SmartSearch._pick(${idx})">
        <span class="ss-emoji">${item.emoji || '📦'}</span>
        <div class="ss-info">
          <div class="ss-name">${highlight(item.name, q)}</div>
          <div class="ss-sub">${item.id}${hint(item) ? ' · ' + hint(item) : ''}</div>
        </div>
        <div class="${qCls} ss-stock">${stock}<span class="ss-unit">${item.unit || '個'}</span></div>
      </div>`;
    }).join('');
    dd.style.display = 'block';
  }

  function hide(){
    if(_dropdown) _dropdown.style.display = 'none';
    _results = []; _active = -1;
  }

  function _pick(idx){
    const item = _results[idx];
    if(!item) return;
    hide();
    if(typeof _callback === 'function') _callback(item);
  }

  function handleKey(e){
    if(!_dropdown || _dropdown.style.display === 'none') return;
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      _active = Math.min(_active + 1, _results.length - 1);
      updateActive();
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      _active = Math.max(_active - 1, 0);
      updateActive();
    } else if(e.key === 'Enter' && _active >= 0){
      e.preventDefault(); _pick(_active);
    } else if(e.key === 'Escape'){
      hide();
    }
  }

  function updateActive(){
    if(!_dropdown) return;
    _dropdown.querySelectorAll('.ss-item').forEach((el, i) => {
      el.classList.toggle('active', i === _active);
    });
  }

  // ── 公開 API ──
  function attach(inputEl, callback, opts = {}){
    _callback = callback;
    const pool = opts.pool || ALL_ITEMS;
    const loc  = opts.locationId || null;

    inputEl.addEventListener('input', e => {
      _inputEl = inputEl;
      const q  = e.target.value.trim();
      if(!q){ hide(); return; }
      const results = search(q, pool);
      if(!results.length){ hide(); return; }
      const dd = getDropdown(inputEl);
      render(results, q, loc);
    });
    inputEl.addEventListener('keydown', handleKey);
    inputEl.addEventListener('focus', e => {
      _inputEl = inputEl;
      const q  = inputEl.value.trim();
      if(q){
        const dd = getDropdown(inputEl);
        const results = search(q, pool);
        if(results.length) render(results, q, loc);
      }
    });
  }

  return { attach, hide, _pick };
})();

// ── 通用的「為不同情境搜尋商品」入口 ──
// context: 'estimate' | 'order' | 'pos' | 'storeB' | 'purchase' | 'production'
const _ssInstances = {};

function searchItemsFor(context, q){
  const resId = {
    estimate:   'est-item-search-result',
    order:      'order-item-search-result',
    pos:        'pos-search-result',
    storeB:     'storeB-search-result',
    purchase:   'purchase-search-result',
    production: 'prod-item-search-result',
  }[context];

  const poolMap = {
    estimate:   FINISHED,
    order:      FINISHED,
    pos:        FINISHED,
    storeB:     FINISHED,
    purchase:   [...SEMI, ...PACKAGING],
    production: FINISHED,
  };

  const res = document.getElementById(resId);
  if(!res) return;
  if(!q){ res.style.display = 'none'; return; }

  const pool    = poolMap[context] || ALL_ITEMS;
  const results = pool.filter(i =>
    i.name?.includes(q) || i.id?.toLowerCase().startsWith(q.toLowerCase())
  ).slice(0, 10);

  if(!results.length){ res.style.display = 'none'; return; }

  res.style.display = 'block';
  res.innerHTML = results.map(item => {
    const stock = getTotalStock(item.id);
    const qCls  = stock <= 0 ? 'ss-qty-empty' : isLowStock(item.id) ? 'ss-qty-low' : 'ss-qty-ok';
    return `<div class="ss-item" onmousedown="addItemTo('${context}','${item.id}')">
      <span class="ss-emoji">${item.emoji || '📦'}</span>
      <div class="ss-info">
        <div class="ss-name">${item.name}</div>
        <div class="ss-sub">${item.id}</div>
      </div>
      <div class="${qCls} ss-stock">${stock}<span class="ss-unit">${item.unit||'個'}</span></div>
    </div>`;
  }).join('');
}

// 統一的「加入品項」入口
function addItemTo(context, itemId){
  const resId = {
    estimate:   'est-item-search-result',
    order:      'order-item-search-result',
    pos:        'pos-search-result',
    storeB:     'storeB-search-result',
    purchase:   'purchase-search-result',
    production: 'prod-item-search-result',
  }[context];
  const searchId = {
    estimate:   'est-item-search',
    order:      'order-item-search',
    pos:        'pos-search',
    storeB:     'storeB-search',
    purchase:   'purchase-search',
    production: 'prod-item-search',
  }[context];

  const el = document.getElementById(resId);
  if(el) el.style.display = 'none';
  const si = document.getElementById(searchId);
  if(si) si.value = '';

  const fnMap = {
    estimate:   'addEstimateItem',
    order:      'addOrderItem',
    pos:        'addPOSItem',
    storeB:     'addStoreBItem',
    purchase:   'addPurchaseItem',
    production: 'addProductionItem',
  };
  if(typeof window[fnMap[context]] === 'function') window[fnMap[context]](itemId);
}
