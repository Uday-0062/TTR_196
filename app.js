/* =============================================
   SGOALS – app.js  (all features + localStorage)
   ============================================= */
'use strict';

/* ── helpers ─────────────────────────────── */
const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

function showToast(msg, dur = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/* ── localStorage ────────────────────────── */
const LS = {
  get: key => { try { return JSON.parse(localStorage.getItem('sgoals_' + key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem('sgoals_' + key, JSON.stringify(val)),
};

/* ── XP / level system ───────────────────── */
let xp = LS.get('xp') || 0;
let streak = LS.get('streak') || 0;
const lastDate = LS.get('lastDate') || '';
const todayStr = new Date().toDateString();

if (lastDate !== todayStr) {
  if (lastDate === new Date(Date.now() - 86400000).toDateString()) streak++;
  else if (lastDate !== '') streak = 1;
  else streak = 1;
  LS.set('streak', streak);
  LS.set('lastDate', todayStr);
}

function addXP(pts) {
  xp += pts;
  LS.set('xp', xp);
  renderHUD();
}

function renderHUD() {
  const level = Math.floor(xp / 100) + 1;
  $('total-xp').textContent = xp;
  $('streak-count').textContent = streak;
  $('player-level').textContent = level;
}
renderHUD();

/* ============================================================
   LIVE CLOCK
   ============================================================ */
function updateClock() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $('clock-date').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  $('clock-time').textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   PARTICLES BACKGROUND
   ============================================================ */
(function spawnParticles() {
  const container = $('particles-container');
  const colors = ['#a855f7','#06b6d4','#f59e0b','#10b981','#f97316'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 14 + 5;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*14+8}s;
      animation-delay:${Math.random()*12}s;
    `;
    container.appendChild(p);
  }
})();

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = $('hamburger');
const navLinks  = $('nav-links');
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

/* ============================================================
   NAV ACTIVE HIGHLIGHT ON SCROLL
   ============================================================ */
const sections = ['todo','attendance','goals','progress','timetable'];
function updateActiveNav() {
  let current = '';
  sections.forEach(id => {
    const el = $(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === current);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ============================================================
   CONFETTI
   ============================================================ */
const confettiCanvas = $('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
let confettiParticles = [];

function resizeConfetti() {
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener('resize', resizeConfetti);

function launchConfetti() {
  const colors = ['#a855f7','#06b6d4','#f59e0b','#10b981','#f97316','#ec4899'];
  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -10,
      r: Math.random() * 8 + 4,
      d: Math.random() * 80 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncrement: (Math.random() * 0.07 + 0.05),
      tiltAngle: 0,
      opacity: 1,
    });
  }
  animateConfetti();
}

function animateConfetti() {
  if (!confettiParticles.length) { ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); return; }
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiParticles.forEach((p, i) => {
    p.tiltAngle += p.tiltAngleIncrement;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) * 1.3;
    p.x += Math.sin(p.tiltAngle) * 2;
    p.tilt = Math.sin(p.tiltAngle) * 12;
    p.opacity -= 0.008;
    ctx.beginPath();
    ctx.lineWidth = p.r / 2;
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 20 && p.opacity > 0);
  requestAnimationFrame(animateConfetti);
}

/* ============================================================
   TO-DO LIST
   ============================================================ */
let todos = LS.get('todos') || [];
let todoFilter = 'all';

function saveTodos() { LS.set('todos', todos); }

function renderTodos() {
  const list  = $('todo-list');
  const empty = $('todo-empty');
  list.innerHTML = '';

  let filtered = todos;
  if (todoFilter === 'active') filtered = todos.filter(t => !t.done);
  if (todoFilter === 'done')   filtered = todos.filter(t => t.done);
  if (todoFilter === 'high')   filtered = todos.filter(t => t.priority === 'high');

  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  $('todo-done-count').textContent  = done;
  $('todo-total-count').textContent = total;
  $('todo-progress-bar').style.width = pct + '%';
  $('todo-progress-label').textContent = pct + '% Complete';

  if (!filtered.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  const emojis = { high:'🔴', medium:'🟡', low:'🟢' };

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.setAttribute('role','listitem');
    li.innerHTML = `
      <button class="todo-check ${todo.done ? 'checked' : ''}" data-id="${todo.id}" aria-label="${todo.done ? 'Mark incomplete' : 'Mark complete'}">
        ${todo.done ? '✓' : ''}
      </button>
      <span class="priority-dot ${todo.priority}"></span>
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      ${todo.due ? `<span class="todo-due-label">📅 ${todo.due}</span>` : ''}
      <button class="todo-del-btn" data-id="${todo.id}" aria-label="Delete task">🗑️</button>
    `;
    list.appendChild(li);
  });

  // Events
  list.querySelectorAll('.todo-check').forEach(btn => {
    btn.addEventListener('click', () => toggleTodo(btn.dataset.id));
  });
  list.querySelectorAll('.todo-del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTodo(btn.dataset.id));
  });
}

function addTodo() {
  const text = $('todo-input').value.trim();
  if (!text) { showToast('⚠️ Write a quest first!'); return; }
  const todo = {
    id: Date.now().toString(),
    text,
    priority: $('todo-priority').value,
    due: $('todo-due').value,
    done: false,
    createdAt: Date.now(),
  };
  todos.unshift(todo);
  saveTodos();
  renderTodos();
  updateProgressDashboard();
  $('todo-input').value = '';
  $('todo-due').value = '';
  addXP(5);
  showToast('⚡ Quest added! +5 XP');
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTodos();
  renderTodos();
  updateProgressDashboard();
  if (t.done) { addXP(10); launchConfetti(); showToast('🎉 Quest complete! +10 XP'); }
  checkAchievements();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  updateProgressDashboard();
  showToast('🗑️ Quest removed');
}

$('todo-add-btn').addEventListener('click', addTodo);
$('todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    todoFilter = btn.dataset.filter;
    renderTodos();
  });
});

renderTodos();

/* ============================================================
   ATTENDANCE TRACKER
   ============================================================ */
let subjects = LS.get('subjects') || [];

function saveSubjects() { LS.set('subjects', subjects); }

function renderAttendance() {
  const grid = $('att-grid');
  grid.innerHTML = '';

  let totalC = 0, totalP = 0, totalA = 0;

  if (!subjects.length) {
    grid.innerHTML = '<p style="color:var(--text-sub);padding:1rem">No subjects yet – add one above!</p>';
  }

  subjects.forEach(sub => {
    const total = sub.present + sub.absent;
    const pct   = total ? Math.round(sub.present / total * 100) : 0;
    const status = pct >= 75 ? 'safe' : pct >= 60 ? 'warn' : 'danger';
    const barColor = pct >= 75 ? 'var(--accent4)' : pct >= 60 ? 'var(--accent3)' : 'var(--accent5)';

    totalC += total; totalP += sub.present; totalA += sub.absent;

    const card = document.createElement('div');
    card.className = 'att-card';
    card.innerHTML = `
      <div class="att-card-top">
        <span class="att-subject-name">📖 ${escapeHtml(sub.name)}</span>
        <span class="att-pct-badge ${status}">${pct}%</span>
      </div>
      <div class="att-counts">
        <span>Classes: <strong>${total}</strong></span>
        <span class="att-count-p">✅ ${sub.present}</span>
        <span class="att-count-a">❌ ${sub.absent}</span>
      </div>
      <div class="att-bar-wrap">
        <div class="att-bar" style="width:${pct}%;background:${barColor}"></div>
      </div>
      <div class="att-btns">
        <button class="att-btn present-btn" data-id="${sub.id}">✅ Present</button>
        <button class="att-btn absent-btn"  data-id="${sub.id}">❌ Absent</button>
        <button class="att-btn del-btn"     data-id="${sub.id}">🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Summary
  $('att-total-classes').textContent = totalC;
  $('att-total-present').textContent = totalP;
  $('att-total-absent').textContent  = totalA;
  const overallPct = totalC ? Math.round(totalP / totalC * 100) : 0;
  $('att-pct').textContent  = overallPct + '%';
  $('prog-att-pct').textContent = overallPct + '%';

  // Events
  grid.querySelectorAll('.present-btn').forEach(btn =>
    btn.addEventListener('click', () => markAttendance(btn.dataset.id, 'present')));
  grid.querySelectorAll('.absent-btn').forEach(btn =>
    btn.addEventListener('click', () => markAttendance(btn.dataset.id, 'absent')));
  grid.querySelectorAll('.del-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteSubject(btn.dataset.id)));

  drawAttChart();
}

function addSubject() {
  const name = $('att-subject').value.trim();
  if (!name) { showToast('⚠️ Enter subject name!'); return; }
  if (subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('⚠️ Subject already exists!'); return;
  }
  subjects.push({ id: Date.now().toString(), name, present: 0, absent: 0 });
  saveSubjects();
  renderAttendance();
  $('att-subject').value = '';
  addXP(3);
  showToast('📚 Subject added! +3 XP');
}

function markAttendance(id, type) {
  const s = subjects.find(s => s.id === id);
  if (!s) return;
  if (type === 'present') { s.present++; addXP(2); showToast('✅ Present marked! +2 XP'); }
  else                    { s.absent++;  showToast('❌ Absent marked'); }
  saveSubjects();
  renderAttendance();
  updateProgressDashboard();
  checkAchievements();
}

function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  saveSubjects();
  renderAttendance();
  showToast('🗑️ Subject removed');
}

$('att-add-btn').addEventListener('click', addSubject);
$('att-subject').addEventListener('keydown', e => { if (e.key === 'Enter') addSubject(); });
renderAttendance();

/* Attendance Chart (bar) */
let attChartInst = null;
function drawAttChart() {
  const canvas = $('att-chart');
  if (!canvas) return;
  if (attChartInst) { attChartInst.destroy(); attChartInst = null; }
  if (!subjects.length) return;

  const labels = subjects.map(s => s.name);
  const pcts   = subjects.map(s => {
    const t = s.present + s.absent;
    return t ? Math.round(s.present / t * 100) : 0;
  });
  const colors = pcts.map(p => p >= 75 ? '#10b981' : p >= 60 ? '#f59e0b' : '#ef4444');

  attChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Attendance %',
        data: pcts,
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.parsed.y + '%' } } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: '#a0a0c0', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#a0a0c0' }, grid: { display: false } },
      }
    }
  });
}

