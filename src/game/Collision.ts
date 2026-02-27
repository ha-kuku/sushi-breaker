import type { Path } from '@/game/Path';
import type { SushiEntity } from '@/game/Sushi';
import type { Projectile } from '@/game/Shooter';
import { distance } from '@/utils/math';
import { SUSHI_RADIUS } from '@/utils/constants';

/** 충돌 시 삽입할 경로 인덱스 (발사체 위치에서 가장 가까운 경로 위 점) */
export function getInsertPathIndex(path: Path, projX: number, projY: number): number {
  const len = path.length;
  let bestIndex = 0;
  let bestDist = Infinity;
  const step = Math.max(1, Math.floor(len / 200));
  for (let i = 0; i < len; i += step) {
    const pt = path.getPoint(i);
    const d = distance(projX, projY, pt.x, pt.y);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export interface CollisionResult {
  hit: boolean;
  pathIndex: number;
  hitSushi: SushiEntity | null;
}

/**
 * 발사체와 레일 위 초밥 충돌 감지.
 * distance < sushiRadius * 2 이면 충돌.
 */
export function checkProjectileChainCollision(
  projectile: Projectile | null,
  chain: { sushis: SushiEntity[] },
  path: Path
): CollisionResult | null {
  if (!projectile?.active) return null;
  const px = projectile.x;
  const py = projectile.y;
  const threshold = SUSHI_RADIUS * 2;

  for (const sushi of chain.sushis) {
    const pt = path.getPoint(sushi.pathIndex);
    const d = distance(px, py, pt.x, pt.y);
    if (d < threshold) {
      const pathIndex = getInsertPathIndex(path, px, py);
      return {
        hit: true,
        pathIndex,
        hitSushi: sushi,
      };
    }
  }
  return null;
}
