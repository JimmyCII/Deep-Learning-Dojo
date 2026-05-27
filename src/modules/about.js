import { el } from "../core/ui.js";

export function renderAbout() {
  return el("div", {}, [
    el("section", { class: "card" }, [
      el("p", { class: "eyebrow", text: "About this dojo" }),
      el("h1", { text: "How to train here" }),
      el("p", { class: "dim", text: "The Data Ninja Deep Learning Dojo is a hands-on tutor for building deep-learning intuition. There are no videos and no walls of text. Each module is a short lab: read the idea, push some sliders, beat the small challenge, answer the knowledge check, and bank XP." }),
      el("ul", { style: { lineHeight: 1.7, paddingLeft: "1.1rem", color: "#b7c9e3" } }, [
        el("li", { text: "All progress is stored on this device only (localStorage)." }),
        el("li", { text: "Modules 1–3 are fully built. Modules 4–8 are roadmapped." }),
        el("li", { text: "Use the Reset link in the footer to wipe progress." })
      ])
    ]),
    el("section", { class: "card" }, [
      el("h2", { text: "Belt ranks" }),
      el("p", { class: "dim", text: "Earn XP by completing modules and beating challenges. Belt promotions:" }),
      el("ul", { style: { fontFamily: "monospace", color: "#ecf3ff", lineHeight: 1.7 } }, [
        el("li", { text: "White Belt — start (0 XP)" }),
        el("li", { text: "Yellow Belt — 50 XP" }),
        el("li", { text: "Green Belt — 150 XP" }),
        el("li", { text: "Blue Belt — 300 XP" }),
        el("li", { text: "Brown Belt — 500 XP" }),
        el("li", { text: "Black Belt — 750 XP" })
      ])
    ])
  ]);
}