/* ============================================================
   GOAL CARDS
   ============================================================ */
let goals = LS.get('goals') || [];

function saveGoals() { LS.set('goals', goals); }

const goalEmojis = { study:'📚', health:'💪', personal:'😊', fun:'🎮' };

function renderGoals() {
  const grid  = $('goals-grid');
  const empty = $('goal-empty');
  grid.innerHTML = '';

  if (!goals.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  goals.forEach(g => {
    const card = document.createElement('div');
    card.className = `goal-card ${g.category}`;
    card.setAttribute('role','listitem');
    card.innerHTML = `
      <div class="goal-card-top">
        <span class="goal-emoji">${goalEmojis[g.category] || '🎯'}</span>
        <span class="goal-text">${escapeHtml(g.text)}</span>
        <button class="goal-del" data-id="${g.id}" aria-label="Delete goal">✕</button>
      </div>
      <div class="goal-progress-label">
        <span>Progress</span>
        <span id="gval-${g.id}">${g.progress}%</span>
      </div>
      <input type="range" class="goal-slider" id="gslider-${g.id}"
        min="0" max="100" value="${g.progress}" data-id="${g.id}" aria-label="Goal progress" />
      <span class="goal-tag ${g.category}">${g.category}</span>
      <button class="goal-done-btn ${g.done ? 'is-done' : ''}" data-id="${g.id}">
        ${g.done ? '✅ Completed!' : '🎯 Mark as Done'}
      </button>
    `;
    grid.appendChild(card);
  });

  // Slider events
  grid.querySelectorAll('.goal-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const g = goals.find(g => g.id === slider.dataset.id);
      if (g) {
        g.progress = parseInt(slider.value);
        $('gval-' + g.id).textContent = g.progress + '%';
        saveGoals();
        updateProgressDashboard();
        drawProgressCharts();
      }
    });
  });
  grid.querySelectorAll('.goal-done-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleGoalDone(btn.dataset.id));
  });
  grid.querySelectorAll('.goal-del').forEach(btn => {
    btn.addEventListener('click', () => deleteGoal(btn.dataset.id));
  });

  updateProgressDashboard();
  drawProgressCharts();
}

