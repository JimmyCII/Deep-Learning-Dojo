/**
 * Module 6 — Classification Lab
 *
 * Three datasets on a 2D point canvas: linearly separable, XOR, and circles.
 * Toggle between a single perceptron (straight boundary) and a small
 * 2-hidden-neuron network (curved boundary). The boundary is computed
 * live by sampling the network across the canvas — no real training,
 * just demonstrate why hidden layers matter.
 *
 * Challenge: pick the XOR dataset, enable the hidden layer, then tune
 * the hidden-layer weights so the boundary correctly classifies all 4 corners.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge, recordChallenge } from "../core/progress.js";

const MOD_ID = "m6";

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function relu(z) { return Math.max(0, z); }

const DATASETS = {
  linear: {
    name: "Linearly separable",
    points: [
      { x: -0.7, y: -0.6, label: 0 }, { x: -0.5, y: -0.2, label: 0 },
      { x: -0.3, y: -0.7, label: 0 }, { x: -0.6, y: 0.0, label: 0 },
      { x: 0.4, y: 0.5, label: 1 },   { x: 0.7, y: 0.2, label: 1 },
      { x: 0.5, y: 0.7, label: 1 },   { x: 0.6, y: 0.0, label: 1 }
    ]
  },
  xor: {
    name: "XOR (the classic)",
    points: [
      { x: -0.7, y: -0.7, label: 0 },
      { x:  0.7, y:  0.7, label: 0 },
      { x: -0.7, y:  0.7, label: 1 },
      { x:  0.7, y: -0.7, label: 1 }
    ]
  },
  circle: {
    name: "Inside / outside circle",
    points: (() => {
      const pts = [];
      // inside
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        pts.push({ x: 0.25 * Math.cos(a), y: 0.25 * Math.sin(a), label: 1 });
      }
      // outside
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        pts.push({ x: 0.85 * Math.cos(a), y: 0.85 * Math.sin(a), label: 0 });
      }
      return pts;
    })()
  }
};

export function renderM6() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    classificationSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "Why can a single perceptron never solve XOR no matter how you tune w₁, w₂, and bias?",
      options: [
        "Because XOR has only 4 points — too few to train.",
        "Because XOR's two classes cannot be separated by any single straight line. A perceptron's boundary is always linear.",
        "Because sigmoid saturates around 0 and 1."
      ],
      answerIndex: 1,
      explanation: "XOR's two classes sit on opposite diagonals. No single line splits them. A hidden layer learns intermediate features (combinations like 'x XOR y') that the output layer can then separate linearly."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "When you turned on the hidden layer for XOR, what did the boundary do? Why?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "A boundary is what a classifier draws between classes." }),
    el("p", { class: "dim", text: "For a single neuron, that boundary is a straight line. For a network with even one tiny hidden layer, the boundary can curve, kink, and wrap around — that's what hidden layers buy you." }),
    Why("Almost no real-world classification problem is linearly separable. \"Is this email spam?\" \"Is this transaction fraud?\" \"Is this tumor benign?\" — none of these split cleanly with a straight line. Hidden layers are how networks model that complexity."),
    Coach("Start with Linearly separable + perceptron. Tune the weights so the line splits the points. Then switch to XOR and try with just the perceptron — you'll see it's impossible. Flip on Hidden Layer. Now you have enough flexibility.")
  ]);
}

function classificationSection() {
  const state = {
    dataset: "linear",
    useHidden: false,
    // perceptron weights (output layer)
    w1: 1.0, w2: 1.0, b: 0.0,
    // hidden layer (2 neurons)
    h1_w1: 1.0, h1_w2: 1.0, h1_b: -0.5,
    h2_w1: 1.0, h2_w2: -1.0, h2_b: 0.5,
    // output layer when hidden is on (combines the two hidden activations)
    o_w1: 1.5, o_w2: -1.5, o_b: -0.5
  };

  const canvas = el("canvas", { width: "440", height: "440" });
  const readout = el("div", { class: "lab-readout" });
  const status = el("p", { class: "muted", style: { marginTop: "0.4rem", minHeight: "1.2em" } });

  // Dataset toggle
  const dsRow = el("div", { class: "toggle-group" }, ["linear", "xor", "circle"].map(k => {
    const b = el("button", {
      type: "button",
      class: state.dataset === k ? "on" : "",
      onclick: () => {
        state.dataset = k;
        document.querySelectorAll(`[data-ds]`).forEach(btn => btn.classList.toggle("on", btn.dataset.ds === k));
        draw();
      },
      "data-ds": k
    }, DATASETS[k].name.split(" ")[0]);
    return b;
  }));

  // Hidden-layer toggle
  const hiddenBtn = el("button", {
    type: "button",
    class: "btn btn-soft",
    onclick: () => {
      state.useHidden = !state.useHidden;
      hiddenBtn.textContent = state.useHidden ? "Disable Hidden Layer" : "Enable Hidden Layer";
      hiddenControlsBox.style.display = state.useHidden ? "" : "none";
      perceptronControlsBox.style.display = state.useHidden ? "none" : "";
      draw();
    }
  }, "Enable Hidden Layer");

  // Perceptron sliders
  const w1 = Slider({ label: "w₁", min: -3, max: 3, step: 0.05, value: 1.0, format: v => fmt(v, 2) });
  const w2 = Slider({ label: "w₂", min: -3, max: 3, step: 0.05, value: 1.0, format: v => fmt(v, 2) });
  const bb = Slider({ label: "bias", min: -2, max: 2, step: 0.05, value: 0.0, format: v => fmt(v, 2) });
  const perceptronControlsBox = el("div", {}, [w1.node, w2.node, bb.node]);

  // Hidden layer sliders
  const h1w1 = Slider({ label: "h₁ · w₁", min: -3, max: 3, step: 0.1, value: 1.0, format: v => fmt(v, 1) });
  const h1w2 = Slider({ label: "h₁ · w₂", min: -3, max: 3, step: 0.1, value: 1.0, format: v => fmt(v, 1) });
  const h1b  = Slider({ label: "h₁ · bias", min: -2, max: 2, step: 0.1, value: -0.5, format: v => fmt(v, 1) });
  const h2w1 = Slider({ label: "h₂ · w₁", min: -3, max: 3, step: 0.1, value: 1.0, format: v => fmt(v, 1) });
  const h2w2 = Slider({ label: "h₂ · w₂", min: -3, max: 3, step: 0.1, value: -1.0, format: v => fmt(v, 1) });
  const h2b  = Slider({ label: "h₂ · bias", min: -2, max: 2, step: 0.1, value: 0.5, format: v => fmt(v, 1) });
  const ow1 = Slider({ label: "out · w₁", min: -3, max: 3, step: 0.1, value: 1.5, format: v => fmt(v, 1) });
  const ow2 = Slider({ label: "out · w₂", min: -3, max: 3, step: 0.1, value: -1.5, format: v => fmt(v, 1) });
  const ob  = Slider({ label: "out · bias", min: -2, max: 2, step: 0.1, value: -0.5, format: v => fmt(v, 1) });
  const hiddenControlsBox = el("div", { style: { display: "none" } }, [h1w1.node, h1w2.node, h1b.node, h2w1.node, h2w2.node, h2b.node, ow1.node, ow2.node, ob.node]);

  // Preset: known XOR solution
  const presetBtn = el("button", { class: "btn btn-gold", type: "button", onclick: () => {
    state.useHidden = true; hiddenBtn.textContent = "Disable Hidden Layer";
    hiddenControlsBox.style.display = ""; perceptronControlsBox.style.display = "none";
    state.dataset = "xor";
    document.querySelectorAll(`[data-ds]`).forEach(btn => btn.classList.toggle("on", btn.dataset.ds === "xor"));
    // a known-good XOR solution with sigmoid + 2 hidden + 1 output
    h1w1.setValue(2.0); h1w2.setValue(2.0); h1b.setValue(-1.0);
    h2w1.setValue(-2.0); h2w2.setValue(-2.0); h2b.setValue(3.0);
    ow1.setValue(2.0); ow2.setValue(2.0); ob.setValue(-3.0);
    draw();
  } }, "Cheat: load XOR solution");

  function predict(x, y) {
    if (!state.useHidden) {
      return sigmoid(state.w1 * x + state.w2 * y + state.b);
    } else {
      const a1 = sigmoid(state.h1_w1 * x + state.h1_w2 * y + state.h1_b);
      const a2 = sigmoid(state.h2_w1 * x + state.h2_w2 * y + state.h2_b);
      return sigmoid(state.o_w1 * a1 + state.o_w2 * a2 + state.o_b);
    }
  }

  function syncState() {
    state.w1 = Number(w1.input.value); state.w2 = Number(w2.input.value); state.b = Number(bb.input.value);
    state.h1_w1 = Number(h1w1.input.value); state.h1_w2 = Number(h1w2.input.value); state.h1_b = Number(h1b.input.value);
    state.h2_w1 = Number(h2w1.input.value); state.h2_w2 = Number(h2w2.input.value); state.h2_b = Number(h2b.input.value);
    state.o_w1 = Number(ow1.input.value); state.o_w2 = Number(ow2.input.value); state.o_b = Number(ob.input.value);
  }

  function draw() {
    syncState();
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // background prob heatmap (coarse)
    const cell = 10;
    for (let px = 0; px < W; px += cell) {
      for (let py = 0; py < H; py += cell) {
        const x = (px / W) * 2 - 1;
        const y = 1 - (py / H) * 2;
        const p = predict(x, y);
        // tint
        if (p >= 0.5) {
          ctx.fillStyle = `rgba(102,221,255,${0.10 + (p - 0.5) * 0.32})`;
        } else {
          ctx.fillStyle = `rgba(255,198,94,${0.10 + (0.5 - p) * 0.32})`;
        }
        ctx.fillRect(px, py, cell, cell);
      }
    }

    // axes
    ctx.strokeStyle = "rgba(189,213,239,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();

    // points
    let correct = 0;
    const pts = DATASETS[state.dataset].points;
    pts.forEach(p => {
      const px = ((p.x + 1) / 2) * W;
      const py = (1 - (p.y + 1) / 2) * H;
      const pred = predict(p.x, p.y) >= 0.5 ? 1 : 0;
      if (pred === p.label) correct++;
      // dot color = true label, ring color = prediction match
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? "#66ddff" : "#ffc65e";
      ctx.fill();
      ctx.strokeStyle = pred === p.label ? "#9bd14f" : "#ff7a7a";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    mount(readout,
      "dataset: ", hi(DATASETS[state.dataset].name),
      "  ·  ", state.useHidden ? hi("with hidden layer", "hi-kata") : hi("perceptron only", "hi"),
      el("br"),
      "accuracy: ", hi(`${correct}/${pts.length}`, correct === pts.length ? "hi-kata" : (correct >= pts.length * 0.75 ? "hi-gold" : "hi-warn"))
    );

    if (correct === pts.length) {
      status.textContent = "Perfect classification.";
      status.style.color = "#9bd14f";
      if (state.dataset === "xor" && state.useHidden) {
        const isNew = recordChallenge(MOD_ID, 100);
        if (isNew) awardBadge("boundary-breaker");
      }
    } else if (correct >= pts.length * 0.75) {
      status.textContent = `Close — ${correct}/${pts.length}. Keep tuning.`;
      status.style.color = "#ffc65e";
    } else {
      status.textContent = `${pts.length - correct} misclassified.`;
      status.style.color = "#b7c9e3";
    }
  }

  [w1, w2, bb, h1w1, h1w2, h1b, h2w1, h2w2, h2b, ow1, ow2, ob].forEach(s => s.input.addEventListener("input", draw));

  draw();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Decision Boundary Lab" }), el("span", { class: "hint", text: "Cyan = class 1, gold = class 0. Background tint = network's confidence." })]),
    el("p", { class: "eyebrow", style: { marginTop: "0.4rem" } }, "Dataset"),
    dsRow,
    el("div", { class: "row", style: { marginTop: "0.5rem" } }, [hiddenBtn, presetBtn]),
    el("div", { class: "lab", style: { marginTop: "0.6rem" } }, [
      el("div", { class: "lab-controls" }, [
        perceptronControlsBox,
        hiddenControlsBox,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Outline ring on each point = green if classified correctly, red if not.")
      ]),
      el("div", { class: "lab-stage" }, [canvas, readout, status])
    ]),
    el("div", { class: "challenge", style: { marginTop: "1rem" } }, [
      el("h3", { text: "Challenge · Solve XOR with hidden layers" }),
      el("p", { class: "dim", text: "Switch to the XOR dataset, enable the Hidden Layer, and tune the hidden + output weights until all 4 corners classify correctly. (Hit the Cheat button if you want to see one valid solution and then reverse-engineer it.) Earns the Boundary Breaker badge." })
    ])
  ]);
}
