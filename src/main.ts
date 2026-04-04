import './style.css';
import { COUNT_OPTIONS, generateQuestions } from './game';
import type { Question, GameResult } from './game';
import { saveRecord, getRecords, formatDate } from './storage';
import type { Record } from './storage';

/* =============================================
   App State
   ============================================= */
let selectedCount = 10;
let selectedMode: 'multiply' | 'divide' = 'multiply';
let questions: Question[] = [];
let results: GameResult[] = [];
let currentIndex = 0;
let currentInput = '';
let startTime = 0;
let timerInterval: ReturnType<typeof setInterval> | null = null;

/* =============================================
   Screen references
   ============================================= */
const app = document.getElementById('app')!;

let homeScreen: HTMLElement;
let countdownScreen: HTMLElement;
let gameScreen: HTMLElement;
let resultScreen: HTMLElement;
let modal: HTMLElement;

/* =============================================
   Utility
   ============================================= */
function showScreen(target: HTMLElement) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  requestAnimationFrame(() => target.classList.add('active'));
}

function el<T extends HTMLElement>(tag: string, cls: string, html = ''): T {
  const e = document.createElement(tag) as T;
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/* =============================================
   Home Screen
   ============================================= */
function buildHome() {
  homeScreen = el('div', 'screen');
  homeScreen.id = 'screen-home';

  const logo = el('div', 'logo', '구구단');
  const sub = el('div', 'logo-sub', '한계에 도전해 보세요');
  const label = el('div', 'count-label', '도전과제 선택');

  const modeWrap = el('div', 'mode-wrap');
  const mulBtn = el<HTMLButtonElement>('button', 'mode-btn selected', '×');
  const divBtn = el<HTMLButtonElement>('button', 'mode-btn', '÷');

  mulBtn.addEventListener('click', () => {
    selectedMode = 'multiply';
    mulBtn.classList.add('selected');
    divBtn.classList.remove('selected');
  });
  divBtn.addEventListener('click', () => {
    selectedMode = 'divide';
    divBtn.classList.add('selected');
    mulBtn.classList.remove('selected');
  });
  modeWrap.append(mulBtn, divBtn);

  const grid = el('div', 'count-grid');
  COUNT_OPTIONS.forEach(opt => {
    const btn = el<HTMLButtonElement>('button', 'count-btn');
    btn.id = `count-btn-${opt.value}`;
    btn.innerHTML = `<span>${opt.label}<span class="sub">${opt.sub}</span></span>`;
    btn.addEventListener('click', () => {
      selectedCount = opt.value;
      grid.querySelectorAll('.count-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      startBtn.disabled = false;
    });
    if (opt.value === selectedCount) {
      btn.classList.add('selected');
    }
    grid.appendChild(btn);
  });

  const startBtn = el<HTMLButtonElement>('button', 'btn-primary', '도전 →');
  startBtn.id = 'btn-start';
  startBtn.addEventListener('click', startCountdown);

  const lbBtn = el<HTMLButtonElement>('button', 'btn-secondary', '리더보드');
  lbBtn.style.width = '100%';
  lbBtn.style.maxWidth = '320px';
  lbBtn.style.marginTop = '12px';
  lbBtn.id = 'btn-home-leaderboard';
  lbBtn.addEventListener('click', openLeaderboardModal);

  homeScreen.append(logo, sub, modeWrap, label, grid, startBtn, lbBtn);
  app.appendChild(homeScreen);
}

/* =============================================
   Countdown Screen
   ============================================= */
function buildCountdown() {
  countdownScreen = el('div', 'screen');
  countdownScreen.id = 'screen-countdown';

  const numEl = el('div', 'countdown-number', '3');
  numEl.id = 'countdown-num';
  const labelEl = el('div', 'countdown-label', '준비하세요!');

  countdownScreen.append(numEl, labelEl);
  app.appendChild(countdownScreen);
}

function startCountdown() {
  showScreen(countdownScreen);
  questions = generateQuestions(selectedCount, selectedMode);
  results = [];
  currentIndex = 0;

  const numEl = document.getElementById('countdown-num')!;
  let count = 3;
  numEl.textContent = String(count);

  const tick = () => {
    count--;
    if (count <= 0) {
      startGame();
      return;
    }
    numEl.style.animation = 'none';
    void numEl.offsetHeight; // reflow
    numEl.style.animation = 'pulse-scale 1s ease-in-out';
    numEl.textContent = String(count);
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}

/* =============================================
   Game Screen
   ============================================= */
function buildGame() {
  gameScreen = el('div', 'screen');
  gameScreen.id = 'screen-game';

  // Header
  const header = el('div', 'game-header');
  const progress = el('div', 'game-progress', '1 / 10');
  progress.id = 'game-progress';
  const timer = el('div', 'game-timer', '0.0s');
  timer.id = 'game-timer';
  header.append(progress, timer);

  // Progress bar
  const barWrap = el('div', 'progress-bar-wrap');
  const barFill = el('div', 'progress-bar-fill');
  barFill.id = 'progress-bar';
  barFill.style.width = '0%';
  barWrap.appendChild(barFill);

  // Question
  const card = el('div', 'question-card');
  const qText = el('div', 'question-text', '');
  qText.id = 'question-text';
  const eqText = el('div', 'question-eq', '=');
  const answerDisplay = el('div', 'answer-display empty', '0');
  answerDisplay.id = 'answer-display';
  card.append(qText, eqText, answerDisplay);

  // Numpad
  const numpad = buildNumpad();

  gameScreen.append(header, barWrap, card, numpad);
  app.appendChild(gameScreen);

  // PC keyboard support
  document.addEventListener('keydown', handleKeyDown);
}

function buildNumpad(): HTMLElement {
  const pad = el('div', 'numpad');
  pad.id = 'numpad';

  const layout = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
  layout.forEach(key => {
    const btn = el<HTMLButtonElement>('button', 'numpad-btn');
    btn.textContent = key;
    if (key === '⌫') btn.classList.add('delete');
    if (key === '0') btn.classList.add('zero');
    if (key === '✓') btn.classList.add('submit');
    btn.id = `numpad-${key === '⌫' ? 'del' : key === '✓' ? 'submit' : key}`;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (key === '⌫') deleteDigit();
      else if (key === '✓') submitAnswer();
      else addDigit(key);
    });
    pad.appendChild(btn);
  });
  return pad;
}

function handleKeyDown(e: KeyboardEvent) {
  if (!gameScreen.classList.contains('active')) return;
  if (e.key >= '0' && e.key <= '9') addDigit(e.key);
  else if (e.key === 'Backspace') deleteDigit();
  else if (e.key === 'Enter') submitAnswer();
}

function addDigit(d: string) {
  if (currentInput.length >= 3) return;
  currentInput += d;
  updateAnswerDisplay();
}

function deleteDigit() {
  currentInput = currentInput.slice(0, -1);
  updateAnswerDisplay();
}

function updateAnswerDisplay() {
  const el = document.getElementById('answer-display')!;
  if (currentInput === '') {
    el.textContent = '0';
    el.classList.add('empty');
  } else {
    el.textContent = currentInput;
    el.classList.remove('empty');
  }
}

function submitAnswer() {
  if (currentInput === '') return;

  const q = questions[currentIndex];
  const userAnswer = parseInt(currentInput, 10);
  const isCorrect = userAnswer === q.answer;

  results.push({ question: q, userAnswer, isCorrect });
  currentInput = '';
  currentIndex++;

  if (currentIndex >= questions.length) {
    endGame();
  } else {
    renderCurrentQuestion();
  }
}

function startGame() {
  showScreen(gameScreen);
  startTime = performance.now();
  currentInput = '';

  // Start elapsed timer display
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const el = document.getElementById('game-timer');
    if (el) el.textContent = elapsed.toFixed(1) + 's';
  }, 100);

  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = questions[currentIndex];
  const total = questions.length;

  const op = selectedMode === 'multiply' ? '×' : '÷';
  document.getElementById('question-text')!.textContent = `${q.a} ${op} ${q.b}`;
  document.getElementById('game-progress')!.textContent = `${currentIndex + 1} / ${total}`;
  document.getElementById('progress-bar')!.style.width = `${(currentIndex / total) * 100}%`;
  updateAnswerDisplay();

}

