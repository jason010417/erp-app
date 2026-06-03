# 工廠庫存管理系統 — 部署說明

## 📁 檔案結構
```
erp-app/
├── index.html        ← 主頁面
├── manifest.json     ← PWA 設定（安裝到桌面用）
├── sw.js             ← Service Worker（離線快取）
├── css/
│   └── style.css     ← 樣式表
├── js/
│   ├── data.js       ← 商品資料庫（可自訂品項）
│   └── app.js        ← 主程式邏輯
└── icons/            ← 請自行放入 icon-192.png / icon-512.png
```

---

## 🚀 部署方式（選一種）

### 方法 A：GitHub Pages（免費、最簡單）
1. 到 https://github.com 建立新帳號/登入
2. 新增 Repository（取名 `erp-app`，設為 Public）
3. 把所有檔案上傳到 Repository
4. 進入 Settings → Pages → Source 選 `main` branch
5. 等 1 分鐘，網址會是：`https://你的帳號.github.io/erp-app/`

### 方法 B：Netlify（拖拉上傳，最快）
1. 到 https://netlify.com 登入（可用 Google 帳號）
2. 把整個 `erp-app` 資料夾拖到 Netlify 網頁
3. 立即得到網址，例如：`https://random-name.netlify.app`

### 方法 C：自己的主機 / NAS
- 把所有檔案放到網頁根目錄即可
- 需要 HTTPS 才能使用相機掃碼功能

---

## 📱 安裝成手機 APP（PWA）

部署後，用手機瀏覽器開啟網址：

**iPhone（Safari）：**
1. 點右下角「分享」按鈕 □↑
2. 選「加入主畫面」
3. 點「新增」→ 桌面出現 APP 圖示

**Android（Chrome）：**
1. 點右上角「⋮」選單
2. 選「新增至主畫面」或「安裝應用程式」
3. 點「安裝」→ 桌面出現 APP 圖示

---

## ✏️ 修改商品資料

編輯 `js/data.js`：

```javascript
// 修改成品，例如改名稱和安全庫存量：
{id:'F01', barcode:'F01-0001', name:'你的成品名稱', emoji:'📦', qty:50, min:10},
```

欄位說明：
- `id`：編號（不可重複）
- `barcode`：條碼（對應實體條碼列印）
- `name`：顯示名稱
- `emoji`：圖示
- `qty`：初始庫存數量
- `min`：安全庫存量（低於此數會發出警告）

---

## 🔍 條碼設定

系統使用「相機掃 QR Code / 條碼」：
- 建議用標籤機印出每個品項的 QR Code，貼在貨架/產品上
- 條碼格式自訂，只要與 `data.js` 中的 `barcode` 欄位一致即可
- 免費 QR Code 產生工具：https://www.qr-code-generator.com

---

## 💾 資料儲存

- 庫存數量與操作記錄存在瀏覽器的 `localStorage`
- 同一台裝置、同一個瀏覽器的資料會保留
- 如需多人/多台共用，需要加入後端資料庫（如 Google Sheets API、Firebase）

---

## 🌐 瀏覽器支援
- ✅ Chrome（Android / Windows / Mac）
- ✅ Safari（iPhone / iPad / Mac）
- ✅ Edge（Windows）
- ⚠️ 相機掃碼需要 HTTPS 環境
