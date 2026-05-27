/**
 * Module 4 — Gradient Descent Playground
 *
 * Ball on a 1-D loss curve. User picks a starting point and a learning rate,
 * then steps (or auto-trains) and watches gradient descent in action.
 * Challenge: reach the minimum in 10 steps or fewer with the ball still settled.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge, recordChallenge } from "../core/progress.js";

const MOD_ID = "m4";

// Loss landscape: a single quadratic well centered at x = 1.2.
// loss(x) = (x − 1.2)² + 0.05   (minimum is 0.05, just to keep things non-zero)
// grad(x) = 2·(x − 1.2)
function loss(x) { return (x - 1.2) ** 2 + 0.05; }
function grad(x) { return 2 * (x - 1.2); }

export function renderM4() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    playgroundSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "You set learning rate = 2.5 and your loss is bouncing wildly between huge values. What's happening?",
      options: [
        "The model is underfitting — increase complexity.",
        "The step size is so large that each update overshoots the minimum and lands further away. Lower the learning rate.",
        "The loss curve is the wrong shape — pick a different loss function."
      ],
      answerIndex: 1,
      explanation: "Classic divergence. The step `-lr · grad` is bigger than the distance to the minimum, so every step jumps past it onto the steeper opposite slope. Lower lr and the system settles."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "Why is a tiny learning rate not a free win — what's the cost of being too cautious?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "Roll downhill. Try not to overshoot." }),
    el("p", { class: "dim", text: "Gradient descent is exactly what it sounds like: at every point, compute which direction the loss is going up (the gradient), then take a step in the opposite direction. The size of that step is the learning rate." }),
    el("p", { class: "dim", html: "Formally: <code>x ← x − (learning_rate × gradient)</code>. Everything else in deep-learning training is a variation on that one line." }),
    Why("Learning rate is the single most influential knob in training. Too small: training takes forever. Too large: training diverges and the loss explodes. Most of the time, picking the right rate is the difference between a working model and a wasted day."),
    Coach("Set lr to 0.1, hit Step a few times, watch the ball settle smoothly into the minimum. Then crank lr to 1.5 and Step again — see it overshoot. Crank to 2.0+ and it diverges.")
  ]);
}

function playgroundSection() {
  const state = {
    x: -1.5,
    history: [],
    autoTimer: null
  };

  const startX = Slider({ label: "starting x", min: -2.5, max: 4.0, step: 0.05, value: -1.5, format: v => fmt(v) });
  const lr     = Slider({ label: "learning rate η", min: 0.01, max: 2.5, step: 0.01, value: 0.20, format: v => fmt(v, 2), hint: "Try 0.1 (gentle), 0.5 (snappy), 1.5 (overshoots)." });

  const canvas = el("canvas", { width: "640", height: "300" });
  const readout = el("div", { class: "lab-readout" });
  const status = el("p", { class: "muted", style: { marginTop: "0.4rem", minHeight: "1.2em" } });

  const stepBtn = el("button", { class: "btn btn-primary", type: "button" }, "Step ▸");
  const autoBtn = el("button", { class: "btn btn-soft", type: "button" }, "Auto-train");
  const resetBtn = el("button", { class: "btn btn-ghost", type: "button" }, "Reset");
  const btnRow = el("div", { class: "row", style: { marginTop: "0.4rem" } }, [stepBtn, autoBtn, resetBtn]);

  function reset() {
    if (state.autoTimer) { clearInterval(state.autoTimer); state.autoTimer = null; autoBtn.textContent = "Auto-train"; }
    state.x = Number(startX.input.value);
    state.history = [state.x];
    draw();
    refreshReadout();
    status.textContent = "Ready. Hit Step to take a gradient step.";
    status.style.color = "#b7c9e3";
  }

  function step() {
    const lrV = Number(lr.input.value);
    const g = grad(state.x);
    state.x = state.x - lrV * g;
    // soft clamp so divergence doesn't leave the canvas forever; we still
    // *report* divergence honestly with a status message.
    state.history.push(state.x);
    if (state.history.length > 200) state.history.shift();
    draw();
    refreshReadout();

    const diff = Math.abs(state.x - 1.2);
    if (!isFinite(state.x) || Math.abs(state.x) > 50) {
      status.textContent = "DIVERGING — learning rate is way too high. Reset and lower it.";
      status.style.color = "#ff7a7a";
      stopAuto();
    } else if (diff < 0.02 && state.history.length <= 11) {
      status.textContent = `Locked into the minimum in ${state.history.length - 1} step${state.history.length - 1 === 1 ? "" : "s"}.`;
      status.style.color = "#9bd14f";
      const isNew = recordChallenge(MOD_ID, 100 - (state.history.length - 1) * 5);
      if (isNew) awardBadge("rate-master");
    } else if (diff < 0.02) {
      status.textContent = `Settled — but it took ${state.history.length - 1} steps. Try a smarter lr to do it in ≤10.`;
      status.style.color = "#ffc65e";
    } else {
      status.textContent = `Step ${state.history.length - 1}: distance to minimum = ${diff.toFixed(3)}`;
      status.style.color = "#b7c9e3";
    }
  }

  function stopAuto() {
    if (state.autoTimer) { clearInterval(state.autoTimer); state.autoTimer = null; autoBtn.textContent = "Auto-train"; }
  }

  function toggleAuto() {
    if (state.autoTimer) { stopAuto(); return; }
    autoBtn.textContent = "Stop";
    state.autoTimer = setInterval(() => {
      step();
      if (Math.abs(state.x - 1.2) < 0.005 || !isFinite(state.x) || Math.abs(state.x) > 50 || state.history.length > 80) {
        stopAuto();
      }
    }, 220);
  }

  startX.input.addEventListener("input", () => {
    state.x = Number(startX.input.value);
    state.history = [state.x];
    draw(); refreshReadout();
    status.textContent = "Starting point moved. Hit Step.";
    status.style.color = "#b7c9e3";
  });
  stepBtn.addEventListener("click", step);
  autoBtn.addEventListener("click", toggleAuto);
  resetBtn.addEventListener("click", reset);
  lr.input.addEventListener("input", refreshReadout);

  function refreshReadout() {
    const g = grad(state.x);
    const lrV = Number(lr.input.value);
    const nextStep = -lrV * g;
    mount(readout,
      "x = ", hi(fmt(state.x, 3)),
      "   loss(x) = ", hi(fmt(loss(state.x), 3), "hi-gold"),
      "   grad = ", hi(fmt(g, 3)),
      el("br"),
      "next step Δx = −η·grad = ", hi(fmt(nextStep, 3), "hi-kata"),
      "   total steps taken: ", hi(String(Math.max(0, state.history.length - 1)))
    );
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const PADX = 32, PADY = 28;
    const xMin = -2.5, xMax = 4.0;
    const lossMax = 6;

    const xToPx = (x) => PADX + ((x - xMin) / (xMax - xMin)) * (W - PADX * 2);
    const yToPx = (loss) => H - PADY - (loss / lossMax) * (H - PADY * 2);

    // grid
    ctx.strokeStyle = "rgba(120,190,255,0.10)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) { const xpx = PADX + i * (W - PADX*2)/12; ctx.beginPath(); ctx.moveTo(xpx, PADY); ctx.lineTo(xpx, H - PADY); ctx.stroke(); }
    for (let i = 0; i <= 6; i++) { const ypx = PADY + i * (H - PADY*2)/6; ctx.beginPath(); ctx.moveTo(PADX, ypx); ctx.lineTo(W - PADX, ypx); ctx.stroke(); }

    // axes
    ctx.strokeStyle = "rgba(189,213,239,0.45)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText("x (weight)", W - 88, H - 8);
    ctx.fillText("loss", 8, 14);

    // loss curve
    ctx.beginPath(); ctx.strokeStyle = "#66ddff"; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 320; i++) {
      const x = xMin + (i / 320) * (xMax - xMin);
      const y = Math.min(lossMax, loss(x));
      const px = xToPx(x), py = yToPx(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // minimum marker
    ctx.strokeStyle = "rgba(155,209,79,0.6)"; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(xToPx(1.2), PADY); ctx.lineTo(xToPx(1.2), H - PADY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9bd14f"; ctx.fillText("minimum at x=1.2", xToPx(1.2) + 6, PADY + 12);

    // history trail
    if (state.history.length > 1) {
      ctx.strokeStyle = "rgba(255,198,94,0.45)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < state.history.length; i++) {
        const hx = state.history[i];
        if (!isFinite(hx)) continue;
        const px = xToPx(Math.max(xMin, Math.min(xMax, hx)));
        const py = yToPx(Math.min(lossMax, loss(hx)));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // dots
      for (let i = 0; i < state.history.length; i++) {
        const hx = state.history[i];
        if (!isFinite(hx)) continue;
        const px = xToPx(Math.max(xMin, Math.min(xMax, hx)));
        const py = yToPx(Math.min(lossMax, loss(hx)));
        ctx.fillStyle = i === state.history.length - 1 ? "#ffc65e" : "rgba(255,198,94,0.45)";
        ctx.beginPath(); ctx.arc(px, py, i === state.history.length - 1 ? 7 : 3.5, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // single starting dot
      const hx = state.history[0] ?? state.x;
      ctx.fillStyle = "#ffc65e";
      ctx.beginPath(); ctx.arc(xToPx(hx), yToPx(loss(hx)), 7, 0, Math.PI * 2); ctx.fill();
    }
  }

  reset();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Gradient Descent Playground" }), el("span", { class: "hint", text: "Drop the ball anywhere on the loss curve. Pick a learning rate. Step." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        startX.node, lr.node, btnRow,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Step takes one gradient step. Auto-train keeps stepping until you converge, diverge, or hit 80 steps.")
      ]),
      el("div", { class: "lab-stage" }, [canvas, readout, status])
    ]),
    el("div", { class: "challenge", style: { marginTop: "1rem" } }, [
      el("h3", { text: "Challenge · Settle in ≤10 steps" }),
      el("p", { class: "dim", text: "Pick a learning rate that gets the ball within 0.02 of the minimum in 10 steps or fewer. Earn the Rate Master badge. Hint: there's a sweet spot around lr ≈ 0.4–0.6." })
    ])
  ]);
}
