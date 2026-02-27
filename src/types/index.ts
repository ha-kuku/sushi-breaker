/** 7종 핵심 초밥 타입 */
export type SushiType =
  | 'egg'
  | 'shrimp'
  | 'tobiko'
  | 'ikura'
  | 'salmon'
  | 'tuna'
  | 'whitefish';

export type GameState = 'title' | 'playing' | 'paused' | 'clear' | 'gameover';

export type ItemType = 'wasabi' | 'ginger';

export interface SushiData {
  type: SushiType;
  score: number;
  /** 경로 상 인덱스 (실수 허용: 보간용) */
  pathIndex: number;
  /** 체인 내 배열 인덱스 */
  chainIndex: number;
}

export interface PathPoint {
  x: number;
  y: number;
  angle: number;
}

export interface BezierCurve {
  start: { x: number; y: number };
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
  end: { x: number; y: number };
}
