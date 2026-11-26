(function () {
  "use strict";

  // ---- Elements ----
  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("home-screen"),
    list: $("list-screen"),
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
    if (name === "home") renderHome(); // refresh traffic lights
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

  // ---- Scores (saved in this browser) ----
  const SCORE_KEY = "vocabQuizScores";

  function loadScores() {
    try {
      return JSON.parse(localStorage.getItem(SCORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveScore(packId, correct, total) {
    try {
      const scores = loadScores();
      const prev = scores[packId] || {};
      scores[packId] = {
        correct,
        total,
        best: Math.max(prev.best || 0, total ? correct / total : 0),
        attempts: (prev.attempts || 0) + 1,
        date: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    } catch (e) {
      /* storage unavailable: lights just won't update */
    }
  }

  // green ≥ 80%, amber 50–79%, red < 50%, grey = not tried yet
  function lightFor(score) {
    if (!score || !score.total) return "none";
    const pct = score.correct / score.total;
    if (pct >= 0.8) return "green";
    if (pct >= 0.5) return "amber";
    return "red";
  }

  function answersFor(word) {
    return Array.isArray(word.nl) ? word.nl : [word.nl];
  }

  // ---- Groups (pages) ----
  const GROUPS = {
    course: { packs: () => (typeof PACKS !== "undefined" ? PACKS : []), file: "packs.js" },
    themes: { packs: () => (typeof THEME_PACKS !== "undefined" ? THEME_PACKS : []), file: "themes.js" },
  };
  let currentGroup = "course";

  function groupFromHash() {
    const g = location.hash.replace("#", "");
    return GROUPS[g] ? g : "course";
  }

  function setGroup(group) {
    currentGroup = group;
    document.body.dataset.group = group;
    document.querySelectorAll(".tab").forEach((t) => {
      const active = t.dataset.group === group;
      t.classList.toggle("active", active);
      if (active) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    renderHome();
  }

  // ---- Home ----
  function renderHome() {
    packList.innerHTML = "";
    const packs = GROUPS[currentGroup].packs();
    if (!packs.length) {
      const p = document.createElement("p");
      p.textContent = "No packs yet — add some in " + GROUPS[currentGroup].file + ".";
      p.className = "subtitle";
      packList.appendChild(p);
      return;
    }
    const scores = loadScores();
    let lastSection = null;
    packs.forEach((pack) => {
      if (pack.section && pack.section !== lastSection) {
        const h = document.createElement("h2");
        h.className = "section-heading";
        h.textContent = pack.section;
        packList.appendChild(h);
        lastSection = pack.section;
      }
      const card = document.createElement("div");
      card.className = "pack-card";

      const score = scores[pack.id];
      const light = lightFor(score);
      card.dataset.light = light;

      const name = document.createElement("p");
      name.className = "pack-name";
      const dot = document.createElement("span");
      dot.className = "light light-" + light;
      const label =
        light === "none"
          ? "Not tested yet"
          : "Last score " + score.correct + "/" + score.total +
            " (" + Math.round((score.correct / score.total) * 100) + "%), best " +
            Math.round(score.best * 100) + "%, " + score.attempts +
            (score.attempts === 1 ? " attempt" : " attempts");
      dot.title = label;
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", label);
      name.append(dot, document.createTextNode(pack.name));
      card.appendChild(name);

      if (pack.description) {
        const desc = document.createElement("p");
        desc.className = "pack-desc";
        desc.textContent = pack.description;
        card.appendChild(desc);
      }

      const count = document.createElement("span");
      count.className = "pack-count";
      const n = pack.words.length;
      count.textContent = n + (n === 1 ? " word" : " words");
      const meta = document.createElement("div");
      meta.className = "pack-meta";
      meta.appendChild(count);
      if (light !== "none") {
        const last = document.createElement("span");
        last.className = "pack-score score-" + light;
        last.textContent = Math.round((score.correct / score.total) * 100) + "%";
        last.title = label;
        meta.appendChild(last);
      }
      card.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "card-actions";
      const listBtn = document.createElement("button");
      listBtn.type = "button";
      listBtn.className = "card-btn list-btn";
      listBtn.textContent = "Word list";
      listBtn.setAttribute("aria-label", "Word list for " + pack.name);
      listBtn.addEventListener("click", () => showList(pack));
      const testBtn = document.createElement("button");
      testBtn.type = "button";
      testBtn.className = "card-btn test-btn";
      testBtn.textContent = "Test";
      testBtn.setAttribute("aria-label", "Test " + pack.name);
      testBtn.addEventListener("click", () => startQuiz(pack));
      actions.append(listBtn, testBtn);
      card.appendChild(actions);

      packList.appendChild(card);
    });
  }

  // ---- Word list ----
  function showList(pack) {
    currentPack = pack;
    $("list-title").textContent = pack.name;
    const n = pack.words.length;
    $("list-count").textContent = n + (n === 1 ? " word" : " words");
    const body = $("word-table-body");
    body.innerHTML = "";
    pack.words.forEach((w) => {
      const tr = document.createElement("tr");
      const en = document.createElement("td");
      en.textContent = w.en;
      const nl = document.createElement("td");
      nl.className = "nl";
      const answers = answersFor(w);
      nl.textContent = answers[0];
      if (answers.length > 1) {
        const alt = document.createElement("span");
        alt.className = "alt";
        alt.textContent = "also: " + answers.slice(1).join(", ");
        nl.appendChild(alt);
      }
      tr.append(en, nl);
      body.appendChild(tr);
    });
    showScreen("list");
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

    saveScore(currentPack.id, correct, total);
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
  $("list-back-btn").addEventListener("click", () => showScreen("home"));
  $("list-test-btn").addEventListener("click", () => startQuiz(currentPack));
  $("home-btn").addEventListener("click", () => showScreen("home"));

  window.addEventListener("hashchange", () => {
    setGroup(groupFromHash());
    showScreen("home");
  });

  // ---- Init ----
  setGroup(groupFromHash());
  showScreen("home");
})();
