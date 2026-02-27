import type { Path } from '@/game/Path';
import type { SushiEntity } from '@/game/Sushi';
import type { Projectile } from '@/game/Shooter';
import { distance } from '@/utils/math';
import { SUSHI_RADIUS, SUSHI_SPACING } from '@/utils/constants';

/** 충돌한 초밥의 pathIndex 근처에서 발사체에 가장 가까운 경로 점을 찾는다. */
export function getInsertPathIndex(
  path: Path,
  projX: number,
  projY: number,
  hitSushiPathIndex: number
): number {
  const searchRadius = SUSHI_SPACING * 3;
  const low = Math.max(0, Math.floor(hitSushiPathIndex - searchRadius));
  const high = Math.min(path.length - 1, Math.ceil(hitSushiPathIndex + searchRadius));
  let bestIndex = Math.round(hitSushiPathIndex);
  let bestDist = Infinity;
  for (let i = low; i <= high; i++) {
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
      const pathIndex = getInsertPathIndex(path, px, py, sushi.pathIndex);
      return {
        hit: true,
        pathIndex,
        hitSushi: sushi,
      };
    }
  }
  return null;
}
