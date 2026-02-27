import { Container, Sprite, Texture, Graphics } from 'pixi.js';
import type { SushiType } from '@/types';
import { SUSHI_RADIUS, SUSHI_SCORES } from '@/utils/constants';

const SUSHI_TEXTURE_PATHS: Record<SushiType, string> = {
  egg: 'assets/sushi/egg.png',
  shrimp: 'assets/sushi/shrimp.png',
  tobiko: 'assets/sushi/tobiko.png',
  ikura: 'assets/sushi/ikura.png',
  salmon: 'assets/sushi/salmon.png',
  tuna: 'assets/sushi/tuna.png',
  whitefish: 'assets/sushi/whitefish.png',
};

const SUSHI_FALLBACK_COLORS: Record<SushiType, number> = {
  egg: 0xfff8dc,
  shrimp: 0xffe4c4,
  tobiko: 0xffa07a,
  ikura: 0xdc143c,
  salmon: 0xfa8072,
  tuna: 0x8b0000,
  whitefish: 0xfffaf0,
};

export interface SushiEntity {
  type: SushiType;
  pathIndex: number;
  chainIndex: number;
  view: Container;
  targetPathIndex?: number;
}

export function getSushiTexturePaths(): string[] {
  return Object.values(SUSHI_TEXTURE_PATHS);
}

const SPRITE_SIZE = SUSHI_RADIUS * 2;

export function createSushiView(type: SushiType): Container {
  const c = new Container();
  const texPath = SUSHI_TEXTURE_PATHS[type];
  const tex = Texture.from(texPath);

  if (tex && tex !== Texture.EMPTY) {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    c.addChild(sprite);
  } else {
    const g = new Graphics();
    g.circle(0, 0, SUSHI_RADIUS).fill({ color: SUSHI_FALLBACK_COLORS[type] });
    g.circle(0, 0, SUSHI_RADIUS).stroke({ width: 2, color: 0x333333 });
    c.addChild(g);
  }
  return c;
}

export function createSushi(type: SushiType, pathIndex: number, chainIndex: number): SushiEntity {
  return {
    type,
    pathIndex,
    chainIndex,
    view: createSushiView(type),
  };
}

export function getSushiScore(type: SushiType): number {
  return SUSHI_SCORES[type];
}