function addGoal() {
  const text = $('goal-text').value.trim();
  if (!text) { showToast('⚠️ Write your goal first!'); return; }
  goals.unshift({
    id: Date.now().toString(),
    text,
    category: $('goal-category').value,
    progress: 0,
    done: false,
    createdAt: Date.now(),
    week: getWeekLabel(),
  });
  saveGoals();
  renderGoals();
  $('goal-text').value = '';
  addXP(5);
  showToast('🌟 Goal added! +5 XP');
}

function toggleGoalDone(id) {
  const g = goals.find(g => g.id === id);
  if (!g) return;
  g.done = !g.done;
  if (g.done) { g.progress = 100; addXP(20); launchConfetti(); showToast('🏆 Goal achieved! +20 XP'); }
  saveGoals();
  renderGoals();
  checkAchievements();
}

function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  saveGoals();
  renderGoals();
  showToast('🗑️ Goal removed');
}

$('goal-add-btn').addEventListener('click', addGoal);
$('goal-text').addEventListener('keydown', e => { if (e.key === 'Enter') addGoal(); });
renderGoals();

/* ============================================================
   PROGRESS DASHBOARD + CHARTS
   ============================================================ */
function updateProgressDashboard() {
  const goalsTotal = goals.length;
  const goalsDone  = goals.filter(g => g.done).length;
  const tasksDone  = todos.filter(t => t.done).length;
  const totalC     = subjects.reduce((a,s) => a + s.present + s.absent, 0);
  const totalP     = subjects.reduce((a,s) => a + s.present, 0);
  const attPct     = totalC ? Math.round(totalP / totalC * 100) : 0;

  $('prog-goals-total').textContent = goalsTotal;
  $('prog-goals-done').textContent  = goalsDone;
  $('prog-tasks-done').textContent  = tasksDone;
  $('prog-att-pct').textContent     = attPct + '%';

  checkAchievements();
}

