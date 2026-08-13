const LEVELS = {
  easy: { pairs: 6, columns: 4 },
  normal: { pairs: 8, columns: 4 },
  hard: { pairs: 12, columns: 6 },
};

const SYMBOLS = ["🌿", "🍊", "🐳", "🌙", "🪻", "🍄", "🦋", "☕", "🐚", "🍋", "🪐", "🫐"];

const board = document.querySelector("#game-board");
const movesElement = document.querySelector("#moves");
const timerElement = document.querySelector("#timer");
const bestElement = document.querySelector("#best");
const matchedElement = document.querySelector("#matched-count");
const pairElement = document.querySelector("#pair-count");
const progressFill = document.querySelector("#progress-fill");
const resetButton = document.querySelector("#reset-button");
const celebration = document.querySelector("#celebration");
const resultMoves = document.querySelector("#result-moves");
const resultTime = document.querySelector("#result-time");
const resultSummary = document.querySelector("#result-summary");
const newRecord = document.querySelector("#new-record");
const playAgainButton = document.querySelector("#play-again-button");
const levelButtons = [...document.querySelectorAll(".level-button")];

let currentLevel = "normal";
let firstCard = null;
let secondCard = null;
let matchedPairs = 0;
let moves = 0;
let seconds = 0;
let timerId = null;
let started = false;
let locked = false;

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function bestKey() {
  return `memory-garden-best-${currentLevel}`;
}

function getBest() {
  try {
    const value = localStorage.getItem(bestKey());
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function updateBestDisplay() {
  const best = getBest();
  bestElement.textContent = best ? `${best.moves}步` : "—";
  bestElement.title = best ? `最佳用时 ${formatTime(best.seconds)}` : "还没有最佳成绩";
}

function startTimer() {
  if (started) return;
  started = true;
  timerId = window.setInterval(() => {
    seconds += 1;
    timerElement.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function makeCard(symbol, index) {
  const card = document.createElement("button");
  card.className = "memory-card";
  card.type = "button";
  card.dataset.symbol = symbol;
  card.setAttribute("aria-label", `未翻开的卡片 ${index + 1}`);
  card.innerHTML = `
    <span class="card-face card-back" aria-hidden="true">✦</span>
    <span class="card-face card-front" aria-hidden="true">${symbol}</span>
  `;
  card.addEventListener("click", () => flipCard(card));
  return card;
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

function flipCard(card) {
  if (locked || card === firstCard || card.classList.contains("is-matched")) return;

  startTimer();
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", `已翻开：${card.dataset.symbol}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  movesElement.textContent = moves;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("is-matched");
    secondCard.classList.add("is-matched");
    firstCard.disabled = true;
    secondCard.disabled = true;
    matchedPairs += 1;
    matchedElement.textContent = matchedPairs;
    progressFill.style.width = `${(matchedPairs / LEVELS[currentLevel].pairs) * 100}%`;
    resetTurn();

    if (matchedPairs === LEVELS[currentLevel].pairs) {
      finishGame();
    }
    return;
  }

  locked = true;
  window.setTimeout(() => {
    [firstCard, secondCard].forEach((selectedCard) => {
      selectedCard.classList.remove("is-flipped");
      selectedCard.setAttribute("aria-label", "未翻开的卡片");
    });
    resetTurn();
  }, 760);
}

function saveBest() {
  const previous = getBest();
  const isBetter = !previous || moves < previous.moves || (moves === previous.moves && seconds < previous.seconds);

  if (isBetter) {
    try {
      localStorage.setItem(bestKey(), JSON.stringify({ moves, seconds }));
    } catch {
      // The game still works when storage is disabled.
    }
  }
  return isBetter;
}

function finishGame() {
  stopTimer();
  const isRecord = saveBest();
  updateBestDisplay();
  resultMoves.textContent = moves;
  resultTime.textContent = formatTime(seconds);
  resultSummary.textContent = moves <= LEVELS[currentLevel].pairs + 3
    ? "好厉害，几乎过目不忘。"
    : "每一次翻开，都让记忆更清晰。";
  newRecord.hidden = !isRecord;

  window.setTimeout(() => {
    celebration.hidden = false;
    playAgainButton.focus();
  }, 520);
}

function buildGame() {
  stopTimer();
  firstCard = null;
  secondCard = null;
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  started = false;
  locked = false;
  celebration.hidden = true;

  const pairTotal = LEVELS[currentLevel].pairs;
  const symbols = SYMBOLS.slice(0, pairTotal);
  const deck = shuffle([...symbols, ...symbols]);

  board.replaceChildren(...deck.map(makeCard));
  board.dataset.level = currentLevel;
  board.style.setProperty("--columns", LEVELS[currentLevel].columns);
  movesElement.textContent = "0";
  timerElement.textContent = "00:00";
  matchedElement.textContent = "0";
  pairElement.textContent = pairTotal;
  progressFill.style.width = "0";
  updateBestDisplay();
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLevel = button.dataset.level;
    levelButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    buildGame();
  });
});

resetButton.addEventListener("click", buildGame);
playAgainButton.addEventListener("click", buildGame);

celebration.addEventListener("click", (event) => {
  if (event.target.classList.contains("celebration-backdrop")) buildGame();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !celebration.hidden) buildGame();
});

buildGame();
