/**
 * Feedback storage + export.
 *
 * Each entry lives in localStorage under a separate key from main progress
 * so resetting progress doesn't nuke feedback.
 *
 * An entry looks like:
 *   {
 *     id: "fb_1716690000000",
 *     ts: "2026-05-25T18:00:00.000Z",
 *     route: "/module/m1",
 *     rating: 4,                    // 0 = not rated
 *     name:   "Optional",
 *     email:  "optional@x.com",
 *     text:   "Loved the neuron simulator. Coach hint was confusing at first.",
 *     context: {
 *       version: "1.0.0",
 *       viewport: "1440x900",
 *       ua: "...",
 *       xp: 120,                    // snapshot of progress XP at submit time
 *       completedModules: 2
 *     }
 *   }
 */

import { SITE } from "../data/site-config.js";
import { getState } from "./progress.js";

const KEY = "dojo_dl_feedback_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); }
  catch (err) { console.warn("Could not save feedback:", err); }
}

export function listFeedback() { return load(); }

export function saveFeedback({ rating = 0, name = "", email = "", text = "" }) {
  const route = (location.hash || "#/dashboard").replace(/^#/, "");
  const s = getState();
  const entry = {
    id: "fb_" + Date.now(),
    ts: new Date().toISOString(),
    route,
    rating: Number(rating) || 0,
    name: String(name).slice(0, 80),
    email: String(email).slice(0, 120),
    text: String(text).slice(0, 4000),
    context: {
      version: SITE.version,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ua: navigator.userAgent.slice(0, 200),
      xp: s.xp,
      completedModules: Object.keys(s.completed).length
    }
  };
  const list = load();
  list.push(entry);
  save(list);
  return entry;
}

export function clearFeedback() { save([]); }

export function deleteFeedback(id) {
  save(load().filter(f => f.id !== id));
}

/** Format one feedback entry as Markdown (good for email/Slack/issues). */
export function formatEntryMarkdown(entry) {
  const stars = entry.rating ? "★".repeat(entry.rating) + "☆".repeat(5 - entry.rating) : "(no rating)";
  return [
    `### Feedback — ${SITE.appName} v${entry.context.version}`,
    "",
    `- **When:** ${entry.ts}`,
    `- **Route:** \`${entry.route}\``,
    `- **Rating:** ${stars}`,
    `- **From:** ${entry.name || "(anonymous)"}${entry.email ? ` <${entry.email}>` : ""}`,
    `- **Viewport:** ${entry.context.viewport}`,
    `- **Progress:** ${entry.context.xp} XP, ${entry.context.completedModules} modules complete`,
    "",
    "> " + (entry.text || "(no text)").split("\n").join("\n> "),
    "",
    `_UA: ${entry.context.ua}_`
  ].join("\n");
}

/** Build a mailto: URL that pre-fills subject and body. */
export function mailtoLinkFor(entry) {
  const subject = `Dojo feedback (${entry.route}) — ${entry.rating ? entry.rating + "/5" : "no rating"}`;
  const body = formatEntryMarkdown(entry);
  return `mailto:${SITE.feedbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Build a GitHub issue URL (if repoUrl is configured). */
export function issueLinkFor(entry) {
  if (!SITE.repoUrl) return null;
  const base = SITE.repoUrl.replace(/\/+$/, "");
  const title = encodeURIComponent(`Feedback: ${entry.route} — ${entry.rating ? entry.rating + "/5" : "comment"}`);
  const body = encodeURIComponent(formatEntryMarkdown(entry));
  return `${base}/issues/new?title=${title}&body=${body}`;
}

/** Download all feedback as a JSON file the reviewer can email back. */
export function downloadAllAsJson() {
  const blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dojo-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}
