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

// i18n support
const TRANSLATIONS = {
  ko: {
    logo: '구구단',
    logoSub: '한계에 도전해 보세요',
    challengeLabel: '도전과제 선택',
    normalMode: '× Normal',
    reverseMode: '÷ Reverse',
    challengeBtn: '도전 →',
    leaderboardBtn: '리더보드',
    countdownLabel: '준비하세요!',
    totalTime: '총 소요시간',
    avgTime: '문제당 평균',
    correctCount: '정답 수',
    accuracyLabel: '정답률',
    wrongAnswersTitle: '틀린 문제 목록',
    firstScreenBtn: '첫 화면으로',
    leaderboardTitle: '리더보드',
    noRecords: '아직 기록이 없어요',
    closeBtn: '닫기',
    confirmQuit: '게임을 포기하고 첫화면으로 돌아갈까요?',
    secondsPerQuestion: 's/문제',
    gameEnded: '게임 종료',
    quitBtn: '게임중단'
  },
  en: {
    logo: 'Gugudan',
    logoSub: 'Challenge your limits',
    challengeLabel: 'Select Challenge',
    normalMode: '× Normal',
    reverseMode: '÷ Reverse',
    challengeBtn: 'Start →',
    leaderboardBtn: 'Leaderboard',
    countdownLabel: 'Get Ready!',
    totalTime: 'Total Time',
    avgTime: 'Avg Time/Q',
    correctCount: 'Correct',
    accuracyLabel: 'Accuracy',
    wrongAnswersTitle: 'Incorrect Answers',
    firstScreenBtn: 'Home',
    leaderboardTitle: 'Leaderboard',
    noRecords: 'No records yet',
    closeBtn: 'Close',
    confirmQuit: 'Are you sure you want to quit the game and return to the main screen?',
    secondsPerQuestion: 's/Q',
    gameEnded: 'Game Over',
    quitBtn: 'Forfeit'
  }
};

let currentLang: 'ko' | 'en' = (localStorage.getItem('gugudan_lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en')) as 'ko' | 'en';

function t(key: keyof typeof TRANSLATIONS['ko']): string {
  return TRANSLATIONS[currentLang][key] || key;
}

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
  (document.activeElement as HTMLElement)?.blur();
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

  const logo = el('div', 'logo', t('logo'));
  const sub = el('div', 'logo-sub', t('logoSub'));
  const label = el('div', 'count-label', t('challengeLabel'));

  const modeWrap = el('div', 'mode-wrap');
  const mulBtn = el<HTMLButtonElement>('button', `mode-btn${selectedMode === 'multiply' ? ' selected' : ''}`, t('normalMode'));
  const divBtn = el<HTMLButtonElement>('button', `mode-btn${selectedMode === 'divide' ? ' selected' : ''}`, t('reverseMode'));

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
    
    let labelText = opt.label;
    let subText = opt.sub;
    if (currentLang === 'en') {
      if (opt.value === 10) { labelText = '10 Qs'; subText = 'Quick challenge'; }
      else if (opt.value === 20) { labelText = '20 Qs'; subText = 'Normal difficulty'; }
      else if (opt.value === 30) { labelText = '30 Qs'; subText = 'Ample practice'; }
      else if (opt.value === 72) { labelText = 'All'; subText = 'Master 72 Qs'; }
    }
    
    btn.innerHTML = `<span>${labelText}<span class="sub">${subText}</span></span>`;
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

  const startBtn = el<HTMLButtonElement>('button', 'btn-primary', t('challengeBtn'));
  startBtn.id = 'btn-start';
  startBtn.addEventListener('click', startCountdown);

  const lbBtn = el<HTMLButtonElement>('button', 'btn-secondary', t('leaderboardBtn'));
  lbBtn.style.width = '100%';
  lbBtn.style.maxWidth = '320px';
  lbBtn.style.marginTop = '12px';
  lbBtn.id = 'btn-home-leaderboard';
  lbBtn.addEventListener('click', openLeaderboardModal);

  // GitHub Corner (Dog ear)
  const gitLink = el<HTMLAnchorElement>('a', 'github-corner');
  gitLink.id = 'github-link';
  gitLink.href = 'https://github.com/surajang/gugudan';
  gitLink.target = '_blank';
  gitLink.rel = 'noopener noreferrer';
  gitLink.setAttribute('aria-label', 'View source on GitHub');
  gitLink.innerHTML = `
    <svg width="70" height="70" viewBox="0 0 250 250" style="position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true">
      <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
      <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>
      <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path>
    </svg>
  `;

  // Language Toggle Button
  const langBtn = el<HTMLButtonElement>('button', 'lang-btn', currentLang === 'ko' ? '🌐 English' : '🌐 한국어');
  langBtn.id = 'btn-lang';
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('gugudan_lang', currentLang);
    init();
  });

  homeScreen.append(logo, sub, modeWrap, label, grid, startBtn, lbBtn, gitLink, langBtn);
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
  const labelEl = el('div', 'countdown-label', t('countdownLabel'));

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

  // Quit Button
  const quitBtn = el<HTMLButtonElement>('button', 'btn-quit', t('quitBtn'));
  quitBtn.id = 'btn-quit';
  quitBtn.addEventListener('click', () => {
    const confirmQuit = confirm(t('confirmQuit'));
    if (confirmQuit) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      currentInput = '';
      results = [];
      questions = [];
      currentIndex = 0;
      showScreen(homeScreen);
    }
  });

  gameScreen.append(header, barWrap, quitBtn, card, numpad);
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
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    addDigit(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    deleteDigit();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    submitAnswer();
  } else if (e.key === ' ') {
    e.preventDefault();
  }
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
    avgTime: avgTime,
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
      <button class="btn-secondary modal-close" id="modal-close-btn">${t('closeBtn')}</button>
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
  openModal(t('wrongAnswersTitle'), html);
}