/* ---- Chart.js charts ---- */
let barChartInst = null, pieChartInst = null, radarChartInst = null;

function drawProgressCharts() {
  drawBarChart();
  drawPieChart();
  drawRadarChart();
}

/* Bar – goals per category */
function drawBarChart() {
  const canvas = $('goals-bar-chart');
  if (!canvas) return;
  if (barChartInst) barChartInst.destroy();

  const cats = ['study','health','personal','fun'];
  const catLabels = ['📚 Study','💪 Health','😊 Personal','🎮 Fun'];
  const total = cats.map(c => goals.filter(g => g.category === c).length);
  const done  = cats.map(c => goals.filter(g => g.category === c && g.done).length);

  barChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [
        { label: 'Total', data: total, backgroundColor: 'rgba(168,85,247,0.5)', borderRadius: 6, borderSkipped: false },
        { label: 'Done',  data: done,  backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6, borderSkipped: false },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#a0a0c0' } } },
      scales: {
        y: { ticks: { color: '#a0a0c0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        x: { ticks: { color: '#a0a0c0' }, grid: { display: false } },
      }
    }
  });
}

/* Pie – category distribution */
function drawPieChart() {
  const canvas = $('goals-pie-chart');
  if (!canvas) return;
  if (pieChartInst) pieChartInst.destroy();

  const cats   = ['study','health','personal','fun'];
  const labels = ['📚 Study','💪 Health','😊 Personal','🎮 Fun'];
  const data   = cats.map(c => goals.filter(g => g.category === c).length);

  if (data.every(d => d === 0)) {
    pieChartInst = new Chart(canvas, {
      type: 'doughnut',
      data: { labels:['No goals yet'], datasets:[{ data:[1], backgroundColor:['rgba(255,255,255,0.05)'] }] },
      options: { plugins:{ legend:{ labels:{ color:'#a0a0c0' } } } }
    });
    return;
  }

  pieChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#6366f1','#10b981','#f59e0b','#a855f7'],
        borderWidth: 2, borderColor: '#0d0d1a',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#a0a0c0', padding: 10 } } },
      cutout: '60%',
    }
  });
}

