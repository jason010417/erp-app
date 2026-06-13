// ============================================================
// data.js — 從 Excel 匯入的實際資料
// 匯入時間：2025-06
// 廠商：41 筆 ｜ 產品：218 筆 ｜ BOM：55 筆
// ============================================================

// ── 產品（全部，含成品/半成品/包材）──
const FINISHED = [
  {
    "id": "001100-001",
    "barcode": "001100-001",
    "name": "蘆薈洗潔精",
    "emoji": "🧴",
    "category": "001",
    "unit": "1罐",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 0,
    "supplierId": "ㄒ001",
    "active": true
  },
  {
    "id": "002401-001",
    "barcode": "002401-001",
    "name": "呷梅梅-梅有檸檬果乾",
    "emoji": "🍑",
    "category": "002",
    "unit": "250g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄔ001",
    "active": true
  },
  {
    "id": "002401-002",
    "barcode": "002401-002",
    "name": "呷梅梅-茶梅蜜餞",
    "emoji": "🍑",
    "category": "002",
    "unit": "250g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄔ001",
    "active": true
  },
  {
    "id": "002401-003",
    "barcode": "002401-003",
    "name": "呷梅梅-鳳梨梅蜜餞",
    "emoji": "🍑",
    "category": "002",
    "unit": "250g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄔ001",
    "active": true
  },
  {
    "id": "002401-004",
    "barcode": "002401-004",
    "name": "呷梅梅-紫蘇梅蜜餞",
    "emoji": "🍑",
    "category": "002",
    "unit": "250g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄔ001",
    "active": true
  },
  {
    "id": "002401-005",
    "barcode": "002401-005",
    "name": "呷梅梅-Q梅蜜餞",
    "emoji": "🍑",
    "category": "002",
    "unit": "250g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄔ001",
    "active": true
  },
  {
    "id": "002401-006",
    "barcode": "002401-006",
    "name": "呷梅梅-梅有芒果夾心",
    "emoji": "🍑",
    "category": "002",
    "unit": "100g/袋",
    "costPrice": 75.0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "",
    "active": true
  },
  {
    "id": "002401-007",
    "barcode": "002401-007",
    "name": "特淡甜梅",
    "emoji": "🍑",
    "category": "002",
    "unit": "130g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄕ001",
    "active": true
  },
  {
    "id": "002401-008",
    "barcode": "002401-008",
    "name": "無子梅餅",
    "emoji": "🍑",
    "category": "002",
    "unit": "90g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄕ001",
    "active": true
  },
  {
    "id": "002401-009",
    "barcode": "002401-009",
    "name": "甘草橄欖",
    "emoji": "🍑",
    "category": "002",
    "unit": "280g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄕ001",
    "active": true
  },
  {
    "id": "002401-010",
    "barcode": "002401-010",
    "name": "無籽橄欖",
    "emoji": "🍑",
    "category": "002",
    "unit": "230g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄕ001",
    "active": true
  },
  {
    "id": "002401-011",
    "barcode": "002401-011",
    "name": "紅心芭樂",
    "emoji": "🍑",
    "category": "002",
    "unit": "150g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 30,
    "supplierId": "ㄕ001",
    "active": true
  },
  {
    "id": "002401-012",
    "barcode": "002401-012",
    "name": "香菇",
    "emoji": "🍑",
    "category": "002",
    "unit": "29g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "002401-013",
    "barcode": "002401-013",
    "name": "黑糖無籽梅",
    "emoji": "🍑",
    "category": "002",
    "unit": "115g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "002401-014",
    "barcode": "002401-014",
    "name": "冰糖無籽茶梅",
    "emoji": "🍑",
    "category": "002",
    "unit": "140g/袋",
    "costPrice": 0,
    "salePrice": 150.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "003400-001",
    "barcode": "003400-001",
    "name": "心願罐爆米花 (焦糖)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 60,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-002",
    "barcode": "003400-002",
    "name": "心願罐爆米花 (鹹甜風味)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 60,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-003",
    "barcode": "003400-003",
    "name": "心願罐爆米花 (鹹酥雞)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 36,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-004",
    "barcode": "003400-004",
    "name": "心願罐爆米花 (玉米濃湯)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 36,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-005",
    "barcode": "003400-005",
    "name": "心願罐爆米花 (珍珠奶茶)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 36,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-006",
    "barcode": "003400-006",
    "name": "心願罐爆米花 (巧克力)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 36,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003400-007",
    "barcode": "003400-007",
    "name": "心願罐爆米花 (起司)",
    "emoji": "🍿",
    "category": "003",
    "unit": "260g/罐",
    "costPrice": 72.0,
    "salePrice": 199.0,
    "safetyStock": 36,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-001",
    "barcode": "003405-001",
    "name": "2Kg鋁袋爆米花(焦糖)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 20,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-002",
    "barcode": "003405-002",
    "name": "2Kg鋁袋爆米花(鹹甜風味)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-003",
    "barcode": "003405-003",
    "name": "2Kg鋁袋爆米花(鹹酥雞)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-004",
    "barcode": "003405-004",
    "name": "2Kg鋁袋爆米花(玉米濃湯)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-005",
    "barcode": "003405-005",
    "name": "2Kg鋁袋爆米花(珍珠奶茶)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-006",
    "barcode": "003405-006",
    "name": "2Kg鋁袋爆米花(巧克力)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003405-007",
    "barcode": "003405-007",
    "name": "2Kg鋁袋爆米花(起司)",
    "emoji": "🍿",
    "category": "003",
    "unit": "2Kg/袋",
    "costPrice": 350.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003401-001",
    "barcode": "003401-001",
    "name": "袋裝爆米花/200g",
    "emoji": "🍿",
    "category": "003",
    "unit": "200g/袋",
    "costPrice": 0,
    "salePrice": 99.0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003401-002",
    "barcode": "003401-002",
    "name": "袋裝爆米花/40g",
    "emoji": "🍿",
    "category": "003",
    "unit": "40g/袋",
    "costPrice": 0,
    "salePrice": 30.0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "003402-001",
    "barcode": "003402-001",
    "name": "袋裝爆米花/100g",
    "emoji": "🍿",
    "category": "003",
    "unit": "100g/袋",
    "costPrice": 0,
    "salePrice": 50.0,
    "safetyStock": 0,
    "supplierId": "ㄐ001",
    "active": true
  },
  {
    "id": "004300-001",
    "barcode": "004300-001",
    "name": "黃金曼特寧耳掛咖啡 (單包)",
    "emoji": "☕",
    "category": "004",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 50.0,
    "safetyStock": 150,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004300-002",
    "barcode": "004300-002",
    "name": "緋紅鸚鵡耳掛咖啡 (單包)",
    "emoji": "☕",
    "category": "004",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 50.0,
    "safetyStock": 150,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004300-003",
    "barcode": "004300-003",
    "name": "耶加雪菲耳掛咖啡 (單包)",
    "emoji": "☕",
    "category": "004",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 50.0,
    "safetyStock": 150,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004300-004",
    "barcode": "004300-004",
    "name": "暖金時光咖啡豆/半磅",
    "emoji": "☕",
    "category": "004",
    "unit": "袋",
    "costPrice": 175.0,
    "salePrice": 450.0,
    "safetyStock": 10,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004300-005",
    "barcode": "004300-005",
    "name": "菲紅果韻咖啡豆",
    "emoji": "☕",
    "category": "004",
    "unit": "袋",
    "costPrice": 155.0,
    "salePrice": 450.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004300-006",
    "barcode": "004300-006",
    "name": "果香序曲咖啡豆",
    "emoji": "☕",
    "category": "004",
    "unit": "袋",
    "costPrice": 165.0,
    "salePrice": 450.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004500-001",
    "barcode": "004500-001",
    "name": "黃金曼特寧耳掛咖啡 10入/盒",
    "emoji": "☕",
    "category": "004",
    "unit": "10包/盒",
    "costPrice": 0,
    "salePrice": 390.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004500-002",
    "barcode": "004500-002",
    "name": "緋紅鸚鵡耳掛咖啡 10入/盒",
    "emoji": "☕",
    "category": "004",
    "unit": "10包/盒",
    "costPrice": 0,
    "salePrice": 390.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004500-003",
    "barcode": "004500-003",
    "name": "耶加雪菲耳掛咖啡 10入/盒",
    "emoji": "☕",
    "category": "004",
    "unit": "10包/盒",
    "costPrice": 0,
    "salePrice": 390.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "004501-001",
    "barcode": "004501-001",
    "name": "幸福三重奏耳掛咖啡禮盒",
    "emoji": "☕",
    "category": "004",
    "unit": "5包*3種/盒",
    "costPrice": 0,
    "salePrice": 499.0,
    "safetyStock": 0,
    "supplierId": "ㄉ001",
    "active": true
  },
  {
    "id": "005300-001",
    "barcode": "005300-001",
    "name": "紅 烏 龍三角立體茶包 (單包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 10.0,
    "safetyStock": 500,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005300-002",
    "barcode": "005300-002",
    "name": "夏夜紅茶三角立體茶包 (單包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 10.0,
    "safetyStock": 500,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005300-003",
    "barcode": "005300-003",
    "name": "四季梔香三角立體茶包 (單包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 10.0,
    "safetyStock": 500,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005300-004",
    "barcode": "005300-004",
    "name": "蜜香紅茶三角立體茶包 (單包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "005300-005",
    "barcode": "005300-005",
    "name": "清香烏龍茶三角立體茶包(單包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "005403-001",
    "barcode": "005403-001",
    "name": "紅 烏 龍三角立體茶包10包/袋",
    "emoji": "🍵",
    "category": "005",
    "unit": "10包/袋",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005403-002",
    "barcode": "005403-002",
    "name": "夏夜紅茶三角立體茶包10包/袋",
    "emoji": "🍵",
    "category": "005",
    "unit": "10包/袋",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005403-003",
    "barcode": "005403-003",
    "name": "四季梔香三角立體茶包10包/袋",
    "emoji": "🍵",
    "category": "005",
    "unit": "10包/袋",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005403-004",
    "barcode": "005403-004",
    "name": "蜜香紅茶三角立體茶包10包/袋",
    "emoji": "🍵",
    "category": "005",
    "unit": "10包/袋",
    "costPrice": 0,
    "salePrice": 99.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005403-005",
    "barcode": "005403-005",
    "name": "清香烏龍茶三角立體茶包10包/袋",
    "emoji": "🍵",
    "category": "005",
    "unit": "10包/袋",
    "costPrice": 0,
    "salePrice": 99.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-001",
    "barcode": "005500-001",
    "name": "夏夜紅茶經濟盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*1入/盒",
    "costPrice": 0,
    "salePrice": 350.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-002",
    "barcode": "005500-002",
    "name": "紅烏龍經濟盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*1入/盒",
    "costPrice": 0,
    "salePrice": 350.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-003",
    "barcode": "005500-003",
    "name": "四季梔香經濟盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*1入/盒",
    "costPrice": 0,
    "salePrice": 350.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-004",
    "barcode": "005500-004",
    "name": "手摘高山烏龍茶經濟盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "2兩*2入/盒",
    "costPrice": 0,
    "salePrice": 350.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-005",
    "barcode": "005500-005",
    "name": "冬片四季 (2入/組)",
    "emoji": "🍵",
    "category": "005",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 600.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-006",
    "barcode": "005500-006",
    "name": "雙茶飲(台灣青茶+蜜香紅茶茶包)",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包*2種/盒",
    "costPrice": 0,
    "salePrice": 500.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005500-007",
    "barcode": "005500-007",
    "name": "四季冬片經濟盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*1入/盒",
    "costPrice": 0,
    "salePrice": 250.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-001",
    "barcode": "005501-001",
    "name": "手採高山烏龍茶禮盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "2兩*2入/組",
    "costPrice": 0,
    "salePrice": 1680.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-002",
    "barcode": "005501-002",
    "name": "杉林溪高山茶葉禮盒-愛茶人",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/盒",
    "costPrice": 0,
    "salePrice": 1380.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "005501-013",
    "barcode": "005501-013",
    "name": "杉林溪高山茶葉禮盒-典藏(紅)",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/盒",
    "costPrice": 0,
    "salePrice": 1380.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "005501-014",
    "barcode": "005501-014",
    "name": "杉林溪高山茶葉禮盒-典藏(綠)",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/盒",
    "costPrice": 0,
    "salePrice": 1380.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "005501-003",
    "barcode": "005501-003",
    "name": "台灣極品金萱茶",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/組",
    "costPrice": 0,
    "salePrice": 1380.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-004",
    "barcode": "005501-004",
    "name": "清香烏龍茶禮盒 (紅色)",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/盒",
    "costPrice": 0,
    "salePrice": 600.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-005",
    "barcode": "005501-005",
    "name": "清香烏龍茶禮盒 (綠色)",
    "emoji": "🍵",
    "category": "005",
    "unit": "4兩*2入/盒",
    "costPrice": 0,
    "salePrice": 600.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-006",
    "barcode": "005501-006",
    "name": "飲茶人三角立體茶包禮盒/25入",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 320.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-007",
    "barcode": "005501-007",
    "name": "蜜香紅茶三角立體茶包禮盒/25入",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 320.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-008",
    "barcode": "005501-008",
    "name": "紅烏龍三角立體茶包禮盒/25入",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 320.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-009",
    "barcode": "005501-009",
    "name": "夏夜紅茶三角立體茶包禮盒/25入",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 320.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-010",
    "barcode": "005501-010",
    "name": "四季梔香三角立體茶包禮盒/25入",
    "emoji": "🍵",
    "category": "005",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 320.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-011",
    "barcode": "005501-011",
    "name": "單提蜜香紅茶包12入/盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "12包/盒",
    "costPrice": 0,
    "salePrice": 129.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005501-012",
    "barcode": "005501-012",
    "name": "單提清香烏龍茶包12入/盒",
    "emoji": "🍵",
    "category": "005",
    "unit": "12包/盒",
    "costPrice": 0,
    "salePrice": 129.0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "005405-001",
    "barcode": "005405-001",
    "name": "台灣手採高山烏龍茶",
    "emoji": "🍵",
    "category": "005",
    "unit": "2兩/磚",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "006300-001",
    "barcode": "006300-001",
    "name": "黃金蕎麥三角立體茶包 (單包)",
    "emoji": "🌼",
    "category": "006",
    "unit": "1包",
    "costPrice": 0,
    "salePrice": 10.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "006403-001",
    "barcode": "006403-001",
    "name": "黃金蕎麥三角立體茶包 10入/袋",
    "emoji": "🌼",
    "category": "006",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "006500-001",
    "barcode": "006500-001",
    "name": "黃金蕎麥經濟包",
    "emoji": "🌼",
    "category": "006",
    "unit": "600g/盒",
    "costPrice": 0,
    "salePrice": 750.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "006501-001",
    "barcode": "006501-001",
    "name": "黃金蕎麥三角立體茶包禮盒/25入",
    "emoji": "🌼",
    "category": "006",
    "unit": "25包/盒",
    "costPrice": 0,
    "salePrice": 269.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-001",
    "barcode": "007404-001",
    "name": "越光米磚 600g",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g/磚",
    "costPrice": 0,
    "salePrice": 120.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-002",
    "barcode": "007404-002",
    "name": "蓬萊米磚 600g",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g/磚",
    "costPrice": 0,
    "salePrice": 100.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-003",
    "barcode": "007404-003",
    "name": "糙米磚 600g",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g/磚",
    "costPrice": 0,
    "salePrice": 100.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-004",
    "barcode": "007404-004",
    "name": "越光米磚 450g",
    "emoji": "🌾",
    "category": "007",
    "unit": "450g/磚",
    "costPrice": 0,
    "salePrice": 100.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-005",
    "barcode": "007404-005",
    "name": "蓬萊米磚 450g",
    "emoji": "🌾",
    "category": "007",
    "unit": "450g/磚",
    "costPrice": 0,
    "salePrice": 80.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007404-006",
    "barcode": "007404-006",
    "name": "糙米磚 450g",
    "emoji": "🌾",
    "category": "007",
    "unit": "450g/磚",
    "costPrice": 0,
    "salePrice": 80.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007501-001",
    "barcode": "007501-001",
    "name": "新安心米禮盒",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g白米*2+600g糙米/盒",
    "costPrice": 0,
    "salePrice": 390.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007601-001",
    "barcode": "007601-001",
    "name": "萬事興龍米提袋-蓬萊米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g白米*2磚/袋",
    "costPrice": 0,
    "salePrice": 198.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007601-002",
    "barcode": "007601-002",
    "name": "萬事興龍米提袋-越光米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g*2磚/袋",
    "costPrice": 0,
    "salePrice": 240.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007602-001",
    "barcode": "007602-001",
    "name": "觀心米提袋-蓬萊米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g白米*2磚/袋",
    "costPrice": 0,
    "salePrice": 240.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007602-002",
    "barcode": "007602-002",
    "name": "觀心米提袋-越光米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g*2磚/袋",
    "costPrice": 0,
    "salePrice": 300.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007603-001",
    "barcode": "007603-001",
    "name": "平安喜樂米提袋-蓬萊米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g白米*2磚/袋",
    "costPrice": 0,
    "salePrice": 240.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007603-002",
    "barcode": "007603-002",
    "name": "平安喜樂米提袋-越光米/2入",
    "emoji": "🌾",
    "category": "007",
    "unit": "600g*2磚/袋",
    "costPrice": 0,
    "salePrice": 240.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-001",
    "barcode": "008300-001",
    "name": "香酥蠶豆酥-原味",
    "emoji": "🍬",
    "category": "008",
    "unit": "290g/包",
    "costPrice": 0,
    "salePrice": 115.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-002",
    "barcode": "008300-002",
    "name": "香酥蠶豆酥-蒜味",
    "emoji": "🍬",
    "category": "008",
    "unit": "290g/包",
    "costPrice": 0,
    "salePrice": 115.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-003",
    "barcode": "008300-003",
    "name": "香酥蠶豆酥-辣味",
    "emoji": "🍬",
    "category": "008",
    "unit": "290g/包",
    "costPrice": 0,
    "salePrice": 115.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-004",
    "barcode": "008300-004",
    "name": "香酥青豆仁-原味",
    "emoji": "🍬",
    "category": "008",
    "unit": "280g/包",
    "costPrice": 0,
    "salePrice": 120.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-005",
    "barcode": "008300-005",
    "name": "香酥青豆仁-蒜味",
    "emoji": "🍬",
    "category": "008",
    "unit": "280g/包",
    "costPrice": 0,
    "salePrice": 120.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "008300-006",
    "barcode": "008300-006",
    "name": "香酥青豆仁-辣味",
    "emoji": "🍬",
    "category": "008",
    "unit": "280g/包",
    "costPrice": 0,
    "salePrice": 120.0,
    "safetyStock": 24,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009000-000",
    "barcode": "009000-000",
    "name": "運費",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 180.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009000-001",
    "barcode": "009000-001",
    "name": "折扣",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009600-001",
    "barcode": "009600-001",
    "name": "帆布提袋-馬上有錢",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 100.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009600-002",
    "barcode": "009600-002",
    "name": "帆布提袋-觀/暖",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009601-001",
    "barcode": "009601-001",
    "name": "萬事興龍提袋",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009601-002",
    "barcode": "009601-002",
    "name": "招財進寶提袋(招財貓)",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009603-001",
    "barcode": "009603-001",
    "name": "平安喜樂提袋",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009603-002",
    "barcode": "009603-002",
    "name": "觀心米束口袋(咖啡色)",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009700-001",
    "barcode": "009700-001",
    "name": "咖啡杯",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 100.0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009900-001",
    "barcode": "009900-001",
    "name": "客製化吊牌/貼紙",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009900-002",
    "barcode": "009900-002",
    "name": "觀心園 1350G米吊牌",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "009900-003",
    "barcode": "009900-003",
    "name": "觀心園 1200G米吊牌",
    "emoji": "📦",
    "category": "009",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100401-001",
    "barcode": "100401-001",
    "name": "公版4兩夾鏈立袋",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-001",
    "barcode": "100500-001",
    "name": "蜜香紅茶外盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-002",
    "barcode": "100500-002",
    "name": "蜜香紅茶內盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-003",
    "barcode": "100500-003",
    "name": "飲茶人外盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-004",
    "barcode": "100500-004",
    "name": "飲茶人內盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-005",
    "barcode": "100500-005",
    "name": "安心米外盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-006",
    "barcode": "100500-006",
    "name": "安心米內盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-007",
    "barcode": "100500-007",
    "name": "黃金曼特寧10入盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-008",
    "barcode": "100500-008",
    "name": "耶佳雪菲10入盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-009",
    "barcode": "100500-009",
    "name": "緋紅鸚鵡10入盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-010",
    "barcode": "100500-010",
    "name": "牛皮提盒外盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-011",
    "barcode": "100500-011",
    "name": "牛皮提盒內盒",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-012",
    "barcode": "100500-012",
    "name": "7*7*11牛皮紙盒",
    "emoji": "📦",
    "category": "100",
    "unit": "7*7*11cm",
    "costPrice": 3.0,
    "salePrice": 0,
    "safetyStock": 200,
    "supplierId": "ㄓ002",
    "active": true
  },
  {
    "id": "100502-001",
    "barcode": "100502-001",
    "name": "手提禮盒提繩",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100502-002",
    "barcode": "100502-002",
    "name": "手提禮盒提繩-紅色",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100502-003",
    "barcode": "100502-003",
    "name": "手提禮盒提繩-暗紅色",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100502-004",
    "barcode": "100502-004",
    "name": "手提禮盒提繩-咖啡色",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100502-005",
    "barcode": "100502-005",
    "name": "手提禮盒提繩-灰色",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100501-001",
    "barcode": "100501-001",
    "name": "手提禮盒 外袖(牛皮)",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100501-002",
    "barcode": "100501-002",
    "name": "手提禮盒 內抽",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100501-003",
    "barcode": "100501-003",
    "name": "三層隔板",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-013",
    "barcode": "100500-013",
    "name": "7*7*13牛皮紙盒",
    "emoji": "📦",
    "category": "100",
    "unit": "7*7*13cm",
    "costPrice": 9.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100500-014",
    "barcode": "100500-014",
    "name": "9*9*15牛皮紙盒(紅茶)",
    "emoji": "📦",
    "category": "100",
    "unit": "9*9*15cm",
    "costPrice": 10.0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100603-001",
    "barcode": "100603-001",
    "name": "馬上有錢提袋(紅色)",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100603-002",
    "barcode": "100603-002",
    "name": "馬上有錢提袋(咖啡色)",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100700-001",
    "barcode": "100700-001",
    "name": "安心米 成分貼紙(透明)",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100910-001",
    "barcode": "100910-001",
    "name": "蘆薈洗潔精-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-001",
    "barcode": "100920-001",
    "name": "呷梅梅-梅有檸檬果乾-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-002",
    "barcode": "100920-002",
    "name": "呷梅梅-茶梅蜜餞-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-003",
    "barcode": "100920-003",
    "name": "呷梅梅-鳳梨梅蜜餞-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-004",
    "barcode": "100920-004",
    "name": "呷梅梅-紫蘇梅蜜餞-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-005",
    "barcode": "100920-005",
    "name": "呷梅梅-Q梅蜜餞-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-006",
    "barcode": "100920-006",
    "name": "呷梅梅-梅有芒果夾心-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-007",
    "barcode": "100920-007",
    "name": "特淡甜梅-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-008",
    "barcode": "100920-008",
    "name": "無子梅餅-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-009",
    "barcode": "100920-009",
    "name": "甘草橄欖-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-010",
    "barcode": "100920-010",
    "name": "無籽橄欖-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-011",
    "barcode": "100920-011",
    "name": "紅心芭樂-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-001",
    "barcode": "100930-001",
    "name": "心願罐爆米花 (焦糖)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-002",
    "barcode": "100930-002",
    "name": "心願罐爆米花 (鹹甜風味)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-003",
    "barcode": "100930-003",
    "name": "心願罐爆米花 (鹹酥雞)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-004",
    "barcode": "100930-004",
    "name": "心願罐爆米花 (玉米濃湯)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-005",
    "barcode": "100930-005",
    "name": "心願罐爆米花 (珍珠奶茶)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-006",
    "barcode": "100930-006",
    "name": "心願罐爆米花 (巧克力)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-007",
    "barcode": "100930-007",
    "name": "心願罐爆米花 (起司)-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-008",
    "barcode": "100930-008",
    "name": "爆米花 120g-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100930-009",
    "barcode": "100930-009",
    "name": "爆米花 40g-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100940-001",
    "barcode": "100940-001",
    "name": "幸福三重奏耳掛咖啡禮盒-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-001",
    "barcode": "100980-001",
    "name": "香酥蠶豆酥-原味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-002",
    "barcode": "100980-002",
    "name": "香酥蠶豆酥-蒜味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-003",
    "barcode": "100980-003",
    "name": "香酥蠶豆酥-辣味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-004",
    "barcode": "100980-004",
    "name": "香酥青豆仁-原味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-005",
    "barcode": "100980-005",
    "name": "香酥青豆仁-蒜味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100980-006",
    "barcode": "100980-006",
    "name": "香酥青豆仁-辣味-貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-001",
    "barcode": "100900-001",
    "name": "蘆薈洗潔精-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-002",
    "barcode": "100900-002",
    "name": "呷梅梅-梅有檸檬果乾-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-003",
    "barcode": "100900-003",
    "name": "呷梅梅-茶梅蜜餞-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-004",
    "barcode": "100900-004",
    "name": "呷梅梅-鳳梨梅蜜餞-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-005",
    "barcode": "100900-005",
    "name": "呷梅梅-紫蘇梅蜜餞-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-006",
    "barcode": "100900-006",
    "name": "呷梅梅-Q梅蜜餞-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-007",
    "barcode": "100900-007",
    "name": "呷梅梅-梅有芒果夾心-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-008",
    "barcode": "100900-008",
    "name": "特淡甜梅-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-009",
    "barcode": "100900-009",
    "name": "無子梅餅-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-010",
    "barcode": "100900-010",
    "name": "甘草橄欖-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-011",
    "barcode": "100900-011",
    "name": "無籽橄欖-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-012",
    "barcode": "100900-012",
    "name": "紅心芭樂-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-013",
    "barcode": "100900-013",
    "name": "幸福三重奏耳掛咖啡禮盒-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-014",
    "barcode": "100900-014",
    "name": "香酥蠶豆酥-原味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-015",
    "barcode": "100900-015",
    "name": "香酥蠶豆酥-蒜味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-016",
    "barcode": "100900-016",
    "name": "香酥蠶豆酥-辣味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-017",
    "barcode": "100900-017",
    "name": "香酥青豆仁-原味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-018",
    "barcode": "100900-018",
    "name": "香酥青豆仁-蒜味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-019",
    "barcode": "100900-019",
    "name": "香酥青豆仁-辣味-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-001",
    "barcode": "100800-001",
    "name": "飲茶人三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-002",
    "barcode": "100800-002",
    "name": "蜜香紅茶三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-003",
    "barcode": "100800-003",
    "name": "紅烏龍三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-004",
    "barcode": "100800-004",
    "name": "夏夜紅茶三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-005",
    "barcode": "100800-005",
    "name": "四季梔香三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-006",
    "barcode": "100800-006",
    "name": "新安心米禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-007",
    "barcode": "100800-007",
    "name": "越光米磚 600g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-008",
    "barcode": "100800-008",
    "name": "蓬萊米磚 600g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-009",
    "barcode": "100800-009",
    "name": "糙米磚 600g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-010",
    "barcode": "100800-010",
    "name": "越光米磚 450g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-011",
    "barcode": "100800-011",
    "name": "蓬萊米磚 450g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-012",
    "barcode": "100800-012",
    "name": "糙米磚 450g-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-013",
    "barcode": "100800-013",
    "name": "黑米-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-014",
    "barcode": "100800-014",
    "name": "紅米-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-001",
    "barcode": "200005-001",
    "name": "夏夜紅茶-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-002",
    "barcode": "200005-002",
    "name": "紅烏龍-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-003",
    "barcode": "200005-003",
    "name": "四季梔香-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-004",
    "barcode": "200005-004",
    "name": "手摘高山烏龍茶-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-005",
    "barcode": "200005-005",
    "name": "冬片四季-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-006",
    "barcode": "200005-006",
    "name": "台灣手採高山烏龍-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-007",
    "barcode": "200005-007",
    "name": "手採高山烏龍茶-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-008",
    "barcode": "200005-008",
    "name": "杉林溪高山茶-愛茶人-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-009",
    "barcode": "200005-009",
    "name": "杉林溪高山茶-典藏(紅-)茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-010",
    "barcode": "200005-010",
    "name": "杉林溪高山茶-典藏(綠)-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-011",
    "barcode": "200005-011",
    "name": "台灣極品金萱茶-茶磚",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-012",
    "barcode": "200005-012",
    "name": "清香烏龍茶禮盒-茶磚(紅色)",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "200005-013",
    "barcode": "200005-013",
    "name": "清香烏龍茶禮盒-茶磚(綠色)",
    "emoji": "📦",
    "category": "200",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100404-001",
    "barcode": "100404-001",
    "name": "米磚真空袋",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100800-015",
    "barcode": "100800-015",
    "name": "黃金蕎麥三角立體茶包禮盒-腰條",
    "emoji": "📦",
    "category": "100",
    "unit": "張",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "007501-002",
    "barcode": "007501-002",
    "name": "台灣三米攏好",
    "emoji": "🌾",
    "category": "007",
    "unit": "紅米450g、黑米450g、白米450g",
    "costPrice": 0,
    "salePrice": 499.0,
    "safetyStock": 2,
    "supplierId": "ㄍ004",
    "active": true
  },
  {
    "id": "007501-003",
    "barcode": "007501-003",
    "name": "紅薏仁調和米粉禮盒組",
    "emoji": "🌾",
    "category": "007",
    "unit": "400公克x2包",
    "costPrice": 160.0,
    "salePrice": 350.0,
    "safetyStock": 5,
    "supplierId": "ㄋ001",
    "active": true
  },
  {
    "id": "005501-015",
    "barcode": "005501-015",
    "name": "饗遊台灣-台灣詩品茶禮盒組",
    "emoji": "🍵",
    "category": "005",
    "unit": "四種茶 *8兩",
    "costPrice": 0,
    "salePrice": 1980.0,
    "safetyStock": 5,
    "supplierId": "ㄉ002",
    "active": true
  },
  {
    "id": "100920-012",
    "barcode": "100920-012",
    "name": "冰糖無籽茶梅貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-020",
    "barcode": "100900-020",
    "name": "黑糖無籽梅-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100920-013",
    "barcode": "100920-013",
    "name": "黑糖無籽梅貼紙",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  },
  {
    "id": "100900-021",
    "barcode": "100900-021",
    "name": "冰糖無籽茶梅-中文標",
    "emoji": "📦",
    "category": "100",
    "unit": "個",
    "costPrice": 0,
    "salePrice": 0,
    "safetyStock": 0,
    "supplierId": "",
    "active": true
  }
];

