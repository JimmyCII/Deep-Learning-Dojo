/**
 * Feedback modal. Free-text + optional rating/name/email.
 * On submit: saves locally, then offers Copy / Email / GitHub Issue routes.
 */

import { el } from "../core/ui.js";
import { saveFeedback, formatEntryMarkdown, mailtoLinkFor, issueLinkFor } from "../core/feedback.js";
import { SITE } from "../data/site-config.js";

let openOverlay = null;

export function openFeedbackModal() {
  if (openOverlay) return;

  const rating = { value: 0 };

  // Star rating widget
  const starRow = el("div", { class: "fb-stars" });
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const s = el("button", {
      type: "button",
      class: "fb-star",
      "data-i": String(i),
      onclick: () => { rating.value = i; refreshStars(); }
    }, "☆");
    stars.push(s); starRow.appendChild(s);
  }
  function refreshStars() {
    stars.forEach((b, idx) => {
      b.textContent = (idx + 1) <= rating.value ? "★" : "☆";
      b.classList.toggle("on", (idx + 1) <= rating.value);
    });
  }
  refreshStars();

  const nameInput  = el("input", { type: "text",  placeholder: "Your name (optional)", class: "fb-input" });
  const emailInput = el("input", { type: "email", placeholder: "Email (optional, lets Jim follow up)", class: "fb-input" });
  const textArea   = el("textarea", { placeholder: "What's working? What's confusing? What would make this better?  Be specific — module name, slider name, exact wording…", class: "fb-textarea" });

  const status = el("p", { class: "fb-status" });

  function close() {
    if (openOverlay && openOverlay.parentNode) openOverlay.parentNode.removeChild(openOverlay);
    openOverlay = null;
    document.removeEventListener("keydown", onEsc);
  }
  function onEsc(e) { if (e.key === "Escape") close(); }

  function captureEntry() {
    return saveFeedback({
      rating: rating.value,
      name:   nameInput.value.trim(),
      email:  emailInput.value.trim(),
      text:   textArea.value.trim()
    });
  }

  // Action buttons
  const copyBtn = el("button", { type: "button", class: "btn btn-soft", onclick: async () => {
    if (!textArea.value.trim() && !rating.value) { flash("Add a rating or some text first."); return; }
    const entry = captureEntry();
    try {
      await navigator.clipboard.writeText(formatEntryMarkdown(entry));
      flash("Copied to clipboard. Paste into Slack, email, or wherever works.");
    } catch {
      flash("Saved locally. Couldn't auto-copy — open Feedback log to copy manually.");
    }
  } }, "Copy summary");

  const emailBtn = el("a", { class: "btn btn-primary", href: "#", onclick: (e) => {
    e.preventDefault();
    if (!textArea.value.trim() && !rating.value) { flash("Add a rating or some text first."); return; }
    const entry = captureEntry();
    location.href = mailtoLinkFor(entry);
    flash(`Saved locally and opened your mail client (${SITE.feedbackEmail}).`);
  } }, `Email Jim`);

  const issueBtn = SITE.repoUrl
    ? el("a", { class: "btn btn-ghost", href: "#", onclick: (e) => {
        e.preventDefault();
        if (!textArea.value.trim() && !rating.value) { flash("Add a rating or some text first."); return; }
        const entry = captureEntry();
        const url = issueLinkFor(entry);
        if (url) window.open(url, "_blank");
        flash("Saved locally and opened GitHub issue draft.");
      } }, "Open GitHub issue")
    : null;

  const cancelBtn = el("button", { type: "button", class: "btn btn-ghost", onclick: close }, "Close");

  function flash(msg) { status.textContent = msg; }

  // Layout
  const card = el("div", { class: "fb-card", onclick: (e) => e.stopPropagation() }, [
    el("div", { class: "fb-head" }, [
      el("div", {}, [
        el("p", { class: "eyebrow", text: "Feedback" }),
        el("h2", { style: { margin: "0.2rem 0 0.4rem" }, text: "Tell Jim what's working." })
      ]),
      el("button", { class: "fb-close", type: "button", onclick: close, "aria-label": "Close" }, "×")
    ]),
    el("p", { class: "dim", style: { marginTop: 0 }, text: `Currently on: ${(location.hash || "#/dashboard").replace(/^#/, "")}` }),
    el("div", { class: "fb-row" }, [el("label", { class: "fb-label", text: "Rating" }), starRow]),
    el("div", { class: "fb-row" }, [nameInput, emailInput]),
    textArea,
    status,
    el("div", { class: "fb-actions" }, [
      cancelBtn,
      el("span", { class: "spacer" }),
      copyBtn,
      issueBtn,
      emailBtn
    ].filter(Boolean)),
    el("p", { class: "fb-foot", text: "Saves locally first. All entries available at #/feedback for later export." })
  ]);

  openOverlay = el("div", { class: "fb-overlay", onclick: close }, [card]);
  document.body.appendChild(openOverlay);
  document.addEventListener("keydown", onEsc);
  textArea.focus();
}