/* Radar – overall progress */
function drawRadarChart() {
  const canvas = $('radar-chart');
  if (!canvas) return;
  if (radarChartInst) radarChartInst.destroy();

  const taskDonePct = todos.length ? Math.round(todos.filter(t=>t.done).length/todos.length*100) : 0;
  const goalDonePct = goals.length ? Math.round(goals.filter(g=>g.done).length/goals.length*100) : 0;
  const avgGoalProg = goals.length ? Math.round(goals.reduce((a,g)=>a+g.progress,0)/goals.length) : 0;
  const totalC      = subjects.reduce((a,s)=>a+s.present+s.absent,0);
  const attPct      = totalC ? Math.round(subjects.reduce((a,s)=>a+s.present,0)/totalC*100) : 0;
  const ttSlots     = (LS.get('timetable') || []).length;
  const ttScore     = Math.min(ttSlots * 10, 100);

  radarChartInst = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Tasks ✅','Goals 🌟','Progress 📈','Attendance 🏫','Planning 📅'],
      datasets: [{
        label: 'Your Power Level',
        data: [taskDonePct, goalDonePct, avgGoalProg, attPct, ttScore],
        backgroundColor: 'rgba(168,85,247,0.2)',
        borderColor: '#a855f7',
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#a855f7',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255,255,255,0.1)' },
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#a0a0c0', font: { size: 12, family: 'Nunito', weight: '700' } },
        }
      },
      plugins: { legend: { labels: { color: '#a0a0c0' } } }
    }
  });
}

updateProgressDashboard();
drawProgressCharts();

/* ============================================================
   ACHIEVEMENTS
   ============================================================ */
const ACHIEVEMENTS = [
  { id:'first_task',   icon:'⭐', label:'First Quest!',      check: () => todos.length >= 1 },
  { id:'five_tasks',   icon:'🌟', label:'5 Quests Added',    check: () => todos.length >= 5 },
  { id:'task_master',  icon:'🏆', label:'10 Tasks Done!',    check: () => todos.filter(t=>t.done).length >= 10 },
  { id:'first_goal',   icon:'🎯', label:'First Goal Set!',   check: () => goals.length >= 1 },
  { id:'goal_crusher', icon:'💪', label:'5 Goals Crushed!',  check: () => goals.filter(g=>g.done).length >= 5 },
  { id:'study_hero',   icon:'📚', label:'Study Hero!',       check: () => goals.filter(g=>g.category==='study').length >= 3 },
  { id:'attendance_a', icon:'🏫', label:'100% Attendance!',  check: () => { const t=subjects.reduce((a,s)=>a+s.present+s.absent,0); const p=subjects.reduce((a,s)=>a+s.present,0); return t>0 && p===t; }},
  { id:'xp_100',       icon:'⚡', label:'100 XP Earned!',    check: () => xp >= 100 },
  { id:'xp_500',       icon:'🚀', label:'500 XP Legend!',    check: () => xp >= 500 },
  { id:'streak_7',     icon:'🔥', label:'7-Day Streak!',     check: () => streak >= 7 },
  { id:'planner',      icon:'📅', label:'Master Planner!',   check: () => (LS.get('timetable')||[]).length >= 5 },
];

let unlockedAch = LS.get('achievements') || [];

function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedAch.includes(ach.id) && ach.check()) {
      unlockedAch.push(ach.id);
      LS.set('achievements', unlockedAch);
      showToast(`🏆 Achievement Unlocked: ${ach.label}`);
      launchConfetti();
    }
  });
  renderAchievements();
}

function renderAchievements() {
  const grid = $('achievements-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!unlockedAch.length) {
    grid.innerHTML = '<p style="color:var(--text-sub);font-size:.85rem">Complete tasks & goals to unlock achievements! 🔒</p>';
    return;
  }
  unlockedAch.forEach(id => {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.innerHTML = `<span class="ach-icon">${ach.icon}</span>${ach.label}`;
    grid.appendChild(badge);
  });
}
renderAchievements();

/* ============================================================
   TIMETABLE
   ============================================================ */
let timetable = LS.get('timetable') || [];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const typeIcons = { study:'📚', exercise:'💪', personal:'😊', break:'☕', sleep:'😴' };

let activeTTDay = DAYS[0];

function saveTimetable() { LS.set('timetable', timetable); }

function renderTTTabs() {
  const tabs = $('tt-tabs');
  tabs.innerHTML = '';
  DAYS.forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'tt-tab' + (day === activeTTDay ? ' active' : '');
    btn.textContent = day.slice(0,3);
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected', day === activeTTDay);
    btn.addEventListener('click', () => { activeTTDay = day; renderTTTabs(); renderTTContent(); });
    tabs.appendChild(btn);
  });
}

