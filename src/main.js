/**
 * App entry. Wires up the router, registers views, and keeps the topbar
 * XP pill in sync with the progress service.
 */

import { registerRoute, setOutlet, start, onNavigate } from "./core/router.js";
import { getState, getBelt, onChange, resetAll } from "./core/progress.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderM1 } from "./modules/m1-neuron.js";
import { renderM2 } from "./modules/m2-activation.js";
import { renderM3 } from "./modules/m3-loss.js";
import { renderM4 } from "./modules/m4-gradient.js";
import { renderM5 } from "./modules/m5-backprop.js";
import { renderM6 } from "./modules/m6-classification.js";
import { renderM7 } from "./modules/m7-training.js";
import { renderM8 } from "./modules/m8-capstone.js";
import { renderGlossary } from "./modules/glossary.js";
import { renderAbout } from "./modules/about.js";
import { renderFeedback } from "./modules/feedback.js";
import { openFeedbackModal } from "./components/feedbackModal.js";
import { SITE } from "./data/site-config.js";

// --- Outlet ---
setOutlet(document.getElementById("view"));

// --- Routes ---
registerRoute("/dashboard", renderDashboard);
registerRoute("/glossary",  renderGlossary);
registerRoute("/about",     renderAbout);
registerRoute("/feedback",  renderFeedback);
registerRoute("/module/m1", () => renderM1());
registerRoute("/module/m2", () => renderM2());
registerRoute("/module/m3", () => renderM3());
registerRoute("/module/m4", () => renderM4());
registerRoute("/module/m5", () => renderM5());
registerRoute("/module/m6", () => renderM6());
registerRoute("/module/m7", () => renderM7());
registerRoute("/module/m8", () => renderM8());

// --- Topbar XP / belt sync ---
const xpNum = document.getElementById("xpNum");
const beltLabel = document.getElementById("beltLabel");
const beltDot = document.getElementById("beltDot");

function refreshXp() {
  const s = getState();
  const belt = getBelt(s.xp);
  xpNum.textContent = `${s.xp} XP`;
  beltLabel.textContent = belt.name;
  beltDot.style.background = belt.color;
}
refreshXp();
onChange(refreshXp);

// --- Nav active state ---
onNavigate((path) => {
  const navLinks = document.querySelectorAll("#topnav a");
  navLinks.forEach(a => {
    const route = a.getAttribute("href").replace("#", "");
    a.classList.toggle("active", route === path || (route === "/dashboard" && path.startsWith("/module/")));
  });
});

// --- Reset button ---
document.getElementById("resetProgressBtn").addEventListener("click", () => {
  if (confirm("Reset all dojo progress? This wipes XP, badges, completed modules, and reflections.")) {
    resetAll();
    location.hash = "#/dashboard";
    location.reload();
  }
});

// --- Feedback button ---
const fbBtn = document.getElementById("feedbackBtn");
if (fbBtn) {
  if (!SITE.showFeedbackButton) fbBtn.style.display = "none";
  fbBtn.addEventListener("click", () => openFeedbackModal());
}

// --- Boot ---
start();
