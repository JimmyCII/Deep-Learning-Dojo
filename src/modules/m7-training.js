/**
 * Module 7 — Training Dashboard
 *
 * Simulates a training run for an over-/under-parameterized model on
 * noisy data. We don't actually fit a model — we synthesize plausible
 * train/val loss & accuracy curves whose shape depends on model
 * complexity and noise, so the user can SEE overfitting.
 *
 * Goal: at high complexity + high noise, train loss keeps falling while
 * val loss bottoms out and rises again. That's overfitting in one picture.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge } from "../core/progress.js";

const MOD_ID = "m7";

export function renderM7() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    dashboardSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "Your training loss is still dropping at epoch 100 but your validation loss bottomed out at epoch 35 and has been climbing since. What is this and what would help?",
      options: [
        "Underfitting — train a bigger model.",
        "Overfitting — the model is memorizing training data. Stop earlier, reduce complexity, add regularization, or get more data.",
        "Healthy training — keep going."
      ],
      answerIndex: 1,
      explanation: "Classic overfitting signature. Train loss ↓, val loss ↑ means the model is fitting noise that doesn't generalize. The cheapest fix is early stopping at epoch 35. Next: more data, simpler model, dropout, or weight decay."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "Why do we even bother holding out validation data? What would go wrong if we just trained on everything?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "Two curves tell you almost everything." }),
    el("p", { class: "dim", text: "While a model trains, plot loss and accuracy on the training set AND on a held-out validation set. The gap between those two curves is the story of how well your model generalizes." }),
    Why("Almost every real-world ML failure is some flavor of overfitting. Reading these curves correctly is the single most-used diagnostic skill in deep learning."),
    Coach("Crank Complexity up to 10 and Noise to 0.5. Hit Train. Watch the validation loss start dropping nicely, bottom out, then begin climbing while training loss keeps going down. That divergence IS overfitting.")
  ]);
}

function dashboardSection() {
  const state = {
    complexity: 4,        // model capacity
    noise: 0.2,           // noise level in the data
    dataSize: 50,         // amount of training data
    epoch: 0,
    history: [], // { epoch, trainLoss, valLoss, trainAcc, valAcc }
    timer: null
  };

  const complexity = Slider({ label: "model complexity", min: 1, max: 12, step: 1, value: 4, format: v => String(Math.round(v)), hint: "1 = tiny model, 12 = giant overparam'd model" });
  const noise      = Slider({ label: "noise in data", min: 0, max: 0.6, step: 0.05, value: 0.2, format: v => fmt(v, 2) });
  const dataSize   = Slider({ label: "training set size", min: 10, max: 200, step: 10, value: 50, format: v => String(Math.round(v)) });

  const trainBtn = el("button", { class: "btn btn-primary", type: "button" }, "Train 80 epochs");
  const resetBtn = el("button", { class: "btn btn-ghost", type: "button" }, "Reset");

  const lossCanvas = el("canvas", { width: "640", height: "240" });
  const accCanvas  = el("canvas", { width: "640", height: "160" });
  const readout = el("div", { class: "lab-readout" });
  const warn = el("div", { class: "coach", style: { display: "none", borderLeftColor: "#ff7a7a", background: "rgba(255,122,122,0.08)" } }, [
    el("span", { class: "icon", text: "⚠ Overfitting", style: { color: "#ff7a7a" } }),
    el("span", { class: "text", text: "" })
  ]);

  // Simulated curves: monotonic train loss drop; val loss bottoms then rises with
  // high complexity & high noise & low data. Accuracy mirrors loss roughly.
  function generateCurves() {
    state.history = [];
    const C = state.complexity;
    const N = state.noise;
    const D = state.dataSize;
    const overfitTendency = Math.max(0, (C - 3) / 9) * (0.3 + N) * (1 - Math.min(1, D / 220));

    for (let epoch = 1; epoch <= 80; epoch++) {
      // train loss: exponential decay toward a small floor (smaller floor for bigger models)
      const trainFloor = Math.max(0.02, 0.4 - C * 0.025) + N * 0.05;
      const trainLoss = trainFloor + (1.2 - trainFloor) * Math.exp(-epoch / (6 + C * 1.2));

      // val loss: same decay, but with an upward bowl driven by overfitTendency
      const valBase = trainLoss + N * 0.25; // val starts above train by noise
      const overshoot = overfitTendency * Math.max(0, (epoch - 25) / 80) ** 1.6 * 1.4;
      const valLoss = valBase + overshoot;

      const trainAcc = Math.min(1, 0.5 + 0.5 * (1 - trainLoss / 1.4));
      const valAcc   = Math.min(1, 0.5 + 0.5 * (1 - valLoss / 1.4));

      state.history.push({ epoch, trainLoss, valLoss, trainAcc: trainAcc, valAcc: valAcc });
    }
  }

  function animateTrain() {
    if (state.timer) clearInterval(state.timer);
    generateCurves();
    state.epoch = 0;
    trainBtn.disabled = true;
    state.timer = setInterval(() => {
      state.epoch++;
      if (state.epoch >= state.history.length) {
        clearInterval(state.timer);
        state.timer = null;
        trainBtn.disabled = false;
      }
      draw();
    }, 30);
  }

  function reset() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.history = []; state.epoch = 0;
    trainBtn.disabled = false;
    draw();
  }

  trainBtn.addEventListener("click", animateTrain);
  resetBtn.addEventListener("click", reset);
  [complexity, noise, dataSize].forEach(s => s.input.addEventListener("input", () => {
    state.complexity = Number(complexity.input.value);
    state.noise = Number(noise.input.value);
    state.dataSize = Number(dataSize.input.value);
    reset();
  }));

  function drawCurve(canvas, key1, key2, color1, color2, max, label) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const PADX = 38, PADY = 22;

    // axes
    ctx.strokeStyle = "rgba(189,213,239,0.45)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText(label, 6, 12);
    ctx.fillText("epoch", W - 56, H - 6);

    if (state.history.length === 0) {
      ctx.fillStyle = "#8aa1bf"; ctx.font = "11px Inter, sans-serif";
      ctx.fillText("Hit Train to simulate 80 epochs.", PADX + 8, H / 2);
      return;
    }

    const shown = state.history.slice(0, state.epoch || state.history.length);
    const xToPx = (i) => PADX + (i / (state.history.length - 1)) * (W - PADX * 2);
    const yToPx = (y) => H - PADY - (y / max) * (H - PADY * 2);

    function plot(arr, color, dashed) {
      ctx.beginPath();
      ctx.strokeStyle = color; ctx.lineWidth = 2.4;
      if (dashed) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
      shown.forEach((p, i) => {
        const px = xToPx(i), py = yToPx(Math.min(max, arr(p)));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
    plot(p => p[key1], color1, false);
    plot(p => p[key2], color2, true);

    // legend
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = color1; ctx.fillRect(PADX + 4, 18, 12, 3); ctx.fillText("training", PADX + 22, 22);
    ctx.fillStyle = color2; ctx.fillRect(PADX + 90, 18, 12, 3); ctx.fillText("validation", PADX + 108, 22);
  }

  function draw() {
    drawCurve(lossCanvas, "trainLoss", "valLoss", "#66ddff", "#ffc65e", 1.4, "loss");
    drawCurve(accCanvas, "trainAcc", "valAcc", "#9bd14f", "#c399ff", 1.0, "accuracy");

    if (state.history.length === 0) {
      mount(readout, "Hit ", hi("Train", "hi"), " to simulate an 80-epoch run. Crank complexity & noise to provoke overfitting.");
      warn.style.display = "none";
      return;
    }
    const idx = Math.max(0, (state.epoch || state.history.length) - 1);
    const p = state.history[idx];
    // find best-val-loss epoch
    const bestVal = state.history.reduce((b, x) => x.valLoss < b.valLoss ? x : b, state.history[0]);
    const overfitGap = p.valLoss - p.trainLoss;
    mount(readout,
      "epoch ", hi(String(p.epoch)),
      "  train_loss=", hi(fmt(p.trainLoss, 3)),
      " val_loss=", hi(fmt(p.valLoss, 3), overfitGap > 0.25 ? "hi-warn" : "hi-kata"),
      el("br"),
      "train_acc=", hi(fmt(p.trainAcc * 100, 1) + "%", "hi-kata"),
      " val_acc=", hi(fmt(p.valAcc * 100, 1) + "%", p.valAcc < 0.7 ? "hi-warn" : "hi-gold"),
      el("br"),
      "best-val epoch so far: ", hi(String(bestVal.epoch), "hi-gold"),
      "   gap = ", hi(fmt(overfitGap, 3), overfitGap > 0.25 ? "hi-warn" : "hi")
    );

    // overfitting warning trigger
    if (state.epoch >= 30 && overfitGap > 0.25) {
      warn.style.display = "";
      warn.lastChild.textContent = `Validation loss is ${overfitGap.toFixed(2)} above training loss and climbing — your model is memorizing the noise. Stop around epoch ${bestVal.epoch} (its best-val point), reduce complexity, or get more data.`;
      awardBadge("curve-reader");
    } else {
      warn.style.display = "none";
    }
  }

  draw();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Simulated Training Run" }), el("span", { class: "hint", text: "Adjust complexity, noise, and data — then train and watch the curves." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        complexity.node, noise.node, dataSize.node,
        el("div", { class: "row", style: { marginTop: "0.4rem" } }, [trainBtn, resetBtn]),
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Try: complexity=10, noise=0.5, dataSize=20. Then watch the val-loss curve diverge from train-loss after ~epoch 25.")
      ]),
      el("div", { class: "lab-stage" }, [lossCanvas, accCanvas, readout, warn])
    ])
  ]);
}
