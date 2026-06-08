// ============================================================
// data.js — 商品基礎資料（成品 / 半成品 / 包材）
// 正式上線前由 Excel 匯入工具覆寫
// ============================================================

// ── 成品 ──
const FINISHED = [
  // 001 清潔
  { id:'F001001', barcode:'001001', name:'天然洗碗精',       emoji:'🧴', category:'001', unit:'瓶', costPrice:60,  salePrice:120, safetyStock:20, supplierId:'',     active:true },
  { id:'F001002', barcode:'001002', name:'天然洗衣皂',       emoji:'🧼', category:'001', unit:'個', costPrice:30,  salePrice:80,  safetyStock:20, supplierId:'',     active:true },
  // 002 果乾/梅
  { id:'F002001', barcode:'002001', name:'紫蘇梅',           emoji:'🍑', category:'002', unit:'包', costPrice:80,  salePrice:180, safetyStock:15, supplierId:'',     active:true },
  { id:'F002002', barcode:'002002', name:'話梅',             emoji:'🍑', category:'002', unit:'包', costPrice:60,  salePrice:150, safetyStock:15, supplierId:'',     active:true },
  // 003 爆米花
  { id:'F003001', barcode:'003001', name:'爆米花（焦糖）',   emoji:'🍿', category:'003', unit:'罐', costPrice:80,  salePrice:199, safetyStock:20, supplierId:'ㄊ001', active:true },
  { id:'F003002', barcode:'003002', name:'爆米花（鹹甜）',   emoji:'🍿', category:'003', unit:'罐', costPrice:80,  salePrice:199, safetyStock:20, supplierId:'ㄊ001', active:true },
  { id:'F003003', barcode:'003003', name:'爆米花（辣味）',   emoji:'🍿', category:'003', unit:'罐', costPrice:80,  salePrice:199, safetyStock:20, supplierId:'ㄊ001', active:true },
  // 004 咖啡
  { id:'F004001', barcode:'004001', name:'耳掛咖啡（曼特寧）',    emoji:'☕', category:'004', unit:'盒', costPrice:120, salePrice:280, safetyStock:10, supplierId:'', active:true },
  { id:'F004002', barcode:'004002', name:'耳掛咖啡（衣索比亞）',  emoji:'☕', category:'004', unit:'盒', costPrice:130, salePrice:300, safetyStock:10, supplierId:'', active:true },
  // 005 茶葉
  { id:'F005001', barcode:'005001', name:'阿里山高山茶',     emoji:'🍵', category:'005', unit:'盒', costPrice:200, salePrice:480, safetyStock:10, supplierId:'ㄅ001', active:true },
  { id:'F005002', barcode:'005002', name:'凍頂烏龍茶',       emoji:'🍵', category:'005', unit:'盒', costPrice:180, salePrice:420, safetyStock:10, supplierId:'ㄅ001', active:true },
  // 006 無咖啡因
  { id:'F006001', barcode:'006001', name:'洋甘菊茶',         emoji:'🌼', category:'006', unit:'盒', costPrice:100, salePrice:250, safetyStock:10, supplierId:'', active:true },
  { id:'F006002', barcode:'006002', name:'薰衣草茶',         emoji:'💜', category:'006', unit:'盒', costPrice:100, salePrice:250, safetyStock:10, supplierId:'', active:true },
  // 007 米糧
  { id:'F007001', barcode:'007001', name:'有機白米',         emoji:'🍚', category:'007', unit:'包', costPrice:150, salePrice:350, safetyStock:10, supplierId:'ㄘ001', active:true },
  { id:'F007002', barcode:'007002', name:'糙米',             emoji:'🌾', category:'007', unit:'包', costPrice:140, salePrice:320, safetyStock:10, supplierId:'ㄘ001', active:true },
  // 008 零嘴
  { id:'F008001', barcode:'008001', name:'薏仁餅乾',         emoji:'🍪', category:'008', unit:'包', costPrice:60,  salePrice:150, safetyStock:15, supplierId:'ㄋ001', active:true },
  { id:'F008002', barcode:'008002', name:'蜜餞綜合包',       emoji:'🍬', category:'008', unit:'包', costPrice:50,  salePrice:120, safetyStock:15, supplierId:'ㄕ001', active:true },
];

// ── 半成品 ──
const SEMI = [
  { id:'S001001', barcode:'S001001', name:'爆米花原料（焦糖）', emoji:'🌽', type:'semi', unit:'公斤', costPrice:40, safetyStock:5,  supplierId:'ㄊ001', active:true },
  { id:'S001002', barcode:'S001002', name:'爆米花原料（鹹甜）', emoji:'🌽', type:'semi', unit:'公斤', costPrice:40, safetyStock:5,  supplierId:'ㄊ001', active:true },
  { id:'S002001', barcode:'S002001', name:'茶磚（烏龍）',       emoji:'🧱', type:'semi', unit:'片',   costPrice:30, safetyStock:10, supplierId:'ㄑ002', active:true },
];

