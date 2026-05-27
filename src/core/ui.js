/**
 * Tiny DOM helpers. No framework. Just enough sugar to keep modules readable.
 */

export function el(tag, attrs = {}, children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "style" && typeof v === "object") {
      Object.assign(node.style, v);
    } else {
      node.setAttribute(k, v);
    }
  }
  if (children != null) appendChildren(node, children);
  return node;
}

export function appendChildren(parent, children) {
  if (children == null) return parent;
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c == null || c === false) continue;
    if (typeof c === "string" || typeof c === "number") {
      parent.appendChild(document.createTextNode(String(c)));
    } else {
      parent.appendChild(c);
    }
  }
  return parent;
}

export function mount(parent, ...children) {
  parent.replaceChildren();
  appendChildren(parent, children.flat());
  return parent;
}

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function fmt(v, digits = 2) {
  if (typeof v !== "number" || !isFinite(v)) return String(v);
  return v.toFixed(digits);
}

/**
 * On-screen formatter for the readout area. Returns a span with class hi.
 */
export function hi(text, kind = "hi") { return el("span", { class: kind, text: String(text) }); }

/**
 * picture(webpSrc, pngSrc, alt, attrs)
 * Builds a <picture><source webp><img png fallback></picture> tree.
 * Use anywhere we want WebP with a graceful PNG fallback.
 */
export function picture(webpSrc, pngSrc, alt = "", attrs = {}) {
  const pic = document.createElement("picture");
  const src = document.createElement("source");
  src.setAttribute("srcset", webpSrc);
  src.setAttribute("type", "image/webp");
  pic.appendChild(src);
  const img = document.createElement("img");
  img.setAttribute("src", pngSrc);
  img.setAttribute("alt", alt);
  img.setAttribute("loading", attrs.loading || "lazy");
  img.setAttribute("decoding", "async");
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "loading") continue;
    if (k === "class") img.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(img.style, v);
    else img.setAttribute(k, v);
  }
  pic.appendChild(img);
  return pic;
}
