import { createStore } from 'zustand/vanilla';
import type { GameState, ItemType } from '@/types';

interface GameStore {
  gameState: GameState;
  score: number;
  combo: number;
  items: { wasabi: number; ginger: number };
  gingerActiveUntil: number;
  addScore: (points: number, comboCount: number) => void;
  useItem: (type: ItemType) => boolean;
  setGameState: (state: GameState) => void;
  resetGame: () => void;
}

export const useGameStore = createStore<GameStore>((set, get) => ({
  gameState: 'title',
  score: 0,
  combo: 0,
  items: { wasabi: 2, ginger: 2 },
  gingerActiveUntil: 0,

  addScore: (points: number, comboCount: number) => {
    const mult = comboCount <= 1 ? 1 : Math.pow(1.2, comboCount - 1);
    const added = Math.round(points * mult);
    set((s) => ({ score: s.score + added, combo: comboCount }));
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

  resetGame: () =>
    set({
      score: 0,
      combo: 0,
      gameState: 'playing',
      gingerActiveUntil: 0,
      items: { wasabi: 2, ginger: 2 },
    }),
}));
