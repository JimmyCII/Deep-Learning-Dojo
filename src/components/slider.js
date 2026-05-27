/**
 * Labeled slider: label row + range input + optional hint.
 * onInput callback receives the parsed Number value.
 */

import { el } from "../core/ui.js";

export function Slider({ label, min, max, step = 0.1, value = 0, hint = "", format, onInput }) {
  const valueOut = el("span", { class: "value", text: format ? format(value) : String(value) });
  const input = el("input", {
    type: "range",
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(value),
    oninput: (e) => {
      const v = Number(e.target.value);
      valueOut.textContent = format ? format(v) : v.toFixed(step < 1 ? 2 : 0);
      if (onInput) onInput(v);
    }
  });
  const wrap = el("div", { class: "slider" }, [
    el("div", { class: "label-row" }, [el("span", { class: "label", text: label }), valueOut]),
    input,
    hint ? el("span", { class: "hint", text: hint }) : null
  ]);
  return { node: wrap, input, setValue(v) { input.value = String(v); input.dispatchEvent(new Event("input")); } };
}
