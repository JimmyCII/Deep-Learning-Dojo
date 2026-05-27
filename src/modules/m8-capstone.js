/**
 * Module 8 — Capstone Mission: Train the Data Ninja Model
 *
 * The synthesis module. The learner picks architecture (hidden size 0/2/4/8),
 * activation (sigmoid/tanh/ReLU), and learning rate, then ACTUALLY trains a
 * small network on a 2D classification dataset with real gradient descent.
 * A held-out validation set is used to gate the Black Belt:
 *   - achieve ≥90% validation accuracy → Black Belt + 200 XP grant via the
 *     standard ModuleFooter complete button.
 *
 * Capstone is locked until Modules 1–7 are completed.
 */

import { el, fmt, hi, mount } from "../core/ui.js";
import { Slider } from "../components/slider.js";
import { Quiz } from "../components/quiz.js";
import { Reflection } from "../components/reflection.js";
import { TermChips } from "../components/terms.js";
import { ModuleHero, ModuleFooter, Coach, Why } from "../components/moduleShell.js";
import { getModule, MODULES } from "../data/modules.js";
import { visitModule, awardBadge, isComplete } from "../core/progress.js";

const MOD_ID = "m8";

// ---------- Math ----------

const ACTIVATIONS = {
  sigmoid: { f: (z) => 1 / (1 + Math.exp(-z)), d_from_y: (y) => y * (1 - y) },
  tanh:    { f: (z) => Math.tanh(z),           d_from_y: (y) => 1 - y * y },
  relu:    { f: (z) => Math.max(0, z),         d_from_y: (y) => y > 0 ? 1 : 0 }
};

function randSeeded(seed) {
  // mulberry32
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDataset(seed = 7) {
  const rng = randSeeded(seed);
  // two interlocking moons
  const train = [], val = [];
  const N = 80;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI;
    const noise = () => (rng() - 0.5) * 0.18;
    train.push({ x: Math.cos(t) - 0.3 + noise(), y: Math.sin(t) + noise(), label: 1 });
    train.push({ x: 1 - Math.cos(t) - 0.3 + noise(), y: -Math.sin(t) + 0.3 + noise(), label: 0 });
  }
  for (let i = 0; i < 40; i++) {
    const t = (rng()) * Math.PI;
    const noise = () => (rng() - 0.5) * 0.18;
    val.push({ x: Math.cos(t) - 0.3 + noise(), y: Math.sin(t) + noise(), label: 1 });
    val.push({ x: 1 - Math.cos(t) - 0.3 + noise(), y: -Math.sin(t) + 0.3 + noise(), label: 0 });
  }
  return { train, val };
}

/**
 * 2-H-1 fully connected network with selectable hidden size and activation.
 * Output uses sigmoid + cross-entropy loss.
 */
class TinyNet {
  constructor({ hidden, activation, seed = 11 }) {
    this.hidden = hidden;
    this.act = ACTIVATIONS[activation];
    this.activationName = activation;
    const rng = randSeeded(seed);
    const rand = () => (rng() * 2 - 1) * 0.7;

    if (hidden === 0) {
      // logistic regression
      this.Wout = [rand(), rand()]; this.bout = rand();
    } else {
      this.W1 = Array.from({ length: hidden }, () => [rand(), rand()]);
      this.b1 = Array.from({ length: hidden }, () => rand());
      this.Wout = Array.from({ length: hidden }, () => rand());
      this.bout = rand();
    }
  }

  forward(x, y) {
    if (this.hidden === 0) {
      const z = this.Wout[0] * x + this.Wout[1] * y + this.bout;
      const p = ACTIVATIONS.sigmoid.f(z);
      return { hAct: null, p };
    } else {
      const hAct = new Array(this.hidden);
      for (let i = 0; i < this.hidden; i++) {
        const z = this.W1[i][0] * x + this.W1[i][1] * y + this.b1[i];
        hAct[i] = this.act.f(z);
      }
      let zo = this.bout;
      for (let i = 0; i < this.hidden; i++) zo += this.Wout[i] * hAct[i];
      const p = ACTIVATIONS.sigmoid.f(zo);
      return { hAct, p };
    }
  }