// 半成品和包材沿用 FINISHED（系統用 category 區分）
const SEMI      = FINISHED.filter(i => !i.salePrice || i.salePrice === 0);
const PACKAGING = [];

// ── 全品項索引 ──
const ALL_ITEMS = FINISHED;
const ITEM_INDEX = {};
ALL_ITEMS.forEach(i => { ITEM_INDEX[i.id] = i; });

// ── 商品分類 ──
const CATEGORIES = {
  "001": {
    "name": "清潔",
    "emoji": "🧴"
  },
  "002": {
    "name": "果乾/梅",
    "emoji": "🍑"
  },
  "003": {
    "name": "爆米花",
    "emoji": "🍿"
  },
  "004": {
    "name": "咖啡",
    "emoji": "☕"
  },
  "005": {
    "name": "茶葉",
    "emoji": "🍵"
  },
  "006": {
    "name": "無咖啡因飲品",
    "emoji": "🌼"
  },
  "007": {
    "name": "米糧",
    "emoji": "🌾"
  },
  "008": {
    "name": "零嘴",
    "emoji": "🍬"
  },
  "009": {
    "name": "其他",
    "emoji": "📦"
  },
  "100": {
    "name": "包裝材料",
    "emoji": "📦"
  },
  "200": {
    "name": "物料",
    "emoji": "📦"
  }
};

