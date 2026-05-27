/**
 * Consistent header + footer for every module page.
 * - Hero with title, subtitle, objectives, XP/badge meta
 * - Footer with "Complete module" CTA and prev/next navigation
 */

import { el } from "../core/ui.js";
import { completeModule, isComplete } from "../core/progress.js";
import { nextModule, prevModule, getModule } from "../data/modules.js";
import { go } from "../core/router.js";

export function ModuleHero(mod) {
  return el("section", { class: "card module-hero" }, [
    el("div", {}, [
      el("p", { class: "eyebrow", text: `Module ${mod.num} · ${mod.subtitle}` }),
      el("h1", { text: mod.title }),
      el("p", { text: mod.short }),
      el("div", { class: "objectives" }, mod.objectives.map(o => el("div", { class: "objective", text: o })))
    ]),
    el("div", { class: "module-meta" }, [
      el("span", {}, `+${mod.xp} XP`),
      isComplete(mod.id) ? el("span", { class: "tag done", text: "Completed" }) : el("span", { class: "tag now", text: "Now training" })
    ])
  ]);
}

export function ModuleFooter(mod, { onComplete } = {}) {
  const next = nextModule(mod.id);
  const prev = prevModule(mod.id);
  const completedAlready = isComplete(mod.id);
  const status = el("span", { class: "tag " + (completedAlready ? "done" : "now"), text: completedAlready ? "Completed" : "Mark complete to earn XP" });

  const completeBtn = el("button", {
    class: "btn btn-kata",
    type: "button",
    onclick: () => {
      const granted = completeModule(mod.id, mod.xp);
      if (granted && onComplete) onComplete();
      status.className = "tag done"; status.textContent = "Completed";
      completeBtn.disabled = true;
      completeBtn.textContent = "✓ Earned " + mod.xp + " XP";
    }
  }, completedAlready ? `✓ Already earned (${mod.xp} XP)` : `Complete module · +${mod.xp} XP`);
  if (completedAlready) completeBtn.disabled = true;

  const navRow = el("div", { class: "row" }, [
    prev ? el("a", { class: "btn btn-ghost", href: `#${prev.route}`, text: `← ${prev.title}` }) : el("a", { class: "btn btn-ghost", href: "#/dashboard", text: "← Dashboard" }),
    el("span", { class: "spacer" }),
    status,
    completeBtn,
    next ? el("a", { class: "btn btn-primary", href: `#${next.route}`, text: `${next.title} →` }) : el("a", { class: "btn btn-primary", href: "#/dashboard", text: "Back to Dojo" })
  ]);

  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Module complete?" }),
    el("p", { class: "dim", text: "Mark this module complete to bank your XP. You can always come back to the lab." }),
    navRow
  ]);
}

export function Coach(text) {
  return el("div", { class: "coach" }, [el("span", { class: "icon", text: "◆ Coach" }), el("span", { class: "text", text })]);
}

export function Why(text) {
  return el("div", { class: "why" }, [el("strong", { text: "Why this matters: " }), text]);
}
