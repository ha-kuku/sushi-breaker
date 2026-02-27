import { Container, Graphics, Sprite } from 'pixi.js';
import type { SushiType } from '@/types';
import { VIEW_WIDTH, VIEW_HEIGHT, PROJECTILE_SPEED } from '@/utils/constants';
import { createSushiView } from '@/game/Sushi';
import { angleBetween } from '@/utils/math';

const SHOOTER_Y = VIEW_HEIGHT - 90;
const GUIDE_LENGTH = 90;
const LOADED_SUSHI_SCALE = 2.8;
const SUSHIS: SushiType[] = [
  'egg',
  'shrimp',
  'tobiko',
  'ikura',
  'salmon',
  'tuna',
  'whitefish',
];

function randomType(): SushiType {
  return SUSHIS[Math.floor(Math.random() * SUSHIS.length)];
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: SushiType;
  active: boolean;
  view: Container;
}

export class Shooter {
  readonly container: Container;
  private shooterSprite: Sprite;
  private guideGraphic: Graphics;
  private currentSushiView: Container;
  private _currentType: SushiType;
  private _nextType: SushiType;
  private _angle: number = -Math.PI / 2;
  private _projectile: Projectile | null = null;
  private pointerDown: boolean = false;

  constructor() {
    this.container = new Container();
    this.container.x = VIEW_WIDTH / 2 + 2;
    this.container.y = SHOOTER_Y;

    this.shooterSprite = Sprite.from('assets/ui/shooter.png');
    this.shooterSprite.anchor.set(0.55, 0.28);
    this.shooterSprite.scale.set(0.19);
    this.container.addChild(this.shooterSprite);

    this.guideGraphic = new Graphics();
    this.container.addChild(this.guideGraphic);

    this._currentType = randomType();
    this._nextType = randomType();
    this.currentSushiView = createSushiView(this._currentType);
    this.currentSushiView.y = -36;
    this.currentSushiView.scale.set(LOADED_SUSHI_SCALE);
    this.container.addChild(this.currentSushiView);

    this.drawGuide();
  }

  get currentType(): SushiType {
    return this._currentType;
  }

  get nextType(): SushiType {
    return this._nextType;
  }

  get projectile(): Projectile | null {
    return this._projectile;
  }

  get canFire(): boolean {
    return !this._projectile?.active && !this.pointerDown;
  }

  get baseX(): number {
    return this.container.x;
  }

  get baseY(): number {
    return this.container.y;
  }

  /** 월드 좌표 기준 발사 위치 */
  getLaunchPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y + this.currentSushiView.y,
    };
  }

  private drawGuide(): void {
    this.guideGraphic.clear();
    const dx = Math.sin(this._angle) * GUIDE_LENGTH;
    const dy = -Math.cos(this._angle) * GUIDE_LENGTH;
    const step = 8;
    for (let i = 0; i < GUIDE_LENGTH; i += step * 2) {
      const t0 = i / GUIDE_LENGTH;
      const t1 = Math.min((i + step) / GUIDE_LENGTH, 1);
      this.guideGraphic
        .moveTo(dx * t0, dy * t0 + this.currentSushiView.y)
        .lineTo(dx * t1, dy * t1 + this.currentSushiView.y)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
    }
  }

  setPointerPosition(worldX: number, worldY: number): void {
    const lx = worldX - this.container.x;
    const ly = worldY - (this.container.y + this.currentSushiView.y);
    let angle = angleBetween(0, 0, lx, ly);
    const HALF_SPREAD = Math.PI / 2; // 위쪽 기준 좌우 90도 (총 180도)
    if (angle < -HALF_SPREAD) angle = -HALF_SPREAD;
    if (angle > HALF_SPREAD) angle = HALF_SPREAD;
    this._angle = angle;
    this.drawGuide();
  }

  pointerDownHandler(): void {
    this.pointerDown = true;
  }

  pointerUpHandler(): void {
    this.pointerDown = false;
  }

  /** 터치 해제 시 발사. 발사체를 생성하고 다음 초밥 로드 */
  fire(): void {
    if (this._projectile?.active) return;

    const pos = this.getLaunchPosition();
    const vx = Math.sin(this._angle) * PROJECTILE_SPEED;
    const vy = -Math.cos(this._angle) * PROJECTILE_SPEED;
    const view = createSushiView(this._currentType);
    view.x = pos.x;
    view.y = pos.y;

    this._projectile = {
      x: pos.x,
      y: pos.y,
      vx,
      vy,
      type: this._currentType,
      active: true,
      view,
    };

    this._currentType = this._nextType;
    this._nextType = randomType();
    this.currentSushiView.removeFromParent();
    this.currentSushiView = createSushiView(this._currentType);
    this.currentSushiView.y = -36;
    this.currentSushiView.scale.set(LOADED_SUSHI_SCALE);
    this.container.addChild(this.currentSushiView);
    this.drawGuide();
  }

  /** 발사체 위치 업데이트 (매 프레임) */
  updateProjectile(dt: number): void {
    if (!this._projectile?.active) return;
    this._projectile.x += this._projectile.vx * dt;
    this._projectile.y += this._projectile.vy * dt;
    this._projectile.view.x = this._projectile.x;
    this._projectile.view.y = this._projectile.y;
  }

  /** 충돌 후 발사체 제거 시 호출 */
  clearProjectile(): void {
    if (this._projectile) {
      this._projectile.active = false;
      this._projectile.view.removeFromParent();
      this._projectile = null;
    }
  }

  /**
   * 체인 밖으로 나갔을 때 호출. 발사한 초밥을 다시 슈터에 넣어서 재발사 가능하게 함.
   */
  restoreMissedShot(shotType: SushiType): void {
    if (!this._projectile) return;
    this._projectile.view.removeFromParent();
    this._projectile = null;
    this._currentType = shotType;
    this.currentSushiView.removeFromParent();
    this.currentSushiView = createSushiView(this._currentType);
    this.currentSushiView.y = -36;
    this.currentSushiView.scale.set(LOADED_SUSHI_SCALE);
    this.container.addChild(this.currentSushiView);
    this.drawGuide();
  }

  /** 발사체 뷰를 부모에 추가 (Game에서 레이어에 넣을 때) */
  getProjectileView(): Container | null {
    return this._projectile?.view ?? null;
  }
}
