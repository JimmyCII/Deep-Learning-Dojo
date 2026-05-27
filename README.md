# Data Ninja Deep Learning Dojo

> Hands-on training, one rep at a time.

An interactive web tutor that teaches the core ideas of deep learning by letting you
**push sliders, watch curves move, and beat small challenges** — not by watching videos
or reading walls of text. Eight modules, from a single-neuron simulator to a capstone
mission where you train a real classifier on noisy two-moons data.

This is **V1**. Modules 1–8 are all built and playable. Feedback is wired in.

---

## Run it

It's a plain static site — no build step, no `npm install`, no Node.

**Easiest:** double-click `index.html`. It opens in your default browser.

**Most reliable** (some browsers are strict about ES modules over `file://`):

```bash
# in this folder
python -m http.server 5500
# then open http://localhost:5500/
```

Or with Node:

```bash
npx http-server -p 5500
```

---

## What's in it

| Module | What you do |
|---|---|
| 1 — Neuron Foundations | Tune inputs/weights/bias on a live single-neuron simulator. Hit a target output to earn First Rep. |
| 2 — Activation Functions Lab | Toggle Sigmoid / Tanh / ReLU. Probe slider with live gradient overlay (vanishing-gradient zones become visible). Bonus softmax mini-lab. |
| 3 — Loss & Learning | MSE quadratic, cross-entropy −log(p), and a challenge to drive average MSE under 0.01. |
| 4 — Gradient Descent Playground | Ball on a loss curve. Pick learning rate, Step or Auto-train. Catch the divergence warning. |
| 5 — Backpropagation Walkthrough | A 2-1-1 network animated stage-by-stage: Forward → Loss → Backward → Update. Plus auto-train + loss curve. |
| 6 — Classification Lab | Three datasets × perceptron-or-hidden-layer. Live decision boundary. XOR challenge with a cheat-then-study preset. |
| 7 — Training Dashboard | Simulated 80-epoch run with live train+val curves. Crank complexity + noise to trigger the overfitting warning. |
| 8 — Capstone Mission | Real gradient descent on two-moons. Pick hidden size, activation, learning rate. Hit ≥90% val accuracy for the Black Belt. |

Plus: dojo dashboard with XP, belt ranks (white → black at 0/50/150/300/500/750 XP),
badges per challenge, glossary search, and a feedback panel.

---

## Leaving feedback (this is V1 — please poke at it)

There's a **Feedback** button in the top-right of every screen. Click it, leave
a star rating + free-text comment, and pick one of three submit paths:

- **Copy summary** — formats your feedback as Markdown and copies it to your
  clipboard. Paste into Slack, email, an issue, anywhere.
- **Email Jim** — opens your mail client pre-filled with the feedback.
- **Open GitHub issue** — opens a pre-filled issue draft (only shown if the
  repo URL is configured in `src/data/site-config.js`).

Every entry also lives in your browser's localStorage. Visit `#/feedback` for
a log of everything you've left on this browser, with per-entry copy/email/issue
actions and a bulk JSON export. That JSON is what you'd email back to Jim if
you'd rather collect a session's worth of notes and send them all at once.

The feedback log automatically captures: current route, viewport size, browser
UA, your XP, and how many modules you've completed. No analytics, no telemetry,
no cloud. Your browser only.

---

## What's stored where

All progress and feedback lives in `localStorage` under two keys:

- `dojo_dl_tutor_v1` — XP, completed modules, quiz pass/fail, reflections, badges, challenge bests.
- `dojo_dl_feedback_v1` — feedback log entries.

Nothing ever leaves your device unless you explicitly use the email or
GitHub-issue button. To wipe progress: the **Reset progress** link in the
footer. To wipe feedback: the **Clear all** button on the `#/feedback` page.

---

## Project layout

```
.
├── index.html                  # SPA shell
├── assets/
│   ├── css/dojo.css            # theme (dark navy + cyan + dojo green)
│   └── images/                 # logo + badge (PNG + WebP)
├── src/
│   ├── main.js                 # boots router + topbar
│   ├── core/
│   │   ├── router.js           # hash-based router
│   │   ├── progress.js         # XP / completion / badges / reflections
│   │   ├── feedback.js         # feedback storage + export helpers
│   │   └── ui.js               # tiny DOM helpers
│   ├── components/
│   │   ├── slider.js
│   │   ├── quiz.js
│   │   ├── reflection.js
│   │   ├── terms.js
│   │   ├── moduleShell.js
│   │   └── feedbackModal.js
│   ├── data/
│   │   ├── modules.js          # 8-module path config + badge registry
│   │   ├── glossary.js
│   │   └── site-config.js      # ← email / repo URL go here
│   └── modules/
│       ├── dashboard.js
│       ├── m1-neuron.js … m8-capstone.js
│       ├── glossary.js  about.js  feedback.js
│       └── stub.js
└── docs/
    ├── AGENT_AUDIT.md          # initial audit of the previous version
    ├── IMPLEMENTATION_PLAN.md
    ├── CHANGELOG.md
    ├── RUNBOOK.md              # how to run + the feedback flow
    └── MAXIMIZE.md             # the V2+ polish backlog
```



## License

MIT — see `LICENSE`.

---

## Credits

Built for Jim Cockerham as a hands-on companion to the Deep Learning Specialization.
Brand: Data Ninja — *Unleash the Power of Your Data*.
