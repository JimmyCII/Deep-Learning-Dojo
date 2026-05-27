/**
 * Tiny hash-based router. Routes are functions that return a DOM node.
 * Default route is #/dashboard.
 */

const routes = new Map();
let outletEl = null;
let onNavigateCb = null;

export function registerRoute(path, factory) {
  routes.set(path, factory);
}

export function setOutlet(node) {
  outletEl = node;
}

export function onNavigate(cb) {
  onNavigateCb = cb;
}

export function go(path) {
  if (location.hash !== `#${path}`) {
    location.hash = `#${path}`;
  } else {
    render();
  }
}

function currentPath() {
  const raw = location.hash || "#/dashboard";
  return raw.startsWith("#") ? raw.slice(1) : raw;
}

function render() {
  if (!outletEl) return;
  const path = currentPath();
  // Match exact, then prefix (e.g. /module/1)
  let factory = routes.get(path);
  let params = {};
  if (!factory) {
    for (const [pattern, fn] of routes.entries()) {
      const m = matchPattern(pattern, path);
      if (m) { factory = fn; params = m; break; }
    }
  }
  if (!factory) factory = routes.get("/dashboard");

  outletEl.replaceChildren();
  try {
    const view = factory(params);
    if (view) outletEl.appendChild(view);
  } catch (err) {
    console.error("Router render failed:", err);
    outletEl.appendChild(makeErrorView(err));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  if (onNavigateCb) onNavigateCb(path);
}

function matchPattern(pattern, path) {
  const pParts = pattern.split("/").filter(Boolean);
  const aParts = path.split("/").filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(":")) {
      params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
    } else if (pParts[i] !== aParts[i]) {
      return null;
    }
  }
  return params;
}

function makeErrorView(err) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `<h2 style="color:#ff7a7a">View error</h2><pre style="white-space:pre-wrap">${(err && err.stack) || String(err)}</pre>`;
  return div;
}

export function start() {
  window.addEventListener("hashchange", render);
  render();
}