function openLeaderboardModal() {
  const lbSection = buildLeaderboard();
  lbSection.querySelector('.leaderboard-title')?.remove();
  lbSection.style.marginTop = '0';
  openModal(t('leaderboardTitle'), lbSection);
}

function closeModal() {
  modal.classList.remove('open');
}

function showResult(totalSec: number, avgTime: number, correct: number, accuracy: number) {
  // Clear and rebuild result screen
  resultScreen.innerHTML = '';

  const emoji = el('div', 'result-emoji', accuracy >= 90 ? '🎉' : accuracy >= 70 ? '👍' : '💪');
  const title = el('div', 'result-title', t('gameEnded'));

  // Stats
  const statsGrid = el('div', 'stats-grid');
  const stats = [
    { value: totalSec.toFixed(1) + 's', label: t('totalTime') },
    { value: avgTime.toFixed(1) + 's', label: t('avgTime') },
    { value: `${correct}/${questions.length}`, label: t('correctCount') },
    { value: `${accuracy}%`, label: t('accuracyLabel') },
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
    const btnText = currentLang === 'ko'
      ? `틀린 문제 보기 (${wrongCount}개)`
      : `Review Mistakes (${wrongCount})`;
    const wrongBtn = el<HTMLButtonElement>('button', 'btn-secondary', btnText);
    wrongBtn.id = 'btn-wrong';
    wrongBtn.addEventListener('click', openWrongModal);
    actions.appendChild(wrongBtn);
  }

  const retryBtn = el<HTMLButtonElement>('button', 'btn-primary', t('firstScreenBtn'));
  retryBtn.id = 'btn-retry';
  retryBtn.addEventListener('click', () => {
    currentInput = '';
    showScreen(homeScreen);
  });
  actions.appendChild(retryBtn);

  // Leaderboard
  const lbSection = buildLeaderboard(selectedMode);

  resultScreen.append(emoji, title, statsGrid, actions, lbSection);
  showScreen(resultScreen);
}

function buildLeaderboard(onlyMode?: 'multiply' | 'divide'): HTMLElement {
  const section = el('div', 'leaderboard-section');
  
  const titleText = onlyMode 
    ? `${t('leaderboardTitle')} (${onlyMode === 'multiply' ? 'Normal' : 'Reverse'})` 
    : t('leaderboardTitle');
  const title = el('div', 'leaderboard-title', titleText);
  section.append(title);

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
      
      const rankText = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      
      item.innerHTML = `
        <span class="lb-rank">${rankText}</span>
        <span class="lb-date">${r.date}</span>
        <span class="lb-stat">${r.avgTime.toFixed(1)}${t('secondsPerQuestion')} · ${r.accuracy}%</span>
      `;
      list.appendChild(item);
    });

    if (records.length === 0) {
      list.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">${t('noRecords')}</div>`;
    }
  }

  if (onlyMode) {
    renderList(onlyMode);
  } else {
    // Tabs
    const tabWrap = el('div', 'lb-tabs');
    const mulTab = el<HTMLButtonElement>('button', 'lb-tab', 'Normal');
    const divTab = el<HTMLButtonElement>('button', 'lb-tab', 'Reverse');
    tabWrap.append(mulTab, divTab);

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
    section.append(tabWrap);
  }

  section.append(list);
  return section;
}

function updateTitle() {
  const baseTitle = currentLang === 'ko' ? '구구단 게임' : 'Gugudan Game';
  const buildSuffix = typeof __BUILD_INFO__ !== 'undefined' ? ` (${__BUILD_INFO__.buildTime})` : '';
  document.title = `${baseTitle}${buildSuffix}`;
}

/* =============================================
   Init
   ============================================= */
function init() {
  app.innerHTML = ''; // Clear existing contents for dynamic re-render in i18n
  updateTitle();
  buildHome();
  buildCountdown();
  buildGame();
  buildResult();
  buildModal();

  // Show home on start
  requestAnimationFrame(() => homeScreen.classList.add('active'));
}

init();
