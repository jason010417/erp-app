// ============================================================
// exam_plan.js — 社工師考試規劃
// ============================================================

const EXAM_SUBJECTS = [
  { id: 'sw', name: '社會工作',           color: '#1D9E75', bg: '#E1F5EE' },
  { id: 'ds', name: '社會工作直接服務',   color: '#185FA5', bg: '#E6F1FB' },
  { id: 'rm', name: '社會工作研究方法',   color: '#6B4FBB', bg: '#EDE9F8' },
  { id: 'sp', name: '社會政策與社會立法', color: '#BA7517', bg: '#FAEEDA' },
  { id: 'hb', name: '人類行為與社會環境', color: '#E24B4A', bg: '#FCEBEB' },
  { id: 'sm', name: '社會工作管理',       color: '#2C7A7B', bg: '#E6FFFA' },
];

let examPlan = JSON.parse(localStorage.getItem('erp_exam_plan') || 'null') || {
  examDate: '',
  goalHours: 40,
  sessions: [],
  mockScores: [],
};

function saveExamPlan() {
  localStorage.setItem('erp_exam_plan', JSON.stringify(examPlan));
  if (typeof pushToFirebase === 'function') pushToFirebase('examPlan', examPlan);
}

// ── 主頁初始化 ──
function initExamPlanPage() {
  const page = document.getElementById('page-exam-plan');
  if (!page) return;

  page.innerHTML = `
    <div class="op-header">
      <button class="back-btn" onclick="showPage('admin')"><i class="ti ti-arrow-left"></i></button>
      <div class="op-title"><i class="ti ti-school" style="color:var(--purple);"></i> 社工師考試規劃</div>
      <button class="small-btn" onclick="openExamSettingsModal()" title="設定考試日期與目標">
        <i class="ti ti-adjustments"></i>
      </button>
    </div>

    <div id="exam-countdown-section"></div>

    <div class="section-title" style="margin-top:14px;">
      <i class="ti ti-chart-bar"></i> 各科讀書進度
    </div>
    <div id="exam-progress-section"></div>

    <div class="section-title" style="margin-top:14px;">
      <i class="ti ti-clipboard-list"></i> 模擬考成績
    </div>
    <div id="exam-mock-section"></div>

    <div class="section-title" style="margin-top:14px;">
      <i class="ti ti-clock"></i> 讀書記錄
    </div>
    <div id="exam-sessions-section"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;padding-bottom:24px;">
      <button class="confirm-btn" style="background:var(--purple);color:#fff;border:none;"
        onclick="openAddSessionModal()">
        <i class="ti ti-plus"></i> 新增讀書記錄
      </button>
      <button class="confirm-btn" style="background:var(--blue);color:#fff;border:none;"
        onclick="openAddMockModal()">
        <i class="ti ti-pencil"></i> 新增模擬考
      </button>
    </div>
  `;

  renderExamCountdown();
  renderExamProgress();
  renderExamMockScores();
  renderExamSessions();
}