function endGame() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const totalMs = performance.now() - startTime;
  const totalSec = totalMs / 1000;
  const avgTime = totalSec / questions.length;
  const correct = results.filter(r => r.isCorrect).length;
  const accuracy = Math.round((correct / questions.length) * 100);

  const record: Record = {
    date: formatDate(new Date()),
    avgTime: Math.round(avgTime * 10) / 10,
    correct,
    total: questions.length,
    accuracy,
    mode: selectedMode,
  };
  saveRecord(record);
  showResult(totalSec, avgTime, correct, accuracy);
}

/* =============================================
   Result Screen
   ============================================= */
function buildResult() {
  resultScreen = el('div', 'screen');
  resultScreen.id = 'screen-result';
  app.appendChild(resultScreen);
}

function buildModal() {
  modal = el('div', 'modal-overlay');
  modal.id = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-sheet" id="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title" id="modal-title"></div>
      <div id="modal-content"></div>
      <button class="btn-secondary modal-close" id="modal-close-btn">닫기</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  app.appendChild(modal);
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
}

function openModal(title: string, content: string | HTMLElement) {
  document.getElementById('modal-title')!.textContent = title;
  const contentEl = document.getElementById('modal-content')!;
  if (typeof content === 'string') {
    contentEl.innerHTML = content;
  } else {
    contentEl.innerHTML = '';
    contentEl.appendChild(content);
  }
  modal.classList.add('open');
}

