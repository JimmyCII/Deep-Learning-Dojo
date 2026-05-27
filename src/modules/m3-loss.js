/**
 * Module 3 — Loss & Learning
 *
 * Two labs:
 *   1) MSE regression lab — drag prediction near a fixed truth, watch
 *      (ŷ − y)² update a quadratic curve and an error meter.
 *   2) Cross-entropy classification lab — drag predicted probability for
 *      the true class, see the log-loss explode as confidence drops.
 * Challenge: reduce total loss across three small examples under a budget.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge, recordChallenge } from "../core/progress.js";

const MOD_ID = "m3";

export function renderM3() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    mseSection(),
    crossEntropySection(),
    challengeSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "The true class is 'cat'. Your model says cat with probability 0.05. What kind of loss number do you expect from cross-entropy here?",
      options: [
        "Near zero — the model has an opinion.",
        "Around 1 — confident answers always score around 1.",
        "Very large — being confidently wrong is punished heavily."
      ],
      answerIndex: 2,
      explanation: "Cross-entropy is −log(p_true). When p_true = 0.05, −log(0.05) ≈ 3.0 — a much bigger penalty than for p_true = 0.5 (≈0.69). Confident-and-wrong is the worst place to be."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "What's the practical difference between MSE and cross-entropy? When would you reach for each?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "Loss is the score the network is trying to minimize." }),
    el("p", { class: "dim", text: "Every training step asks the same question: \"how wrong were we?\" Loss turns that into a single number. The whole game of training is to make that number smaller." }),
    Why("If you pick the wrong loss for the task, the network optimizes the wrong objective. Regression problems usually want MSE. Classification problems want cross-entropy."),
    Coach("Move the prediction slider toward the truth in each lab. The loss number drops, the bar shrinks, and the parabola/log curve shows you exactly why.")
  ]);
}

// ---------- MSE Lab ----------

function mseSection() {
  const TRUTH = 0.7;
  const pred = Slider({ label: "your prediction ŷ", min: 0, max: 1, step: 0.01, value: 0.2, format: v => fmt(v) });

  const canvas = el("canvas", { width: "640", height: "260" });
  const meter = el("div", { class: "loss-meter" }, [el("div", { style: { width: "0%" } })]);
  const readout = el("div", { class: "lab-readout" });

  function draw() {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const PADX = 40, PADY = 24;
    const xToPx = (x) => PADX + (x) * (W - PADX * 2);
    const yToPx = (y) => H - PADY - (y / 1.0) * (H - PADY * 2);

    // axes
    ctx.strokeStyle = "rgba(189,213,239,0.45)";
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText("ŷ (your prediction)", W - 150, H - 6);
    ctx.fillText("loss = (ŷ − y)²", 8, 14);

    // parabola
    ctx.beginPath(); ctx.strokeStyle = "#66ddff"; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const loss = (x - TRUTH) ** 2;
      const px = xToPx(x), py = yToPx(Math.min(1.0, loss));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // truth marker
    ctx.strokeStyle = "rgba(155,209,79,0.7)"; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(xToPx(TRUTH), PADY); ctx.lineTo(xToPx(TRUTH), H - PADY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9bd14f"; ctx.fillText("truth y = " + TRUTH, xToPx(TRUTH) + 6, PADY + 10);

    // current pick
    const x = Number(pred.input.value);
    const loss = (x - TRUTH) ** 2;
    ctx.fillStyle = "#ffc65e";
    ctx.beginPath(); ctx.arc(xToPx(x), yToPx(Math.min(1.0, loss)), 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,198,94,0.6)"; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(xToPx(x), H - PADY); ctx.lineTo(xToPx(x), yToPx(Math.min(1.0, loss))); ctx.stroke();
    ctx.setLineDash([]);

    meter.firstChild.style.width = Math.min(100, loss / 0.5 * 100).toFixed(0) + "%";
    mount(readout,
      "y=", hi(fmt(TRUTH, 2), "hi-kata"),
      " · ŷ=", hi(fmt(x, 2)),
      " · loss = (ŷ − y)² = ", hi(fmt(loss, 4), loss < 0.01 ? "hi-kata" : (loss > 0.1 ? "hi-warn" : "hi-gold"))
    );

    if (loss < 0.001) awardBadge("loss-tracker");
  }
  pred.input.addEventListener("input", draw);
  draw();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Mean Squared Error Lab" }), el("span", { class: "hint", text: "Drag your prediction toward the truth. Watch the loss meter shrink." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        pred.node,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "The curve is the loss landscape. The minimum is exactly where ŷ = y. MSE punishes being far away quadratically — twice the error is four times the loss.")
      ]),
      el("div", { class: "lab-stage" }, [canvas, meter, readout])
    ])
  ]);
}

// ---------- Cross-Entropy Lab ----------

function crossEntropySection() {
  const p = Slider({ label: "your p(true class)", min: 0.001, max: 1, step: 0.001, value: 0.5, format: v => fmt(v, 3) });
  const canvas = el("canvas", { width: "640", height: "240" });
  const meter = el("div", { class: "loss-meter" }, [el("div", { style: { width: "50%" } })]);
  const readout = el("div", { class: "lab-readout" });

  function draw() {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const PADX = 40, PADY = 24;
    const xToPx = (x) => PADX + x * (W - PADX * 2);
    const yToPx = (y) => H - PADY - (y / 5.0) * (H - PADY * 2);

    // axes
    ctx.strokeStyle = "rgba(189,213,239,0.45)";
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText("p(true class)", W - 110, H - 6);
    ctx.fillText("loss = −log(p)", 8, 14);

    // -log(p) curve
    ctx.beginPath(); ctx.strokeStyle = "#c399ff"; ctx.lineWidth = 2.5;
    for (let i = 1; i <= 200; i++) {
      const x = i / 200;
      const loss = -Math.log(Math.max(1e-9, x));
      const px = xToPx(x), py = yToPx(Math.min(5.0, loss));
      if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // current pick
    const x = Number(p.input.value);
    const loss = -Math.log(Math.max(1e-9, x));
    ctx.fillStyle = "#ffc65e";
    ctx.beginPath(); ctx.arc(xToPx(x), yToPx(Math.min(5.0, loss)), 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,198,94,0.6)"; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(xToPx(x), H - PADY); ctx.lineTo(xToPx(x), yToPx(Math.min(5.0, loss))); ctx.stroke();
    ctx.setLineDash([]);

    meter.firstChild.style.width = Math.min(100, loss / 3 * 100).toFixed(0) + "%";
    let kind = "hi-gold";
    if (loss > 1.5) kind = "hi-warn";
    if (loss < 0.2) kind = "hi-kata";
    mount(readout, "p(true)=", hi(fmt(x, 3)), " · loss = ", hi(fmt(loss, 3), kind));
  }
  p.input.addEventListener("input", draw);
  draw();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Cross-Entropy Lab" }), el("span", { class: "hint", text: "The price of confident wrongness." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        p.node,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Cross-entropy for the true class is −log(p). Get to 1.0 → loss is zero. Slip below 0.1 → loss explodes past 2. The curve is asymmetric on purpose.")
      ]),
      el("div", { class: "lab-stage" }, [canvas, meter, readout])
    ])
  ]);
}

// ---------- Challenge ----------

function challengeSection() {
  // Three regression examples; one slider per prediction. Goal: total MSE < 0.05.
  const truths = [0.20, 0.55, 0.85];
  const preds = truths.map(() => Slider({ label: "ŷ", min: 0, max: 1, step: 0.01, value: 0.5, format: v => fmt(v) }));
  const readout = el("div", { class: "lab-readout" });
  const meter = el("div", { class: "loss-meter" }, [el("div", { style: { width: "100%" } })]);
  const status = el("p", { class: "muted", style: { marginTop: "0.5rem" } });

  function tick() {
    const losses = preds.map((s, i) => (Number(s.input.value) - truths[i]) ** 2);
    const total = losses.reduce((a, b) => a + b, 0);
    meter.firstChild.style.width = Math.min(100, total / 0.6 * 100).toFixed(0) + "%";

    mount(readout,
      "truth = [", hi(truths.map(t => fmt(t, 2)).join(", "), "hi-kata"), "]",
      el("br"),
      "your ŷ = [", hi(preds.map(p => fmt(Number(p.input.value), 2)).join(", ")), "]",
      el("br"),
      "individual losses = [", hi(losses.map(l => fmt(l, 4)).join(", "), "hi-gold"), "]",
      el("br"),
      "total MSE = ", hi(fmt(total / 3, 5), total / 3 < 0.05 ? "hi-kata" : "hi-warn")
    );

    if (total / 3 < 0.01) {
      status.textContent = "Locked. Total MSE under 0.01 — clean tune.";
      status.style.color = "#9bd14f";
      const isNew = recordChallenge(MOD_ID, 100 - (total / 3) * 1000);
      if (isNew) awardBadge("loss-tracker");
    } else if (total / 3 < 0.05) {
      status.textContent = "Almost — under 0.05. Get it under 0.01 to earn the Loss Tracker badge.";
      status.style.color = "#ffc65e";
    } else {
      status.textContent = "Push each prediction toward its truth. You're aiming for total MSE below 0.05.";
      status.style.color = "#b7c9e3";
    }
  }
  preds.forEach(s => s.input.addEventListener("input", tick));
  tick();

  return el("section", { class: "challenge" }, [
    el("h3", { text: "Challenge · Drive the Loss Down" }),
    el("p", { class: "dim", text: "Three predictions, three truths. Tune each ŷ so the total MSE drops below 0.01. The meter shrinks as the loss does." }),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, preds.map(p => p.node)),
      el("div", { class: "lab-stage" }, [meter, readout, status])
    ])
  ]);
}
