/* ============================================================================
   Denaro — App logic
   ============================================================================ */

const STORAGE_KEY = "denaro.progress.v1";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  networth: 0,
  completedLessons: {},          // id -> { completed: true, reward, ts }
  activeUnitId: null,
  activeLessonId: null,
  activeQuestionIdx: 0,
  activeSelectedIdx: null,       // for MC / TF
  activeAnswered: false,         // whether current question already checked
  activeCorrectCount: 0,
  activeTotalAsked: 0,
  activeStartNetworth: 0,
  activeReward: 0,
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.networth === "number") state.networth = saved.networth;
    if (saved.completedLessons) state.completedLessons = saved.completedLessons;
  } catch (e) {
    console.warn("Failed to load progress:", e);
  }
}
function saveProgress() {
  const { networth, completedLessons } = state;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ networth, completedLessons })
  );
}

// ---------------------------------------------------------------------------
// Curriculum helpers
// ---------------------------------------------------------------------------

function allLessons() {
  const out = [];
  for (const u of CURRICULUM.units)
    for (const s of u.sections)
      for (const l of s.lessons)
        out.push({ unit: u, section: s, lesson: l });
  return out;
}
function flatLessonList() {
  return allLessons().map(x => x.lesson);
}
function findLessonById(id) {
  return allLessons().find(x => x.lesson.id === id);
}
function unitProgress(unit) {
  let total = 0, done = 0, reward = 0, earned = 0;
  for (const s of unit.sections)
    for (const l of s.lessons) {
      total++;
      reward += l.reward;
      if (state.completedLessons[l.id]) {
        done++;
        earned += l.reward;
      }
    }
  return { total, done, reward, earned };
}

/** A lesson is unlocked if it's the first uncompleted lesson OR any previous
 *  lesson in the whole curriculum is completed. We use a linear ordering. */
function isLessonUnlocked(lessonId) {
  const all = flatLessonList();
  const idx = all.findIndex(l => l.id === lessonId);
  if (idx <= 0) return true; // very first is always unlocked
  const prev = all[idx - 1];
  return !!state.completedLessons[prev.id];
}
function isLessonCompleted(lessonId) {
  return !!state.completedLessons[lessonId];
}

// ---------------------------------------------------------------------------
// Rendering — Unit navigator
// ---------------------------------------------------------------------------

function renderUnitNav() {
  const nav = document.getElementById("unitNav");
  const titleEl = `<div class="unit-nav-title">Your Journey</div>`;
  const items = CURRICULUM.units.map(u => {
    const p = unitProgress(u);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const active = u.id === state.activeUnitId ? "active" : "";
    return `
      <div class="unit-nav-item ${active}" data-unit="${u.id}">
        <div class="unit-nav-icon" style="background:${u.color}22;color:${u.color}">${u.icon}</div>
        <div class="unit-nav-text">
          <div class="unit-nav-title-line">${u.title}</div>
          <div class="unit-nav-progress-line">${p.done}/${p.total} lessons · ${pct}%</div>
          <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%;background:${u.color}"></div></div>
        </div>
      </div>`;
  }).join("");
  nav.innerHTML = titleEl + items;

  nav.querySelectorAll(".unit-nav-item").forEach(el => {
    el.addEventListener("click", () => {
      state.activeUnitId = el.dataset.unit;
      renderUnitNav();
      renderContent();
    });
  });
}

// ---------------------------------------------------------------------------
// Rendering — Center (unit banner + lesson path)
// ---------------------------------------------------------------------------

function renderContent() {
  const unit = CURRICULUM.units.find(u => u.id === state.activeUnitId) || CURRICULUM.units[0];
  state.activeUnitId = unit.id;

  renderUnitBanner(unit);
  renderLessonChart(unit);
}