// ── 包材 ──
const PACKAGING = [
  { id:'P001001', barcode:'P001001', name:'爆米花鐵罐',     emoji:'🥫', type:'packaging', unit:'個', costPrice:15, safetyStock:50,  supplierId:'ㄉ004', active:true },
  { id:'P001002', barcode:'P001002', name:'茶葉禮盒',       emoji:'📦', type:'packaging', unit:'個', costPrice:20, safetyStock:30,  supplierId:'ㄍ002', active:true },
  { id:'P001003', barcode:'P001003', name:'提繩',           emoji:'🎀', type:'packaging', unit:'條', costPrice:2,  safetyStock:100, supplierId:'ㄓ001', active:true },
  { id:'P001004', barcode:'P001004', name:'中文標籤貼紙',   emoji:'🏷️', type:'packaging', unit:'張', costPrice:1,  safetyStock:200, supplierId:'ㄍ002', active:true },
  { id:'P001005', barcode:'P001005', name:'腰條',           emoji:'📄', type:'packaging', unit:'張', costPrice:2,  safetyStock:100, supplierId:'ㄍ002', active:true },
];

// ── 全品項索引 ──
const ALL_ITEMS = [...FINISHED, ...SEMI, ...PACKAGING];
const ITEM_INDEX = {};
ALL_ITEMS.forEach(i => { ITEM_INDEX[i.id] = i; });

// ── 商品分類 ──
const CATEGORIES = {
  '001': { name:'清潔',     emoji:'🧴' },
  '002': { name:'果乾/梅',  emoji:'🍑' },
  '003': { name:'爆米花',   emoji:'🍿' },
  '004': { name:'咖啡',     emoji:'☕' },
  '005': { name:'茶葉',     emoji:'🍵' },
  '006': { name:'無咖啡因', emoji:'🌼' },
  '007': { name:'米糧',     emoji:'🌾' },
  '008': { name:'零嘴',     emoji:'🍪' },
};

// ── BOM 組合 ──
let BOM = {
  'F003001': [
    { materialId:'S001001', qty:0.2 },
    { materialId:'P001001', qty:1 },
    { materialId:'P001004', qty:1 },
    { materialId:'P001005', qty:1 },
  ],
  'F003002': [
    { materialId:'S001002', qty:0.2 },
    { materialId:'P001001', qty:1 },
    { materialId:'P001004', qty:1 },
    { materialId:'P001005', qty:1 },
  ],
  'F005002': [
    { materialId:'S002001', qty:3 },
    { materialId:'P001002', qty:1 },
    { materialId:'P001003', qty:1 },
    { materialId:'P001004', qty:1 },
  ],
};

// ── 廠商基礎資料（聯絡資料存 Firebase）──
const SUPPLIERS = [
  { id:'ㄅ001', name:'秉昇茶葉' },
  { id:'ㄆ001', name:'品鮮茶廠' },
  { id:'ㄇ001', name:'瑪理髮央企業社' },
  { id:'ㄈ001', name:'福聯達茶行' },
  { id:'ㄉ001', name:'德瑞國際貿易有限公司' },
  { id:'ㄉ002', name:'大晃茶業股份有限公司' },
  { id:'ㄉ003', name:'東興製冰廠' },
  { id:'ㄉ004', name:'大煒塑膠工業股份有限公司' },
  { id:'ㄊ001', name:'天慧爆米花' },
  { id:'ㄊ002', name:'拓林美企業有限公司' },
  { id:'ㄊ003', name:'淘寶' },
  { id:'ㄋ001', name:'南投縣草屯薏仁生產合作社' },
  { id:'ㄍ001', name:'光總企業有限公司' },
  { id:'ㄍ002', name:'冠球彩色印刷股份有限公司' },
  { id:'ㄍ003', name:'廣維(咖啡杯)' },
  { id:'ㄍ004', name:'觀心園' },
  { id:'ㄏ001', name:'皇家可口股份有限公司' },
  { id:'ㄏ002', name:'荷包袋國際有限公司' },
  { id:'ㄐ001', name:'金硯有限公司' },
  { id:'ㄐ002', name:'健豪印刷事業股份有限公司' },
  { id:'ㄐ003', name:'金鴻華企業有限公司' },
  { id:'ㄑ001', name:'柒彩松' },
  { id:'ㄑ002', name:'麒麟茶葉企業股份有限公司' },
  { id:'ㄑ003', name:'洽和碾米工廠' },
  { id:'ㄒ001', name:'小白菜化妝品工廠' },
  { id:'ㄒ002', name:'蝦皮(公益捐款)' },
  { id:'ㄒ003', name:'軒靖貿易有限公司' },
  { id:'ㄓ001', name:'仲圖包裝(鹿鹿開發-竹山店)' },
  { id:'ㄓ002', name:'紙品訂製店-淘寶' },
  { id:'ㄔ001', name:'晨軒梅(王貴香)' },
  { id:'ㄔ002', name:'萇宏包材行' },
  { id:'ㄔ003', name:'誠欲實業股份有限公司' },
  { id:'ㄕ001', name:'順泰蜜餞食品股份有限公司' },
  { id:'ㄖ001', name:'日昇-塑膠杯' },
  { id:'ㄘ001', name:'草屯鎮農會碾米廠' },
  { id:'ㄙ001', name:'松宏有限公司' },
  { id:'ㄞ001', name:'愛就夠公益網' },
  { id:'ㄨ001', name:'無忌興業股份有限公司' },
  { id:'ㄩ001', name:'源品實業有限公司' },
  { id:'ㄩ002', name:'勇捷(制服)' },
  { id:'一001', name:'晏城股份有限公司' },
];
const SUPPLIER_INDEX = {};
SUPPLIERS.forEach(s => { SUPPLIER_INDEX[s.id] = s; });

// ── 工具函式 ──
function getItem(id)     { return ITEM_INDEX[id]     || null; }
function getSupplier(id) { return SUPPLIER_INDEX[id] || null; }
function getCategory(id) { return CATEGORIES[id]     || { name:id, emoji:'📦' }; }
