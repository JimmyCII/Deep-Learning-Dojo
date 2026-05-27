import { el } from "../core/ui.js";
import { GLOSSARY } from "../data/glossary.js";

export function renderGlossary() {
  const filter = el("input", {
    type: "search",
    placeholder: "Filter terms…",
    style: { padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(120,190,255,0.32)", background: "rgba(5,11,22,0.6)", color: "#ecf3ff", width: "100%", maxWidth: "320px" },
    oninput: (e) => apply(e.target.value.toLowerCase())
  });

  const list = el("div", { style: { display: "grid", gap: "0.5rem" } });

  function apply(q) {
    list.replaceChildren();
    Object.entries(GLOSSARY)
      .filter(([k, v]) => !q || k.toLowerCase().includes(q) || v.toLowerCase().includes(q))
      .forEach(([k, v]) => {
        list.appendChild(el("div", { class: "card", style: { padding: "0.85rem 1rem" } }, [
          el("p", { style: { margin: 0 } }, [el("strong", { text: k }), " — ", v])
        ]));
      });
  }

  apply("");

  return el("div", {}, [
    el("section", { class: "card" }, [
      el("p", { class: "eyebrow", text: "Reference" }),
      el("h1", { text: "Glossary" }),
      el("p", { class: "dim", text: "Plain-English definitions for every key term in the dojo. Searchable." }),
      filter
    ]),
    list
  ]);
}
