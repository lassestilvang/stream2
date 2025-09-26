import { useMovieAppStore } from "@/state/store";
import { WatchedItem, WatchlistItem } from "@/state/store";
import { TmdbContent } from "@/lib/tmdb";

describe("MovieAppStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useMovieAppStore.setState({
      searchResults: [],
      watched: [],
      watchlist: [],
    });
  });

  it("should have correct initial state", () => {
    const state = useMovieAppStore.getState();

    expect(state.searchResults).toEqual([]);
    expect(state.watched).toEqual([]);
    expect(state.watchlist).toEqual([]);
  });

  describe("setSearchResults", () => {
    it("should set search results", () => {
      const mockResults: TmdbContent[] = [
        {
          id: 1,
          title: "Test Movie",
          poster_path: "/poster.jpg",
          release_date: "2023-01-01",
          overview: "Test overview",
          media_type: "movie",
        },
      ];

      useMovieAppStore.getState().setSearchResults(mockResults);

      const state = useMovieAppStore.getState();
      expect(state.searchResults).toEqual(mockResults);
    });
  });

  describe("addWatched", () => {
    it("should add a watched item to the list", () => {
      const mockWatchedItem: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Test Movie",
        posterPath: "/poster.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-01"),
      };

      useMovieAppStore.getState().addWatched(mockWatchedItem);

      const state = useMovieAppStore.getState();
      expect(state.watched).toEqual([mockWatchedItem]);
    });

    it("should add multiple watched items", () => {
      const item1: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Movie 1",
        posterPath: "/poster1.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-01"),
      };

      const item2: WatchedItem = {
        id: 2,
        tmdbId: 456,
        title: "Movie 2",
        posterPath: "/poster2.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-02"),
      };

      useMovieAppStore.getState().addWatched(item1);
      useMovieAppStore.getState().addWatched(item2);

      const state = useMovieAppStore.getState();
      expect(state.watched).toEqual([item1, item2]);
    });
  });

  describe("updateWatched", () => {
    it("should update a watched item", () => {
      const initialItem: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Test Movie",
        posterPath: "/poster.jpg",
        mediaType: "movie",
        rating: 7,
        watchedAt: new Date("2023-01-01"),
      };

      useMovieAppStore.setState({ watched: [initialItem] });

      useMovieAppStore
        .getState()
        .updateWatched(1, { rating: 9, notes: "Great movie!" });

      const state = useMovieAppStore.getState();
      expect(state.watched[0]).toEqual({
        ...initialItem,
        rating: 9,
        notes: "Great movie!",
      });
    });

    it("should not update if id does not match", () => {
      const item: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Test Movie",
        posterPath: "/poster.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-01"),
      };

      useMovieAppStore.setState({ watched: [item] });

      useMovieAppStore.getState().updateWatched(999, { rating: 9 });

      const state = useMovieAppStore.getState();
      expect(state.watched[0]).toEqual(item);
    });
  });

  describe("deleteWatched", () => {
    it("should delete a watched item by id", () => {
      const item1: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Movie 1",
        posterPath: "/poster1.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-01"),
      };

      const item2: WatchedItem = {
        id: 2,
        tmdbId: 456,
        title: "Movie 2",
        posterPath: "/poster2.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-02"),
      };

      useMovieAppStore.setState({ watched: [item1, item2] });

      useMovieAppStore.getState().deleteWatched(1);

      const state = useMovieAppStore.getState();
      expect(state.watched).toEqual([item2]);
    });

    it("should not change state if id does not exist", () => {
      const item: WatchedItem = {
        id: 1,
        tmdbId: 123,
        title: "Test Movie",
        posterPath: "/poster.jpg",
        mediaType: "movie",
        watchedAt: new Date("2023-01-01"),
      };

      useMovieAppStore.setState({ watched: [item] });

      useMovieAppStore.getState().deleteWatched(999);

      const state = useMovieAppStore.getState();
      expect(state.watched).toEqual([item]);
    });
  });

  describe("addWatchlistItem", () => {
    it("should add an item to watchlist", () => {
      const mockItem: WatchlistItem = {
        id: 1,
        tmdbId: 123,
        title: "Test Movie",
        posterPath: "/poster.jpg",
        mediaType: "movie",
      };

      useMovieAppStore.getState().addWatchlistItem(mockItem);

      const state = useMovieAppStore.getState();
      expect(state.watchlist).toEqual([mockItem]);
    });
  });

  describe("removeWatchlistItem", () => {
    it("should remove an item from watchlist by id", () => {
      const item1: WatchlistItem = {
        id: 1,
        tmdbId: 123,
        title: "Movie 1",
        posterPath: "/poster1.jpg",
        mediaType: "movie",
      };

      const item2: WatchlistItem = {
        id: 2,
        tmdbId: 456,
        title: "Movie 2",
        posterPath: "/poster2.jpg",
        mediaType: "movie",
      };

      useMovieAppStore.setState({ watchlist: [item1, item2] });

      useMovieAppStore.getState().removeWatchlistItem(1);

      const state = useMovieAppStore.getState();
      expect(state.watchlist).toEqual([item2]);
    });
  });

  describe("fetchWatched", () => {
    it("should be a function (placeholder implementation)", async () => {
      // Since it's not implemented, just test it doesn't throw
      await expect(
        useMovieAppStore.getState().fetchWatched()
      ).resolves.toBeUndefined();
    });
  });

  describe("fetchWatchlist", () => {
    it("should be a function (placeholder implementation)", async () => {
      // Since it's not implemented, just test it doesn't throw
      await expect(
        useMovieAppStore.getState().fetchWatchlist()
      ).resolves.toBeUndefined();
    });
  });
});