// ── 倒數計時卡 ──
function renderExamCountdown() {
  const el = document.getElementById('exam-countdown-section');
  if (!el) return;

  if (!examPlan.examDate) {
    el.innerHTML = `
      <div class="form-card" style="text-align:center;padding:24px;">
        <i class="ti ti-calendar-event" style="font-size:44px;color:var(--text3);"></i>
        <div style="margin-top:10px;font-size:15px;color:var(--text2);">尚未設定考試日期</div>
        <button class="small-btn green-btn"
          style="margin:14px auto 0;display:inline-flex;"
          onclick="openExamSettingsModal()">
          <i class="ti ti-plus"></i> 立即設定
        </button>
      </div>`;
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exam  = new Date(examPlan.examDate); exam.setHours(0, 0, 0, 0);
  const diff  = Math.ceil((exam - today) / 86400000);

  let clr = '#1D9E75', bg = '#E1F5EE', status = '穩定備考中';
  if (diff < 0)       { clr = '#9B9B98'; bg = 'var(--bg)'; status = '考試已結束'; }
  else if (diff === 0){ clr = '#E24B4A'; bg = '#FCEBEB';   status = '今天就是考試日！加油！'; }
  else if (diff <= 30){ clr = '#E24B4A'; bg = '#FCEBEB';   status = '最後衝刺！把握每一天'; }
  else if (diff <= 60){ clr = '#BA7517'; bg = '#FAEEDA';   status = '加緊腳步備考！'; }

  el.innerHTML = `
    <div class="form-card"
      style="text-align:center;padding:22px;background:${bg};border-color:${clr}30;">
      <div style="font-size:13px;font-weight:700;color:${clr};letter-spacing:.5px;">${status}</div>
      <div style="font-size:56px;font-weight:900;color:${clr};line-height:1.1;margin:8px 0 4px;">
        ${diff < 0 ? '—' : diff}<span style="font-size:22px;font-weight:600;"> 天</span>
      </div>
      <div style="font-size:14px;color:var(--text2);">考試日期：${fmtDateFull(examPlan.examDate)}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px;">
        各科目標 ${examPlan.goalHours || 40} 小時
      </div>
    </div>`;
}

// ── 各科讀書進度 ──
function renderExamProgress() {
  const el = document.getElementById('exam-progress-section');
  if (!el) return;

  const goal = examPlan.goalHours || 40;
  const hrs  = {};
  EXAM_SUBJECTS.forEach(s => { hrs[s.id] = 0; });
  (examPlan.sessions || []).forEach(s => {
    if (hrs[s.subjectId] !== undefined) hrs[s.subjectId] += (s.hours || 0);
  });

  const totalHrs  = Object.values(hrs).reduce((a, b) => a + b, 0);
  const totalGoal = goal * EXAM_SUBJECTS.length;
  const overallPct = Math.min(100, Math.round((totalHrs / totalGoal) * 100));

  el.innerHTML = `
    <div class="form-card" style="padding:12px 14px;margin-bottom:8px;
      background:var(--purple-light);border-color:var(--purple-mid);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:14px;font-weight:700;color:var(--purple);">整體進度</div>
        <div style="font-size:13px;color:var(--purple);">${totalHrs} / ${totalGoal} 小時 (${overallPct}%)</div>
      </div>
      <div style="height:12px;background:var(--purple-mid)40;border-radius:6px;overflow:hidden;">
        <div style="height:100%;width:${overallPct}%;background:var(--purple);border-radius:6px;transition:width .4s;"></div>
      </div>
    </div>
    ${EXAM_SUBJECTS.map(sub => {
      const h   = hrs[sub.id] || 0;
      const pct = Math.min(100, Math.round((h / goal) * 100));
      return `
        <div class="form-card" style="padding:11px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
            <div style="font-size:13px;font-weight:600;color:${sub.color};">${sub.name}</div>
            <div style="font-size:12px;color:var(--text2);">${h} / ${goal} 小時 (${pct}%)</div>
          </div>
          <div style="height:9px;background:${sub.bg};border-radius:5px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${sub.color};border-radius:5px;transition:width .4s;"></div>
          </div>
        </div>`;
    }).join('')}`;
}

// ── 模擬考成績 ──
function renderExamMockScores() {
  const el = document.getElementById('exam-mock-section');
  if (!el) return;

  const mocks = (examPlan.mockScores || []).slice().reverse();
  if (!mocks.length) {
    el.innerHTML = `<div class="inv-ok" style="color:var(--text3);">
      <i class="ti ti-clipboard-x"></i> 尚無模擬考記錄</div>`;
    return;
  }

  el.innerHTML = mocks.map((m, i) => {
    const scores = m.scores || {};
    const vals   = EXAM_SUBJECTS.map(s => scores[s.id] || 0);
    const avg    = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const pass   = vals.every(v => v >= 40) && avg >= 60;

    return `
      <div class="form-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-weight:700;font-size:15px;">第 ${mocks.length - i} 次模擬考</div>
            <div style="font-size:12px;color:var(--text3);">
              ${fmtDateFull(m.date)}${m.note ? ' · ' + m.note : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:26px;font-weight:900;color:${avg >= 60 ? 'var(--green)' : 'var(--red)'};">
              ${avg}
            </div>
            <div style="font-size:11px;font-weight:600;color:${pass ? 'var(--green)' : 'var(--red)'};">
              ${pass ? '✓ 通過標準' : '✗ 尚未達標'}
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
          ${EXAM_SUBJECTS.map(s => {
            const score = scores[s.id] || 0;
            const low = score < 60;
            return `<div style="padding:6px 10px;border-radius:var(--radius-sm);background:${low ? '#FCEBEB' : 'var(--bg)'};">
              <div style="font-size:10px;color:var(--text3);margin-bottom:2px;">${s.name}</div>
              <div style="font-size:20px;font-weight:700;color:${low ? 'var(--red)' : s.color};">${score}</div>
            </div>`;
          }).join('')}
        </div>
        <button style="margin-top:8px;font-size:12px;color:var(--text3);padding:2px 0;display:flex;align-items:center;gap:4px;"
          onclick="deleteMockScore('${m.id}')">
          <i class="ti ti-trash"></i> 刪除
        </button>
      </div>`;
  }).join('');
}

// ── 讀書記錄列表 ──
function renderExamSessions() {
  const el = document.getElementById('exam-sessions-section');
  if (!el) return;

  const sessions = (examPlan.sessions || []).slice().reverse().slice(0, 30);
  if (!sessions.length) {
    el.innerHTML = `<div class="inv-ok" style="color:var(--text3);">
      <i class="ti ti-clock-off"></i> 尚無讀書記錄</div>`;
    return;
  }

  el.innerHTML = sessions.map(s => {
    const sub = EXAM_SUBJECTS.find(x => x.id === s.subjectId) || { name: s.subjectId, color: '#666', bg: '#eee' };
    return `
      <div class="inv-warn-row" style="gap:10px;">
        <span style="flex-shrink:0;padding:3px 10px;border-radius:20px;
          background:${sub.bg};color:${sub.color};font-size:11px;font-weight:600;">
          ${sub.name}
        </span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:600;">${s.hours} 小時${s.note ? ' · ' + s.note : ''}</div>
          <div style="font-size:12px;color:var(--text3);">${fmtDateFull(s.date)}</div>
        </div>
        <button style="flex-shrink:0;color:var(--text3);padding:6px;"
          onclick="deleteExamSession('${s.id}')">
          <i class="ti ti-x"></i>
        </button>
      </div>`;
  }).join('');
}

// ── 新增讀書記錄 ──
function openAddSessionModal() {
  const modal = document.getElementById('examSessionModal');
  if (!modal) return;
  document.getElementById('esm-date').value    = todayStr();
  document.getElementById('esm-subject').value = EXAM_SUBJECTS[0].id;
  document.getElementById('esm-hours').value   = '2';
  document.getElementById('esm-note').value    = '';
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('esm-hours').select?.(), 250);
}

