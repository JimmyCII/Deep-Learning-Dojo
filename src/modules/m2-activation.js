/**
 * Module 2 — Activation Functions Lab
 *
 * Plot Sigmoid / Tanh / ReLU on the same canvas, toggle which ones are
 * visible, drag a probe to read all values at the same z, and toggle a
 * "show gradient" overlay so vanishing-gradient zones are visible.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge } from "../core/progress.js";

const MOD_ID = "m2";

const FNS = {
  sigmoid: { color: "#66ddff", f: (z) => 1 / (1 + Math.exp(-z)), d: (z) => { const s = 1/(1+Math.exp(-z)); return s*(1-s); }, label: "Sigmoid" },
  tanh:    { color: "#c399ff", f: (z) => Math.tanh(z), d: (z) => 1 - Math.tanh(z) ** 2, label: "Tanh" },
  relu:    { color: "#9bd14f", f: (z) => Math.max(0, z), d: (z) => z > 0 ? 1 : 0, label: "ReLU" }
};

export function renderM2() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    labSection(),
    softmaxSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "Your network is 30 layers deep and training has stalled — early layers' weights barely change. Which activation choice most likely caused this, and what would help?",
      options: [
        "Sigmoid; switch to ReLU because sigmoid saturates and its gradient is near zero for large |z|.",
        "ReLU; switch to sigmoid because ReLU's gradient is always 1.",
        "Tanh; switch to softmax in hidden layers."
      ],
      answerIndex: 0,
      explanation: "Sigmoid's gradient is at most 0.25 and vanishes for large |z|. In deep stacks this multiplies to near-zero gradients. ReLU keeps a gradient of 1 for positive inputs and trains much faster."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "When would you prefer Tanh over ReLU? Think about the output range."
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "Without a non-linearity, a deep network is just one big linear layer." }),
    el("p", { class: "dim", text: "An activation function is the kink or curve that gives a network its expressive power. Different activations have very different shapes — and very different gradients." }),
    Why("Picking the wrong activation can make training silently fail. Most modern hidden layers use ReLU or a close cousin; output layers usually use sigmoid (binary), softmax (multi-class), or none (regression)."),
    Coach("Below, toggle each function on and off. Then turn on Show Gradient — the dashed lines show how fast each function is changing at every point. Notice where they go flat. That's where learning slows to a crawl.")
  ]);
}

function labSection() {
  const visible = { sigmoid: true, tanh: true, relu: true };
  const showGrad = { value: false };

  const probe = Slider({ label: "probe z", min: -6, max: 6, step: 0.05, value: 0, format: v => fmt(v) });

  const toggles = el("div", { class: "toggle-group" }, Object.entries(FNS).map(([key, fn]) => {
    const b = el("button", {
      type: "button",
      class: visible[key] ? "on" : "",
      onclick: () => { visible[key] = !visible[key]; b.classList.toggle("on", visible[key]); draw(); }
    }, fn.label);
    return b;
  }));
  const gradBtn = el("button", {
    type: "button",
    class: "btn btn-soft",
    onclick: () => { showGrad.value = !showGrad.value; gradBtn.textContent = showGrad.value ? "Hide Gradient" : "Show Gradient"; draw(); }
  }, "Show Gradient");

  const canvas = el("canvas", { width: "640", height: "320" });
  const readout = el("div", { class: "lab-readout" });

  function draw() {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(120,190,255,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += H / 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // axes (origin in the middle vertically, slightly above)
    const ox = W / 2;
    const oy = H * 0.62;
    ctx.strokeStyle = "rgba(189,213,239,0.6)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();

    // axis labels
    ctx.fillStyle = "#8aa1bf"; ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText("z", W - 14, oy - 6);
    ctx.fillText("f(z)", ox + 6, 14);

    const zToPx = (z) => ox + (z / 6) * (W / 2 - 8);
    const yToPx = (y) => oy - y * (H * 0.35);

    for (const [key, fn] of Object.entries(FNS)) {
      if (!visible[key]) continue;

      // function
      ctx.beginPath();
      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2.5;
      for (let i = 0; i <= 400; i++) {
        const z = -6 + (i / 400) * 12;
        const y = fn.f(z);
        const px = zToPx(z), py = yToPx(y);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // gradient overlay
      if (showGrad.value) {
        ctx.beginPath();
        ctx.strokeStyle = fn.color;
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= 400; i++) {
          const z = -6 + (i / 400) * 12;
          const dy = fn.d(z);
          const px = zToPx(z), py = yToPx(dy);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // probe line
    const z = Number(probe.input.value);
    const probePx = zToPx(z);
    ctx.strokeStyle = "rgba(255,198,94,0.6)";
    ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(probePx, 0); ctx.lineTo(probePx, H); ctx.stroke(); ctx.setLineDash([]);

    // probe dots
    for (const [key, fn] of Object.entries(FNS)) {
      if (!visible[key]) continue;
      const y = fn.f(z);
      ctx.fillStyle = fn.color;
      ctx.beginPath(); ctx.arc(probePx, yToPx(y), 5, 0, Math.PI * 2); ctx.fill();
    }

    // legend
    let lx = 12, ly = 18;
    ctx.font = "12px Inter, sans-serif";
    for (const [key, fn] of Object.entries(FNS)) {
      ctx.fillStyle = visible[key] ? fn.color : "rgba(140,160,190,0.4)";
      ctx.fillRect(lx, ly - 8, 14, 3);
      ctx.fillText(fn.label, lx + 20, ly);
      lx += 90;
    }
    if (showGrad.value) {
      ctx.fillStyle = "#b7c9e3";
      ctx.fillText("(dashed = gradient)", lx + 4, ly);
    }

    // readout
    const parts = [];
    for (const [key, fn] of Object.entries(FNS)) {
      if (!visible[key]) continue;
      parts.push(`${fn.label} f=${fn.f(z).toFixed(3)} grad=${fn.d(z).toFixed(3)}`);
    }
    mount(readout, "at z=", hi(fmt(z, 2)), " · ", parts.join(" | "));

    // award badge once user explores both gradient view and at least one toggle
    if (showGrad.value) awardBadge("function-fluent");
  }

  probe.input.addEventListener("input", draw);

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Activation Comparison Lab" }), el("span", { class: "hint", text: "Toggle functions, drag the probe, flip on the gradient overlay to see where learning stalls." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        probe.node,
        el("p", { class: "eyebrow", text: "Show / hide" }),
        toggles,
        gradBtn,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Tip: pull probe out past z ≈ ±4 with gradient on. Watch sigmoid & tanh gradients collapse to zero. That's the vanishing-gradient problem in one picture.")
      ]),
      el("div", { class: "lab-stage" }, [canvas, readout])
    ])
  ]);
}

function softmaxSection() {
  // Three scores for softmax; user drags to see probabilities and confidence
  const s1 = Slider({ label: "score · cat", min: -3, max: 5, step: 0.1, value: 2.0, format: v => fmt(v, 1) });
  const s2 = Slider({ label: "score · dog", min: -3, max: 5, step: 0.1, value: 1.0, format: v => fmt(v, 1) });
  const s3 = Slider({ label: "score · fish", min: -3, max: 5, step: 0.1, value: -0.5, format: v => fmt(v, 1) });
  const bars = el("div", { style: { display: "grid", gap: "0.4rem", marginTop: "0.4rem" } });
  const readout = el("div", { class: "lab-readout" });

  function softmax(xs) {
    const m = Math.max(...xs);
    const exps = xs.map(x => Math.exp(x - m));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  function bar(label, color, prob) {
    const fill = el("div", { style: { width: (prob * 100).toFixed(1) + "%", height: "16px", borderRadius: "999px", background: color, transition: "width .25s" } });
    const track = el("div", { style: { height: "16px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" } }, [fill]);
    return el("div", {}, [
      el("div", { style: { display: "flex", justifyContent: "space-between", fontFamily: "JetBrains Mono, monospace", fontSize: "0.82rem" } }, [
        el("span", { text: label }),
        el("span", { text: (prob * 100).toFixed(1) + "%" })
      ]),
      track
    ]);
  }

  function refresh() {
    const xs = [Number(s1.input.value), Number(s2.input.value), Number(s3.input.value)];
    const ps = softmax(xs);
    bars.replaceChildren(
      bar("cat",  "#66ddff", ps[0]),
      bar("dog",  "#9bd14f", ps[1]),
      bar("fish", "#ffc65e", ps[2])
    );
    mount(readout,
      "softmax sums to ", hi("1.000", "hi-kata"),
      " · top class: ", hi(["cat","dog","fish"][ps.indexOf(Math.max(...ps))], "hi"),
      " at ", hi((Math.max(...ps) * 100).toFixed(1) + "%", "hi-gold")
    );
  }
  [s1, s2, s3].forEach(s => s.input.addEventListener("input", refresh));
  refresh();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Softmax Mini-Lab" }), el("span", { class: "hint", text: "How raw scores become class probabilities." })]),
    el("p", { class: "dim", text: "Softmax turns any set of real-valued scores into probabilities that sum to 1. The biggest score dominates exponentially — increasing one score quickly crushes the others." }),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [s1.node, s2.node, s3.node]),
      el("div", { class: "lab-stage" }, [bars, readout])
    ])
  ]);
}
