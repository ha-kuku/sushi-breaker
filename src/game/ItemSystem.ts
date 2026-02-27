import type { Path } from '@/game/Path';
import type { SushiChain } from '@/game/SushiChain';
import type { SushiEntity } from '@/game/Sushi';
import { findNextCombo } from '@/game/Matcher';
import { getSushiScore } from '@/game/Sushi';
import { useGameStore } from '@/store/gameStore';

/** Wasabi Bomb: 경로 인덱스 기준 반경(포인트 수) */
const WASABI_RADIUS = 80;

/** Ginger Slow: 감속 계수 (1 = 정상) */
const GINGER_SLOW_FACTOR = 0.3;

export function getGingerSpeedMultiplier(): number {
  const until = useGameStore.getState().gingerActiveUntil ?? 0;
  return until > Date.now() ? GINGER_SLOW_FACTOR : 1;
}

export function activateGinger(): boolean {
  return useGameStore.getState().useItem('ginger');
}

export function activateWasabi(
  chain: SushiChain,
  path: Path,
  addRemoveAnimation: (s: SushiEntity) => void
): boolean {
  const state = useGameStore.getState();
  if (!state.useItem('wasabi')) return false;
  const head = chain.getHeadPathIndex();
  const low = Math.max(0, head - WASABI_RADIUS);
  const high = Math.min(path.length - 1, head + WASABI_RADIUS);
  const toRemove = chain.sushis.filter(
    (s) => s.pathIndex >= low && s.pathIndex <= high
  );
  const indices = toRemove.map((s) => s.chainIndex);
  if (indices.length === 0) return true;
  const baseScore = toRemove.reduce((sum, s) => sum + getSushiScore(s.type), 0);
  const removed = chain.removeAtChainIndices(indices);
  removed.forEach(addRemoveAnimation);
  state.addScore(baseScore, 1);
  processCombosAfterRemoval(chain, addRemoveAnimation);
  return true;
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
