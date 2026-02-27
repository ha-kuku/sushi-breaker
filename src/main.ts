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

  function startNewGame(level = 1) {
    game?.destroy();
    useGameStore.getState().resetGame(level);
    game = new Game(app);
    buildHUD();
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
      if (sc) sc.textContent = `${s.score} / ${s.targetScore}`;
      const cw = document.getElementById('count-wasabi');
      if (cw) cw.textContent = `×${s.items.wasabi}`;
      const cg = document.getElementById('count-ginger');
      if (cg) cg.textContent = `×${s.items.ginger}`;
      const nxImg = document.getElementById('hud-next-img') as HTMLImageElement | null;
      if (nxImg && game) {
        nxImg.src = `assets/sushi/${game.shooter.nextType}.png`;
      }

      if (s.gameState === 'clear' && !document.getElementById('clear-overlay')) {
        showOverlay('clear-overlay', '클리어!', `점수: ${s.score} / ${s.targetScore}`, '다음 레벨', () => {
          document.getElementById('clear-overlay')?.remove();
          const lvl = useGameStore.getState().level + 1;
          startNewGame(lvl);
        });
      }
      if (s.gameState === 'gameover' && !document.getElementById('gameover-overlay')) {
        showOverlay('gameover-overlay', '게임 오버', `점수: ${s.score}`, '다시 하기', () => {
          document.getElementById('gameover-overlay')?.remove();
          startNewGame(1);
        });
      }
    }

    function showOverlay(id: string, titleText: string, scoreText: string, btnText: string, onClick: () => void) {
      const scr = document.createElement('div');
      scr.id = id;
      scr.className = 'screen-overlay';
      scr.style.background = id === 'clear-overlay' ? 'rgba(74,44,16,0.9)' : 'rgba(0,0,0,0.7)';
      const h2 = document.createElement('h2');
      h2.textContent = titleText;
      const p = document.createElement('p');
      p.textContent = scoreText;
      const btn = document.createElement('button');
      btn.textContent = btnText;
      btn.addEventListener('click', onClick);
      scr.append(h2, p, btn);
      overlay?.appendChild(scr);
    }

    useGameStore.subscribe(update);
    update();
  }

  const startBtn = document.getElementById('start-btn');
  const titleScreen = document.getElementById('title-screen');

  startBtn?.addEventListener('click', () => {
    console.log('[SushiBreaker] Start clicked');
    titleScreen?.classList.add('hidden');
    startNewGame(1);
  });

  console.log('[SushiBreaker] Ready');
}

init().catch((err) => {
  showError(`초기화 실패: ${err?.message ?? err}`);
});
