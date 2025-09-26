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
  setSearchResults: (results: TmdbContent[]) => void;
  addWatched: (item: WatchedItem) => void;
  updateWatched: (id: number, updates: Partial<WatchedItem>) => void;
  deleteWatched: (id: number) => void;
  addWatchlistItem: (item: WatchlistItem) => void;
  removeWatchlistItem: (id: number) => void;
  // Add actions for fetching from DB later
  fetchWatched: () => Promise<void>;
  fetchWatchlist: () => Promise<void>;
}

export const useMovieAppStore = create<MovieAppState>((set) => ({
  searchResults: [],
  watched: [],
  watchlist: [],
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
  addWatchlistItem: (item) =>
    set((state) => ({ watchlist: [...state.watchlist, item] })),
  removeWatchlistItem: (id) =>
    set((state) => ({
      watchlist: state.watchlist.filter((item) => item.id !== id),
    })),
  fetchWatched: async () => {
    // This will be implemented later with API calls
  },
  fetchWatchlist: async () => {
    // This will be implemented later with API calls
  },
}));