function openWrongModal() {
  const wrongList = results.filter(r => !r.isCorrect);
  const html = '<div class="wrong-list">' + wrongList.map(r => {
    const op = selectedMode === 'multiply' ? '×' : '÷';
    return `
    <div class="wrong-item">
      <span class="wrong-question">${r.question.a} ${op} ${r.question.b}</span>
      <div class="wrong-answer-wrap">
        <span class="wrong-yours">${r.userAnswer ?? '?'}</span>
        <span class="wrong-correct">→ ${r.question.answer}</span>
      </div>
    </div>
  `}).join('') + '</div>';
  openModal('틀린 문제 목록', html);
}

function openLeaderboardModal() {
  const lbSection = buildLeaderboard();
  lbSection.querySelector('.leaderboard-title')?.remove();
  lbSection.style.marginTop = '0';
  openModal('리더보드 보기', lbSection);
}

function closeModal() {
  modal.classList.remove('open');
}

function showResult(totalSec: number, avgTime: number, correct: number, accuracy: number) {
  // Clear and rebuild result screen
  resultScreen.innerHTML = '';

  const emoji = el('div', 'result-emoji', accuracy >= 90 ? '🎉' : accuracy >= 70 ? '👍' : '💪');
  const title = el('div', 'result-title', '게임 종료');

  // Stats
  const statsGrid = el('div', 'stats-grid');
  const stats = [
    { value: totalSec.toFixed(1) + 's', label: '총 소요시간' },
    { value: avgTime.toFixed(1) + 's', label: '문제당 평균' },
    { value: `${correct}/${questions.length}`, label: '정답 수' },
    { value: `${accuracy}%`, label: '정답률' },
  ];
  stats.forEach(s => {
    const card = el('div', 'stat-card');
    card.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
    statsGrid.appendChild(card);
  });

  // Actions
  const actions = el('div', 'result-actions');

  const wrongCount = results.filter(r => !r.isCorrect).length;
  if (wrongCount > 0) {
    const wrongBtn = el<HTMLButtonElement>('button', 'btn-secondary', `틀린 문제 보기 (${wrongCount}개)`);
    wrongBtn.id = 'btn-wrong';
    wrongBtn.addEventListener('click', openWrongModal);
    actions.appendChild(wrongBtn);
  }

  const retryBtn = el<HTMLButtonElement>('button', 'btn-primary', '다시하기');
  retryBtn.id = 'btn-retry';
  retryBtn.addEventListener('click', () => {
    currentInput = '';
    showScreen(homeScreen);
  });
  actions.appendChild(retryBtn);

  // Leaderboard
  const lbSection = buildLeaderboard();

  resultScreen.append(emoji, title, statsGrid, actions, lbSection);
  showScreen(resultScreen);
}

function buildLeaderboard(): HTMLElement {
  const section = el('div', 'leaderboard-section');
  const title = el('div', 'leaderboard-title', '리더보드');

  // Tabs
  const tabWrap = el('div', 'lb-tabs');
  const mulTab = el<HTMLButtonElement>('button', 'lb-tab', '곱셈');
  const divTab = el<HTMLButtonElement>('button', 'lb-tab', '나눗셈');
  tabWrap.append(mulTab, divTab);

  const list = el('div', 'leaderboard-list');

  function renderList(modeFilter: 'multiply' | 'divide') {
    list.innerHTML = '';
    const records = getRecords()
      .filter(r => (r.mode || 'multiply') === modeFilter)
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.avgTime - b.avgTime;
      });

    records.slice(0, 10).forEach((r, i) => {
      const item = el('div', i === 0 ? 'leaderboard-item gold' : 'leaderboard-item');
      item.innerHTML = `
        <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
        <span class="lb-date">${r.date}</span>
        <span class="lb-stat">${r.avgTime}s/문제 · ${r.accuracy}%</span>
      `;
      list.appendChild(item);
    });

    if (records.length === 0) {
      list.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">아직 기록이 없어요</div>';
    }
  }

  mulTab.addEventListener('click', () => {
    mulTab.classList.add('active');
    divTab.classList.remove('active');
    renderList('multiply');
  });
  divTab.addEventListener('click', () => {
    divTab.classList.add('active');
    mulTab.classList.remove('active');
    renderList('divide');
  });

  // Init
  if (selectedMode === 'divide') {
    divTab.classList.add('active');
    renderList('divide');
  } else {
    mulTab.classList.add('active');
    renderList('multiply');
  }

  section.append(title, tabWrap, list);
  return section;
}

/* =============================================
   Init
   ============================================= */
function init() {
  buildHome();
  buildCountdown();
  buildGame();
  buildResult();
  buildModal();

  // Show home on start
  requestAnimationFrame(() => homeScreen.classList.add('active'));
}

init();
