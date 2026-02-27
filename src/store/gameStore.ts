import { createStore } from 'zustand/vanilla';
import type { GameState, ItemType } from '@/types';
import { TARGET_SCORE_BASE } from '@/utils/constants';

interface GameStore {
  gameState: GameState;
  score: number;
  targetScore: number;
  combo: number;
  level: number;
  items: { wasabi: number; ginger: number };
  gingerActiveUntil: number;
  addScore: (points: number, comboCount: number) => void;
  useItem: (type: ItemType) => boolean;
  setGameState: (state: GameState) => void;
  resetGame: (level?: number) => void;
  setLevel: (level: number) => void;
}

export const useGameStore = createStore<GameStore>((set, get) => ({
  gameState: 'title',
  score: 0,
  targetScore: TARGET_SCORE_BASE,
  combo: 0,
  level: 1,
  items: { wasabi: 2, ginger: 2 },
  gingerActiveUntil: 0,

  addScore: (points: number, comboCount: number) => {
    const mult = comboCount <= 1 ? 1 : Math.pow(1.2, comboCount - 1);
    const added = Math.round(points * mult);
    set((s) => {
      const newScore = s.score + added;
      const next = newScore >= s.targetScore ? 'clear' as GameState : undefined;
      return { score: newScore, combo: comboCount, ...(next && { gameState: next }) };
    });
  },

  useItem: (type: ItemType) => {
    const key = type === 'wasabi' ? 'wasabi' : 'ginger';
    const state = get();
    if (state.items[key] <= 0) return false;
    const updates: Partial<GameStore> = { items: { ...state.items, [key]: state.items[key] - 1 } };
    if (type === 'ginger') updates.gingerActiveUntil = Date.now() + 5000;
    set(updates);
    return true;
  },

  setGameState: (gameState: GameState) => set({ gameState }),

  resetGame: (level = 1) =>
    set({
      score: 0,
      targetScore: TARGET_SCORE_BASE * level,
      combo: 0,
      level,
      gameState: 'playing',
      gingerActiveUntil: 0,
      items: { wasabi: 2, ginger: 2 },
    }),

  setLevel: (level: number) =>
    set({ level, targetScore: TARGET_SCORE_BASE * level }),
}));
