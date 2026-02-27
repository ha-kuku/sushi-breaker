import type { Path } from '@/game/Path';
import type { SushiEntity } from '@/game/Sushi';
import { createSushi } from '@/game/Sushi';
import type { SushiType } from '@/types';
import { CHAIN_SPEED, SUSHI_SPACING } from '@/utils/constants';
import { lerp } from '@/utils/math';

const INITIAL_CHAIN_LENGTH = 10;
const SPAWN_INTERVAL = 1.8;

const SUSHI_TYPES: SushiType[] = [
  'egg',
  'shrimp',
  'tobiko',
  'ikura',
  'salmon',
  'tuna',
  'whitefish',
];

function randomType(): SushiType {
  return SUSHI_TYPES[Math.floor(Math.random() * SUSHI_TYPES.length)];
}

export class SushiChain {
  private _sushis: SushiEntity[] = [];
  private _speed: number = CHAIN_SPEED;
  private _reachedEnd: boolean = false;
  private _totalSpawned: number = 0;
  private _spawnTimer: number = 0;
  constructor(
    private path: Path,
    private onGameOver: () => void
  ) {
    this.spawnInitial();
  }

  private spawnInitial(): void {
    for (let i = 0; i < INITIAL_CHAIN_LENGTH; i++) {
      const pathIndex = i * SUSHI_SPACING;
      const sushi = createSushi(randomType(), pathIndex, i);
      this._sushis.push(sushi);
    }
    this._totalSpawned = INITIAL_CHAIN_LENGTH;
  }

  /** 매 tick마다 호출. 일정 시간마다 꼬리에 새 초밥 추가 (실패할 때까지 무한). */
  trySpawnNext(dt: number): SushiEntity | null {
    this._spawnTimer += dt;
    if (this._spawnTimer < SPAWN_INTERVAL) return null;
    this._spawnTimer -= SPAWN_INTERVAL;

    const tailIndex = this.getTailPathIndex();
    const newPathIndex = Math.max(0, tailIndex - SUSHI_SPACING);
    const sushi = createSushi(randomType(), newPathIndex, -1);
    this._sushis.push(sushi);
    this._sushis.sort((a, b) => a.pathIndex - b.pathIndex);
    this._sushis.forEach((s, i) => (s.chainIndex = i));
    this._totalSpawned++;
    return sushi;
  }

  get sushis(): SushiEntity[] {
    return this._sushis;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this._speed = value;
  }

  get reachedEnd(): boolean {
    return this._reachedEnd;
  }

  /** 체인 머리(가장 앞)의 pathIndex */
  getHeadPathIndex(): number {
    if (this._sushis.length === 0) return 0;
    return Math.max(...this._sushis.map((s) => s.pathIndex));
  }

  /** 체인 꼬리의 pathIndex */
  getTailPathIndex(): number {
    if (this._sushis.length === 0) return 0;
    return Math.min(...this._sushis.map((s) => s.pathIndex));
  }

  private static readonly LERP_SPEED = 14;

  update(dt: number): void {
    if (this._reachedEnd) return;
    const advance = this._speed * dt;
    for (const s of this._sushis) {
      if (s.targetPathIndex != null) {
        s.pathIndex = lerp(s.pathIndex, s.targetPathIndex, Math.min(1, SushiChain.LERP_SPEED * dt));
        if (Math.abs(s.pathIndex - s.targetPathIndex) < 0.5) {
          s.pathIndex = s.targetPathIndex;
          delete s.targetPathIndex;
        }
      } else {
        s.pathIndex += advance;
      }
    }

    this.enforceSpacing();

    const head = this.getHeadPathIndex();
    if (head >= this.path.length - 1) {
      this._reachedEnd = true;
      this.onGameOver();
    }
  }

  /** 매 프레임 최소 간격을 강제하여 겹침 방지 */
  private enforceSpacing(): void {
    this._sushis.sort((a, b) => a.pathIndex - b.pathIndex);
    for (let i = 1; i < this._sushis.length; i++) {
      const minPos = this._sushis[i - 1].pathIndex + SUSHI_SPACING;
      if (this._sushis[i].pathIndex < minPos) {
        this._sushis[i].pathIndex = minPos;
      }
    }
    this._sushis.forEach((s, i) => (s.chainIndex = i));
  }

  /**
   * 경로 기준으로 각 초밥 뷰 위치/회전 갱신
   */
  updateViews(): void {
    for (const s of this._sushis) {
      const pt = this.path.getPoint(s.pathIndex);
      s.view.x = pt.x;
      s.view.y = pt.y;
      s.view.rotation = pt.angle;
    }
  }

  /** 인덱스로 초밥 조회 (pathIndex 순 정렬 후) */
  getSushiByPathOrder(): SushiEntity[] {
    return [...this._sushis].sort((a, b) => a.pathIndex - b.pathIndex);
  }

  /** pathIndex 기준으로 가장 가까운 초밥의 chainIndex */
  getNearestChainIndex(pathIndex: number): number {
    let best = 0;
    let bestDist = Infinity;
    this._sushis.forEach((s, i) => {
      const d = Math.abs(s.pathIndex - pathIndex);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  /** 특정 chainIndex의 초밥 제거 (매칭/아이템용). 제거된 엔티티 배열 반환 (뷰 제거용). */
  removeAtChainIndices(indices: number[]): SushiEntity[] {
    const set = new Set(indices);
    const removed = this._sushis.filter((s) => set.has(s.chainIndex));
    this._sushis = this._sushis.filter((s) => !set.has(s.chainIndex));
    this._sushis.forEach((s, i) => (s.chainIndex = i));
    return removed;
  }

  /** pathIndex에 새 초밥 삽입. 전후 간격을 보장하고 뒤쪽 체인 전체를 밀어낸다. */
  insertAtPathIndex(pathIndex: number, type: SushiType): SushiEntity {
    const newSushi = createSushi(type, pathIndex, -1);
    this._sushis.push(newSushi);
    this._sushis.sort((a, b) => a.pathIndex - b.pathIndex);
    const newIdx = this._sushis.findIndex((s) => s === newSushi);

    // 앞 초밥과의 최소 간격 보장
    if (newIdx > 0) {
      const minPos = this._sushis[newIdx - 1].pathIndex + SUSHI_SPACING;
      if (newSushi.pathIndex < minPos) {
        newSushi.pathIndex = minPos;
      }
    }

    // 뒤쪽 초밥 전체를 cascade로 밀어내기
    for (let i = newIdx + 1; i < this._sushis.length; i++) {
      const requiredPos = this._sushis[i - 1].pathIndex + SUSHI_SPACING;
      if (this._sushis[i].pathIndex < requiredPos) {
        this._sushis[i].targetPathIndex = requiredPos;
      }
    }

    this._sushis.forEach((s, i) => (s.chainIndex = i));
    return newSushi;
  }
}
