import type { SushiChain } from '@/game/SushiChain';
import type { SushiEntity } from '@/game/Sushi';
import { findNextCombo } from '@/game/Matcher';
import { getSushiScore } from '@/game/Sushi';
import { useGameStore } from '@/store/gameStore';

/** Wasabi Bomb: 착탄 초밥 기준 앞뒤로 제거할 초밥 수 */
const WASABI_HALF_RANGE = 2;

/** Ginger Slow: 감속 계수 (1 = 정상) */
const GINGER_SLOW_FACTOR = 0.3;

export function getGingerSpeedMultiplier(): number {
  const until = useGameStore.getState().gingerActiveUntil ?? 0;
  return until > Date.now() ? GINGER_SLOW_FACTOR : 1;
}

export function activateGinger(): boolean {
  return useGameStore.getState().useItem('ginger');
}

/** 와사비 아이템 소비만 처리 (실제 폭발은 착탄 시 executeWasabiBomb에서) */
export function activateWasabi(): boolean {
  return useGameStore.getState().useItem('wasabi');
}

/**
 * 착탄 지점(pathIndex) 기준으로 가장 가까운 초밥 + 앞뒤 2개씩 총 5개 제거.
 */
export function executeWasabiBomb(
  chain: SushiChain,
  targetPathIndex: number,
  addRemoveAnimation: (s: SushiEntity) => void
): void {
  const ordered = [...chain.sushis].sort((a, b) => a.pathIndex - b.pathIndex);
  if (ordered.length === 0) return;

  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < ordered.length; i++) {
    const d = Math.abs(ordered[i].pathIndex - targetPathIndex);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  const low = Math.max(0, nearestIdx - WASABI_HALF_RANGE);
  const high = Math.min(ordered.length - 1, nearestIdx + WASABI_HALF_RANGE);
  const toRemove = ordered.slice(low, high + 1);
  const indices = toRemove.map((s) => s.chainIndex);
  if (indices.length === 0) return;

  const state = useGameStore.getState();
  const baseScore = toRemove.reduce((sum, s) => sum + getSushiScore(s.type), 0);
  const removed = chain.removeAtChainIndices(indices);
  removed.forEach(addRemoveAnimation);
  state.addScore(baseScore, 1);
  processCombosAfterRemoval(chain, addRemoveAnimation);
}

function processCombosAfterRemoval(
  chain: SushiChain,
  addRemoveAnimation: (s: SushiEntity) => void
): void {
  const store = useGameStore.getState();
  let comboCount = 0;
  let match = findNextCombo(chain.sushis);
  while (match && match.length >= 1) {
    comboCount++;
    const baseScore = match.reduce((sum, ci) => {
      const s = chain.sushis.find((x) => x.chainIndex === ci);
      return sum + (s ? getSushiScore(s.type) : 0);
    }, 0);
    const removed = chain.removeAtChainIndices(match);
    removed.forEach(addRemoveAnimation);
    store.addScore(baseScore, comboCount);
    match = findNextCombo(chain.sushis);
  }
}
