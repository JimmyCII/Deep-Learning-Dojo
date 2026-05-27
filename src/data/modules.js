/**
 * Central learning-path config. 8 consolidated modules, mapped from the
 * old 13-lesson structure. Adding a module here lights it up on the dashboard.
 */

export const MODULES = [
  {
    id: "m1",
    num: "01",
    route: "/module/m1",
    title: "Neuron Foundations",
    subtitle: "What a neuron actually computes",
    short: "Inputs × weights + bias → activation. Build intuition by tuning a single neuron until its output hits a target.",
    objectives: [
      "Recognize the inputs, weights, and bias of a single neuron",
      "Compute a neuron's weighted sum and activation by hand",
      "Tune a neuron to produce a target output"
    ],
    keyTerms: ["neuron", "weight", "bias", "weighted sum", "activation", "prediction"],
    xp: 60,
    badge: "first-rep",
    status: "ready",
    mapsToOld: ["Lesson 01", "Lesson 02", "part of Lesson 03"]
  },
  {
    id: "m2",
    num: "02",
    route: "/module/m2",
    title: "Activation Functions Lab",
    subtitle: "Why non-linearity changes everything",
    short: "Compare Sigmoid, Tanh, ReLU, and Softmax side-by-side. See where gradients vanish and which one wins for which job.",
    objectives: [
      "Compare four common activation functions visually",
      "Spot where gradients vanish and why that matters",
      "Pick the right activation for a given task"
    ],
    keyTerms: ["sigmoid", "tanh", "ReLU", "softmax", "non-linearity", "vanishing gradient"],
    xp: 60,
    badge: "function-fluent",
    status: "ready",
    mapsToOld: ["activation portion of Lesson 03"]
  },
  {
    id: "m3",
    num: "03",
    route: "/module/m3",
    title: "Loss & Learning",
    subtitle: "Why your model needs feedback",
    short: "Loss is how the network knows it was wrong. Move a slider, watch the loss meter respond, and beat the challenge.",
    objectives: [
      "Explain why a model needs a loss signal",
      "Compute Mean Squared Error for a small batch",
      "Recognize the shape of cross-entropy loss"
    ],
    keyTerms: ["loss", "error", "MSE", "cross-entropy", "prediction"],
    xp: 60,
    badge: "loss-tracker",
    status: "ready",
    mapsToOld: ["Lesson 04"]
  },
  {
    id: "m4",
    num: "04",
    route: "/module/m4",
    title: "Gradient Descent Playground",
    subtitle: "Tuning the learning rate",
    short: "Roll a ball down a loss curve. Crank the learning rate too high and it bounces around forever; too low and you'll fall asleep waiting.",
    objectives: [
      "Describe the role of the gradient in updating weights",
      "Tune learning rate to balance speed and stability"
    ],
    keyTerms: ["gradient", "learning rate", "step", "minimum", "overshoot"],
    xp: 70,
    badge: "rate-master",
    status: "ready",
    mapsToOld: ["Lesson 04", "parts of Lesson 07"]
  },
  {
    id: "m5",
    num: "05",
    route: "/module/m5",
    title: "Backpropagation Walkthrough",
    subtitle: "Forward, loss, backward, update",
    short: "Animate a tiny network through one full training step. See gradients ripple backward and weights shift.",
    objectives: [
      "Trace a forward pass through a tiny network",
      "Trace a backward pass and weight update",
      "Explain the chain rule intuitively without heavy math"
    ],
    keyTerms: ["forward pass", "backward pass", "chain rule", "gradient", "weight update"],
    xp: 80,
    badge: "backprop-belt",
    status: "ready",
    mapsToOld: ["Lessons 03 + 04 + 06 backprop"]
  },
  {
    id: "m6",
    num: "06",
    route: "/module/m6",
    title: "Classification Lab",
    subtitle: "Why hidden layers matter",
    short: "Drop points on a canvas. A perceptron can split simple cases — but XOR? You'll need hidden layers.",
    objectives: [
      "Visualize a decision boundary in 2D",
      "Recognize the XOR problem and why a single layer cannot solve it",
      "Toggle a hidden layer and watch the boundary curve"
    ],
    keyTerms: ["decision boundary", "perceptron", "XOR", "hidden layer", "classification"],
    xp: 80,
    badge: "boundary-breaker",
    status: "ready",
    mapsToOld: ["Lesson 03 XOR", "Lessons 05 + 07"]
  },
  {
    id: "m7",
    num: "07",
    route: "/module/m7",
    title: "Training Dashboard",
    subtitle: "Reading the curves",
    short: "Simulate a training run with live loss and accuracy curves. Push complexity past the data's signal and watch overfitting in real time.",
    objectives: [
      "Interpret loss and accuracy curves",
      "Recognize the visual signature of overfitting",
      "Reason about train/validation split"
    ],
    keyTerms: ["epoch", "accuracy", "overfitting", "train/val split", "noise"],
    xp: 80,
    badge: "curve-reader",
    status: "ready",
    mapsToOld: ["Lessons 05 + 06 + 07"]
  },
  {
    id: "m8",
    num: "08",
    route: "/module/m8",
    title: "Capstone Mission: Train the Data Ninja Model",
    subtitle: "Put it all together",
    short: "Configure a small network end-to-end and train it on a classification challenge. Earn the Data Ninja Black Belt.",
    objectives: [
      "Configure architecture, activation, and learning rate",
      "Train a model and read its curves",
      "Pass a held-out classification challenge"
    ],
    keyTerms: ["model", "architecture", "training run", "validation"],
    xp: 200,
    badge: "black-belt",
    status: "ready",
    mapsToOld: ["synthesizes 1–7"]
  }
];

export const BADGES = {
  "first-rep":        { name: "First Rep",        icon: "◉", desc: "Tuned your first neuron." },
  "function-fluent":  { name: "Function Fluent",  icon: "ƒ", desc: "Mastered four activations." },
  "loss-tracker":     { name: "Loss Tracker",     icon: "↓", desc: "Drove loss to zero." },
  "rate-master":      { name: "Rate Master",      icon: "η", desc: "Tamed the learning rate." },
  "backprop-belt":    { name: "Backprop Belt",    icon: "⇆", desc: "Traced gradients backwards." },
  "boundary-breaker": { name: "Boundary Breaker", icon: "⤧", desc: "Solved XOR with hidden layers." },
  "curve-reader":     { name: "Curve Reader",     icon: "≋", desc: "Spotted overfitting on sight." },
  "black-belt":       { name: "Data Ninja Black Belt", icon: "★", desc: "Completed the capstone mission." }
};

export function getModule(id) { return MODULES.find(m => m.id === id); }
export function nextModule(currentId) {
  const i = MODULES.findIndex(m => m.id === currentId);
  return i >= 0 && i < MODULES.length - 1 ? MODULES[i + 1] : null;
}
export function prevModule(currentId) {
  const i = MODULES.findIndex(m => m.id === currentId);
  return i > 0 ? MODULES[i - 1] : null;
}
