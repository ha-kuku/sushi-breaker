import type { Application } from 'pixi.js';
import { Container, Graphics } from 'pixi.js';
import { VIEW_WIDTH, VIEW_HEIGHT, CHAIN_SPEED } from '@/utils/constants';
import { Path } from '@/game/Path';
import { SushiChain } from '@/game/SushiChain';
import { Shooter } from '@/game/Shooter';
import { checkProjectileChainCollision } from '@/game/Collision';
import { findMatch, findNextCombo } from '@/game/Matcher';
import { getSushiScore } from '@/game/Sushi';
import { useGameStore } from '@/store/gameStore';
import { getGingerSpeedMultiplier, activateWasabi as doActivateWasabi, executeWasabiBomb, activateGinger as doActivateGinger } from '@/game/ItemSystem';
import { vibrateOnMatch } from '@/utils/haptics';
import { sound } from '@/utils/sound';

/** 나무 배경 (카운터/테이블 느낌) */
function createWoodBackground(): Graphics {
  const g = new Graphics();
  const base = 0xdeb887;
  g.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill({ color: base });

  for (let y = 0; y < VIEW_HEIGHT; y += 12) {
    const alpha = (y / 12) % 2 === 0 ? 0.92 : 1;
    g.rect(0, y, VIEW_WIDTH, 6).fill({ color: 0xd2a56d, alpha });
  }
  return g;
}

const PROJECTILE_MISS_MARGIN = 80;
const PROJECTILE_MISS_TIMEOUT = 4;

export class Game {
  readonly stage: Container;
  readonly background: Graphics;
  readonly gameLayer: Container;
  readonly path: Path;
  readonly chain: SushiChain;
  readonly shooter: Shooter;
  private _pointerWasDown = false;
  private _removeAnimations: { view: Container; timer: number; duration: number }[] = [];
  private _projectileFlightTime = 0;
  private _wasabiMode = false;

  constructor(private _app: Application) {
    this.stage = this._app.stage;
    this.stage.eventMode = 'static';
    this.background = createWoodBackground();
    this.gameLayer = new Container();
    this.stage.addChild(this.background);
    this.stage.addChild(this.gameLayer);

    this.path = new Path();
    this.chain = new SushiChain(this.path, () => {
      useGameStore.getState().setGameState('gameover');
    });
    for (const s of this.chain.sushis) {
      this.gameLayer.addChild(s.view);
    }

    this.shooter = new Shooter();
    this.gameLayer.addChild(this.shooter.container);

    this.stage.on('pointerdown', this.onPointerDown, this);
    this.stage.on('pointermove', this.onPointerMove, this);
    this.stage.on('pointerup', this.onPointerUp, this);
    this.stage.on('pointerupoutside', this.onPointerUp, this);

    this._app.ticker.add(this.tick, this);
  }

  private onPointerDown(e: { global: { x: number; y: number } }): void {
    this._pointerWasDown = true;
    this.shooter.pointerDownHandler();
    this.shooter.setPointerPosition(e.global.x, e.global.y);
  }

  private onPointerMove(e: { global: { x: number; y: number } }): void {
    this.shooter.setPointerPosition(e.global.x, e.global.y);
  }

  private onPointerUp(): void {
    this.shooter.pointerUpHandler();
    if (this._pointerWasDown && this.shooter.canFire) {
      this.shooter.fire();
      this._projectileFlightTime = 0;
      sound.shoot();
      const pv = this.shooter.getProjectileView();
      if (pv) this.gameLayer.addChild(pv);
    }
    this._pointerWasDown = false;
  }

  private static readonly REMOVE_ANIM_DURATION = 0.12;

  private tick(): void {
    const gs = useGameStore.getState().gameState;
    if (gs !== 'playing') return;

    const dt = this._app.ticker.deltaMS / 1000;
    const speedMult = getGingerSpeedMultiplier();
    this.chain.speed = CHAIN_SPEED * speedMult;
    this.chain.update(dt);

    const spawned = this.chain.trySpawnNext(dt);
    if (spawned) {
      this.gameLayer.addChild(spawned.view);
    }

    this.chain.updateViews();
    this.shooter.updateProjectile(dt);
    for (let i = this._removeAnimations.length - 1; i >= 0; i--) {
      const a = this._removeAnimations[i];
      a.timer -= dt;
      const t = Math.max(0, a.timer / a.duration);
      a.view.scale.set(t);
      if (a.timer <= 0) {
        a.view.removeFromParent();
        this._removeAnimations.splice(i, 1);
      }
    }
    const proj = this.shooter.projectile;
    if (proj?.active && proj.view && !proj.view.parent) {
      this.gameLayer.addChild(proj.view);
    }
    if (proj?.active) {
      this._projectileFlightTime += dt;
      const outOfBounds =
        proj.x < -PROJECTILE_MISS_MARGIN ||
        proj.x > VIEW_WIDTH + PROJECTILE_MISS_MARGIN ||
        proj.y < -PROJECTILE_MISS_MARGIN ||
        proj.y > VIEW_HEIGHT + PROJECTILE_MISS_MARGIN;
      if (outOfBounds || this._projectileFlightTime >= PROJECTILE_MISS_TIMEOUT) {
        this.shooter.restoreMissedShot(proj.type);
        this._projectileFlightTime = 0;
      }
    }
    const collision = checkProjectileChainCollision(proj, this.chain, this.path);
    if (collision?.hit && proj) {
      this._projectileFlightTime = 0;
      if (this._wasabiMode) {
        this._wasabiMode = false;
        this.shooter.clearProjectile();
        executeWasabiBomb(this.chain, collision.pathIndex, (s) => {
          this._removeAnimations.push({
            view: s.view,
            timer: Game.REMOVE_ANIM_DURATION,
            duration: Game.REMOVE_ANIM_DURATION,
          });
        });
        sound.item();
      } else {
        const newSushi = this.chain.insertAtPathIndex(collision.pathIndex, proj.type);
        this.gameLayer.addChild(newSushi.view);
        this.shooter.clearProjectile();
        this.processMatches(newSushi.chainIndex);
      }
    }
  }

  private processMatches(insertChainIndex: number): void {
    const store = useGameStore.getState();
    let comboCount = 0;
    let match = findMatch(this.chain.sushis, insertChainIndex);

    while (match.length >= 1) {
      comboCount++;
      const baseScore = match.reduce((sum, ci) => {
        const s = this.chain.sushis.find((x) => x.chainIndex === ci);
        return sum + (s ? getSushiScore(s.type) : 0);
      }, 0);
      const removed = this.chain.removeAtChainIndices(match);
      const duration = Game.REMOVE_ANIM_DURATION;
      removed.forEach((s) => {
        this._removeAnimations.push({ view: s.view, timer: duration, duration });
      });
      vibrateOnMatch();
      if (comboCount > 1) sound.combo();
      else sound.match();
      store.addScore(baseScore, comboCount);

      match = findNextCombo(this.chain.sushis) ?? [];
    }
  }

  useWasabi(): boolean {
    if (!doActivateWasabi()) return false;
    this._wasabiMode = true;
    sound.item();
    return true;
  }

  useGinger(): boolean {
    const ok = doActivateGinger();
    if (ok) sound.item();
    return ok;
  }

  destroy(): void {
    this._app.ticker.remove(this.tick, this);
    this._app.stage.removeChildren();
  }
}
