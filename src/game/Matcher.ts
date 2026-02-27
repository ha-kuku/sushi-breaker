import type { SushiEntity } from '@/game/Sushi';
import { MATCH_MIN_COUNT } from '@/utils/constants';

/**
 * pathIndex 순으로 정렬된 체인에서, 삽입 인덱스(chainIndex 또는 pathIndex 기준) 주변으로
 * 같은 type이 연속 3개 이상인 구간의 chainIndex 목록 반환.
 */
export function findMatch(chain: SushiEntity[], insertChainIndex: number): number[] {
  const ordered = [...chain].sort((a, b) => a.pathIndex - b.pathIndex);
  const idx = ordered.findIndex((s) => s.chainIndex === insertChainIndex);
  if (idx < 0) return [];

  const type = ordered[idx].type;
  let start = idx;
  let end = idx;
  while (start > 0 && ordered[start - 1].type === type) start--;
  while (end < ordered.length - 1 && ordered[end + 1].type === type) end++;

  const count = end - start + 1;
  if (count < MATCH_MIN_COUNT) return [];
  return ordered.slice(start, end + 1).map((s) => s.chainIndex);
}

/**
 * 현재 체인에서 path 순서 기준 첫 번째로 나오는 3개 이상 연속 같은 타입의 chainIndex 배열 반환.
 */
export function findNextCombo(chain: SushiEntity[]): number[] | null {
  if (chain.length < MATCH_MIN_COUNT) return null;
  const ordered = [...chain].sort((a, b) => a.pathIndex - b.pathIndex);
  let start = 0;
  for (let i = 1; i <= ordered.length; i++) {
    if (i === ordered.length || ordered[i].type !== ordered[start].type) {
      if (i - start >= MATCH_MIN_COUNT) {
        return ordered.slice(start, i).map((s) => s.chainIndex);
      }
      start = i;
    }
  }
  return null;
}