function renderUnitBanner(unit) {
  const el = document.getElementById("unitBanner");
  const p = unitProgress(unit);
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  el.style.setProperty("--unit-accent", unit.color);
  el.innerHTML = `
    <div class="banner-left">
      <div class="banner-icon">${unit.icon}</div>
      <div>
        <h2>${escapeHtml(unit.title)}</h2>
        <div class="banner-sub">${escapeHtml(unit.subtitle || "")}</div>
      </div>
    </div>
    <div class="banner-progress">
      <div class="big">${pct}%</div>
      <div>${p.done}/${p.total} lessons · $${p.earned.toLocaleString()} earned</div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   Line-chart lesson path
   -------------------------------------------------------------------------- */

function renderLessonChart(unit) {
  const container = document.getElementById("pathContainer");

  // Flatten sections into a single ordered lesson stream, keeping section info.
  const stream = [];
  unit.sections.forEach((section, sIdx) => {
    section.lessons.forEach((lesson) => {
      stream.push({ lesson, section, sIdx });
    });
  });

  const N = stream.length;
  const totalReward = stream.reduce((s, x) => s + x.lesson.reward, 0);

  // Cumulative reward at each lesson index (1-based inclusive).
  let cum = 0;
  const points = stream.map((s, i) => {
    cum += s.lesson.reward;
    return { ...s, index: i, cum };
  });

  // Chart geometry
  const padL = 66;
  const padR = 40;
  const padT = 56;
  const padB = 92;
  const containerW = (container.parentElement || container).clientWidth || 700;
  const desiredSpacing = 130;
  const naturalW = padL + padR + Math.max(1, N - 1) * desiredSpacing;
  const width = Math.max(containerW - 48, naturalW, 620);
  const height = 460;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  function xAt(i) {
    if (N <= 1) return padL + chartW / 2;
    return padL + (chartW * i) / (N - 1);
  }
  function yAt(v) {
    if (totalReward <= 0) return padT + chartH;
    return padT + chartH - (v / totalReward) * chartH;
  }

  // Y ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  // Section divider Xs (before each section except the first)
  const sectionMarkers = [];
  {
    let acc = 0;
    unit.sections.forEach((section, sIdx) => {
      const startIdx = acc;
      acc += section.lessons.length;
      const endIdx = acc - 1;
      if (section.lessons.length === 0) return;
      const midX = (xAt(startIdx) + xAt(endIdx)) / 2;
      sectionMarkers.push({
        sIdx,
        title: section.title,
        startX: xAt(startIdx),
        endX: xAt(endIdx),
        midX,
        dividerX: sIdx === 0 ? null : xAt(startIdx) - desiredSpacing / 2,
      });
    });
  }

  // Line path (starts at bottom-left origin -> each cumulative point)
  const originX = xAt(0) - Math.min(60, chartW * 0.08);
  const originY = padT + chartH;
  const pathCommands = [`M ${originX} ${originY}`];
  points.forEach((p) => {
    pathCommands.push(`L ${xAt(p.index)} ${yAt(p.cum)}`);
  });
  const linePath = pathCommands.join(" ");
  const areaPath =
    linePath +
    ` L ${xAt(N - 1)} ${originY}` +
    ` L ${originX} ${originY} Z`;

  // Also compute how much of the line is "completed"
  const doneCount = points.filter((p) => isLessonCompleted(p.lesson.id)).length;
  // Path up to and including the last completed lesson
  let doneLinePath = "";
  if (doneCount > 0) {
    const cmds = [`M ${originX} ${originY}`];
    for (let i = 0; i < doneCount; i++) {
      cmds.push(`L ${xAt(points[i].index)} ${yAt(points[i].cum)}`);
    }
    doneLinePath = cmds.join(" ");
  }

  // Build SVG
  const yTicksSvg = yTicks
    .map((t) => {
      const val = t * totalReward;
      const y = yAt(val);
      return `
        <line class="grid-line" x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}"/>
        <text class="axis-label" x="${padL - 10}" y="${y + 4}" text-anchor="end">$${nice(val)}</text>
      `;
    })
    .join("");

  const sectionsSvg = sectionMarkers
    .map((m) => {
      const parts = [];
      if (m.dividerX != null) {
        parts.push(`<line class="section-divider" x1="${m.dividerX}" y1="${padT - 10}" x2="${m.dividerX}" y2="${padT + chartH}"/>`);
      }
      if (m.title) {
        parts.push(`<text class="section-label" x="${m.midX}" y="${padT - 22}" text-anchor="middle">${escapeHtml(m.title)}</text>`);
      }
      return parts.join("");
    })
    .join("");

  const svg = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#22c55e" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#facc15"/>
        </linearGradient>
        <linearGradient id="doneLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#4ade80"/>
        </linearGradient>
      </defs>

      ${yTicksSvg}
      ${sectionsSvg}

      <!-- projected (dim) area + line -->
      <path d="${areaPath}" fill="url(#areaGrad)" opacity="0.35"/>
      <path d="${linePath}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- earned solid line (up to last completed) -->
      ${
        doneLinePath
          ? `<path d="${doneLinePath}" fill="none" stroke="url(#doneLineGrad)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" style="filter: drop-shadow(0 0 12px rgba(34,197,94,0.5))"/>`
          : ""
      }
    </svg>
  `;

  // Overlay: nodes + labels
  const nodesHtml = points
    .map((p) => {
      const done = isLessonCompleted(p.lesson.id);
      const unlocked = isLessonUnlocked(p.lesson.id);
      const current = !done && unlocked && isCurrent(p.lesson.id);
      let cls = "locked";
      if (done) cls = "done";
      else if (current) cls = "current";
      else if (unlocked) cls = "unlocked";

      const x = xAt(p.index);
      const y = yAt(p.cum);
      const labelY = padT + chartH + 24;
      const cumChip = `<div class="chart-cum ${done ? "done" : ""}" style="left:${x}px;top:${y - 22}px">$${nice(p.cum)}</div>`;
      const startBubble = current ? `<div class="start-bubble">START</div>` : "";

      const icon = done ? "" : unlocked ? escapeHtml(p.lesson.icon || "•") : "🔒";
      return `
        ${cumChip}
        <button class="chart-node ${cls}" data-lesson="${p.lesson.id}" style="left:${x}px;top:${y}px;--unit-accent:${p.section && p.section.title ? getUnitAccent() : getUnitAccent()}">
          ${startBubble}
          <div class="chart-dot"><span>${icon}</span></div>
        </button>
        <div class="chart-label ${cls}" style="left:${x}px;top:${labelY}px">
          <div class="l-title">${escapeHtml(p.lesson.title)}</div>
          <div class="l-reward">+$${p.lesson.reward.toLocaleString()}</div>
        </div>
      `;
    })
    .join("");

  const p = unitProgress(unit);
  const completeCard =
    p.done === p.total && p.total > 0
      ? `
        <div class="unit-complete-card">
          <h3>🏆 Unit Mastered</h3>
          <p>You conquered ${escapeHtml(unit.title)}. On to the next climb.</p>
        </div>`
      : "";

  container.innerHTML = `
    <div class="chart-wrap">
      <div class="chart-inner" style="width:${width}px;height:${height}px">
        ${svg}
        <div class="chart-nodes">${nodesHtml}</div>
      </div>
    </div>
    ${completeCard}
  `;

  // Set unit accent color on nodes root
  container.style.setProperty("--unit-accent", unit.color);

  container.querySelectorAll(".chart-node").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.lesson;
      if (!isLessonUnlocked(id)) {
        toast("Complete previous lessons to unlock 🔒");
        return;
      }
      openLesson(id);
    });
  });

  // Auto-scroll horizontally to the current lesson so it's visible on big units.
  const wrap = container.querySelector(".chart-wrap");
  const currentBtn = container.querySelector(".chart-node.current, .chart-node.done + .chart-node.unlocked, .chart-node.unlocked");
  if (wrap && currentBtn) {
    const btnLeft = parseFloat(currentBtn.style.left) || 0;
    const target = Math.max(0, btnLeft - wrap.clientWidth / 2 + 24);
    wrap.scrollLeft = target;
  }
}

