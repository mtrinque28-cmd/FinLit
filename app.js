/* ============================================================================
   Wealthy Owl — App logic
   ============================================================================ */

const STORAGE_KEY = "wealthyOwl.progress.v1";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  networth: 0,
  streak: 0,
  hearts: 5,
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
    Object.assign(state, saved);
  } catch (e) {
    console.warn("Failed to load progress:", e);
  }
}
function saveProgress() {
  const { networth, streak, hearts, completedLessons } = state;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ networth, streak, hearts, completedLessons })
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
  renderLessonPath(unit);
}

function renderUnitBanner(unit) {
  const el = document.getElementById("unitBanner");
  const p = unitProgress(unit);
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  el.style.background = unit.color;
  el.innerHTML = `
    <div class="banner-left">
      <div class="banner-icon">${unit.icon}</div>
      <div>
        <h2>Unit · ${unit.title}</h2>
        <div class="banner-sub">${unit.subtitle}</div>
      </div>
    </div>
    <div class="banner-progress">
      <div class="big">${pct}%</div>
      <div>${p.done}/${p.total} lessons · $${p.earned.toLocaleString()} earned</div>
    </div>
  `;
}

function renderLessonPath(unit) {
  const container = document.getElementById("pathContainer");
  const parts = [];

  unit.sections.forEach((section, sIdx) => {
    if (section.title) {
      parts.push(`
        <div class="section-title-row">
          <div class="line"></div>
          <div class="label">${section.title}</div>
          <div class="line"></div>
        </div>
      `);
    }
    parts.push(`<div class="lesson-path">`);
    section.lessons.forEach((lesson, i) => {
      const offset = zigzagOffset(i, section.lessons.length);
      const unlocked = isLessonUnlocked(lesson.id);
      const done = isLessonCompleted(lesson.id);
      let cls = "";
      let styleColor = unit.color;
      let styleColorDk = shade(unit.color, -18);
      if (done) {
        cls = "done";
      } else if (unlocked) {
        // is it the *current* one (first unlocked, uncompleted)?
        if (isCurrent(lesson.id)) cls = "current";
      } else {
        cls = "locked";
        styleColor = "";
        styleColorDk = "";
      }
      const label = escapeHtml(lesson.title);
      const emoji = done ? "✔" : (unlocked ? lesson.icon : "🔒");
      const style = unlocked && !done ? `--node-color:${styleColor};--node-color-dk:${styleColorDk};` : "";
      parts.push(`
        <div class="lesson-row" data-offset="${offset}">
          <div class="lesson-node-wrap ${unlocked ? "" : "is-locked"}" style="position:relative">
            ${isCurrent(lesson.id) && !done ? `<div class="start-bubble">START</div>` : ""}
            <button class="lesson-node ${cls}" data-lesson="${lesson.id}" ${unlocked ? "" : "disabled"} style="${style}">
              ${emoji}
            </button>
            <div class="lesson-label">
              ${label}
              <span class="reward">+$${lesson.reward.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `);
    });
    parts.push(`</div>`);
  });

  const p = unitProgress(unit);
  if (p.done === p.total) {
    parts.push(`
      <div class="unit-complete-card">
        <h3>🏆 Unit Complete!</h3>
        <p>You've mastered ${unit.title}. Onward and upward.</p>
      </div>
    `);
  }

  container.innerHTML = parts.join("");
  container.querySelectorAll(".lesson-node").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.lesson;
      if (!isLessonUnlocked(id)) {
        toast("Complete previous lessons to unlock 🔒");
        return;
      }
      openLesson(id);
    });
  });
}

function zigzagOffset(i, total) {
  const cycle = i % 6;
  return { 0: 0, 1: 1, 2: 2, 3: 1, 4: 0, 5: -1 }[cycle] ?? 0;
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
// Rendering — Mountain / net worth
// ---------------------------------------------------------------------------

function renderMountain() {
  const goal = CURRICULUM.goal;
  // Non-linear (sqrt) mapping so mid-values feel visible without early lessons
  // being overwhelmed by later huge rewards.
  const ratio = Math.min(1, Math.sqrt(state.networth / goal));
  const fillHeight = ratio * 500; // out of 500 SVG units

  const fill = document.getElementById("mountainFill");
  fill.setAttribute("y", 500 - fillHeight);
  fill.setAttribute("height", fillHeight);

  const climber = document.getElementById("climber");
  const climberY = 500 - fillHeight;
  climber.setAttribute("y", Math.min(490, Math.max(30, climberY - 8)));

  // Milestones
  const labels = document.getElementById("milestoneLabels");
  labels.innerHTML = CURRICULUM.milestones.map(m => {
    const r = Math.min(1, Math.sqrt(m.value / goal));
    const topPct = (1 - r) * 100;
    const hit = state.networth >= m.value ? "hit" : "";
    return `<div class="milestone ${hit}" style="top:${topPct}%"><span class="m-emoji">${m.emoji}</span>$${nice(m.value)}</div>`;
  }).join("");

  // Summary
  document.getElementById("networthBig").textContent = state.networth.toLocaleString();
  document.getElementById("networthVal").textContent = state.networth.toLocaleString();
  const bar = document.getElementById("networthBar");
  bar.style.width = (state.networth / goal * 100).toFixed(2) + "%";

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
  const heartsEl = document.getElementById("lessonHearts");
  heartsEl.textContent = state.hearts;

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
  renderMountain();
}

// ---------------------------------------------------------------------------
// Networth animation + confetti + toast
// ---------------------------------------------------------------------------

let networthTween = null;
function animateNetworth(from, to) {
  const start = performance.now();
  const duration = 900;
  const netEl = document.getElementById("networthVal");
  const netBig = document.getElementById("networthBig");
  cancelAnimationFrame(networthTween);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = Math.round(from + (to - from) * eased);
    netEl.textContent = v.toLocaleString();
    netBig.textContent = v.toLocaleString();
    // Also progressive fill
    const goal = CURRICULUM.goal;
    const ratio = Math.min(1, Math.sqrt(v / goal));
    const fillHeight = ratio * 500;
    const fill = document.getElementById("mountainFill");
    fill.setAttribute("y", 500 - fillHeight);
    fill.setAttribute("height", fillHeight);
    const climber = document.getElementById("climber");
    climber.setAttribute("y", Math.min(490, Math.max(30, 500 - fillHeight - 8)));
    const bar = document.getElementById("networthBar");
    bar.style.width = (v / goal * 100).toFixed(2) + "%";
    if (t < 1) networthTween = requestAnimationFrame(step);
    else renderMountain(); // one last consistent render (milestone hit states, etc.)
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
  state.streak = 0;
  state.hearts = 5;
  state.completedLessons = {};
  saveProgress();
  document.getElementById("streakVal").textContent = state.streak;
  document.getElementById("heartsVal").textContent = state.hearts;
  renderUnitNav();
  renderContent();
  renderMountain();
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

  // Default active unit = first with incomplete lessons, else first
  if (!state.activeUnitId) {
    const firstIncomplete = CURRICULUM.units.find(u => {
      const p = unitProgress(u);
      return p.done < p.total;
    });
    state.activeUnitId = (firstIncomplete || CURRICULUM.units[0]).id;
  }

  document.getElementById("streakVal").textContent = state.streak;
  document.getElementById("heartsVal").textContent = state.hearts;

  renderUnitNav();
  renderContent();
  renderMountain();

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
