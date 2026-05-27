/**
 * Reflection prompt with persistent text. Saves on blur and on each keystroke
 * (debounced) to the progress service.
 */

import { el } from "../core/ui.js";
import { saveReflection, getReflection } from "../core/progress.js";

export function Reflection({ moduleId, prompt }) {
  const existing = getReflection(moduleId);
  let timer = null;
  const ta = el("textarea", {
    placeholder: "Your reflection (saved locally)…",
    oninput: (e) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => saveReflection(moduleId, e.target.value), 400);
    },
    onblur: (e) => saveReflection(moduleId, e.target.value)
  });
  ta.value = existing;
  return el("section", { class: "card reflection" }, [
    el("p", { class: "eyebrow", text: "Reflection" }),
    el("p", { text: prompt, class: "dim" }),
    ta
  ]);
}