function getUnitAccent() {
  const u = CURRICULUM.units.find((u) => u.id === state.activeUnitId);
  return u ? u.color : "#22c55e";
}

function isCurrent(lessonId) {
  const all = flatLessonList();
  for (const l of all) {
    if (!state.completedLessons[l.id]) {
      return l.id === lessonId;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Rendering — Climb-to-$1M strip
// ---------------------------------------------------------------------------

/** Non-linear mapping so early milestones ($1k, $10k) are visible on the bar
 *  without being crushed against the left edge by later huge rewards. */
function climbRatio(v) {
  const goal = CURRICULUM.goal;
  if (v <= 0) return 0;
  return Math.min(1, Math.sqrt(v / goal));
}

function renderClimbStatic() {
  // Milestone dots — rendered once on boot (no data dependency)
  const milestones = document.getElementById("climbMilestones");
  milestones.innerHTML = CURRICULUM.milestones.map((m) => {
    const leftPct = (climbRatio(m.value) * 100).toFixed(2);
    return `
      <div class="climb-ms" data-value="${m.value}" style="left:${leftPct}%">
        <div class="ms-dot"></div>
        <div class="ms-caption"><span class="ms-emoji">${m.emoji}</span>$${nice(m.value)}</div>
      </div>
    `;
  }).join("");
}

function updateClimb(networth) {
  const goal = CURRICULUM.goal;
  const pct = (climbRatio(networth) * 100);
  const climbFill = document.getElementById("climbFill");
  const climbClimber = document.getElementById("climbClimber");
  climbFill.style.width = pct.toFixed(2) + "%";
  climbClimber.style.left = pct.toFixed(2) + "%";

  // Text
  document.getElementById("climbCurrent").textContent = Math.round(networth).toLocaleString();
  const realPct = Math.min(100, (networth / goal) * 100);
  document.getElementById("climbPct").textContent = realPct < 10
    ? realPct.toFixed(1)
    : Math.round(realPct).toString();

  // Milestone hit states
  document.querySelectorAll(".climb-ms").forEach((el) => {
    const v = parseFloat(el.dataset.value);
    el.classList.toggle("hit", networth >= v);
  });

  // Lesson counters
  const totalLessons = flatLessonList().length;
  const done = Object.keys(state.completedLessons).length;
  document.getElementById("lessonsDone").textContent = done;
  document.getElementById("lessonsTotal").textContent = totalLessons;
}

function nice(v) {
  if (v >= 1_000_000) return (v / 1_000_000) + "M";
  if (v >= 1000) return (v / 1000) + "k";
  return v.toString();
}

// ---------------------------------------------------------------------------
// Lesson runner
// ---------------------------------------------------------------------------

function openLesson(lessonId) {
  const found = findLessonById(lessonId);
  if (!found) return;
  state.activeLessonId = lessonId;
  state.activeQuestionIdx = 0;
  state.activeCorrectCount = 0;
  state.activeTotalAsked = 0;
  state.activeSelectedIdx = null;
  state.activeAnswered = false;
  state.activeStartNetworth = state.networth;
  state.activeReward = found.lesson.reward;

  const overlay = document.getElementById("lessonOverlay");
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  renderQuestion();
}

function closeLesson(force = false) {
  if (!force && state.activeQuestionIdx > 0 && !isLessonCompleted(state.activeLessonId)) {
    if (!confirm("Leave this lesson? Your progress in this lesson will be lost.")) return;
  }
  const overlay = document.getElementById("lessonOverlay");
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  document.getElementById("lessonFooter").className = "lesson-footer";
}

function renderQuestion() {
  const found = findLessonById(state.activeLessonId);
  const lesson = found.lesson;
  const body = document.getElementById("lessonBody");
  const footer = document.getElementById("lessonFooter");
  const checkBtn = document.getElementById("checkBtn");
  const feedback = document.getElementById("feedback");
  const progressFill = document.getElementById("lessonProgressFill");

  const questions = lesson.questions;
  const total = Math.max(questions.length, 1);
  state.activeSelectedIdx = null;
  state.activeAnswered = false;
  feedback.className = "feedback";
  feedback.innerHTML = "";
  footer.className = "lesson-footer";
  checkBtn.disabled = true;
  checkBtn.textContent = "CHECK";
  checkBtn.classList.remove("wrong-mode");

  progressFill.style.width = ((state.activeQuestionIdx) / total * 100) + "%";

  // Placeholder empty-question lesson — treat as auto-complete summary
  if (!questions || questions.length === 0) {
    body.innerHTML = `
      <div class="lesson-complete">
        <div class="lc-badge">${lesson.icon}</div>
        <h2 class="lc-title">${escapeHtml(lesson.title)}</h2>
        <p class="lc-sub" style="max-width:420px">This lesson is coming soon. Tap continue to claim your reward and keep climbing the chart. 🧗</p>
      </div>
    `;
    checkBtn.textContent = "CLAIM +$" + lesson.reward.toLocaleString();
    checkBtn.disabled = false;
    feedback.innerHTML = "";
    checkBtn.onclick = () => {
      finalizeLesson(true);
    };
    return;
  }

  // We're past all questions -> show summary screen
  if (state.activeQuestionIdx >= questions.length) {
    showLessonComplete();
    return;
  }

  const q = questions[state.activeQuestionIdx];
  if (q.type === "mc" || q.type === "tf") {
    renderMCQuestion(q);
  } else if (q.type === "fill") {
    renderFillQuestion(q);
  } else if (q.type === "match") {
    renderMatchQuestion(q);
  } else {
    body.innerHTML = `<div class="q-title">Unsupported question type: ${q.type}</div>`;
  }
}

function renderMCQuestion(q) {
  const body = document.getElementById("lessonBody");
  const checkBtn = document.getElementById("checkBtn");
  const options = q.type === "tf"
    ? ["True", "False"]
    : q.options;

  body.innerHTML = `
    <h2 class="q-title">${escapeHtml(q.prompt)}</h2>
    <div class="q-options ${q.type === "tf" ? "tf" : ""}">
      ${options.map((opt, i) => `
        <button class="q-option" data-idx="${i}">
          <span class="kbd">${i + 1}</span>
          ${escapeHtml(String(opt))}
        </button>
      `).join("")}
    </div>
  `;

  body.querySelectorAll(".q-option").forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.activeAnswered) return;
      body.querySelectorAll(".q-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.activeSelectedIdx = parseInt(btn.dataset.idx, 10);
      checkBtn.disabled = false;
    });
  });

  checkBtn.onclick = () => handleMCCheck(q);
}

