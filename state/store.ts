import { create } from "zustand";
import { TmdbContent } from "@/lib/tmdb";

export interface WatchedItem {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: "movie" | "tv";
  rating?: number;
  notes?: string;
  watchedAt: Date;
}

export interface WatchlistItem {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  mediaType: "movie" | "tv";
}

interface MovieAppState {
  searchResults: TmdbContent[];
  watched: WatchedItem[];
  watchlist: WatchlistItem[];
  watchlistLoading: boolean;
  watchlistError: string | null;
  addWatchlistLoading: boolean;
  addWatchlistError: string | null;
  removeWatchlistLoading: boolean;
  removeWatchlistError: string | null;
  setSearchResults: (results: TmdbContent[]) => void;
  addWatched: (item: WatchedItem) => void;
  updateWatched: (id: number, updates: Partial<WatchedItem>) => void;
  deleteWatched: (id: number) => void;
  addWatchlistItem: (item: Omit<WatchlistItem, 'id'>) => Promise<void>;
  removeWatchlistItem: (id: number) => Promise<void>;
  fetchWatched: () => Promise<void>;
  fetchWatchlist: () => Promise<void>;
}

export const useMovieAppStore = create<MovieAppState>((set, get) => ({
  searchResults: [],
  watched: [],
  watchlist: [],
  watchlistLoading: false,
  watchlistError: null,
  addWatchlistLoading: false,
  addWatchlistError: null,
  removeWatchlistLoading: false,
  removeWatchlistError: null,
  setSearchResults: (results) => set({ searchResults: results }),
  addWatched: (item) => set((state) => ({ watched: [...state.watched, item] })),
  updateWatched: (id, updates) =>
    set((state) => ({
      watched: state.watched.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  deleteWatched: (id) =>
    set((state) => ({
      watched: state.watched.filter((item) => item.id !== id),
    })),
  addWatchlistItem: async (item) => {
    const tempId = Date.now(); // Temporary ID for optimistic update
    const optimisticItem: WatchlistItem = { ...item, id: tempId };

    // Optimistic update
    set((state) => ({
      watchlist: [...state.watchlist, optimisticItem],
      addWatchlistLoading: true,
      addWatchlistError: null,
    }));

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item');
      }

      const newItem = await response.json();

      // Update with real ID
      set((state) => ({
        watchlist: state.watchlist.map((w) =>
          w.id === tempId ? { ...newItem } : w
        ),
        addWatchlistLoading: false,
      }));
    } catch (error) {
      // Rollback on failure
      set((state) => ({
        watchlist: state.watchlist.filter((w) => w.id !== tempId),
        addWatchlistLoading: false,
        addWatchlistError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  },
  removeWatchlistItem: async (id) => {
    const itemToRemove = get().watchlist.find((w) => w.id === id);
    if (!itemToRemove) return;

    // Optimistic update
    set((state) => ({
      watchlist: state.watchlist.filter((w) => w.id !== id),
      removeWatchlistLoading: true,
      removeWatchlistError: null,
    }));

    try {
      const response = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove item');
      }

      set((state) => ({
        removeWatchlistLoading: false,
      }));
    } catch (error) {
      // Rollback on failure
      set((state) => ({
        watchlist: [...state.watchlist, itemToRemove],
        removeWatchlistLoading: false,
        removeWatchlistError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  },
  fetchWatched: async () => {
    // This will be implemented later with API calls
  },
  fetchWatchlist: async () => {
    set({ watchlistLoading: true, watchlistError: null });

    try {
      const response = await fetch('/api/watchlist');

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const data = await response.json();
      set({ watchlist: data, watchlistLoading: false });
    } catch (error) {
      set({
        watchlistLoading: false,
        watchlistError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
}));