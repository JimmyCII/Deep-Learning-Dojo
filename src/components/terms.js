/**
 * Clickable key-term chips. Show a definition under the chip row when clicked.
 */

import { el } from "../core/ui.js";
import { defineTerm } from "../data/glossary.js";

export function TermChips(terms) {
  const def = el("div", { class: "term-def" });
  const row = el("div", { class: "term-row" }, terms.map(t =>
    el("button", {
      class: "term",
      type: "button",
      onclick: () => {
        def.classList.add("show");
        def.innerHTML = `<strong>${t}</strong> &nbsp; ${defineTerm(t)}`;
      }
    }, t)
  ));
  return el("section", {}, [
    el("p", { class: "eyebrow", text: "Key terms" }),
    row,
    def
  ]);
}