// ── BOM 組合 ──
let BOM = {
  "004500-001": [
    {
      "materialId": "100500-007",
      "qty": 1.0,
      "materialName": "黃金曼特寧10入盒"
    },
    {
      "materialId": "004300-001",
      "qty": 10.0,
      "materialName": "黃金曼特寧耳掛咖啡 (單包)"
    }
  ],
  "004500-002": [
    {
      "materialId": "100500-009",
      "qty": 1.0,
      "materialName": "緋紅鸚鵡10入盒"
    },
    {
      "materialId": "004300-002",
      "qty": 10.0,
      "materialName": "緋紅鸚鵡耳掛咖啡 (單包)"
    }
  ],
  "004500-003": [
    {
      "materialId": "100500-008",
      "qty": 1.0,
      "materialName": "耶佳雪菲10入盒"
    },
    {
      "materialId": "004300-003",
      "qty": 10.0,
      "materialName": "耶加雪菲耳掛咖啡 (單包)"
    }
  ],
  "004501-001": [
    {
      "materialId": "100501-001",
      "qty": 1.0,
      "materialName": "手提禮盒 外袖(牛皮)"
    },
    {
      "materialId": "100501-002",
      "qty": 1.0,
      "materialName": "手提禮盒 內抽"
    },
    {
      "materialId": "100501-003",
      "qty": 1.0,
      "materialName": "三層隔板"
    },
    {
      "materialId": "100502-001",
      "qty": 1.0,
      "materialName": "手提禮盒提繩"
    },
    {
      "materialId": "004300-002",
      "qty": 5.0,
      "materialName": "緋紅鸚鵡耳掛咖啡 (單包)"
    },
    {
      "materialId": "004300-003",
      "qty": 5.0,
      "materialName": "耶加雪菲耳掛咖啡 (單包)"
    },
    {
      "materialId": "004300-001",
      "qty": 5.0,
      "materialName": "黃金曼特寧耳掛咖啡 (單包)"
    }
  ],
  "003402-001": [
    {
      "materialId": "003405-001",
      "qty": 0.05,
      "materialName": "2Kg鋁袋爆米花(焦糖)"
    }
  ],
  "001100-001": [
    {
      "materialId": "001100-001",
      "qty": 1.0,
      "materialName": "蘆薈洗潔精"
    },
    {
      "materialId": "100910-001",
      "qty": 1.0,
      "materialName": "蘆薈洗潔精-貼紙"
    }
  ],
  "002401-012": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    }
  ],
  "005500-006": [
    {
      "materialId": "005300-005",
      "qty": 25.0,
      "materialName": "清香烏龍茶三角立體茶包(單包)"
    },
    {
      "materialId": "MAT_蜜香紅茶三角立體",
      "qty": 25.0,
      "materialName": "蜜香紅茶三角立體茶包(單包)"
    }
  ],
  "005501-006": [
    {
      "materialId": "005300-005",
      "qty": 25.0,
      "materialName": "清香烏龍茶三角立體茶包(單包)"
    },
    {
      "materialId": "100500-003",
      "qty": 1.0,
      "materialName": "飲茶人外盒"
    },
    {
      "materialId": "100500-004",
      "qty": 1.0,
      "materialName": "飲茶人內盒"
    },
    {
      "materialId": "100502-005",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-灰色"
    }
  ],
  "005501-008": [
    {
      "materialId": "005300-001",
      "qty": 25.0,
      "materialName": "紅 烏 龍三角立體茶包 (單包)"
    },
    {
      "materialId": "100500-010",
      "qty": 1.0,
      "materialName": "牛皮提盒外盒"
    },
    {
      "materialId": "100500-011",
      "qty": 1.0,
      "materialName": "牛皮提盒內盒"
    },
    {
      "materialId": "100502-003",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-暗紅色"
    },
    {
      "materialId": "100800-003",
      "qty": 1.0,
      "materialName": "紅烏龍三角立體茶包禮盒-腰條"
    }
  ],
  "005501-007": [
    {
      "materialId": "MAT_蜜香紅茶三角立體",
      "qty": 25.0,
      "materialName": "蜜香紅茶三角立體茶包(單包)"
    },
    {
      "materialId": "100500-001",
      "qty": 1.0,
      "materialName": "蜜香紅茶外盒"
    },
    {
      "materialId": "100500-002",
      "qty": 1.0,
      "materialName": "蜜香紅茶內盒"
    },
    {
      "materialId": "100502-003",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-暗紅色"
    }
  ],
  "005501-009": [
    {
      "materialId": "005300-002",
      "qty": 25.0,
      "materialName": "夏夜紅茶三角立體茶包 (單包)"
    },
    {
      "materialId": "100500-010",
      "qty": 1.0,
      "materialName": "牛皮提盒外盒"
    },
    {
      "materialId": "100500-011",
      "qty": 1.0,
      "materialName": "牛皮提盒內盒"
    },
    {
      "materialId": "100502-003",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-暗紅色"
    },
    {
      "materialId": "100800-004",
      "qty": 1.0,
      "materialName": "夏夜紅茶三角立體茶包禮盒-腰條"
    }
  ],
  "005300-003": [
    {
      "materialId": "005300-003",
      "qty": 25.0,
      "materialName": "四季梔香三角立體茶包 (單包)"
    },
    {
      "materialId": "100500-010",
      "qty": 1.0,
      "materialName": "牛皮提盒外盒"
    },
    {
      "materialId": "100500-011",
      "qty": 1.0,
      "materialName": "牛皮提盒內盒"
    },
    {
      "materialId": "100502-004",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-咖啡色"
    },
    {
      "materialId": "100800-005",
      "qty": 1.0,
      "materialName": "四季梔香三角立體茶包禮盒-腰條"
    }
  ],
  "006501-001": [
    {
      "materialId": "006300-001",
      "qty": 25.0,
      "materialName": "黃金蕎麥三角立體茶包 (單包)"
    },
    {
      "materialId": "100500-010",
      "qty": 1.0,
      "materialName": "牛皮提盒外盒"
    },
    {
      "materialId": "100500-011",
      "qty": 1.0,
      "materialName": "牛皮提盒內盒"
    },
    {
      "materialId": "100502-004",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-咖啡色"
    },
    {
      "materialId": "100800-005",
      "qty": 1.0,
      "materialName": "四季梔香三角立體茶包禮盒-腰條"
    }
  ],
  "007501-001": [
    {
      "materialId": "007404-002",
      "qty": 2.0,
      "materialName": "蓬萊米磚 600g"
    },
    {
      "materialId": "007404-003",
      "qty": 1.0,
      "materialName": "糙米磚 600g"
    },
    {
      "materialId": "100500-005",
      "qty": 1.0,
      "materialName": "安心米外盒"
    },
    {
      "materialId": "100500-006",
      "qty": 1.0,
      "materialName": "安心米內盒"
    },
    {
      "materialId": "100502-002",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-紅色"
    }
  ],
  "007601-001": [
    {
      "materialId": "007404-002",
      "qty": 2.0,
      "materialName": "蓬萊米磚 600g"
    },
    {
      "materialId": "009601-001",
      "qty": 1.0,
      "materialName": "萬事興龍提袋"
    }
  ],
  "007601-002": [
    {
      "materialId": "007404-001",
      "qty": 2.0,
      "materialName": "越光米磚 600g"
    },
    {
      "materialId": "009601-001",
      "qty": 1.0,
      "materialName": "萬事興龍提袋"
    }
  ],
  "007602-001": [
    {
      "materialId": "007404-002",
      "qty": 2.0,
      "materialName": "蓬萊米磚 600g"
    },
    {
      "materialId": "009603-002",
      "qty": 1.0,
      "materialName": "觀心米束口袋(咖啡色)"
    }
  ],
  "007602-002": [
    {
      "materialId": "007404-001",
      "qty": 2.0,
      "materialName": "越光米磚 600g"
    },
    {
      "materialId": "009603-002",
      "qty": 1.0,
      "materialName": "觀心米束口袋(咖啡色)"
    }
  ],
  "007603-001": [
    {
      "materialId": "007404-002",
      "qty": 2.0,
      "materialName": "蓬萊米磚 600g"
    },
    {
      "materialId": "009603-001",
      "qty": 1.0,
      "materialName": "平安喜樂提袋"
    }
  ],
  "007603-002": [
    {
      "materialId": "007404-001",
      "qty": 2.0,
      "materialName": "越光米磚 600g"
    },
    {
      "materialId": "009603-001",
      "qty": 1.0,
      "materialName": "平安喜樂提袋"
    }
  ],
  "003400-001": [
    {
      "materialId": "003400-001",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (焦糖)"
    },
    {
      "materialId": "100930-001",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (焦糖)-中文標"
    }
  ],
  "003400-002": [
    {
      "materialId": "003400-002",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (鹹甜風味)"
    },
    {
      "materialId": "100930-002",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (鹹甜風味)-中文標"
    }
  ],
  "003400-003": [
    {
      "materialId": "003400-003",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (鹹酥雞)"
    },
    {
      "materialId": "100930-003",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (鹹酥雞)-中文標"
    }
  ],
  "003400-004": [
    {
      "materialId": "003400-004",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (玉米濃湯)"
    },
    {
      "materialId": "100930-004",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (玉米濃湯)-中文標"
    }
  ],
  "003400-005": [
    {
      "materialId": "003400-005",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (珍珠奶茶)"
    },
    {
      "materialId": "100930-005",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (珍珠奶茶)-中文標"
    }
  ],
  "003400-006": [
    {
      "materialId": "003400-006",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (巧克力)"
    },
    {
      "materialId": "100930-006",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (巧克力)-中文標"
    }
  ],
  "003400-007": [
    {
      "materialId": "003400-007",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (起司)"
    },
    {
      "materialId": "100930-007",
      "qty": 1.0,
      "materialName": "心願罐爆米花 (起司)-中文標"
    }
  ],
  "003401-002": [
    {
      "materialId": "003405-001",
      "qty": 0.02,
      "materialName": "2Kg鋁袋爆米花(焦糖)"
    },
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    }
  ],
  "007404-002": [
    {
      "materialId": "100800-008",
      "qty": 1.0,
      "materialName": "蓬萊米磚 600g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "007404-001": [
    {
      "materialId": "100800-007",
      "qty": 1.0,
      "materialName": "越光米磚 600g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "007404-003": [
    {
      "materialId": "100800-009",
      "qty": 1.0,
      "materialName": "糙米磚 600g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "007404-004": [
    {
      "materialId": "100800-010",
      "qty": 1.0,
      "materialName": "越光米磚 450g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "007404-005": [
    {
      "materialId": "100800-011",
      "qty": 1.0,
      "materialName": "蓬萊米磚 450g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "007404-006": [
    {
      "materialId": "100800-012",
      "qty": 1.0,
      "materialName": "糙米磚 450g-腰條"
    },
    {
      "materialId": "100404-001",
      "qty": 1.0,
      "materialName": "米磚真空袋"
    }
  ],
  "002401-011": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    },
    {
      "materialId": "100920-011",
      "qty": 1.0,
      "materialName": "紅心芭樂-貼紙"
    },
    {
      "materialId": "100900-012",
      "qty": 1.0,
      "materialName": "紅心芭樂-中文標"
    }
  ],
  "002401-003": [
    {
      "materialId": "100920-003",
      "qty": 1.0,
      "materialName": "呷梅梅-鳳梨梅蜜餞-貼紙"
    },
    {
      "materialId": "100900-004",
      "qty": 1.0,
      "materialName": "呷梅梅-鳳梨梅蜜餞-中文標"
    }
  ],
  "002401-002": [
    {
      "materialId": "100920-002",
      "qty": 1.0,
      "materialName": "呷梅梅-茶梅蜜餞-貼紙"
    },
    {
      "materialId": "100900-003",
      "qty": 1.0,
      "materialName": "呷梅梅-茶梅蜜餞-中文標"
    }
  ],
  "002401-005": [
    {
      "materialId": "100920-005",
      "qty": 1.0,
      "materialName": "呷梅梅-Q梅蜜餞-貼紙"
    },
    {
      "materialId": "100900-006",
      "qty": 1.0,
      "materialName": "呷梅梅-Q梅蜜餞-中文標"
    }
  ],
  "002401-004": [
    {
      "materialId": "100920-004",
      "qty": 1.0,
      "materialName": "呷梅梅-紫蘇梅蜜餞-貼紙"
    },
    {
      "materialId": "100900-005",
      "qty": 1.0,
      "materialName": "呷梅梅-紫蘇梅蜜餞-中文標"
    }
  ],
  "002401-010": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    },
    {
      "materialId": "100920-010",
      "qty": 1.0,
      "materialName": "無籽橄欖-貼紙"
    },
    {
      "materialId": "100900-011",
      "qty": 1.0,
      "materialName": "無籽橄欖-中文標"
    }
  ],
  "002401-009": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    },
    {
      "materialId": "100920-009",
      "qty": 1.0,
      "materialName": "甘草橄欖-貼紙"
    },
    {
      "materialId": "100900-010",
      "qty": 1.0,
      "materialName": "甘草橄欖-中文標"
    }
  ],
  "002401-007": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    },
    {
      "materialId": "100900-008",
      "qty": 1.0,
      "materialName": "特淡甜梅-中文標"
    }
  ],
  "002401-008": [
    {
      "materialId": "100401-001",
      "qty": 1.0,
      "materialName": "公版4兩夾鏈立袋"
    },
    {
      "materialId": "100900-009",
      "qty": 1.0,
      "materialName": "無子梅餅-中文標"
    }
  ],
  "002401-001": [
    {
      "materialId": "100920-001",
      "qty": 1.0,
      "materialName": "呷梅梅-梅有檸檬果乾-貼紙"
    },
    {
      "materialId": "100900-002",
      "qty": 1.0,
      "materialName": "呷梅梅-梅有檸檬果乾-中文標"
    }
  ],
  "005501-010": [
    {
      "materialId": "005300-003",
      "qty": 25.0,
      "materialName": "四季梔香三角立體茶包 (單包)"
    },
    {
      "materialId": "100502-004",
      "qty": 1.0,
      "materialName": "手提禮盒提繩-咖啡色"
    },
    {
      "materialId": "100800-005",
      "qty": 1.0,
      "materialName": "四季梔香三角立體茶包禮盒-腰條"
    },
    {
      "materialId": "100500-010",
      "qty": 1.0,
      "materialName": "牛皮提盒外盒"
    },
    {
      "materialId": "100500-011",
      "qty": 1.0,
      "materialName": "牛皮提盒內盒"
    }
  ],
  "002401-014": [
    {
      "materialId": "100920-012",
      "qty": 1.0,
      "materialName": "冰糖無籽茶梅貼紙"
    },
    {
      "materialId": "100900-021",
      "qty": 1.0,
      "materialName": "冰糖無籽茶梅-中文標"
    }
  ],
  "002401-013": [
    {
      "materialId": "100920-013",
      "qty": 1.0,
      "materialName": "黑糖無籽梅貼紙"
    },
    {
      "materialId": "100900-020",
      "qty": 1.0,
      "materialName": "黑糖無籽梅-中文標"
    }
  ],
  "002401-006": [
    {
      "materialId": "100920-006",
      "qty": 1.0,
      "materialName": "呷梅梅-梅有芒果夾心-貼紙"
    },
    {
      "materialId": "100900-007",
      "qty": 1.0,
      "materialName": "呷梅梅-梅有芒果夾心-中文標"
    }
  ],
  "008300-001": [
    {
      "materialId": "100980-001",
      "qty": 1.0,
      "materialName": "香酥蠶豆酥-原味-貼紙"
    }
  ],
  "008300-002": [
    {
      "materialId": "100980-002",
      "qty": 1.0,
      "materialName": "香酥蠶豆酥-蒜味-貼紙"
    }
  ],
  "008300-003": [
    {
      "materialId": "100980-003",
      "qty": 1.0,
      "materialName": "香酥蠶豆酥-辣味-貼紙"
    }
  ],
  "008300-004": [
    {
      "materialId": "100980-004",
      "qty": 1.0,
      "materialName": "香酥青豆仁-原味-貼紙"
    }
  ],
  "008300-005": [
    {
      "materialId": "100980-005",
      "qty": 1.0,
      "materialName": "香酥青豆仁-蒜味-貼紙"
    }
  ],
  "008300-006": [
    {
      "materialId": "100980-006",
      "qty": 1.0,
      "materialName": "香酥青豆仁-辣味-貼紙"
    }
  ]
};

