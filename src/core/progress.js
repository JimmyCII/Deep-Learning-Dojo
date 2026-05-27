/**
 * Progress service.
 *
 * Stores XP, completed modules, knowledge-check results, reflection text,
 * and earned badges in localStorage. Emits 'change' events so the topbar
 * XP pill and the dashboard can re-render without coupling.
 */

const KEY = "dojo_dl_tutor_v1";

const DEFAULT = {
  xp: 0,
  completed: {},   // { moduleId: { at: isoString, xp: 50 } }
  quizzes: {},     // { moduleId: { lastResult: "correct"|"incorrect", attempts: 3 } }
  reflections: {}, // { moduleId: "free text" }
  badges: {},      // { badgeId: { at: isoString } }
  challenges: {},  // { moduleId: { best: number } }
  visited: {}      // { moduleId: isoString }
};

const BELTS = [
  { name: "White Belt",  min: 0,   color: "linear-gradient(135deg,#f4f6fa,#cbd2dc)" },
  { name: "Yellow Belt", min: 50,  color: "linear-gradient(135deg,#fff1ad,#f7c948)" },
  { name: "Green Belt",  min: 150, color: "linear-gradient(135deg,#c9eb95,#9bd14f)" },
  { name: "Blue Belt",   min: 300, color: "linear-gradient(135deg,#9be0ff,#66ddff)" },
  { name: "Brown Belt",  min: 500, color: "linear-gradient(135deg,#d6a878,#8a5a2b)" },
  { name: "Black Belt",  min: 750, color: "linear-gradient(135deg,#3a3a3a,#0a0a0a)" }
];

const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    return Object.assign({}, structuredClone(DEFAULT), parsed);
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
  for (const fn of listeners) fn(state);
}

let _state = load();

export function getState() { return _state; }

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function visitModule(moduleId) {
  _state.visited[moduleId] = new Date().toISOString();
  save(_state);
}

export function completeModule(moduleId, xp = 50) {
  if (_state.completed[moduleId]) return false; // idempotent
  _state.completed[moduleId] = { at: new Date().toISOString(), xp };
  _state.xp += xp;
  save(_state);
  return true;
}

export function isComplete(moduleId) {
  return Boolean(_state.completed[moduleId]);
}

export function awardBadge(badgeId) {
  if (_state.badges[badgeId]) return false;
  _state.badges[badgeId] = { at: new Date().toISOString() };
  save(_state);
  return true;
}

export function recordQuiz(moduleId, result) {
  const prev = _state.quizzes[moduleId] || { attempts: 0 };
  _state.quizzes[moduleId] = {
    lastResult: result,
    attempts: prev.attempts + 1,
    at: new Date().toISOString()
  };
  save(_state);
}

export function saveReflection(moduleId, text) {
  _state.reflections[moduleId] = text;
  save(_state);
}

export function getReflection(moduleId) {
  return _state.reflections[moduleId] || "";
}

export function recordChallenge(moduleId, score) {
  const prev = _state.challenges[moduleId];
  if (!prev || score > prev.best) {
    _state.challenges[moduleId] = { best: score, at: new Date().toISOString() };
    save(_state);
    return true;
  }
  return false;
}

export function getBelt(xp = _state.xp) {
  let current = BELTS[0];
  for (const b of BELTS) if (xp >= b.min) current = b;
  return current;
}

export function nextBelt(xp = _state.xp) {
  return BELTS.find(b => b.min > xp) || null;
}

export function resetAll() {
  _state = structuredClone(DEFAULT);
  save(_state);
}