function closeExamSessionModal(e) {
  const modal = document.getElementById('examSessionModal');
  if (!e || e.target === modal) modal.style.display = 'none';
}

function submitExamSession() {
  const date      = document.getElementById('esm-date').value;
  const subjectId = document.getElementById('esm-subject').value;
  const hours     = parseFloat(document.getElementById('esm-hours').value) || 0;
  const note      = document.getElementById('esm-note').value.trim();

  if (!date || !subjectId || hours <= 0) {
    showToast('請填寫日期、科目與讀書時數');
    return;
  }

  examPlan.sessions.push({
    id: 'EP' + Date.now(),
    date,
    subjectId,
    hours,
    note,
    createdAt: Date.now(),
  });

  saveExamPlan();
  closeExamSessionModal();
  renderExamProgress();
  renderExamSessions();
  showToast('✅ 讀書記錄已新增');
}

function deleteExamSession(id) {
  examPlan.sessions = examPlan.sessions.filter(s => s.id !== id);
  saveExamPlan();
  renderExamProgress();
  renderExamSessions();
  showToast('已刪除');
}

// ── 新增模擬考 ──
function openAddMockModal() {
  const modal = document.getElementById('examMockModal');
  if (!modal) return;
  document.getElementById('emm-date').value = todayStr();
  document.getElementById('emm-note').value = '';
  EXAM_SUBJECTS.forEach(s => {
    const inp = document.getElementById('emm-score-' + s.id);
    if (inp) inp.value = '';
  });
  modal.style.display = 'flex';
}

function closeExamMockModal(e) {
  const modal = document.getElementById('examMockModal');
  if (!e || e.target === modal) modal.style.display = 'none';
}

function submitExamMock() {
  const date = document.getElementById('emm-date').value;
  const note = document.getElementById('emm-note').value.trim();
  if (!date) { showToast('請填寫考試日期'); return; }

  const scores = {};
  EXAM_SUBJECTS.forEach(s => {
    const val = parseInt(document.getElementById('emm-score-' + s.id)?.value || '0', 10);
    scores[s.id] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  });

  if (!examPlan.mockScores) examPlan.mockScores = [];
  examPlan.mockScores.push({
    id: 'MK' + Date.now(),
    date,
    note,
    scores,
    createdAt: Date.now(),
  });

  saveExamPlan();
  closeExamMockModal();
  renderExamMockScores();
  showToast('✅ 模擬考成績已新增');
}

function deleteMockScore(id) {
  examPlan.mockScores = (examPlan.mockScores || []).filter(m => m.id !== id);
  saveExamPlan();
  renderExamMockScores();
  showToast('已刪除');
}

// ── 設定（考試日期 & 目標時數）──
function openExamSettingsModal() {
  const modal = document.getElementById('examSettingsModal');
  if (!modal) return;
  document.getElementById('exs-date').value = examPlan.examDate || '';
  document.getElementById('exs-goal').value = examPlan.goalHours || 40;
  modal.style.display = 'flex';
}

function closeExamSettingsModal(e) {
  const modal = document.getElementById('examSettingsModal');
  if (!e || e.target === modal) modal.style.display = 'none';
}

function submitExamSettings() {
  const date = document.getElementById('exs-date').value;
  const goal = parseInt(document.getElementById('exs-goal').value, 10);
  if (!date) { showToast('請選擇考試日期'); return; }
  if (!goal || goal <= 0) { showToast('請設定有效的目標時數'); return; }

  examPlan.examDate  = date;
  examPlan.goalHours = goal;
  saveExamPlan();
  closeExamSettingsModal();
  renderExamCountdown();
  renderExamProgress();
  showToast('✅ 設定已儲存');
}
