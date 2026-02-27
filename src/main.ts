import './index.css';
import { VIEW_WIDTH, VIEW_HEIGHT } from '@/utils/constants';

function showError(msg: string) {
  const el = document.getElementById('error-display');
  if (el) {
    el.style.display = 'block';
    el.textContent = msg;
  }
  console.error('[SushiBreaker] ERROR:', msg);
}

function resizeCanvas() {
  const wrapper = document.getElementById('game-canvas-wrapper');
  if (!wrapper) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / VIEW_WIDTH, h / VIEW_HEIGHT);
  wrapper.style.transform = `scale(${scale})`;
}

async function init() {
  console.log('[SushiBreaker] init start');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const { Application, Assets } = await import('pixi.js');
  console.log('[SushiBreaker] PixiJS loaded');

  const app = new Application();
  await app.init({
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: 0xdeb887,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  console.log('[SushiBreaker] PixiJS app initialized');

  const wrapper = document.getElementById('game-canvas-wrapper');
  if (!wrapper) throw new Error('game-canvas-wrapper not found');
  wrapper.appendChild(app.canvas as HTMLCanvasElement);

  const { getSushiTexturePaths } = await import('@/game/Sushi');
  const allTextures = [
    ...getSushiTexturePaths(),
    'assets/items/wasabi.png',
    'assets/items/ginger.png',
  ];
  await Assets.load(allTextures);
  console.log('[SushiBreaker] Assets preloaded');

  const { Game } = await import('@/game/Game');
  const { useGameStore } = await import('@/store/gameStore');
  console.log('[SushiBreaker] Modules loaded');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let game: any = null;

  function startNewGame() {
    game?.destroy();
    useGameStore.getState().resetGame();
    game = new Game(app);
    buildHUD();
    showOnboardingModal();
  }

  function showOnboardingModal() {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay || document.getElementById('onboarding-modal')) return;
    useGameStore.getState().setGameState('paused');

    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';

    const inner = document.createElement('div');
    inner.className = 'onboarding-inner';

    const title = document.createElement('h2');
    title.textContent = '게임 방법';
    title.className = 'onboarding-title';

    const list = document.createElement('ul');
    list.className = 'onboarding-list';
    list.innerHTML = `
      <li>같은 종류 초밥 <strong>3개 이상</strong>을 연속으로 맞추면 터져요.</li>
      <li>화면을 <strong>드래그</strong>해서 방향을 정한 뒤 손을 떼면 발사됩니다.</li>
      <li>초밥이 <strong>끝까지 도달</strong>하면 게임 오버예요.</li>
      <li>우측 하단 <strong>아이템</strong>으로 와사비 폭탄·생강 슬로우를 쓸 수 있어요.</li>
    `;

    const btn = document.createElement('button');
    btn.className = 'onboarding-btn';
    btn.textContent = '시작하기';
    btn.addEventListener('click', () => {
      modal.remove();
      useGameStore.getState().setGameState('playing');
    });

    inner.append(title, list, btn);
    modal.appendChild(inner);
    overlay?.appendChild(modal);
  }

  function buildHUD() {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    // Score bar — centered, compact width
    const topBar = document.createElement('div');
    topBar.className = 'hud-top';
    topBar.style.backgroundImage = 'url(assets/ui/scoreboard.png)';
    topBar.style.backgroundSize = '100% 100%';
    topBar.style.backgroundRepeat = 'no-repeat';
    const scoreSpan = document.createElement('span');
    scoreSpan.id = 'hud-score';
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'home-btn';
    pauseBtn.textContent = '⏸';
    pauseBtn.addEventListener('click', () => {
      const s = useGameStore.getState();
      if (s.gameState === 'playing') {
        useGameStore.getState().setGameState('paused');
        showPauseOverlay();
      }
    });

    const homeBtn = document.createElement('button');
    homeBtn.className = 'home-btn';
    homeBtn.textContent = '🏠';
    homeBtn.addEventListener('click', () => {
      game?.destroy();
      game = null;
      overlay.innerHTML = '';
      document.getElementById('title-screen')?.classList.remove('hidden');
      useGameStore.getState().setGameState('title');
    });

    btnGroup.append(pauseBtn, homeBtn);
    topBar.append(scoreSpan, btnGroup);
    overlay.appendChild(topBar);

    function showPauseOverlay() {
      if (document.getElementById('pause-overlay')) return;
      const scr = document.createElement('div');
      scr.id = 'pause-overlay';
      scr.className = 'screen-overlay';
      scr.style.background = 'rgba(0,0,0,0.6)';
      const h2 = document.createElement('h2');
      h2.textContent = '일시정지';
      const btn = document.createElement('button');
      btn.textContent = '계속하기';
      btn.addEventListener('click', () => {
        useGameStore.getState().setGameState('playing');
        scr.remove();
      });
      scr.append(h2, btn);
      overlay?.appendChild(scr);
    }

    // Combined bottom panel: items + next sushi
    const bottomPanel = document.createElement('div');
    bottomPanel.className = 'bottom-panel';

    // Items section
    const itemLabel = document.createElement('div');
    itemLabel.className = 'panel-label';
    itemLabel.textContent = 'ITEMS';
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';

    const wBtn = document.createElement('button');
    wBtn.className = 'item-btn wasabi';
    const wImg = document.createElement('img');
    wImg.src = 'assets/items/wasabi.png';
    wImg.style.cssText = 'width:24px;height:24px;pointer-events:none;';
    wBtn.appendChild(wImg);
    wBtn.addEventListener('click', () => { game?.useWasabi(); update(); });
    const wCount = document.createElement('span');
    wCount.id = 'count-wasabi';
    wCount.className = 'item-count';

    const gBtn = document.createElement('button');
    gBtn.className = 'item-btn ginger';
    const gImg = document.createElement('img');
    gImg.src = 'assets/items/ginger.png';
    gImg.style.cssText = 'width:24px;height:24px;pointer-events:none;';
    gBtn.appendChild(gImg);
    gBtn.addEventListener('click', () => { game?.useGinger(); update(); });
    const gCount = document.createElement('span');
    gCount.id = 'count-ginger';
    gCount.className = 'item-count';

    itemRow.append(wBtn, wCount, gBtn, gCount);
    bottomPanel.append(itemLabel, itemRow);

    // Divider
    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.15);margin:2px 0;';
    bottomPanel.appendChild(divider);

    // Next sushi section
    const nextLabel = document.createElement('div');
    nextLabel.className = 'panel-label';
    nextLabel.textContent = 'NEXT';
    const nextRow = document.createElement('div');
    nextRow.className = 'next-row';
    const nextImg = document.createElement('img');
    nextImg.id = 'hud-next-img';
    nextImg.style.cssText = 'width:30px;height:30px;';
    nextRow.appendChild(nextImg);
    bottomPanel.append(nextLabel, nextRow);

    overlay.appendChild(bottomPanel);

    function update() {
      const s = useGameStore.getState();
      const sc = document.getElementById('hud-score');
      if (sc) sc.textContent = String(s.score);
      const cw = document.getElementById('count-wasabi');
      if (cw) cw.textContent = `×${s.items.wasabi}`;
      const cg = document.getElementById('count-ginger');
      if (cg) cg.textContent = `×${s.items.ginger}`;
      const nxImg = document.getElementById('hud-next-img') as HTMLImageElement | null;
      if (nxImg && game) {
        nxImg.src = `assets/sushi/${game.shooter.nextType}.png`;
      }

      if (s.gameState === 'gameover' && !document.getElementById('gameover-overlay')) {
        const scr = document.createElement('div');
        scr.id = 'gameover-overlay';
        scr.className = 'screen-overlay';
        scr.style.background = 'rgba(0,0,0,0.7)';
        const h2 = document.createElement('h2');
        h2.textContent = '게임 오버';
        const p = document.createElement('p');
        p.textContent = `점수: ${s.score}`;
        const btn = document.createElement('button');
        btn.textContent = '다시 하기';
        btn.addEventListener('click', () => {
          scr.remove();
          startNewGame();
        });
        scr.append(h2, p, btn);
        overlay?.appendChild(scr);
      }
    }

    useGameStore.subscribe(update);
    update();
  }

  const startBtn = document.getElementById('start-btn');
  const titleScreen = document.getElementById('title-screen');

  startBtn?.addEventListener('click', () => {
    console.log('[SushiBreaker] Start clicked');
    titleScreen?.classList.add('hidden');
    startNewGame();
  });

  console.log('[SushiBreaker] Ready');
}

init().catch((err) => {
  showError(`초기화 실패: ${err?.message ?? err}`);
});
