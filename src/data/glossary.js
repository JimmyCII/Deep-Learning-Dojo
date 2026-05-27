/**
 * Plain-English definitions for key terms. Click a term chip → see the definition.
 */

export const GLOSSARY = {
  "neuron": "A tiny math unit that multiplies inputs by weights, sums them with a bias, then runs the result through an activation function.",
  "weight": "A number that says how much one input matters to this neuron. Training is mostly about finding good weights.",
  "bias": "A spare knob the neuron can shift the result up or down with, even when all inputs are zero.",
  "weighted sum": "Each input × its weight, all added together, plus the bias. That single number is what the activation function sees.",
  "activation": "A non-linear squish-or-clip applied to the weighted sum. It lets networks model curves, not just straight lines.",
  "prediction": "The neuron's (or network's) final output. In a classifier this is usually a probability or a class.",
  "sigmoid": "An S-shaped curve that squashes any number to between 0 and 1. Reads naturally as a probability.",
  "tanh": "Like sigmoid but squashes to between -1 and 1. Zero-centered, often easier to train than sigmoid.",
  "ReLU": "Rectified Linear Unit. If the input is positive, pass it through; if negative, return zero. Fast and very widely used.",
  "softmax": "Turns a vector of raw scores into probabilities that sum to 1. Used for multi-class classifier output.",
  "non-linearity": "Any bend or kink in the function — without it, stacking layers is no better than one big linear layer.",
  "vanishing gradient": "When gradients shrink to near-zero deep in a network, training stalls. Sigmoid and tanh do this in their flat regions.",
  "loss": "A single number that measures how wrong a prediction was. Lower is better; training tries to drive it down.",
  "error": "Casual word for loss — the gap between what the model said and what was true.",
  "MSE": "Mean Squared Error. Average of (prediction − truth)² across the batch. Common for regression.",
  "cross-entropy": "Loss for classification. Big penalty when the model is confidently wrong, small penalty when it's confidently right.",
  "gradient": "The slope of the loss with respect to each weight. Tells the network which way to nudge each weight to lower the loss.",
  "learning rate": "How big a step to take in the gradient's direction. Too small = slow. Too large = bouncing past the minimum.",
  "step": "One weight update during training.",
  "minimum": "The bottom of the loss curve — what gradient descent is climbing down toward.",
  "overshoot": "When the learning rate is too high and updates jump past the minimum instead of settling into it.",
  "forward pass": "Push the inputs through the network and compute the output.",
  "backward pass": "Compute gradients from the loss back through every layer so each weight knows how to change.",
  "chain rule": "The calculus trick that lets you compose derivatives layer-by-layer. Backprop is really just the chain rule applied carefully.",
  "weight update": "Subtract (learning rate × gradient) from each weight. One small step toward less loss.",
  "decision boundary": "The dividing line (or surface) where the classifier flips from one class to another.",
  "perceptron": "The simplest possible neural network: one neuron with a step activation. Can only draw straight boundaries.",
  "XOR": "The classic 'two classes that cannot be separated by a straight line' problem. The reason hidden layers exist.",
  "hidden layer": "A layer between input and output. Hidden layers let the network learn curved or compositional features.",
  "classification": "The task of putting an input into one of several categories.",
  "epoch": "One full pass through your training data.",
  "accuracy": "Percentage of predictions that match the truth label.",
  "overfitting": "When a model memorizes its training data and stops generalizing to new examples. The training curve looks great while the validation curve diverges.",
  "train/val split": "Reserve some data the model never sees during training, so you can honestly measure how well it generalizes.",
  "noise": "Variation in the data that has no real signal — labels that are wrong, irrelevant features, measurement jitter.",
  "model": "The whole network: its architecture plus its current weights.",
  "architecture": "How the layers are arranged — how many, how big, what type.",
  "training run": "One complete attempt to fit a model: choose hyperparameters, train for some epochs, evaluate.",
  "validation": "Checking the model's performance on data it has never seen during training."
};

export function defineTerm(term) {
  const k = String(term || "").toLowerCase();
  for (const [key, val] of Object.entries(GLOSSARY)) {
    if (key.toLowerCase() === k) return val;
  }
  return "Definition coming soon.";
}
