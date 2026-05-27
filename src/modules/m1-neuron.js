/**
 * Module 1 — Neuron Foundations
 *
 * Hands-on: live single-neuron simulator. Move input/weight/bias sliders,
 * watch the weighted sum, activation, and final output update in real time.
 * Challenge: tune the neuron to hit a randomized target output.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge, recordChallenge } from "../core/progress.js";

const MOD_ID = "m1";

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

export function renderM1() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    simulatorSection(),
    challengeSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "A neuron has weights [2, -1], bias 0.5, and inputs [1, 1]. What is its weighted sum (z)?",
      options: ["0.5", "1.5", "2.5", "-0.5"],
      answerIndex: 1,
      explanation: "z = 2·1 + (−1)·1 + 0.5 = 1.5. The bias shifts the result; the weights scale each input."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "In your own words, what does the bias actually let a neuron do?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "A neuron is just three steps." }),
    el("ol", { style: { lineHeight: 1.7, color: "#b7c9e3" } }, [
      el("li", { html: "<strong>Weighted sum.</strong> Multiply each input by its weight, add the bias. Call the result <code>z</code>." }),
      el("li", { html: "<strong>Activation.</strong> Squash <code>z</code> through a non-linear function (we'll use sigmoid here)." }),
      el("li", { html: "<strong>Output.</strong> The squashed number is the neuron's prediction." })
    ]),
    Why("Every layer in every modern network is a stack of these tiny units. Once you understand one neuron, the rest is composition."),
    Coach("Open the simulator below. Zero out x₂ and w₂ first (so the second input drops out of the sum). Then set x₁ = 1, w₁ = 2, and bias = 0. You should see z = 2 exactly, and the output land near 0.88. That's sigmoid(2).")
  ]);
}

function simulatorSection() {
  // sliders
  const x1 = Slider({ label: "x₁ (input 1)", min: -2, max: 2, step: 0.05, value: 0.6, format: v => fmt(v) });
  const x2 = Slider({ label: "x₂ (input 2)", min: -2, max: 2, step: 0.05, value: -0.3, format: v => fmt(v) });
  const w1 = Slider({ label: "w₁ (weight 1)", min: -3, max: 3, step: 0.05, value: 1.5, format: v => fmt(v) });
  const w2 = Slider({ label: "w₂ (weight 2)", min: -3, max: 3, step: 0.05, value: -1.2, format: v => fmt(v) });
  const b  = Slider({ label: "bias", min: -2, max: 2, step: 0.05, value: 0.2, format: v => fmt(v) });

  const readout = el("div", { class: "lab-readout" });
  const svg = makeNeuronSvg();

  const ctrl = el("div", { class: "lab-controls" }, [x1.node, x2.node, w1.node, w2.node, b.node]);

  function compute() {
    const vx1 = Number(x1.input.value), vx2 = Number(x2.input.value);
    const vw1 = Number(w1.input.value), vw2 = Number(w2.input.value);
    const vb  = Number(b.input.value);
    const z = vx1 * vw1 + vx2 * vw2 + vb;
    const y = sigmoid(z);

    // Update SVG labels and edge widths
    svg.update({ x1: vx1, x2: vx2, w1: vw1, w2: vw2, b: vb, z, y });

    mount(readout,
      "z = ", hi(fmt(vx1, 2)), "·", hi(fmt(vw1, 2)), " + ",
      hi(fmt(vx2, 2)), "·", hi(fmt(vw2, 2)), " + ", hi(fmt(vb, 2)),
      " = ", hi(fmt(z, 3)),
      el("br"),
      "output = sigmoid(z) = ", hi(fmt(y, 4), "hi-kata")
    );
  }

  [x1, x2, w1, w2, b].forEach(s => s.input.addEventListener("input", compute));
  compute();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Single-Neuron Simulator" }), el("span", { class: "hint", text: "Drag any slider. Watch the diagram and the math update live." })]),
    el("div", { class: "lab" }, [ctrl, el("div", { class: "lab-stage" }, [svg.node, readout])])
  ]);
}

function makeNeuronSvg() {
  const NS = "http://www.w3.org/2000/svg";
  const w = 520, h = 280;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("class", "lab-svg");

  // Inputs at left, neuron at center, output at right
  const x1c = { x: 60, y: 80 };
  const x2c = { x: 60, y: 200 };
  const bc  = { x: 60, y: 140 };
  const nc  = { x: 290, y: 140 };
  const yc  = { x: 470, y: 140 };

  function circle(cx, cy, r, fill, stroke = "rgba(120,190,255,0.5)") {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    c.setAttribute("fill", fill); c.setAttribute("stroke", stroke); c.setAttribute("stroke-width", "1.5");
    return c;
  }
  function line(a, b, color = "rgba(120,190,255,0.55)", width = 2) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
    l.setAttribute("stroke", color); l.setAttribute("stroke-width", width); l.setAttribute("stroke-linecap", "round");
    return l;
  }
  function text(x, y, str, color = "#ecf3ff", size = 13, anchor = "middle") {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", anchor);
    t.setAttribute("fill", color); t.setAttribute("font-size", size); t.setAttribute("font-family", "JetBrains Mono, monospace");
    t.textContent = str;
    return t;
  }

  const edge1 = line(x1c, nc); const edge2 = line(x2c, nc); const edgeB = line(bc, nc, "rgba(255,198,94,0.8)", 1.5); const edgeOut = line(nc, yc, "rgba(155,209,79,0.9)", 3);
  svg.appendChild(edgeB); svg.appendChild(edge1); svg.appendChild(edge2); svg.appendChild(edgeOut);

  svg.appendChild(circle(x1c.x, x1c.y, 22, "rgba(102,221,255,0.12)"));
  svg.appendChild(circle(x2c.x, x2c.y, 22, "rgba(102,221,255,0.12)"));
  svg.appendChild(circle(bc.x, bc.y, 16, "rgba(255,198,94,0.18)", "rgba(255,198,94,0.6)"));
  svg.appendChild(circle(nc.x, nc.y, 36, "rgba(155,209,79,0.18)", "rgba(155,209,79,0.7)"));
  svg.appendChild(circle(yc.x, yc.y, 26, "rgba(155,209,79,0.28)", "rgba(155,209,79,0.9)"));

  const x1lab = text(x1c.x, x1c.y + 5, "x₁ 0.00");
  const x2lab = text(x2c.x, x2c.y + 5, "x₂ 0.00");
  const blab  = text(bc.x, bc.y + 5, "b 0.00", "#ffc65e");
  const w1lab = text((x1c.x + nc.x) / 2, (x1c.y + nc.y) / 2 - 6, "w₁ 0.00", "#66ddff", 12);
  const w2lab = text((x2c.x + nc.x) / 2, (x2c.y + nc.y) / 2 + 14, "w₂ 0.00", "#66ddff", 12);
  const zlab  = text(nc.x, nc.y - 4, "z = 0", "#ecf3ff", 12);
  const ylab2 = text(nc.x, nc.y + 14, "σ", "#9bd14f", 12);
  const ylab  = text(yc.x, yc.y + 6, "0.00", "#9bd14f", 14);
  const yCap  = text(yc.x, yc.y + 50, "output ŷ", "#b7c9e3", 11);

  [x1lab, x2lab, blab, w1lab, w2lab, zlab, ylab2, ylab, yCap].forEach(t => svg.appendChild(t));

  function setEdge(line, val) {
    const mag = Math.min(8, Math.max(1, Math.abs(val) * 2 + 1));
    line.setAttribute("stroke-width", mag);
    line.setAttribute("stroke", val >= 0 ? "rgba(102,221,255,0.85)" : "rgba(255,122,122,0.85)");
  }

  return {
    node: svg,
    update({ x1, x2, w1, w2, b, z, y }) {
      x1lab.textContent = `x₁ ${x1.toFixed(2)}`;
      x2lab.textContent = `x₂ ${x2.toFixed(2)}`;
      blab.textContent  = `b ${b.toFixed(2)}`;
      w1lab.textContent = `w₁ ${w1.toFixed(2)}`;
      w2lab.textContent = `w₂ ${w2.toFixed(2)}`;
      zlab.textContent  = `z=${z.toFixed(2)}`;
      ylab.textContent  = y.toFixed(3);
      setEdge(edge1, w1); setEdge(edge2, w2);
    }
  };
}

// ---------- Challenge ----------

function challengeSection() {
  const target = (() => {
    // pick a target between 0.15 and 0.85 so it's reachable
    return Math.round((0.2 + Math.random() * 0.6) * 100) / 100;
  })();

  // Fixed inputs for the challenge so the user only tunes weights/bias
  const xs = { x1: 0.8, x2: -0.4 };

  const w1 = Slider({ label: "w₁", min: -3, max: 3, step: 0.05, value: 0, format: v => fmt(v) });
  const w2 = Slider({ label: "w₂", min: -3, max: 3, step: 0.05, value: 0, format: v => fmt(v) });
  const b  = Slider({ label: "bias", min: -2, max: 2, step: 0.05, value: 0, format: v => fmt(v) });

  const meter = el("div", { class: "target-meter" }, [el("div", { style: { width: "0%" } })]);
  const readout = el("div", { class: "lab-readout" });
  const status = el("p", { class: "muted", style: { marginTop: "0.5rem" } });
  const passed = { value: false };

  function tick() {
    const vw1 = Number(w1.input.value);
    const vw2 = Number(w2.input.value);
    const vb  = Number(b.input.value);
    const z = xs.x1 * vw1 + xs.x2 * vw2 + vb;
    const y = sigmoid(z);
    const diff = Math.abs(y - target);
    const pct = Math.max(0, 100 - diff * 200); // closer to target = higher pct
    meter.firstChild.style.width = pct.toFixed(0) + "%";

    mount(readout,
      "fixed inputs x₁=", hi(fmt(xs.x1, 2)), ", x₂=", hi(fmt(xs.x2, 2)),
      el("br"),
      "your output = ", hi(fmt(y, 4), "hi-kata"),
      "   target = ", hi(fmt(target, 2), "hi-gold"),
      "   |Δ| = ", hi(fmt(diff, 4), diff < 0.02 ? "hi-kata" : "hi-warn")
    );

    if (diff < 0.02 && !passed.value) {
      passed.value = true;
      status.textContent = "Locked on. Nice tune.";
      status.style.color = "#9bd14f";
      const isNew = recordChallenge(MOD_ID, 100 - diff * 100);
      if (isNew) awardBadge("first-rep");
    } else if (passed.value && diff >= 0.02) {
      passed.value = false;
      status.textContent = "Drifted off — get back within ±0.02 of the target.";
      status.style.color = "#ffc65e";
    } else if (!passed.value) {
      status.textContent = `Aim for within ±0.02 of ${target.toFixed(2)}.`;
      status.style.color = "#b7c9e3";
    }
  }

  [w1, w2, b].forEach(s => s.input.addEventListener("input", tick));
  tick();

  return el("section", { class: "challenge" }, [
    el("h3", { text: "Challenge · Tune the Neuron" }),
    el("p", { class: "dim", text: `Inputs are locked. Move w₁, w₂, and bias until the neuron's output is within ±0.02 of the target (${target.toFixed(2)}). Earn the First Rep badge.` }),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [w1.node, w2.node, b.node]),
      el("div", { class: "lab-stage" }, [meter, readout, status])
    ])
  ]);
}