// ── 廠商資料 ──
const SUPPLIERS = [
  {
    "id": "一001",
    "phonetic": "一",
    "name": "晏城股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "04-24253355",
    "email": "",
    "line": "",
    "bankName": "新光銀行",
    "bankBranch": "大雅分行",
    "bankCode": "103",
    "accountName": "晏城股份有限公司",
    "accountNo": "888101020344"
  },
  {
    "id": "ㄅ001",
    "phonetic": "ㄅ",
    "name": "秉昇茶葉",
    "taxId": "",
    "contact": "AA",
    "tel": "AAA",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄆ001",
    "phonetic": "ㄆ",
    "name": "品鮮茶廠",
    "taxId": "",
    "contact": "簡士棋",
    "tel": "049-2583090",
    "email": "",
    "line": "",
    "bankName": "郵局",
    "bankBranch": "內湖東湖郵局",
    "bankCode": "700",
    "accountName": "簡士棋",
    "accountNo": "25490261699"
  },
  {
    "id": "ㄇ001",
    "phonetic": "ㄇ",
    "name": "瑪理髮央企業社",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄈ001",
    "phonetic": "ㄈ",
    "name": "福聯達茶行",
    "taxId": "",
    "contact": "楊清琴",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "玉山銀行",
    "bankBranch": "草屯分行",
    "bankCode": "808",
    "accountName": "福聯達茶行楊清琴",
    "accountNo": "990940009189"
  },
  {
    "id": "ㄉ001",
    "phonetic": "ㄉ",
    "name": "德瑞國際貿易有限公司",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "土地銀行",
    "bankBranch": "中科分行",
    "bankCode": "5",
    "accountName": "德瑞國際貿易有限公司",
    "accountNo": "135001007150"
  },
  {
    "id": "ㄉ002",
    "phonetic": "ㄉ",
    "name": "大晃茶業股份有限公司",
    "taxId": "61917026",
    "contact": "謝學欣",
    "tel": "049-2581011",
    "email": "brucehsieh1973@gmail.com",
    "line": "",
    "bankName": "第一銀行",
    "bankBranch": "南投分行",
    "bankCode": "7",
    "accountName": "大晃茶業股份有限公司",
    "accountNo": "43110024056"
  },
  {
    "id": "ㄉ003",
    "phonetic": "ㄉ",
    "name": "東興製冰廠",
    "taxId": "",
    "contact": "",
    "tel": "049-2362695",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄉ004",
    "phonetic": "ㄉ",
    "name": "大煒塑膠工業股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "049-2315789",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄊ001",
    "phonetic": "ㄊ",
    "name": "天慧爆米花",
    "taxId": "",
    "contact": "漫漫",
    "tel": "0915-082066",
    "email": "",
    "line": "",
    "bankName": "中國信託",
    "bankBranch": "文心分行",
    "bankCode": "822",
    "accountName": "陳梅玉",
    "accountNo": "473540255418"
  },
  {
    "id": "ㄊ002",
    "phonetic": "ㄊ",
    "name": "拓林美企業有限公司",
    "taxId": "",
    "contact": "",
    "tel": "04-22600780",
    "email": "",
    "line": "",
    "bankName": "彰化銀行",
    "bankBranch": "台中分行",
    "bankCode": "9",
    "accountName": "拓林美企業有限公司",
    "accountNo": "40590113587600"
  },
  {
    "id": "ㄊ003",
    "phonetic": "ㄊ",
    "name": "淘寶",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄋ001",
    "phonetic": "ㄋ",
    "name": "南投縣草屯薏仁生產合作社",
    "taxId": "",
    "contact": "",
    "tel": "049-2551555",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄍ001",
    "phonetic": "ㄍ",
    "name": "光總企業有限公司",
    "taxId": "89611052",
    "contact": "陳秀鳳",
    "tel": "0905-223779",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄍ002",
    "phonetic": "ㄍ",
    "name": "冠球彩色印刷股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "04-23596678",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄍ003",
    "phonetic": "ㄍ",
    "name": "廣維(咖啡杯)",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄍ004",
    "phonetic": "ㄍ",
    "name": "觀心園",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄏ001",
    "phonetic": "ㄏ",
    "name": "皇家可口股份有限公司",
    "taxId": "",
    "contact": "翁宗文",
    "tel": "0919-865155",
    "email": "ian.weng@duroyal.com",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄏ002",
    "phonetic": "ㄏ",
    "name": "荷包袋國際有限公司",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "台灣銀行",
    "bankBranch": "博愛分行",
    "bankCode": "4",
    "accountName": "荷包袋國際有限公司",
    "accountNo": "119001032678"
  },
  {
    "id": "ㄐ001",
    "phonetic": "ㄐ",
    "name": "金硯有限公司",
    "taxId": "",
    "contact": "",
    "tel": "07-7688336",
    "email": "",
    "line": "",
    "bankName": "郵局",
    "bankBranch": "鳳山文山郵局",
    "bankCode": "700",
    "accountName": "張有定",
    "accountNo": "85312025685"
  },
  {
    "id": "ㄐ002",
    "phonetic": "ㄐ",
    "name": "健豪印刷事業股份有限公司",
    "taxId": "16332027",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "合作金庫",
    "bankBranch": "五權分行",
    "bankCode": "6",
    "accountName": "健豪印刷事業股份有限公司",
    "accountNo": "85340800094398"
  },
  {
    "id": "ㄐ003",
    "phonetic": "ㄐ",
    "name": "金鴻華企業有限公司",
    "taxId": "",
    "contact": "林玉芬",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "華南銀行",
    "bankBranch": "鶯歌分行",
    "bankCode": "8",
    "accountName": "金鴻華企業有限公司",
    "accountNo": "196100003809"
  },
  {
    "id": "ㄑ001",
    "phonetic": "ㄑ",
    "name": "柒彩松",
    "taxId": "",
    "contact": "張小姐",
    "tel": "049-2367801",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄑ002",
    "phonetic": "ㄑ",
    "name": "麒麟茶葉企業股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "049-2644217",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄑ003",
    "phonetic": "ㄑ",
    "name": "洽和碾米工廠",
    "taxId": "",
    "contact": "",
    "tel": "049-256 3303",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄒ002",
    "phonetic": "ㄒ",
    "name": "蝦皮 (公益捐款)",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄒ003",
    "phonetic": "ㄒ",
    "name": "軒靖貿易有限公司",
    "taxId": "",
    "contact": "",
    "tel": "049-2367596",
    "email": "xuan.jing519@msa.hinet.net",
    "line": "",
    "bankName": "玉山銀行",
    "bankBranch": "草屯分行",
    "bankCode": "808",
    "accountName": "軒靖貿易有限公司",
    "accountNo": "990940016386"
  },
  {
    "id": "ㄒ001",
    "phonetic": "ㄒ",
    "name": "小白菜化妝品工廠",
    "taxId": "",
    "contact": "",
    "tel": "049-2338158",
    "email": "",
    "line": "",
    "bankName": "第一銀行",
    "bankBranch": "草屯分行",
    "bankCode": "7",
    "accountName": "小白菜化妝品工廠",
    "accountNo": "44110051018"
  },
  {
    "id": "ㄓ001",
    "phonetic": "ㄓ",
    "name": "仲圖包裝(鹿鹿開發-竹山店)",
    "taxId": "",
    "contact": "",
    "tel": "049-2655000",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄓ002",
    "phonetic": "ㄓ",
    "name": "紙品訂製店-淘寶",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄔ001",
    "phonetic": "ㄔ",
    "name": "晨軒梅(王貴香)",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "中國信託",
    "bankBranch": "南投分行",
    "bankCode": "822",
    "accountName": "王貴香",
    "accountNo": "78540205627"
  },
  {
    "id": "ㄔ002",
    "phonetic": "ㄔ",
    "name": "萇宏包材行",
    "taxId": "",
    "contact": "",
    "tel": "03-3630989",
    "email": "",
    "line": "",
    "bankName": "聯邦銀行",
    "bankBranch": "桃鶯分行",
    "bankCode": "803",
    "accountName": "萇宏包材行鄭榮義",
    "accountNo": "29102037021"
  },
  {
    "id": "ㄔ003",
    "phonetic": "ㄔ",
    "name": "誠欲實業股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "06-7959989",
    "email": "",
    "line": "",
    "bankName": "京城銀行",
    "bankBranch": "西港分行",
    "bankCode": "54",
    "accountName": "誠欲實業股份有限公司",
    "accountNo": "35125018988"
  },
  {
    "id": "ㄕ001",
    "phonetic": "ㄕ",
    "name": "順泰蜜餞食品股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "04-8534399",
    "email": "",
    "line": "",
    "bankName": "臺灣企銀",
    "bankBranch": "員林分行",
    "bankCode": "50",
    "accountName": "順泰蜜餞食品股份有限公司",
    "accountNo": "55012017498"
  },
  {
    "id": "ㄖ001",
    "phonetic": "ㄖ",
    "name": "日昇-塑膠杯",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄘ001",
    "phonetic": "ㄘ",
    "name": "草屯鎮農會碾米廠",
    "taxId": "",
    "contact": "",
    "tel": "049-255 1151",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄙ001",
    "phonetic": "ㄙ",
    "name": "松宏有限公司",
    "taxId": "",
    "contact": "",
    "tel": "049-2229418",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄞ001",
    "phonetic": "ㄞ",
    "name": "愛就夠公益網",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄨ001",
    "phonetic": "ㄨ",
    "name": "無忌興業股份有限公司",
    "taxId": "",
    "contact": "",
    "tel": "049-2653528",
    "email": "",
    "line": "",
    "bankName": "台中商銀",
    "bankBranch": "竹山分行",
    "bankCode": "53",
    "accountName": "無忌興業股份有限公司",
    "accountNo": "52221043467"
  },
  {
    "id": "ㄩ001",
    "phonetic": "ㄩ",
    "name": "源品實業有限公司",
    "taxId": "",
    "contact": "",
    "tel": "04-24060379",
    "email": "",
    "line": "",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  },
  {
    "id": "ㄩ002",
    "phonetic": "ㄩ",
    "name": "勇捷(制服)",
    "taxId": "",
    "contact": "",
    "tel": "",
    "email": "",
    "line": "勇捷",
    "bankName": "",
    "bankBranch": "",
    "bankCode": "",
    "accountName": "",
    "accountNo": ""
  }
];
const SUPPLIER_INDEX = {};
SUPPLIERS.forEach(s => { SUPPLIER_INDEX[s.id] = s; });

