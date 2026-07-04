/* ============================================================================
   Denaro — App logic
   ============================================================================ */

const STORAGE_KEY = "denaro.progress.v1";

// ---------------------------------------------------------------------------
// Icon set — minimal line SVGs (Lucide-style) keyed by unit id
// ---------------------------------------------------------------------------

const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

const UNIT_ICONS = {
  basics:     `<svg ${ICON_ATTRS}><path d="M15 14c.2-1 .7-1.7 1.5-2.5A6 6 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  budgeting:  `<svg ${ICON_ATTRS}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  banking:    `<svg ${ICON_ATTRS}><path d="M3 22h18"/><path d="M6 18V11"/><path d="M10 18V11"/><path d="M14 18V11"/><path d="M18 18V11"/><path d="M12 3 3 8v3h18V8z"/></svg>`,
  credit:     `<svg ${ICON_ATTRS}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h2"/></svg>`,
  investing:  `<svg ${ICON_ATTRS}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>`,
  retirement: `<svg ${ICON_ATTRS}><path d="M12 3v18"/><path d="M5 8c0-3 3-5 7-5s7 2 7 5"/><path d="M8 21h8"/><path d="M6 14c1.5 1.5 4 1.5 6 0"/><path d="M12 14c1.5 1.5 4 1.5 6 0"/></svg>`,
  taxes:      `<svg ${ICON_ATTRS}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`,
  insurance:  `<svg ${ICON_ATTRS}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  realestate: `<svg ${ICON_ATTRS}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
  advanced:   `<svg ${ICON_ATTRS}><path d="m2 20 20 0"/><path d="m2 20 3-12 5 6 4-8 4 8 5-6 3 12"/></svg>`,
};

function unitIconSvg(unitId) {
  return UNIT_ICONS[unitId] ||
    `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="8"/></svg>`;
}

const LOCK_SVG =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
const CHECK_SVG =
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>`;

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
  const titleEl = `<div class="unit-nav-title">Curriculum</div>`;
  const items = CURRICULUM.units.map(u => {
    const p = unitProgress(u);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    const active = u.id === state.activeUnitId ? "active" : "";
    return `
      <div class="unit-nav-item ${active}" data-unit="${u.id}">
        <div class="unit-nav-icon">${unitIconSvg(u.id)}</div>
        <div class="unit-nav-text">
          <div class="unit-nav-title-line">${escapeHtml(u.title)}</div>
          <div class="unit-nav-progress-line">${p.done} of ${p.total} · ${pct}%</div>
          <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
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
  el.innerHTML = `
    <div class="banner-left">
      <div class="banner-icon">${unitIconSvg(unit.id)}</div>
      <div>
        <h2>${escapeHtml(unit.title)}</h2>
        <div class="banner-sub">${escapeHtml(unit.subtitle || "")}</div>
      </div>
    </div>
    <div class="banner-progress">
      <div class="metric">
        <span class="metric-label">Progress</span>
        <span class="metric-value">${pct}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Lessons</span>
        <span class="metric-value">${p.done} / ${p.total}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Earned</span>
        <span class="metric-value">$${p.earned.toLocaleString()}</span>
      </div>
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
          <stop offset="0%"  stop-color="#4ade80" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#4ade80" stop-opacity="0"/>
        </linearGradient>
      </defs>

      ${yTicksSvg}
      ${sectionsSvg}

      <!-- projected (dim) line -->
      <path d="${linePath}" fill="none" stroke="#4ade80" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="4 6" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- earned solid area + line -->
      ${
        doneLinePath
          ? `<path d="${doneLinePath} L ${xAt(Math.max(0, doneCount - 1))} ${originY} L ${originX} ${originY} Z" fill="url(#areaGrad)"/>
             <path d="${doneLinePath}" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
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
      const cumCls = done ? "done" : current ? "current" : "";
      const cumChip = `<div class="chart-cum ${cumCls}" style="left:${x}px;top:${y - 14}px">$${nice(p.cum)}</div>`;

      return `
        ${cumChip}
        <button class="chart-node ${cls}" data-lesson="${p.lesson.id}" style="left:${x}px;top:${y}px" aria-label="${escapeHtml(p.lesson.title)}">
          <div class="chart-dot"></div>
        </button>
        <div class="chart-label ${cls}" style="left:${x}px;top:${labelY}px">
          <div class="l-title">${escapeHtml(p.lesson.title)}</div>
          <div class="l-reward">$${p.lesson.reward.toLocaleString()}</div>
        </div>
      `;
    })
    .join("");

  const p = unitProgress(unit);
  const completeCard =
    p.done === p.total && p.total > 0
      ? `
        <div class="unit-complete-card">
          <h3>Unit complete</h3>
          <p>You finished ${escapeHtml(unit.title)}.</p>
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

  container.querySelectorAll(".chart-node").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.lesson;
      if (!isLessonUnlocked(id)) {
        toast("Complete previous lessons to unlock.");
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
        <div class="ms-caption">$${nice(m.value)}</div>
      </div>
    `;
  }).join("");
}

