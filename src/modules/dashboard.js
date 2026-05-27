/**
 * Dojo dashboard. The home view.
 *  - Hero with brand + "continue training" CTA
 *  - Stat cards (XP, modules completed, current belt, next belt at)
 *  - Path map (8 module cards)
 *  - Badge rack
 *  - Capstone preview
 */

import { el, picture } from "../core/ui.js";
import { MODULES, BADGES } from "../data/modules.js";
import { getState, getBelt, nextBelt, isComplete } from "../core/progress.js";

export function renderDashboard() {
  const s = getState();
  const completedCount = Object.keys(s.completed).length;
  const totalXp = s.xp;
  const belt = getBelt(totalXp);
  const next = nextBelt(totalXp);
  const xpToNext = next ? Math.max(0, next.min - totalXp) : 0;

  // Find next module to train: first incomplete & ready, else first ready.
  const upNext = MODULES.find(m => m.status === "ready" && !isComplete(m.id))
              || MODULES.find(m => m.status === "ready")
              || MODULES[0];

  return el("div", {}, [
    heroCard(upNext, belt, next, xpToNext),
    statsRow(s, belt, next, completedCount),
    pathSection(),
    badgesSection(),
    capstoneCard()
  ]);
}

function heroCard(upNext, belt, next, xpToNext) {
  const ctaHref = `#${upNext.route}`;
  const ctaLabel = isComplete(upNext.id) ? `Review ${upNext.title}` : `Train · ${upNext.title}`;
  return el("section", { class: "card dash-hero" }, [
    el("div", { class: "dash-hero-copy" }, [
      el("p", { class: "eyebrow", text: "The Data Ninja Dojo" }),
      el("h1", { text: "Build deep-learning intuition by doing." }),
      el("p", { text: "Eight short modules, each one a hands-on lab. Move sliders, watch curves, run the math, beat the challenge. No videos. No walls of text. Just reps." }),
      el("div", { class: "row" }, [
        el("a", { class: "btn btn-primary", href: ctaHref, text: ctaLabel + " →" }),
        next ? el("span", { class: "dim", text: `Next belt: ${next.name} in ${xpToNext} XP` }) : el("span", { class: "dim", text: "Black belt reached." })
      ])
    ]),
    el("div", { class: "dash-hero-art" }, [
      picture(
        "assets/images/data-ninja-badge.webp",
        "assets/images/Data_Ninja_badge.png",
        "Data Ninja Dojo badge",
        { loading: "eager" }
      )
    ])
  ]);
}

function statsRow(s, belt, next, completed) {
  return el("section", { class: "dash-stats" }, [
    statCard("XP", s.xp, "gold"),
    statCard("Modules complete", `${completed}/${MODULES.length}`, "kata"),
    statCard("Current belt", belt.name, "accent"),
    statCard("Badges earned", `${Object.keys(s.badges).length}/${Object.keys(BADGES).length}`)
  ]);
}

function statCard(label, value, hue) {
  return el("div", { class: "stat" }, [
    el("div", { class: "label", text: label }),
    el("div", { class: "value" + (hue ? " " + hue : ""), text: String(value) })
  ]);
}

function pathSection() {
  const cards = MODULES.map((m, idx) => {
    const done = isComplete(m.id);
    const ready = m.status === "ready";
    const tag = done
      ? el("span", { class: "tag done", text: "Done" })
      : ready
        ? el("span", { class: "tag now", text: "Open" })
        : el("span", { class: "tag soon", text: "Soon" });

    const card = el("a", {
      class: "path-card" + (!ready ? " locked" : ""),
      href: ready ? `#${m.route}` : "javascript:void(0)",
      onclick: (e) => { if (!ready) e.preventDefault(); }
    }, [
      el("div", { class: "pc-head" }, [
        el("span", { class: "pc-num", text: `MODULE ${m.num}` }),
        tag
      ]),
      el("h3", { text: m.title }),
      el("p", { text: m.short }),
      el("div", { class: "pc-foot" }, [
        el("span", { text: m.subtitle }),
        el("span", { class: "pc-xp", text: `+${m.xp} XP` })
      ])
    ]);
    return card;
  });

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [
      el("h2", { text: "Training Path" }),
      el("span", { class: "hint", text: "Modules build on each other. Train them in order for best intuition." })
    ]),
    el("div", { class: "path-grid" }, cards)
  ]);
}

function badgesSection() {
  const s = getState();
  const earnedIds = new Set(Object.keys(s.badges));
  const badges = Object.entries(BADGES).map(([id, b]) => {
    const earned = earnedIds.has(id);
    return el("div", { class: "badge" + (earned ? " earned" : "") }, [
      el("div", { class: "b-icon", text: b.icon }),
      el("div", { class: "b-name", text: b.name }),
      el("div", { class: "b-sub", text: earned ? "Earned" : b.desc })
    ]);
  });
  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [
      el("h2", { text: "Badge Rack" }),
      el("span", { class: "hint", text: "Earn badges for module milestones and challenge wins." })
    ]),
    el("div", { class: "badge-rack" }, badges)
  ]);
}

function capstoneCard() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Capstone preview" }),
    el("h2", { text: "Train the Data Ninja Model" }),
    el("p", { class: "dim", text: "After the seven foundation modules, you'll configure and train a small classification network end-to-end. Pass the challenge, earn the Black Belt." }),
    el("p", { class: "muted", text: "Capstone unlocks after Modules 1–7 are complete." })
  ]);
}
