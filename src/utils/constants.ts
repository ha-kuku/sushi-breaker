import type { SushiType } from '@/types';

/** 게임 뷰포트 (세로 9:16) */
export const VIEW_WIDTH = 390;
export const VIEW_HEIGHT = 844;

/** 초밥 반지름 (픽셀) */
export const SUSHI_RADIUS = 18;

/** 경로 위 초밥 간 인덱스 간격 */
export const SUSHI_SPACING = 28;

/** 체인 기본 이동 속도 (인덱스/초) */
export const CHAIN_SPEED = 15;

/** 경로 Lookup Table 해상도 (지그재그 경로에 맞춰 높은 해상도) */
export const PATH_RESOLUTION = 2400;

/** 초밥 타입별 기본 점수 */
export const SUSHI_SCORES: Record<SushiType, number> = {
  egg: 10,
  shrimp: 15,
  tobiko: 20,
  ikura: 25,
  salmon: 30,
  tuna: 40,
  whitefish: 35,
};

/** 발사체 속도 (픽셀/초) */
export const PROJECTILE_SPEED = 600;

/** 매칭 최소 개수 */
export const MATCH_MIN_COUNT = 3;

/** 콤보당 점수 배율 */
export const COMBO_MULTIPLIER = 1.2;

/** 레벨별 목표 점수 (기본) */
export const TARGET_SCORE_BASE = 1000;