function updateClimb(networth) {
  const goal = CURRICULUM.goal;
  const pct = (climbRatio(networth) * 100);
  const climbFill = document.getElementById("climbFill");
  const climbMarker = document.getElementById("climbMarker");
  climbFill.style.width = pct.toFixed(2) + "%";
  climbMarker.style.left = pct.toFixed(2) + "%";

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
  checkBtn.textContent = "Check";
  checkBtn.classList.remove("danger");

  progressFill.style.width = ((state.activeQuestionIdx) / total * 100) + "%";

  // Placeholder empty-question lesson — treat as auto-complete summary
  if (!questions || questions.length === 0) {
    body.innerHTML = `
      <div class="lesson-complete">
        <div class="lc-check">${CHECK_SVG}</div>
        <h2 class="lc-title">${escapeHtml(lesson.title)}</h2>
        <p class="lc-sub" style="max-width:440px">Content for this lesson is in progress. Claim the reward to continue your journey.</p>
      </div>
    `;
    checkBtn.textContent = "Claim $" + lesson.reward.toLocaleString();
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
      <span class="fb-title">Correct</span>
      <span class="fb-body">${escapeHtml(q.explanation || "")}</span>
    `;
    checkBtn.classList.remove("danger");
    checkBtn.textContent = "Continue";
  } else {
    feedback.className = "feedback wrong";
    feedback.innerHTML = `
      <span class="fb-title">Incorrect</span>
      <span class="fb-body">${escapeHtml(q.explanation || "")}</span>
    `;
    checkBtn.classList.add("danger");
    checkBtn.textContent = "Continue";
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
      <div class="lc-check">${CHECK_SVG}</div>
      <h2 class="lc-title">Lesson complete</h2>
      <p class="lc-sub">${escapeHtml(found.unit.title)} — ${escapeHtml(lesson.title)}</p>
      <div class="lc-cards">
        <div class="lc-card reward">
          <div class="lc-label">Net worth gain</div>
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
  footer.className = "lesson-footer";
  checkBtn.classList.remove("danger");
  checkBtn.textContent = "Claim $" + lesson.reward.toLocaleString();
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

    // Milestone crossings — quiet toast
    for (const m of CURRICULUM.milestones) {
      if (before < m.value && state.networth >= m.value) {
        toast(`Milestone reached: $${m.value.toLocaleString()}`);
      }
    }
  } else if (success && alreadyDone) {
    toast("Lesson already claimed.");
  }

  // Close modal, re-render tree
  closeLesson(true);
  renderUnitNav();
  renderContent();
  updateClimb(state.networth);
}

// ---------------------------------------------------------------------------
// Networth animation + toast
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
  toast._t = setTimeout(() => el.classList.add("hidden"), 2400);
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
  toast("Progress reset.");
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