function handleMCCheck(q) {
  const checkBtn = document.getElementById("checkBtn");
  const footer = document.getElementById("lessonFooter");
  const feedback = document.getElementById("feedback");
  const body = document.getElementById("lessonBody");

  // If already answered, treat click as CONTINUE
  if (state.activeAnswered) {
    state.activeQuestionIdx++;
    renderQuestion();
    return;
  }

  state.activeTotalAsked++;
  state.activeAnswered = true;

  const correctIdx = q.type === "tf" ? (q.correct ? 0 : 1) : q.correct;
  const isCorrect = state.activeSelectedIdx === correctIdx;

  body.querySelectorAll(".q-option").forEach((btn, i) => {
    btn.classList.remove("selected");
    if (i === correctIdx) btn.classList.add("correct");
    if (i === state.activeSelectedIdx && !isCorrect) btn.classList.add("wrong");
    btn.disabled = true;
  });

  if (isCorrect) {
    state.activeCorrectCount++;
    feedback.className = "feedback correct";
    feedback.innerHTML = `
      <span class="fb-title">✅ Nice work!</span>
      <span class="fb-body">${escapeHtml(q.explanation || "Correct.")}</span>
    `;
    footer.className = "lesson-footer correct-mode";
    checkBtn.classList.remove("wrong-mode");
    checkBtn.textContent = "CONTINUE";
  } else {
    feedback.className = "feedback wrong";
    feedback.innerHTML = `
      <span class="fb-title">❌ Not quite</span>
      <span class="fb-body">${escapeHtml(q.explanation || "Give it another go.")}</span>
    `;
    footer.className = "lesson-footer wrong-mode";
    checkBtn.classList.add("wrong-mode");
    checkBtn.textContent = "CONTINUE";
  }
}

