const boundaryCanvas = document.getElementById("boundaryCanvas");
const xorCanvas = document.getElementById("xorCanvas");
const activationCanvas = document.getElementById("activationCanvas");

const w1El = document.getElementById("w1");
const w2El = document.getElementById("w2");
const bEl = document.getElementById("b");
const lineEqEl = document.getElementById("lineEq");
const toggleXorBtn = document.getElementById("toggleXor");
const xorModeText = document.getElementById("xorModeText");
const checklist = document.getElementById("checklist");
const progressText = document.getElementById("progressText");

let xorMlpMode = false;

function mapToCanvas(x, y, canvas) {
  return {
    cx: (x + 1) * 0.5 * canvas.width,
    cy: canvas.height - (y + 1) * 0.5 * canvas.height
  };
}

function drawAxes(ctx, canvas) {
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
}

function drawDecisionBoundary() {
  const ctx = boundaryCanvas.getContext("2d");
  const w1 = parseFloat(w1El.value);
  const w2 = parseFloat(w2El.value);
  const b = parseFloat(bEl.value);

  ctx.clearRect(0, 0, boundaryCanvas.width, boundaryCanvas.height);
  drawAxes(ctx, boundaryCanvas);

  const points = [
    { x: -0.7, y: -0.5, label: 0 },
    { x: -0.6, y: -0.2, label: 0 },
    { x: 0.3, y: 0.5, label: 1 },
    { x: 0.6, y: 0.2, label: 1 }
  ];

  points.forEach((p) => {
    const score = w1 * p.x + w2 * p.y + b;
    const pred = score >= 0 ? 1 : 0;
    const { cx, cy } = mapToCanvas(p.x, p.y, boundaryCanvas);
    ctx.beginPath();
    ctx.fillStyle = pred === 1 ? "#2563eb" : "#f97316";
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  if (Math.abs(w2) > 1e-5) {
    const xA = -1;
    const yA = (-b - w1 * xA) / w2;
    const xB = 1;
    const yB = (-b - w1 * xB) / w2;
    const pA = mapToCanvas(xA, yA, boundaryCanvas);
    const pB = mapToCanvas(xB, yB, boundaryCanvas);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pA.cx, pA.cy);
    ctx.lineTo(pB.cx, pB.cy);
    ctx.stroke();
  }

  lineEqEl.textContent = `Boundary: ${w1.toFixed(1)}x + ${w2.toFixed(1)}y + ${b.toFixed(1)} = 0`;
}

function xorClassSinglePerceptron(x, y) {
  const score = x + y - 0.9;
  return score >= 0 ? 1 : 0;
}

function xorClassMlpLike(x, y) {
  const h1 = Math.max(0, x - y);
  const h2 = Math.max(0, y - x);
  return (h1 + h2) > 0.2 ? 1 : 0;
}

function drawXorDemo() {
  const ctx = xorCanvas.getContext("2d");
  ctx.clearRect(0, 0, xorCanvas.width, xorCanvas.height);
  drawAxes(ctx, xorCanvas);

  const step = 8;
  for (let px = 0; px < xorCanvas.width; px += step) {
    for (let py = 0; py < xorCanvas.height; py += step) {
      const x = (px / xorCanvas.width) * 2 - 1;
      const y = ((xorCanvas.height - py) / xorCanvas.height) * 2 - 1;
      const pred = xorMlpMode ? xorClassMlpLike(x, y) : xorClassSinglePerceptron(x, y);
      ctx.fillStyle = pred === 1 ? "rgba(37,99,235,0.18)" : "rgba(249,115,22,0.18)";
      ctx.fillRect(px, py, step, step);
    }
  }

  const xorPoints = [
    { x: -0.8, y: -0.8, label: 0 },
    { x: 0.8, y: 0.8, label: 0 },
    { x: -0.8, y: 0.8, label: 1 },
    { x: 0.8, y: -0.8, label: 1 }
  ];
  xorPoints.forEach((p) => {
    const { cx, cy } = mapToCanvas(p.x, p.y, xorCanvas);
    ctx.beginPath();
    ctx.fillStyle = p.label === 1 ? "#1d4ed8" : "#ea580c";
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  xorModeText.textContent = xorMlpMode
    ? "MLP view: combined hidden features create non-linear regions that can separate XOR."
    : "Single perceptron view: one linear cut cannot correctly separate XOR corners.";
}

function drawActivation() {
  const ctx = activationCanvas.getContext("2d");
  ctx.clearRect(0, 0, activationCanvas.width, activationCanvas.height);
  drawAxes(ctx, activationCanvas);

  function plot(fn, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 200; i++) {
      const x = -1 + (i / 200) * 2;
      const y = fn(x * 5) / 5;
      const { cx, cy } = mapToCanvas(x, y, activationCanvas);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  plot((z) => (z >= 0 ? 1 : 0), "#ef4444");
  plot((z) => 1 / (1 + Math.exp(-z)), "#2563eb");
  plot((z) => Math.max(0, z), "#059669");
}

function updateChecklistProgress() {
  const boxes = checklist.querySelectorAll('input[type="checkbox"]');
  const done = Array.from(boxes).filter((b) => b.checked).length;
  progressText.textContent = `Checklist progress: ${done}/${boxes.length} completed.`;
}

w1El.addEventListener("input", drawDecisionBoundary);
w2El.addEventListener("input", drawDecisionBoundary);
bEl.addEventListener("input", drawDecisionBoundary);
toggleXorBtn.addEventListener("click", () => {
  xorMlpMode = !xorMlpMode;
  toggleXorBtn.textContent = xorMlpMode ? "Switch to Single Perceptron View" : "Switch to MLP-Style View";
  drawXorDemo();
});
checklist.addEventListener("change", updateChecklistProgress);

drawDecisionBoundary();
drawXorDemo();
drawActivation();
updateChecklistProgress();
