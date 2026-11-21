(function () {
  "use strict";

  // ---- Elements ----
  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("home-screen"),
    quiz: $("quiz-screen"),
    results: $("results-screen"),
  };
  const packList = $("pack-list");
  const packTitle = $("pack-title");
  const progressText = $("progress-text");
  const progressFill = $("progress-fill");
  const englishWord = $("english-word");
  const form = $("answer-form");
  const input = $("answer-input");
  const submitBtn = $("submit-btn");
  const feedback = $("feedback");
  const nextBtn = $("next-btn");

  // ---- State ----
  let currentPack = null;
  let queue = [];
  let index = 0;
  let results = [];
  let answered = false;

  // ---- Helpers ----
  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => (el.hidden = key !== name));
    window.scrollTo(0, 0);
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Lowercase, trim, collapse spaces, strip accents and trailing punctuation.
  // Also accepts "dorp, het" for "het dorp" and ignores "…" in phrases
  // like "over … heen".
  function normalize(s) {
    let t = String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/…|\.{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?,;]+$/g, "")
      .trim();
    const m = t.match(/^(.+?)\s*,\s*(de|het|een)$/);
    if (m) t = m[2] + " " + m[1];
    return t;
  }

  function answersFor(word) {
    return Array.isArray(word.nl) ? word.nl : [word.nl];
  }

  // ---- Home ----
  function renderHome() {
    packList.innerHTML = "";
    if (typeof PACKS === "undefined" || !PACKS.length) {
      const p = document.createElement("p");
      p.textContent = "No packs yet — add some in packs.js.";
      p.className = "subtitle";
      packList.appendChild(p);
      return;
    }
    PACKS.forEach((pack) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pack-card";

      const name = document.createElement("p");
      name.className = "pack-name";
      name.textContent = pack.name;
      btn.appendChild(name);

      if (pack.description) {
        const desc = document.createElement("p");
        desc.className = "pack-desc";
        desc.textContent = pack.description;
        btn.appendChild(desc);
      }

      const count = document.createElement("span");
      count.className = "pack-count";
      const n = pack.words.length;
      count.textContent = n + (n === 1 ? " word" : " words");
      btn.appendChild(count);

      btn.addEventListener("click", () => startQuiz(pack));
      packList.appendChild(btn);
    });
  }

  // ---- Quiz ----
  function startQuiz(pack) {
    currentPack = pack;
    queue = shuffle(pack.words);
    index = 0;
    results = [];
    packTitle.textContent = pack.name;
    showScreen("quiz");
    showQuestion();
  }

  function showQuestion() {
    const word = queue[index];
    answered = false;
    englishWord.textContent = word.en;
    progressText.textContent = index + 1 + " / " + queue.length;
    progressFill.style.width = (index / queue.length) * 100 + "%";

    input.value = "";
    input.disabled = false;
    submitBtn.hidden = false;
    feedback.hidden = true;
    feedback.className = "feedback";
    nextBtn.hidden = true;
    input.focus();
  }

  function checkAnswer() {
    if (answered) return;
    answered = true;

    const word = queue[index];
    const given = input.value;
    const accepted = answersFor(word);
    const isCorrect = accepted.some((a) => normalize(a) === normalize(given));

    results.push({ word, given, correct: isCorrect });

    input.disabled = true;
    submitBtn.hidden = true;
    feedback.innerHTML = "";

    if (isCorrect) {
      feedback.classList.add("correct");
      feedback.textContent = "✓ Correct!";
      // If they typed a valid alternative, show the others too
      if (accepted.length > 1) {
        const also = document.createElement("span");
        also.className = "yours";
        also.textContent = "Accepted answers: " + accepted.join(", ");
        feedback.appendChild(also);
      }
    } else {
      feedback.classList.add("wrong");
      feedback.append("✗ The correct answer is ");
      const ans = document.createElement("span");
      ans.className = "answer";
      ans.textContent = accepted[0];
      feedback.appendChild(ans);
      if (accepted.length > 1) {
        feedback.append(" (also: " + accepted.slice(1).join(", ") + ")");
      }
      const yours = document.createElement("span");
      yours.className = "yours";
      yours.textContent = given.trim() ? "You wrote: " + given.trim() : "No answer given";
      feedback.appendChild(yours);
    }

    feedback.hidden = false;
    progressFill.style.width = ((index + 1) / queue.length) * 100 + "%";
    nextBtn.textContent = index + 1 < queue.length ? "Next →" : "See results →";
    nextBtn.hidden = false;
    nextBtn.focus();
  }

  function next() {
    index++;
    if (index < queue.length) {
      showQuestion();
    } else {
      showResults();
    }
  }

  // ---- Results ----
  function showResults() {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    $("results-pack").textContent = currentPack.name;
    $("score").textContent = correct + " / " + total;

    let msg;
    if (pct === 100) msg = "Perfect! Uitstekend! 🎉";
    else if (pct >= 80) msg = pct + "% — Goed gedaan!";
    else if (pct >= 50) msg = pct + "% — Not bad, keep practising.";
    else msg = pct + "% — Give it another go.";
    $("score-message").textContent = msg;

    const missed = results.filter((r) => !r.correct);
    const list = $("missed-list");
    list.innerHTML = "";
    missed.forEach((r) => {
      const li = document.createElement("li");
      const en = document.createElement("span");
      en.textContent = r.word.en;
      const nl = document.createElement("span");
      nl.className = "nl";
      nl.textContent = answersFor(r.word)[0];
      li.append(en, nl);
      list.appendChild(li);
    });
    $("missed-wrap").hidden = missed.length === 0;

    showScreen("results");
    $("home-btn").focus();
  }

  // ---- Events ----
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    checkAnswer();
  });
  nextBtn.addEventListener("click", next);
  $("quit-btn").addEventListener("click", () => {
    if (index === 0 && !answered) return showScreen("home");
    if (confirm("Leave this quiz? Your progress will be lost.")) showScreen("home");
  });
  $("retry-btn").addEventListener("click", () => startQuiz(currentPack));
  $("home-btn").addEventListener("click", () => showScreen("home"));

  // ---- Init ----
  renderHome();
  showScreen("home");
})();