// ── 工具函式 ──
function getItem(id)     { return ITEM_INDEX[id]     || null; }
function getSupplier(id) { return SUPPLIER_INDEX[id] || null; }
function getCategory(id) { return CATEGORIES[id]     || { name: id, emoji: '📦' }; }

// ── 商品旗標系統（動態計算，不需要修改每筆資料）──
// canSell:       可在 POS / 訂單賣給客人
// canPurchase:   可建進貨單向廠商採購
// canBeMaterial: 可作為 BOM 材料

function computeItemFlags(item){
  // 手動覆寫優先（後台在商品編輯器設定的例外）
  const overrides = JSON.parse(localStorage.getItem('erp_item_flags') || '{}');
  if(overrides[item.id]) return overrides[item.id];

  const hasSalePrice = item.salePrice && item.salePrice > 0;
  const hasCostPrice = item.costPrice && item.costPrice > 0;
  // 有 BOM 定義的品項視為半成品，預設可作材料
  const hasBom       = (typeof BOM !== 'undefined') && (BOM[item.id]?.length ?? 0) > 0;

  return {
    // 有售價 → 可賣；有 costPrice 也算可賣（可議價的半成品商品）
    canSell:       hasSalePrice || hasCostPrice,
    // 有進貨價 或 無售價（半成品/原料）→ 可進貨
    canPurchase:   hasCostPrice || !hasSalePrice,
    // 沒有售價（半成品/包材）或 有進貨價 或 有 BOM → 可當材料
    canBeMaterial: !hasSalePrice || hasCostPrice || hasBom,
  };
}