function showLessonComplete() {
  const found = findLessonById(state.activeLessonId);
  const lesson = found.lesson;
  const body = document.getElementById("lessonBody");
  const footer = document.getElementById("lessonFooter");
  const checkBtn = document.getElementById("checkBtn");
  const feedback = document.getElementById("feedback");
  const progressFill = document.getElementById("lessonProgressFill");
  progressFill.style.width = "100%";

  const accuracy = state.activeTotalAsked === 0
    ? 100
    : Math.round(state.activeCorrectCount / state.activeTotalAsked * 100);

  body.innerHTML = `
    <div class="lesson-complete">
      <div class="lc-badge">🎉</div>
      <h2 class="lc-title">Lesson Complete!</h2>
      <p class="lc-sub">${escapeHtml(lesson.title)} · ${escapeHtml(found.unit.title)}</p>
      <div class="lc-cards">
        <div class="lc-card reward">
          <div class="lc-label">Net Worth</div>
          <div class="lc-value">+$${lesson.reward.toLocaleString()}</div>
        </div>
        <div class="lc-card accuracy">
          <div class="lc-label">Accuracy</div>
          <div class="lc-value">${accuracy}%</div>
        </div>
      </div>
    </div>
  `;
  feedback.innerHTML = "";
  feedback.className = "feedback";
  footer.className = "lesson-footer correct-mode";
  checkBtn.classList.remove("wrong-mode");
  checkBtn.textContent = "CLAIM +$" + lesson.reward.toLocaleString();
  checkBtn.disabled = false;
  checkBtn.onclick = () => finalizeLesson(true);
}

