/**
 * Module 5 — Backpropagation Walkthrough
 *
 * A tiny 2-1-1 network (2 inputs → 1 hidden neuron → 1 output neuron, both
 * sigmoid). The user steps through forward pass → loss → backward pass →
 * weight update, with each stage highlighted on the diagram and explained
 * in the side panel. Then they can run a full training run on a single
 * (x, target) pair and watch the loss curve drop.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule } from "../data/modules.js";
import { visitModule, awardBadge } from "../core/progress.js";

const MOD_ID = "m5";

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function dSigmoid_from_y(y) { return y * (1 - y); }

const STAGES = [
  { id: "idle",    title: "Ready", text: "Hit Forward to push inputs through the network." },
  { id: "forward", title: "1. Forward pass", text: "Inputs flow left → right. Each neuron computes z (weighted sum + bias), then a = sigmoid(z)." },
  { id: "loss",    title: "2. Loss", text: "Compare the output to the target. We use squared error: L = ½(a_out − target)². Smaller is better." },
  { id: "backward",title: "3. Backward pass", text: "Compute how each weight affected the loss. dL/dw uses the chain rule: it's the product of the gradient flowing back from the loss times the local derivative at each step." },
  { id: "update",  title: "4. Weight update", text: "Each weight moves a tiny step against its gradient: w ← w − η · dL/dw. The network is a hair better than before." }
];

export function renderM5() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);
  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    walkthroughSection(),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "In one English sentence, what does the chain rule do for backpropagation?",
      options: [
        "It lets us compute each weight's effect on the loss by multiplying local derivatives along the path from that weight to the output.",
        "It makes the network deeper by chaining more layers together.",
        "It guarantees the gradient is always positive."
      ],
      answerIndex: 0,
      explanation: "Backprop is the chain rule applied repeatedly. Each layer's contribution to the loss is the product of its own local derivative and the gradient handed back from the layer in front of it."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "Why does it matter that we compute the backward pass AFTER the forward pass — could you do them in any order?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Core idea" }),
    el("h2", { text: "Backprop is the chain rule, organized." }),
    el("p", { class: "dim", text: "Forward to make a prediction. Compute loss. Then walk backward, asking at every weight: \"if I nudge you up a tiny bit, does the loss go up or down, and by how much?\" That number is the gradient. Subtract a fraction of it. Repeat." }),
    Why("Backprop is how every modern neural network learns. The math gets hairy in big networks but the recipe is identical to what you'll step through below."),
    Coach("Tap Forward, then Loss, then Backward, then Update — in that order. Each tap highlights the part of the diagram that's active and the side panel explains exactly what just happened.")
  ]);
}

function walkthroughSection() {
  // Network state. Inputs x1=1.0, x2=0.5. Target = 0.0. Initial weights spread.
  const net = {
    x1: 1.0, x2: 0.5, target: 0.0, lr: 0.5,
    w1: 0.6, w2: -0.4, b_h: 0.1,         // hidden neuron weights & bias
    w3: 0.8, b_o: -0.2,                  // output neuron weights & bias
    // intermediate values (computed during forward)
    z_h: 0, a_h: 0, z_o: 0, a_o: 0, L: 0,
    // gradients (computed during backward)
    dL_dao: 0, dL_dzo: 0, dL_dw3: 0, dL_dbo: 0,
    dL_dah: 0, dL_dzh: 0, dL_dw1: 0, dL_dw2: 0, dL_dbh: 0,
    stage: "idle",
    lossHistory: []
  };

  const targetSlider = Slider({ label: "target", min: 0, max: 1, step: 0.01, value: 0.0, format: v => fmt(v, 2) });
  const lrSlider     = Slider({ label: "learning rate η", min: 0.05, max: 3.0, step: 0.05, value: 0.5, format: v => fmt(v, 2) });

  const svg = makeNetSvg(net);
  const readout = el("div", { class: "lab-readout" });
  const explain = el("div", { class: "coach", style: { display: "block" } }, [el("span", { class: "icon", text: "◆ Stage" }), el("span", { class: "text", text: STAGES[0].text })]);
  const stageTitle = el("h3", { style: { margin: "0 0 0.3rem", color: "#66ddff" }, text: STAGES[0].title });

  const forwardBtn = el("button", { class: "btn btn-primary", type: "button" }, "Forward →");
  const lossBtn    = el("button", { class: "btn btn-soft", type: "button" }, "Loss");
  const backBtn    = el("button", { class: "btn btn-soft", type: "button" }, "← Backward");
  const updateBtn  = el("button", { class: "btn btn-kata", type: "button" }, "Update weights");
  const resetBtn   = el("button", { class: "btn btn-ghost", type: "button" }, "Reset");
  const trainBtn   = el("button", { class: "btn btn-gold", type: "button" }, "Auto-train 30 steps");

  const btnRow1 = el("div", { class: "row", style: { marginTop: "0.4rem" } }, [forwardBtn, lossBtn, backBtn, updateBtn]);
  const btnRow2 = el("div", { class: "row", style: { marginTop: "0.4rem" } }, [resetBtn, trainBtn]);

  // Loss history chart
  const lossCanvas = el("canvas", { width: "640", height: "120" });

  function forward() {
    net.target = Number(targetSlider.input.value);
    net.z_h = net.x1 * net.w1 + net.x2 * net.w2 + net.b_h;
    net.a_h = sigmoid(net.z_h);
    net.z_o = net.a_h * net.w3 + net.b_o;
    net.a_o = sigmoid(net.z_o);
    net.stage = "forward";
  }
  function computeLoss() {
    net.L = 0.5 * (net.a_o - net.target) ** 2;
    net.stage = "loss";
  }
  function backward() {
    net.dL_dao = (net.a_o - net.target);
    net.dL_dzo = net.dL_dao * dSigmoid_from_y(net.a_o);
    net.dL_dw3 = net.dL_dzo * net.a_h;
    net.dL_dbo = net.dL_dzo;
    net.dL_dah = net.dL_dzo * net.w3;
    net.dL_dzh = net.dL_dah * dSigmoid_from_y(net.a_h);
    net.dL_dw1 = net.dL_dzh * net.x1;
    net.dL_dw2 = net.dL_dzh * net.x2;
    net.dL_dbh = net.dL_dzh;
    net.stage = "backward";
  }
  function update() {
    const lr = Number(lrSlider.input.value);
    net.w1 -= lr * net.dL_dw1;
    net.w2 -= lr * net.dL_dw2;
    net.b_h -= lr * net.dL_dbh;
    net.w3 -= lr * net.dL_dw3;
    net.b_o -= lr * net.dL_dbo;
    net.stage = "update";
    net.lossHistory.push(net.L);
    if (net.lossHistory.length > 200) net.lossHistory.shift();
    if (net.L < 0.0005) awardBadge("backprop-belt");
  }

  function reset() {
    Object.assign(net, {
      w1: 0.6, w2: -0.4, b_h: 0.1, w3: 0.8, b_o: -0.2,
      z_h: 0, a_h: 0, z_o: 0, a_o: 0, L: 0,
      dL_dao: 0, dL_dzo: 0, dL_dw3: 0, dL_dbo: 0,
      dL_dah: 0, dL_dzh: 0, dL_dw1: 0, dL_dw2: 0, dL_dbh: 0,
      stage: "idle",
      lossHistory: []
    });
    refresh();
  }

  function refresh() {
    svg.update(net);
    const s = STAGES.find(s => s.id === net.stage) || STAGES[0];
    stageTitle.textContent = s.title;
    explain.lastChild.textContent = s.text;

    mount(readout,
      "x = [", hi(fmt(net.x1, 2)), ", ", hi(fmt(net.x2, 2)), "]   target=", hi(fmt(net.target, 2), "hi-gold"),
      el("br"),
      "hidden: z=", hi(fmt(net.z_h, 3)), "  a=", hi(fmt(net.a_h, 3)),
      "    output: z=", hi(fmt(net.z_o, 3)), "  a=", hi(fmt(net.a_o, 3), "hi-kata"),
      el("br"),
      "loss L = ", hi(fmt(net.L, 4), net.L < 0.01 ? "hi-kata" : "hi-warn"),
      "   weights → w1=", hi(fmt(net.w1, 2)), " w2=", hi(fmt(net.w2, 2)), " b_h=", hi(fmt(net.b_h, 2)),
      " w3=", hi(fmt(net.w3, 2)), " b_o=", hi(fmt(net.b_o, 2))
    );

    drawLossChart();
  }

  function drawLossChart() {
    const ctx = lossCanvas.getContext("2d");
    const W = lossCanvas.width, H = lossCanvas.height;
    ctx.clearRect(0, 0, W, H);
    const PADX = 28, PADY = 16;
    ctx.strokeStyle = "rgba(189,213,239,0.45)";
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText("training step", W - 96, H - 4);
    ctx.fillText("loss", 4, 12);

    if (net.lossHistory.length === 0) {
      ctx.fillStyle = "#8aa1bf"; ctx.font = "11px Inter, sans-serif";
      ctx.fillText("Hit Forward → Loss → Backward → Update (or Auto-train) to plot the loss curve.", PADX + 8, H / 2);
      return;
    }
    const maxL = Math.max(0.1, ...net.lossHistory);
    ctx.beginPath(); ctx.strokeStyle = "#66ddff"; ctx.lineWidth = 2;
    net.lossHistory.forEach((L, i) => {
      const px = PADX + (i / Math.max(1, net.lossHistory.length - 1)) * (W - PADX * 2);
      const py = (H - PADY) - (L / maxL) * (H - PADY * 2);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  forwardBtn.addEventListener("click", () => { forward(); refresh(); });
  lossBtn.addEventListener("click",    () => { if (net.stage === "idle") forward(); computeLoss(); refresh(); });
  backBtn.addEventListener("click",    () => { if (net.stage === "idle") { forward(); computeLoss(); } else if (net.stage === "forward") { computeLoss(); } backward(); refresh(); });
  updateBtn.addEventListener("click",  () => { if (net.stage !== "backward") { forward(); computeLoss(); backward(); } update(); refresh(); });
  resetBtn.addEventListener("click",   () => reset());
  trainBtn.addEventListener("click",   () => {
    for (let i = 0; i < 30; i++) { forward(); computeLoss(); backward(); update(); }
    refresh();
  });
  [targetSlider, lrSlider].forEach(s => s.input.addEventListener("input", refresh));

  refresh();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Step-Through Backprop" }), el("span", { class: "hint", text: "2-1-1 network. Inputs fixed at [1.0, 0.5]. Walk the four stages — or auto-train." })]),
    el("div", { class: "lab" }, [
      el("div", { class: "lab-controls" }, [
        targetSlider.node, lrSlider.node, btnRow1, btnRow2,
        el("p", { class: "muted", style: { fontSize: "0.8rem" } }, "Stages must run in order: Forward → Loss → Backward → Update. The diagram highlights the active part.")
      ]),
      el("div", { class: "lab-stage" }, [
        svg.node,
        el("div", {}, [stageTitle, explain]),
        readout
      ])
    ]),
    el("section", { class: "card", style: { marginTop: "1rem", background: "rgba(5,11,22,0.5)" } }, [
      el("p", { class: "eyebrow", text: "Loss over training steps" }),
      lossCanvas
    ])
  ]);
}

function makeNetSvg(net) {
  const NS = "http://www.w3.org/2000/svg";
  const W = 580, H = 260;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "lab-svg");
  svg.style.maxHeight = "240px";

  // nodes
  const x1n = { x: 60, y: 90 };
  const x2n = { x: 60, y: 180 };
  const hn  = { x: 260, y: 135 };
  const on  = { x: 460, y: 135 };
  const ln  = { x: 540, y: 135 }; // loss target marker

  function circle(cx, cy, r, fill, stroke, id) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    c.setAttribute("fill", fill); c.setAttribute("stroke", stroke); c.setAttribute("stroke-width", "1.5");
    if (id) c.setAttribute("id", id);
    return c;
  }
  function line(a, b, color, width, id) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
    l.setAttribute("stroke", color); l.setAttribute("stroke-width", width); l.setAttribute("stroke-linecap", "round");
    if (id) l.setAttribute("id", id);
    return l;
  }
  function text(x, y, str, color = "#ecf3ff", size = 11, anchor = "middle", id) {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", anchor);
    t.setAttribute("fill", color); t.setAttribute("font-size", size); t.setAttribute("font-family", "JetBrains Mono, monospace");
    t.textContent = str;
    if (id) t.setAttribute("id", id);
    return t;
  }

  // edges
  const e_x1h = line(x1n, hn, "rgba(102,221,255,0.7)", 2, "e_x1h");
  const e_x2h = line(x2n, hn, "rgba(102,221,255,0.7)", 2, "e_x2h");
  const e_ho  = line(hn, on,  "rgba(102,221,255,0.7)", 2, "e_ho");
  const e_ol  = line(on, ln,  "rgba(155,209,79,0.7)",   2, "e_ol");
  svg.append(e_x1h, e_x2h, e_ho, e_ol);

  // nodes
  svg.append(
    circle(x1n.x, x1n.y, 20, "rgba(102,221,255,0.12)", "rgba(120,190,255,0.5)"),
    circle(x2n.x, x2n.y, 20, "rgba(102,221,255,0.12)", "rgba(120,190,255,0.5)"),
    circle(hn.x, hn.y, 32, "rgba(155,209,79,0.18)", "rgba(155,209,79,0.7)", "h_node"),
    circle(on.x, on.y, 32, "rgba(155,209,79,0.18)", "rgba(155,209,79,0.7)", "o_node"),
    circle(ln.x, ln.y, 18, "rgba(255,198,94,0.18)", "rgba(255,198,94,0.7)", "l_node")
  );

  // labels (held by closure so we don't depend on getElementById)
  const lab_ah     = text(hn.x, hn.y + 12, "a=0.00", "#ecf3ff", 11);
  const lab_ao     = text(on.x, on.y + 12, "a=0.00", "#ecf3ff", 11);
  const lab_L      = text(ln.x, ln.y + 4, "L 0.00", "#ffc65e", 11);
  const lab_w1     = text((x1n.x + hn.x)/2, (x1n.y + hn.y)/2 - 6, "w₁ 0.00", "#66ddff", 10);
  const lab_w2     = text((x2n.x + hn.x)/2, (x2n.y + hn.y)/2 + 14, "w₂ 0.00", "#66ddff", 10);
  const lab_w3     = text((hn.x + on.x)/2, (hn.y + on.y)/2 - 6, "w₃ 0.00", "#66ddff", 10);
  const lab_target = text(540, 38, "0.00", "#ffc65e", 11);
  svg.append(
    text(x1n.x, x1n.y + 4, "x₁ 1.00"),
    text(x2n.x, x2n.y + 4, "x₂ 0.50"),
    text(hn.x, hn.y - 4, "hidden", "#9bd14f", 11),
    lab_ah,
    text(on.x, on.y - 4, "output", "#9bd14f", 11),
    lab_ao,
    lab_L,
    lab_w1, lab_w2, lab_w3,
    text(540, 26, "target", "#ffc65e", 10),
    lab_target
  );

  function highlight(stage) {
    // reset
    [e_x1h, e_x2h, e_ho].forEach(e => { e.setAttribute("stroke", "rgba(102,221,255,0.55)"); e.setAttribute("stroke-width", "2"); });
    e_ol.setAttribute("stroke", "rgba(155,209,79,0.55)");
    e_ol.setAttribute("stroke-width", "2");
    if (stage === "forward") {
      [e_x1h, e_x2h, e_ho].forEach(e => { e.setAttribute("stroke", "#66ddff"); e.setAttribute("stroke-width", "4"); });
    } else if (stage === "loss") {
      e_ol.setAttribute("stroke", "#ffc65e"); e_ol.setAttribute("stroke-width", "4");
    } else if (stage === "backward") {
      [e_ho, e_x1h, e_x2h].forEach(e => { e.setAttribute("stroke", "#ff7a7a"); e.setAttribute("stroke-width", "4"); });
    } else if (stage === "update") {
      [e_x1h, e_x2h, e_ho].forEach(e => { e.setAttribute("stroke", "#9bd14f"); e.setAttribute("stroke-width", "4"); });
    }
  }

  return {
    node: svg,
    update(net) {
      lab_ah.textContent      = "a=" + net.a_h.toFixed(3);
      lab_ao.textContent      = "a=" + net.a_o.toFixed(3);
      lab_L.textContent       = "L " + net.L.toFixed(3);
      lab_w1.textContent      = "w₁ " + net.w1.toFixed(2);
      lab_w2.textContent      = "w₂ " + net.w2.toFixed(2);
      lab_w3.textContent      = "w₃ " + net.w3.toFixed(2);
      lab_target.textContent  = net.target.toFixed(2);
      highlight(net.stage);
    }
  };
}