// 快捷篩選函式
function getSellableItems(){
  return ALL_ITEMS.filter(i => computeItemFlags(i).canSell && i.active !== false);
}
function getPurchasableItems(){
  return ALL_ITEMS.filter(i => computeItemFlags(i).canPurchase && i.active !== false);
}
function getMaterialItems(){
  return ALL_ITEMS.filter(i => computeItemFlags(i).canBeMaterial && i.active !== false);
}

// 後台手動覆寫旗標（管理員）
function setItemFlags(itemId, flags){
  const all = JSON.parse(localStorage.getItem('erp_item_flags') || '{}');
  all[itemId] = { ...computeItemFlags(getItem(itemId)), ...flags };
  localStorage.setItem('erp_item_flags', JSON.stringify(all));
  if(typeof pushToFirebase === 'function') pushToFirebase('itemFlags', all);
}

// ── 啟動時從 localStorage 覆蓋 BOM（admin 修改過的） ──
function loadBomOverrides(){
  try {
    const saved = localStorage.getItem('erp_bom');
    if(saved){
      const overrides = JSON.parse(saved);
      Object.keys(overrides).forEach(id => { BOM[id] = overrides[id]; });
    }
  } catch(e){ console.warn('BOM overrides load failed', e); }
}
document.addEventListener('DOMContentLoaded', loadBomOverrides);