function finalizeLesson(success) {
  const found = findLessonById(state.activeLessonId);
  const lesson = found.lesson;

  const alreadyDone = isLessonCompleted(lesson.id);

  if (success && !alreadyDone) {
    state.completedLessons[lesson.id] = {
      completed: true,
      reward: lesson.reward,
      ts: Date.now(),
    };
    const before = state.networth;
    state.networth += lesson.reward;
    animateNetworth(before, state.networth);
    saveProgress();

    // Check milestones for confetti
    for (const m of CURRICULUM.milestones) {
      if (before < m.value && state.networth >= m.value) {
        confettiBurst();
        toast(`${m.emoji} Milestone unlocked: ${m.label} · $${m.value.toLocaleString()}`);
      }
    }
  } else if (success && alreadyDone) {
    // Re-doing a completed lesson — no double reward
    toast("You've already earned this lesson's reward.");
  }

  // Close modal, re-render tree
  closeLesson(true);
  renderUnitNav();
  renderContent();
  updateClimb(state.networth);
}

// ---------------------------------------------------------------------------
// Networth animation + confetti + toast
// ---------------------------------------------------------------------------

let networthTween = null;
function animateNetworth(from, to) {
  const start = performance.now();
  const duration = 900;
  cancelAnimationFrame(networthTween);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = from + (to - from) * eased;
    updateClimb(v);
    if (t < 1) networthTween = requestAnimationFrame(step);
    else updateClimb(to);
  }
  networthTween = requestAnimationFrame(step);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function confettiBurst() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ["#58cc02", "#1cb0f6", "#ff9600", "#ce82ff", "#ffc800", "#ff4b4b"];
  const N = 140;
  const parts = [];
  for (let i = 0; i < N; i++) {
    parts.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 60,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 1) * 12 - 4,
      g: 0.4 + Math.random() * 0.2,
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      life: 0,
    });
  }
  let running = true;
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      if (p.y < canvas.height + 20 && p.life < 200) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    }
    if (alive && running) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  frame();
  setTimeout(() => (running = false), 2500);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Lighten/darken a hex color by percent (-100 .. 100). */