  /** One step of gradient descent on a single example. Cross-entropy loss. */
  step(x, y, label, lr) {
    const { hAct, p } = this.forward(x, y);
    // dL/dzo = (p - label) for sigmoid + BCE
    const dzo = p - label;

    if (this.hidden === 0) {
      this.Wout[0] -= lr * dzo * x;
      this.Wout[1] -= lr * dzo * y;
      this.bout   -= lr * dzo;
    } else {
      // hidden gradients
      for (let i = 0; i < this.hidden; i++) {
        const dWout_i = dzo * hAct[i];
        const dhi = dzo * this.Wout[i] * this.act.d_from_y(hAct[i]);
        // update W1[i]
        this.W1[i][0] -= lr * dhi * x;
        this.W1[i][1] -= lr * dhi * y;
        this.b1[i]   -= lr * dhi;
        this.Wout[i] -= lr * dWout_i;
      }
      this.bout -= lr * dzo;
    }
    // return per-example loss (cross-entropy)
    const eps = 1e-9;
    const L = -(label * Math.log(p + eps) + (1 - label) * Math.log(1 - p + eps));
    return L;
  }

  predict(x, y) { return this.forward(x, y).p; }
}

function accuracy(net, ds) {
  let correct = 0;
  for (const p of ds) {
    const pred = net.predict(p.x, p.y) >= 0.5 ? 1 : 0;
    if (pred === p.label) correct++;
  }
  return correct / ds.length;
}

function meanLoss(net, ds) {
  let total = 0;
  const eps = 1e-9;
  for (const p of ds) {
    const pp = net.predict(p.x, p.y);
    total += -(p.label * Math.log(pp + eps) + (1 - p.label) * Math.log(1 - pp + eps));
  }
  return total / ds.length;
}

// ---------- View ----------

export function renderM8() {
  visitModule(MOD_ID);
  const mod = getModule(MOD_ID);

  // Capstone gate: require Modules 1–7 complete
  const prereqs = MODULES.filter(m => m.id !== "m8");
  const completedCount = prereqs.filter(m => isComplete(m.id)).length;
  const unlocked = completedCount >= prereqs.length;

  return el("div", {}, [
    ModuleHero(mod),
    coreIdeaSection(),
    unlocked ? capstoneSection() : lockedSection(completedCount, prereqs.length),
    TermChips(mod.keyTerms),
    Quiz({
      moduleId: MOD_ID,
      question: "You hit 92% validation accuracy on the moons dataset but only 71% on a fresh dataset from the same distribution. Most likely problem?",
      options: [
        "Your model is too small — add more hidden neurons.",
        "Your validation set was probably too small or too correlated with training, so 92% wasn't an honest estimate. Re-split and re-evaluate.",
        "You used the wrong activation."
      ],
      answerIndex: 1,
      explanation: "When test-time performance is way below validation, the validation set wasn't representative. Bigger, more diverse, properly randomized splits give honest numbers."
    }),
    Reflection({
      moduleId: MOD_ID,
      prompt: "Looking back at the whole dojo: which single concept clicked the hardest for you, and where did it click — the slider, the diagram, the challenge, or the explanation?"
    }),
    ModuleFooter(mod)
  ]);
}

function coreIdeaSection() {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Capstone mission" }),
    el("h2", { text: "Configure a network. Train it. Win." }),
    el("p", { class: "dim", text: "This is the synthesis. You'll pick a hidden size, an activation, and a learning rate, then actually train a small network on a two-moons classification problem using real gradient descent. Beat 90% validation accuracy and you've earned the Black Belt." }),
    Why("Every choice you'll make here — architecture, activation, learning rate, when to stop — is the same set of choices that determines whether real-world models work or don't. Just scaled up."),
    Coach("Start with: hidden=4, activation=tanh, lr=0.3. Hit Train 500 epochs. You should land somewhere around 90% validation accuracy. From there, experiment with what makes it better or worse.")
  ]);
}