function renderTTContent() {
  const content = $('tt-content');
  const daySlots = timetable.filter(s => s.day === activeTTDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (!daySlots.length) {
    content.innerHTML = '<div class="tt-empty">😴 No slots for this day yet — add some above!</div>';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'tt-day-slots';

  daySlots.forEach(slot => {
    const div = document.createElement('div');
    div.className = `tt-slot ${slot.type}`;
    div.innerHTML = `
      <span class="tt-slot-time">⏰ ${slot.start} – ${slot.end}</span>
      <span class="tt-slot-icon">${typeIcons[slot.type] || '📌'}</span>
      <span class="tt-slot-name">${escapeHtml(slot.activity)}</span>
      <span class="tt-slot-type">${slot.type}</span>
      <button class="tt-del-btn" data-id="${slot.id}" aria-label="Delete slot">🗑️</button>
    `;
    wrap.appendChild(div);
  });

  content.innerHTML = '';
  content.appendChild(wrap);

  content.querySelectorAll('.tt-del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTTSlot(btn.dataset.id));
  });
}

function addTTSlot() {
  const activity = $('tt-activity').value.trim();
  const start    = $('tt-start').value;
  const end      = $('tt-end').value;
  const day      = $('tt-day').value;
  const type     = $('tt-type').value;

  if (!activity) { showToast('⚠️ Enter activity name!'); return; }
  if (!start || !end) { showToast('⚠️ Set start and end time!'); return; }
  if (start >= end) { showToast('⚠️ End must be after start!'); return; }

  timetable.push({ id: Date.now().toString(), day, type, activity, start, end });
  saveTimetable();
  activeTTDay = day;
  renderTTTabs();
  renderTTContent();
  $('tt-activity').value = '';
  $('tt-start').value = '';
  $('tt-end').value = '';
  addXP(3);
  showToast('📅 Slot added! +3 XP');
  checkAchievements();
}

function deleteTTSlot(id) {
  timetable = timetable.filter(s => s.id !== id);
  saveTimetable();
  renderTTContent();
  showToast('🗑️ Slot removed');
}

$('tt-add-btn').addEventListener('click', addTTSlot);
renderTTTabs();
renderTTContent();

/* ============================================================
   MASCOT IMAGE FALLBACK
   ============================================================ */
const mascotImg = $('mascot-img');
if (mascotImg) {
  mascotImg.addEventListener('error', () => {
    mascotImg.style.display = 'none';
    $('mascot-fallback').style.display = 'block';
  });
  if (!mascotImg.complete || mascotImg.naturalWidth === 0) {
    mascotImg.style.display = 'none';
    $('mascot-fallback').style.display = 'block';
  }
}

/* ============================================================
   UTILS
   ============================================================ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function getWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return `${start.getMonth()+1}/${start.getDate()}`;
}

/* ============================================================
   CHART.JS – lazy load from CDN
   ============================================================ */
(function loadChartJS() {
  if (window.Chart) { drawProgressCharts(); drawAttChart(); return; }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
  script.onload = () => { drawProgressCharts(); drawAttChart(); };
  document.head.appendChild(script);
})();

console.log('%cSGOALS 🔴 RED EDITION loaded!', 'color:#ff2d2d;font-size:18px;font-weight:bold');

/* ============================================================
   FIRE CURSOR TRAIL EFFECT (Red Edition Extra Effect)
   ============================================================ */
(function fireCursorTrail() {
  const colors = ['#ff2d2d','#ff6b00','#ffcc00','#ff4da6','#ff0055','#ff8800'];
  let lastTime = 0;
  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastTime < 40) return; // throttle
    lastTime = now;

    const spark = document.createElement('div');
    spark.className = 'cursor-spark';
    spark.style.cssText = `
      left: ${e.clientX - 4}px;
      top:  ${e.clientY - 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      box-shadow: 0 0 8px ${colors[0]}, 0 0 16px ${colors[1]};
    `;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 600);
  });
})();

/* ============================================================
   UPDATE PARTICLES TO RED THEME
   ============================================================ */
(function recolorParticles() {
  const redColors = ['#ff2d2d','#ff6b00','#cc0000','#ff0055','#ff8800','#ffcc00'];
  document.querySelectorAll('.particle').forEach(p => {
    p.style.background = redColors[Math.floor(Math.random() * redColors.length)];
  });
})();
