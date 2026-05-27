/**
 * Feedback log view — list every entry the reviewer (or you) has left,
 * with per-entry Copy / Email / Issue actions and a bulk JSON export.
 *
 * Useful when a reviewer shares a device/browser with you: they leave
 * entries, you visit #/feedback and bulk export.
 */

import { el } from "../core/ui.js";
import { listFeedback, deleteFeedback, clearFeedback,
         formatEntryMarkdown, mailtoLinkFor, issueLinkFor,
         downloadAllAsJson } from "../core/feedback.js";
import { openFeedbackModal } from "../components/feedbackModal.js";
import { SITE } from "../data/site-config.js";

export function renderFeedback() {
  const entries = listFeedback();

  return el("div", {}, [
    headerCard(entries.length),
    entries.length ? listCard(entries) : emptyCard()
  ]);
}

function headerCard(count) {
  const exportBtn = el("button", { class: "btn btn-soft", type: "button",
    onclick: () => downloadAllAsJson() }, `Export all (${count}) as JSON`);
  const clearBtn = el("button", { class: "btn btn-ghost", type: "button",
    onclick: () => {
      if (confirm("Delete all feedback entries from this browser? This cannot be undone.")) {
        clearFeedback(); location.reload();
      }
    } }, "Clear all");
  const newBtn = el("button", { class: "btn btn-primary", type: "button",
    onclick: () => openFeedbackModal() }, "Leave new feedback");

  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Feedback log" }),
    el("h1", { text: "What people are saying" }),
    el("p", { class: "dim", text: `Every feedback entry left in this browser is stored locally. ${count} entr${count === 1 ? "y" : "ies"} so far. Export the whole batch as JSON to share with Jim, or copy/email entries one at a time.` }),
    el("div", { class: "row" }, [
      newBtn, exportBtn, count ? clearBtn : null
    ].filter(Boolean))
  ]);
}

function emptyCard() {
  return el("section", { class: "card", style: { textAlign: "center", padding: "2.5rem 1rem" } }, [
    el("p", { class: "dim", style: { fontSize: "1.05rem", margin: 0 }, text: "No feedback yet on this browser." }),
    el("p", { class: "muted", style: { marginTop: "0.4rem" }, text: "Click the Feedback button in the topbar from any screen to leave a note." })
  ]);
}

function listCard(entries) {
  // newest first
  const sorted = entries.slice().sort((a, b) => b.ts.localeCompare(a.ts));
  return el("section", { class: "card" }, sorted.map(entryCard));
}

function entryCard(entry) {
  const stars = entry.rating ? "★".repeat(entry.rating) + "☆".repeat(5 - entry.rating) : "(no rating)";
  const issueLink = issueLinkFor(entry);

  const meta = el("div", { class: "fb-meta" }, [
    el("span", { class: "fb-stars-small" + (entry.rating ? " on" : ""), text: stars }),
    el("span", { class: "fb-route", text: entry.route }),
    el("span", { class: "fb-when", text: niceDate(entry.ts) }),
    entry.name ? el("span", { class: "fb-name", text: entry.name }) : null
  ].filter(Boolean));

  const body = el("p", { class: "fb-body", text: entry.text || "(no text)" });

  const ctx = el("p", { class: "fb-ctx",
    text: `v${entry.context.version} · ${entry.context.viewport} · ${entry.context.xp} XP, ${entry.context.completedModules} modules` });

  const actions = el("div", { class: "row", style: { gap: "0.4rem", marginTop: "0.5rem" } }, [
    el("button", { class: "btn btn-soft", type: "button", onclick: async () => {
      try { await navigator.clipboard.writeText(formatEntryMarkdown(entry)); }
      catch { /* ignore */ }
    } }, "Copy"),
    el("a", { class: "btn btn-ghost", href: mailtoLinkFor(entry) }, "Email"),
    issueLink ? el("a", { class: "btn btn-ghost", href: issueLink, target: "_blank", rel: "noopener" }, "GitHub issue") : null,
    el("span", { class: "spacer" }),
    el("button", { class: "btn btn-ghost", type: "button", onclick: () => {
      if (confirm("Delete this entry?")) { deleteFeedback(entry.id); location.reload(); }
    } }, "Delete")
  ].filter(Boolean));

  return el("article", { class: "fb-entry" }, [meta, body, ctx, actions]);
}

function niceDate(iso) {
  try { return new Date(iso).toLocaleString(); }
  catch { return iso; }
}