function lockedSection(done, total) {
  return el("section", { class: "card" }, [
    el("p", { class: "eyebrow", text: "Locked" }),
    el("h2", { text: `Complete Modules 1–7 first  (${done}/${total} done)` }),
    el("p", { class: "dim", text: "The capstone synthesizes every previous module — the lab won't make sense without those reps. Train them first, then come back here for the Black Belt." }),
    el("a", { class: "btn btn-primary", href: "#/dashboard", text: "Back to the Dojo" })
  ]);
}

function capstoneSection() {
  const state = {
    dataset: makeDataset(7),
    net: null,
    hidden: 4,
    activation: "tanh",
    lr: 0.3,
    history: [], // { epoch, trainLoss, valLoss, trainAcc, valAcc }
    epoch: 0,
    timer: null,
    bestVal: 0
  };

  function rebuild() {
    state.net = new TinyNet({ hidden: state.hidden, activation: state.activation, seed: 11 });
    state.history = []; state.epoch = 0; state.bestVal = 0;
    refresh();
  }

  // Controls
  const hiddenToggle = el("div", { class: "toggle-group" }, [0, 2, 4, 8].map(h => el("button", {
    type: "button",
    class: state.hidden === h ? "on" : "",
    onclick: () => { state.hidden = h; hiddenToggle.querySelectorAll("button").forEach(b => b.classList.toggle("on", Number(b.textContent) === h)); rebuild(); }
  }, String(h))));

  const actToggle = el("div", { class: "toggle-group" }, ["sigmoid", "tanh", "relu"].map(a => el("button", {
    type: "button",
    class: state.activation === a ? "on" : "",
    onclick: () => { state.activation = a; actToggle.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.textContent === a)); rebuild(); }
  }, a)));

  const lrSlider = Slider({ label: "learning rate η", min: 0.01, max: 1.5, step: 0.01, value: 0.3, format: v => fmt(v, 2) });
  lrSlider.input.addEventListener("input", () => { state.lr = Number(lrSlider.input.value); });

  const trainBtn   = el("button", { class: "btn btn-primary", type: "button" }, "Train 500 epochs");
  const continueBtn = el("button", { class: "btn btn-soft", type: "button" }, "+200 more");
  const resetBtn   = el("button", { class: "btn btn-ghost", type: "button" }, "Reset weights");
  const newSeedBtn = el("button", { class: "btn btn-ghost", type: "button" }, "New dataset");

  const decisionCanvas = el("canvas", { width: "320", height: "320" });
  const curvesCanvas   = el("canvas", { width: "320", height: "240" });
  const readout = el("div", { class: "lab-readout" });
  const verdict = el("div", { class: "coach", style: { display: "none" } }, [el("span", { class: "icon", text: "" }), el("span", { class: "text", text: "" })]);

  function trainEpochs(n) {
    if (state.timer) clearInterval(state.timer);
    trainBtn.disabled = true; continueBtn.disabled = true;
    let remaining = n;
    state.timer = setInterval(() => {
      const batch = Math.min(10, remaining);
      for (let e = 0; e < batch; e++) {
        // shuffle pass through training data
        const order = state.dataset.train.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        for (const idx of order) {
          const p = state.dataset.train[idx];
          state.net.step(p.x, p.y, p.label, state.lr);
        }
        state.epoch++;
        const tL = meanLoss(state.net, state.dataset.train);
        const vL = meanLoss(state.net, state.dataset.val);
        const tA = accuracy(state.net, state.dataset.train);
        const vA = accuracy(state.net, state.dataset.val);
        if (vA > state.bestVal) state.bestVal = vA;
        state.history.push({ epoch: state.epoch, trainLoss: tL, valLoss: vL, trainAcc: tA, valAcc: vA });
        if (state.history.length > 2000) state.history.shift();
      }
      remaining -= batch;
      refresh();
      if (remaining <= 0) {
        clearInterval(state.timer); state.timer = null;
        trainBtn.disabled = false; continueBtn.disabled = false;
      }
    }, 12);
  }

  trainBtn.addEventListener("click", () => { rebuild(); trainEpochs(500); });
  continueBtn.addEventListener("click", () => trainEpochs(200));
  resetBtn.addEventListener("click", () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } rebuild(); });
  newSeedBtn.addEventListener("click", () => { state.dataset = makeDataset(Math.floor(Math.random() * 9999)); rebuild(); });

  function drawDecision() {
    const ctx = decisionCanvas.getContext("2d");
    const W = decisionCanvas.width, H = decisionCanvas.height;
    ctx.clearRect(0, 0, W, H);

    const XMIN = -1.6, XMAX = 1.6, YMIN = -1.2, YMAX = 1.6;
    const xToPx = (x) => ((x - XMIN) / (XMAX - XMIN)) * W;
    const yToPx = (y) => H - ((y - YMIN) / (YMAX - YMIN)) * H;

    if (state.net) {
      const cell = 10;
      for (let px = 0; px < W; px += cell) {
        for (let py = 0; py < H; py += cell) {
          const x = XMIN + (px / W) * (XMAX - XMIN);
          const y = YMAX - (py / H) * (YMAX - YMIN);
          const p = state.net.predict(x, y);
          if (p >= 0.5) ctx.fillStyle = `rgba(102,221,255,${0.10 + (p - 0.5) * 0.36})`;
          else          ctx.fillStyle = `rgba(255,198,94,${0.10 + (0.5 - p) * 0.36})`;
          ctx.fillRect(px, py, cell, cell);
        }
      }
    }
    // points: train smaller, val bigger w/ ring
    for (const p of state.dataset.train) {
      ctx.beginPath(); ctx.arc(xToPx(p.x), yToPx(p.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "#66ddff" : "#ffc65e"; ctx.fill();
    }
    for (const p of state.dataset.val) {
      ctx.beginPath(); ctx.arc(xToPx(p.x), yToPx(p.y), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label ? "rgba(102,221,255,0.5)" : "rgba(255,198,94,0.5)"; ctx.fill();
      ctx.strokeStyle = state.net && (state.net.predict(p.x, p.y) >= 0.5 ? 1 : 0) === p.label ? "#9bd14f" : "#ff7a7a";
      ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  function drawCurves() {
    const ctx = curvesCanvas.getContext("2d");
    const W = curvesCanvas.width, H = curvesCanvas.height;
    ctx.clearRect(0, 0, W, H);
    const PADX = 32, PADY = 22;
    ctx.strokeStyle = "rgba(189,213,239,0.45)";
    ctx.beginPath(); ctx.moveTo(PADX, H - PADY); ctx.lineTo(W - PADX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADX, PADY); ctx.lineTo(PADX, H - PADY); ctx.stroke();
    ctx.fillStyle = "#8aa1bf"; ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText("val accuracy", 4, 12);
    ctx.fillText("epoch", W - 44, H - 4);

    if (state.history.length === 0) {
      ctx.fillStyle = "#8aa1bf"; ctx.font = "11px Inter, sans-serif";
      ctx.fillText("Train to see curves.", PADX + 8, H / 2);
      return;
    }
    const maxE = state.history.length;
    const xToPx = (i) => PADX + (i / Math.max(1, maxE - 1)) * (W - PADX * 2);
    const yToPx = (y) => H - PADY - y * (H - PADY * 2);

    // 90% threshold line
    ctx.strokeStyle = "rgba(255,198,94,0.45)"; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(PADX, yToPx(0.9)); ctx.lineTo(W - PADX, yToPx(0.9)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffc65e"; ctx.fillText("90% goal", W - 70, yToPx(0.9) - 4);

    function plot(arr, color) {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
      state.history.forEach((h, i) => {
        const px = xToPx(i), py = yToPx(arr(h));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    plot(h => h.trainAcc, "#9bd14f");
    plot(h => h.valAcc,   "#66ddff");
    ctx.fillStyle = "#9bd14f"; ctx.fillText("train", PADX + 4, 22);
    ctx.fillStyle = "#66ddff"; ctx.fillText("val",   PADX + 36, 22);
  }

  function refresh() {
    drawDecision(); drawCurves();
    const last = state.history[state.history.length - 1];
    if (!last) {
      mount(readout,
        "config: hidden=", hi(String(state.hidden)),
        " activation=", hi(state.activation),
        " lr=", hi(fmt(state.lr, 2))
      );
      verdict.style.display = "none";
      return;
    }
    mount(readout,
      "epoch ", hi(String(last.epoch)),
      "  train_acc=", hi(fmt(last.trainAcc * 100, 1) + "%", "hi-kata"),
      "  val_acc=", hi(fmt(last.valAcc * 100, 1) + "%", last.valAcc >= 0.9 ? "hi-kata" : (last.valAcc >= 0.8 ? "hi-gold" : "hi-warn")),
      el("br"),
      "best val so far: ", hi(fmt(state.bestVal * 100, 1) + "%", state.bestVal >= 0.9 ? "hi-kata" : "hi-gold"),
      "   loss: train=", hi(fmt(last.trainLoss, 3)), " val=", hi(fmt(last.valLoss, 3))
    );

    if (state.bestVal >= 0.9) {
      awardBadge("black-belt");
      verdict.style.display = "";
      verdict.style.borderLeftColor = "#9bd14f";
      verdict.style.background = "rgba(155,209,79,0.10)";
      verdict.firstChild.textContent = "★ Capstone passed";
      verdict.firstChild.style.color = "#9bd14f";
      verdict.lastChild.textContent = "≥90% validation accuracy reached. The Black Belt badge is yours. Hit Complete Module below to bank the 200 XP.";
    } else if (last.valAcc < 0.65 && state.history.length > 200) {
      verdict.style.display = "";
      verdict.style.borderLeftColor = "#ffc65e";
      verdict.style.background = "rgba(255,198,94,0.08)";
      verdict.firstChild.textContent = "◆ Coach";
      verdict.firstChild.style.color = "#ffc65e";
      verdict.lastChild.textContent = "Stuck under 65%. Try a bigger hidden size (4 or 8), switch activation to tanh or ReLU, or nudge lr between 0.1 and 0.5.";
    } else {
      verdict.style.display = "none";
    }
  }

  rebuild();

  return el("section", { class: "card" }, [
    el("div", { class: "section-h" }, [el("h2", { text: "Capstone Lab" }), el("span", { class: "hint", text: "Real gradient descent on two-moons. Goal: ≥90% validation accuracy." })]),
    el("div", { class: "lab", style: { gridTemplateColumns: "260px 1fr" } }, [
      el("div", { class: "lab-controls" }, [
        el("p", { class: "eyebrow", text: "Hidden neurons" }),
        hiddenToggle,
        el("p", { class: "eyebrow", style: { marginTop: "0.5rem" }, text: "Hidden activation" }),
        actToggle,
        lrSlider.node,
        el("div", { class: "row", style: { marginTop: "0.4rem" } }, [trainBtn, continueBtn]),
        el("div", { class: "row", style: { marginTop: "0.4rem" } }, [resetBtn, newSeedBtn]),
        el("p", { class: "muted", style: { fontSize: "0.78rem", marginTop: "0.4rem" } }, "Train rebuilds the network from scratch. +200 more keeps training the current weights.")
      ]),
      el("div", { class: "lab-stage", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" } }, [
        decisionCanvas, curvesCanvas, readout, verdict
      ])
    ])
  ]);
}