function shade(hex, percent) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map(x => x + x).join("") : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const p = percent / 100;
  r = Math.max(0, Math.min(255, Math.round(r + (p < 0 ? r : 255 - r) * p)));
  g = Math.max(0, Math.min(255, Math.round(g + (p < 0 ? g : 255 - g) * p)));
  b = Math.max(0, Math.min(255, Math.round(b + (p < 0 ? b : 255 - b) * p)));
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

function resetProgress() {
  if (!confirm("Reset all progress? Your net worth will drop to $0.")) return;
  state.networth = 0;
  state.completedLessons = {};
  saveProgress();
  renderUnitNav();
  renderContent();
  updateClimb(state.networth);
  toast("Progress reset. Fresh start! 🌱");
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot() {
  loadProgress();

  // Optional URL flags: ?lesson=basics-1 auto-opens a lesson.
  //                     ?networth=250000 forces a demo net worth.
  const url = new URL(window.location.href);
  const forcedNW = parseInt(url.searchParams.get("networth"), 10);
  if (!isNaN(forcedNW)) state.networth = forcedNW;
  const forcedUnit = url.searchParams.get("unit");
  if (forcedUnit && CURRICULUM.units.some(u => u.id === forcedUnit)) {
    state.activeUnitId = forcedUnit;
  }
  // ?demo=N marks the first N lessons of the curriculum complete (visual demo only).
  const demoN = parseInt(url.searchParams.get("demo"), 10);
  if (!isNaN(demoN) && demoN > 0) {
    const all = flatLessonList();
    let acc = 0;
    for (let i = 0; i < Math.min(demoN, all.length); i++) {
      state.completedLessons[all[i].id] = { completed: true, reward: all[i].reward, ts: Date.now() };
      acc += all[i].reward;
    }
    state.networth = acc;
  }

  // Default active unit = first with incomplete lessons, else first
  if (!state.activeUnitId) {
    const firstIncomplete = CURRICULUM.units.find(u => {
      const p = unitProgress(u);
      return p.done < p.total;
    });
    state.activeUnitId = (firstIncomplete || CURRICULUM.units[0]).id;
  }

  renderClimbStatic();
  renderUnitNav();
  renderContent();
  updateClimb(state.networth);

  document.getElementById("brandHome").addEventListener("click", () => {
    state.activeUnitId = CURRICULUM.units[0].id;
    renderUnitNav();
    renderContent();
    // scroll to top
    document.getElementById("content").scrollTo({ top: 0, behavior: "smooth" });
  });
  document.getElementById("closeLesson").addEventListener("click", () => closeLesson());
  document.getElementById("resetBtn").addEventListener("click", resetProgress);

  const forcedLesson = url.searchParams.get("lesson");
  if (forcedLesson && findLessonById(forcedLesson)) {
    // ensure it's unlocked for demo purposes
    setTimeout(() => openLesson(forcedLesson), 200);
  }

  // Number-key shortcuts inside a lesson
  document.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("lessonOverlay");
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Escape") { closeLesson(); return; }
    if (e.key === "Enter") {
      const btn = document.getElementById("checkBtn");
      if (!btn.disabled) btn.click();
      return;
    }
    if (/^[1-6]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      const opt = document.querySelectorAll(".q-option")[idx];
      if (opt && !state.activeAnswered) opt.click();
    }
  });
}

document.addEventListener("DOMContentLoaded", boot);
