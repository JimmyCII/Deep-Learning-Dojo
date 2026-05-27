/**
 * Knowledge-check card. Single question, 2-4 options, one correct.
 * Records pass/fail to the progress service.
 */

import { el } from "../core/ui.js";
import { recordQuiz } from "../core/progress.js";

export function Quiz({ moduleId, question, options, answerIndex, explanation, onPass }) {
  const explainEl = el("div", { class: "explain hidden", text: explanation });
  const buttons = [];

  const onClick = (idx) => () => {
    const correct = idx === answerIndex;
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === answerIndex) b.classList.add("correct");
      else if (i === idx && !correct) b.classList.add("wrong");
    });
    explainEl.classList.remove("hidden");
    recordQuiz(moduleId, correct ? "correct" : "incorrect");
    if (correct && onPass) onPass();
  };

  const optionList = el("div", { class: "options" }, options.map((o, i) => {
    const b = el("button", { type: "button", onclick: onClick(i) }, o);
    buttons.push(b);
    return b;
  }));

  return el("section", { class: "quiz" }, [
    el("h3", { text: "Knowledge check" }),
    el("p", { class: "q", text: question }),
    optionList,
    explainEl
  ]);
}
