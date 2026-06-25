# 收銀模式（Kiosk Mode）設計規格

## 目標

將 ERP 分成兩個入口：
- **操作員模式**（預設）：身障員工只看得到外展 POS，無法誤觸管理功能
- **主管模式**（PIN 解鎖）：完整後台介面，與現在相同

---

## 使用流程

```
[啟動 App]
    ↓ role = operator（預設）
[外展選擇頁 #page-kiosk-home]
    ↓ 點選進行中的外展卡片
[外展 POS 頁]  ← 返回按鈕 → 回外展選擇頁
    
[任何時間點右上角「主管」按鈕]
    ↓ 輸入 PIN
[完整主管介面 #page-home + 底部導覽列顯示]
    ↓ 點角色 badge → 退出主管
[外展選擇頁（回到操作員模式）]
```

---

## 版面規格

### 操作員模式（外展選擇頁）

```
┌─────────────────────────────────────┐
│ 🏭 庇護工場 ERP    ☁同步  [👷操作員] │  ← header 與現在相同
├─────────────────────────────────────┤
│                                     │
│        選擇今日外展活動              │
│                                     │
│  ┌───────────┐  ┌───────────┐       │
│  │    🏪     │  │    🎪     │       │  ← kiosk-event-card
│  │ 草屯夜市  │  │中興新村市集│       │  大卡片，點擊進入 POS
│  │ 6/25 草屯 │  │ 6/25-6/26 │       │
│  │ [進行中]  │  │ [進行中]  │       │
│  └───────────┘  └───────────┘       │
│                                     │
│  （若無進行中活動）                   │
│  ┌─────────────────────────────┐    │
│  │  目前沒有進行中的外展活動    │    │
│  │  請主管登入並開啟外展活動    │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
     無底部導覽列
```

### 主管模式

與現在完全相同。底部導覽列顯示，所有頁面可存取。

---

## 需修改的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `index.html` | 新增 HTML | `#page-kiosk-home` div + 卡片列表容器 `#kiosk-event-list` |
| `index.html` | 新增 CSS | `.kiosk-event-card`（大卡片）、`.bottom-nav.hidden`（隱藏導覽列） |
| `js/auth.js` | 修改 | `applyRoleUI()` — 根據角色切換：顯示/隱藏底部 nav，跳轉 home 或 kiosk-home |
| `js/auth.js` | 修改 | `DOMContentLoaded` — 若操作員角色，預設顯示 kiosk-home |
| `js/events.js` | 新增函式 | `renderKioskHome()` — 篩出 `eventStatus(ev) === 'active'` 的外展，渲染卡片 |
| `js/pos.js` | 修改 | `startEventPOS()` — 在操作員模式下，POS 頁顯示「← 返回外展選擇」按鈕 |

---

## 操作員可見 / 不可見

| 可見 | 不可見 |
|------|--------|
| 外展選擇頁 | 底部導覽列（5 個 tab） |
| 外展 POS（限進行中活動） | 首頁儀表板 |
| 右上角主管登入按鈕 | 訂單、庫存、工廠、管理 |
| 收款完成收據 | 門市 POS（A/B 門市） |

---

## 關鍵判斷邏輯

```javascript
// applyRoleUI() 修改後的邏輯（概念）
function applyRoleUI() {
  const role = currentRole();
  const nav = document.querySelector('.bottom-nav');

  if (isManager()) {
    nav.classList.remove('hidden');
    // 若目前在 kiosk-home，跳回 home
    if (currentPage === 'kiosk-home') showPage('home');
  } else {
    nav.classList.add('hidden');
    // 操作員 → 跳到外展選擇頁
    showPage('kiosk-home');
    renderKioskHome();
  }
  // 更新右上角 badge 文字（與現在相同）
  const labels = { operator: '👷 操作員', manager: '👔 主管', admin: '👑 管理員' };
  document.getElementById('header-role').textContent = labels[role];
}
```

---

## 狀態：規格確認，待實作
