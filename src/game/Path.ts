import type { PathPoint, BezierCurve } from '@/types';
import { bezierPoint, bezierTangent } from '@/utils/math';
import { VIEW_WIDTH, PATH_RESOLUTION } from '@/utils/constants';

/** 단일 곡선에서 t∈[0,1] 구간 샘플 수 */
const CURVE_SAMPLES = 200;

/**
 * 세로형 화면에 맞춘 S자 경로.
 * 베지어 곡선들을 이어 등간격(arc-length) Lookup Table을 만든다.
 */
export class Path {
  private points: PathPoint[] = [];

  constructor() {
    this.buildLookupTable(this.createSCurve(), PATH_RESOLUTION);
  }

  /**
   * 좌우 지그재그 5단 경로 (시안 레이아웃).
   * 상단 입구 → 좌우로 왕복하며 하강 → 하단 슈터 근처에서 종료.
   */
  private createSCurve(): BezierCurve[] {
    const w = VIEW_WIDTH;
    const L = 35;
    const R = w - 35;
    const rows = [90, 210, 330, 450, 570];
    const bulge = 50;
    const curves: BezierCurve[] = [];

    for (let i = 0; i < rows.length; i++) {
      const y = rows[i];
      const goRight = i % 2 === 0;

      if (goRight) {
        curves.push({
          start: { x: L, y },
          cp1: { x: L + 80, y: y - 18 },
          cp2: { x: R - 80, y: y + 18 },
          end: { x: R, y },
        });
      } else {
        curves.push({
          start: { x: R, y },
          cp1: { x: R - 80, y: y - 18 },
          cp2: { x: L + 80, y: y + 18 },
          end: { x: L, y },
        });
      }

      if (i < rows.length - 1) {
        const yNext = rows[i + 1];
        const gap = yNext - y;
        if (goRight) {
          curves.push({
            start: { x: R, y },
            cp1: { x: R + bulge, y: y + gap * 0.35 },
            cp2: { x: R + bulge, y: yNext - gap * 0.35 },
            end: { x: R, y: yNext },
          });
        } else {
          curves.push({
            start: { x: L, y },
            cp1: { x: L - bulge, y: y + gap * 0.35 },
            cp2: { x: L - bulge, y: yNext - gap * 0.35 },
            end: { x: L, y: yNext },
          });
        }
      }
    }

    const lastY = rows[rows.length - 1];
    const endGoRight = (rows.length - 1) % 2 === 0;
    const lastX = endGoRight ? R : L;
    curves.push({
      start: { x: lastX, y: lastY },
      cp1: { x: lastX, y: lastY + 40 },
      cp2: { x: w / 2, y: lastY + 60 },
      end: { x: w / 2, y: lastY + 90 },
    });

    return curves;
  }

  /**
   * 베지어 곡선들로부터 등간격(arc-length) 포인트 배열 생성
   */
  buildLookupTable(curves: BezierCurve[], resolution: number): void {
    const raw: { x: number; y: number; angle: number }[] = [];

    for (const curve of curves) {
      const p0 = curve.start;
      const p1 = curve.cp1;
      const p2 = curve.cp2;
      const p3 = curve.end;

      for (let i = 0; i <= CURVE_SAMPLES; i++) {
        const t = i / CURVE_SAMPLES;
        const pt = bezierPoint(p0, p1, p2, p3, t);
        const tan = bezierTangent(p0, p1, p2, p3, t);
        const angle = Math.atan2(tan.x, -tan.y);
        raw.push({ x: pt.x, y: pt.y, angle });
      }
    }

    const lengths: number[] = [0];
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1];
      const b = raw[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      lengths.push(lengths[lengths.length - 1] + d);
    }
    const totalLength = lengths[lengths.length - 1];
    if (totalLength <= 0) {
      this.points = raw.map((r) => ({ ...r, angle: r.angle }));
      return;
    }

    const step = totalLength / resolution;
    this.points = [];

    for (let i = 0; i < resolution; i++) {
      const dist = i * step;
      let idx = 0;
      while (idx < lengths.length - 1 && lengths[idx + 1] < dist) idx++;
      const t =
        lengths[idx + 1] === lengths[idx]
          ? 0
          : (dist - lengths[idx]) / (lengths[idx + 1] - lengths[idx]);
      const a = raw[idx];
      const b = raw[Math.min(idx + 1, raw.length - 1)];
      const angle = a.angle + (b.angle - a.angle) * t;
      this.points.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle,
      });
    }
  }

  getPoint(index: number): PathPoint {
    const i = Math.max(0, Math.min(index, this.points.length - 1));
    const i0 = Math.floor(i);
    const i1 = Math.min(i0 + 1, this.points.length - 1);
    const t = i - i0;
    const a = this.points[i0];
    const b = this.points[i1];
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      angle: a.angle + (b.angle - a.angle) * t,
    };
  }

  get length(): number {
    return this.points.length;
  }

  /** 디버그: 경로 시각화용 포인트 배열 */
  getPointsForDebug(): PathPoint[] {
    return [...this.points];
  }
}
