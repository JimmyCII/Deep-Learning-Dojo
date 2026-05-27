import { el } from "../core/ui.js";
import { getModule } from "../data/modules.js";

export function renderStub(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return el("div", { class: "card", text: "Module not found." });

  return el("div", {}, [
    el("section", { class: "card module-hero" }, [
      el("div", {}, [
        el("p", { class: "eyebrow", text: `Module ${mod.num} · ${mod.subtitle}` }),
        el("h1", { text: mod.title }),
        el("p", { text: mod.short })
      ]),
      el("div", { class: "module-meta" }, [
        el("span", { class: "tag soon", text: "Roadmapped" }),
        el("span", { text: `+${mod.xp} XP when shipped` })
      ])
    ]),
    el("section", { class: "card" }, [
      el("p", { class: "eyebrow", text: "What you'll learn here" }),
      el("ul", { style: { lineHeight: 1.7, color: "#b7c9e3" } },
        mod.objectives.map(o => el("li", { text: o }))
      )
    ]),
    el("section", { class: "card" }, [
      el("p", { class: "eyebrow", text: "Status" }),
      el("h3", { text: "This module is on the training roadmap." }),
      el("p", { class: "dim", text: "Modules 1–3 are fully interactive. Modules 4–8 are scaffolded and will be built out in the next training session. The path map on the dashboard already shows where this one will plug in." }),
      el("div", { class: "row" }, [
        el("a", { class: "btn btn-ghost", href: "#/dashboard", text: "← Back to dojo" }),
        el("a", { class: "btn btn-primary", href: "#/module/m1", text: "Train Module 1 →" })
      ])
    ])
  ]);
}
