import type { Game } from '@/game/Game';
import { useGameStore } from '@/store/gameStore';
import type { SushiType } from '@/types';

const SUSHI_LABELS: Record<SushiType, string> = {
  egg: '계란',
  shrimp: '새우',
  tobiko: '날치알',
  ikura: '연어알',
  salmon: '연어',
  tuna: '참치',
  whitefish: '흰살',
};

export function createHUD(getGame: () => Game | null): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-screen', 'playing');
  root.className = 'absolute inset-0 flex flex-col text-white';

  const topBar = document.createElement('div');
  topBar.className = 'flex items-center justify-between px-3 py-2 bg-[#8B4513]/90 rounded-b-lg';
  const scoreEl = document.createElement('span');
  scoreEl.id = 'hud-score';
  scoreEl.textContent = '0 / 1000';
  const btnRow = document.createElement('div');
  btnRow.className = 'flex gap-2';
  const homeBtn = document.createElement('button');
  homeBtn.textContent = '홈';
  homeBtn.className = 'px-3 py-1 bg-amber-800 rounded';
  const menuBtn = document.createElement('button');
  menuBtn.textContent = '≡';
  menuBtn.className = 'px-3 py-1 bg-amber-800 rounded';
  btnRow.append(homeBtn, menuBtn);
  topBar.append(scoreEl, btnRow);
  root.appendChild(topBar);

  const rightPanel = document.createElement('div');
  rightPanel.className = 'absolute right-2 bottom-24 flex flex-col gap-2';
  const itemsLabel = document.createElement('div');
  itemsLabel.className = 'text-sm font-bold text-amber-900';
  itemsLabel.textContent = 'ITEMS';
  const itemRow = document.createElement('div');
  itemRow.className = 'flex gap-2';
  const wasabiBtn = document.createElement('button');
  wasabiBtn.id = 'btn-wasabi';
  wasabiBtn.className = 'w-12 h-12 rounded-full bg-green-600 text-white text-xs font-bold';
  wasabiBtn.textContent = 'W';
  const gingerBtn = document.createElement('button');
  gingerBtn.id = 'btn-ginger';
  gingerBtn.className = 'w-12 h-12 rounded-full bg-pink-400 text-white text-xs font-bold';
  gingerBtn.textContent = 'G';
  const wasabiCount = document.createElement('span');
  wasabiCount.id = 'count-wasabi';
  wasabiCount.className = 'text-amber-900 text-sm';
  const gingerCount = document.createElement('span');
  gingerCount.id = 'count-ginger';
  gingerCount.className = 'text-amber-900 text-sm';
  itemRow.append(wasabiBtn, wasabiCount, gingerBtn, gingerCount);
  rightPanel.append(itemsLabel, itemRow);

  const nextLabel = document.createElement('div');
  nextLabel.className = 'text-sm font-bold text-amber-900 mt-2';
  nextLabel.textContent = 'NEXT';
  const nextEl = document.createElement('div');
  nextEl.id = 'hud-next-sushi';
  nextEl.className = 'text-amber-900 text-sm';
  rightPanel.appendChild(nextLabel);
  rightPanel.appendChild(nextEl);
  root.appendChild(rightPanel);

  function update() {
    const s = useGameStore.getState();
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.textContent = String(s.score);
    const cw = document.getElementById('count-wasabi');
    if (cw) cw.textContent = `×${s.items.wasabi}`;
    const cg = document.getElementById('count-ginger');
    if (cg) cg.textContent = `×${s.items.ginger}`;
    const next = document.getElementById('hud-next-sushi');
    const g = getGame();
    if (next && g) next.textContent = SUSHI_LABELS[g.shooter.nextType] ?? '';
  }

  wasabiBtn.addEventListener('click', () => {
    getGame()?.useWasabi();
    update();
  });
  gingerBtn.addEventListener('click', () => {
    getGame()?.useGinger();
    update();
  });
  homeBtn.addEventListener('click', () => {
    useGameStore.getState().setGameState('title');
  });
  menuBtn.addEventListener('click', () => {
    useGameStore.getState().setGameState('paused');
  });

  useGameStore.subscribe(update);
  update();
  return root;
}

export function createTitleScreen(onStart: () => void): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-screen', 'title');
  root.className = 'absolute inset-0 flex flex-col items-center justify-center gap-6';
  root.style.cssText = 'background: rgba(139,69,19,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center;';
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold';
  title.style.cssText = 'color: #fff; font-size: 1.75rem;';
  title.textContent = '회전초밥 브레이커';
  const sub = document.createElement('p');
  sub.style.color = '#fffbeb';
  sub.textContent = "Chef's Hand";
  const startBtn = document.createElement('button');
  startBtn.style.cssText = 'padding: 1rem 2rem; background: #b45309; color: #fff; font-size: 1.25rem; font-weight: bold; border: none; border-radius: 12px; cursor: pointer;';
  startBtn.textContent = '시작';
  startBtn.addEventListener('click', onStart);
  root.append(title, sub, startBtn);
  return root;
}

export function createPauseScreen(): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-screen', 'paused');
  root.className = 'absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4';
  const title = document.createElement('h2');
  title.className = 'text-2xl text-white';
  title.textContent = '일시정지';
  const resumeBtn = document.createElement('button');
  resumeBtn.className = 'px-6 py-3 bg-amber-600 text-white rounded-lg';
  resumeBtn.textContent = '계속';
  resumeBtn.addEventListener('click', () => useGameStore.getState().setGameState('playing'));
  root.append(title, resumeBtn);
  return root;
}

export function createClearScreen(onNext: () => void): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-screen', 'clear');
  root.className = 'absolute inset-0 flex flex-col items-center justify-center bg-[#8B4513]/90 gap-4';
  const title = document.createElement('h2');
  title.className = 'text-2xl text-white';
  title.textContent = '클리어!';
  const scoreEl = document.createElement('p');
  scoreEl.id = 'clear-score';
  scoreEl.className = 'text-white text-lg';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'px-6 py-3 bg-amber-600 text-white rounded-lg';
  nextBtn.textContent = '다음 레벨';
  nextBtn.addEventListener('click', onNext);
  root.append(title, scoreEl, nextBtn);
  return root;
}

export function createGameOverScreen(onRetry: () => void): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-screen', 'gameover');
  root.className = 'absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4';
  const title = document.createElement('h2');
  title.className = 'text-2xl text-white';
  title.textContent = '게임 오버';
  const scoreEl = document.createElement('p');
  scoreEl.id = 'gameover-score';
  scoreEl.className = 'text-white';
  const retryBtn = document.createElement('button');
  retryBtn.className = 'px-6 py-3 bg-amber-600 text-white rounded-lg';
  retryBtn.textContent = '다시 하기';
  retryBtn.addEventListener('click', onRetry);
  root.append(title, scoreEl, retryBtn);
  return root;
}
