import { renderHook } from "@testing-library/react";
import { useWatched } from "@/hooks/useWatched";

// Mock the Zustand store
jest.mock("@/state/store", () => ({
  useMovieAppStore: jest.fn(),
}));

import { useMovieAppStore, WatchedItem } from "@/state/store";

type MockStoreReturn = {
  watched: WatchedItem[];
  addWatched: jest.MockedFunction<(item: WatchedItem) => void>;
  updateWatched: jest.MockedFunction<
    (id: number, updates: Partial<WatchedItem>) => void
  >;
  deleteWatched: jest.MockedFunction<(id: number) => void>;
};

const mockUseMovieAppStore = useMovieAppStore as jest.MockedFunction<
  typeof useMovieAppStore
>;

describe("useWatched hook", () => {
  const mockWatched = [
    {
      id: 1,
      tmdbId: 123,
      title: "Test Movie",
      posterPath: "/poster.jpg",
      mediaType: "movie" as const,
      watchedAt: new Date("2023-01-01"),
    },
  ];

  const mockAddWatched = jest.fn();
  const mockUpdateWatched = jest.fn();
  const mockDeleteWatched = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the store to return the watched data and functions
    mockUseMovieAppStore.mockReturnValue({
      watched: mockWatched,
      addWatched: mockAddWatched,
      updateWatched: mockUpdateWatched,
      deleteWatched: mockDeleteWatched,
    } as MockStoreReturn);
  });

  it("should return watched data from the store", () => {
    const { result } = renderHook(() => useWatched());

    expect(result.current.watched).toEqual(mockWatched);
  });

  it("should return addWatched function from the store", () => {
    const { result } = renderHook(() => useWatched());

    expect(result.current.addWatched).toBe(mockAddWatched);
  });

  it("should return updateWatched function from the store", () => {
    const { result } = renderHook(() => useWatched());

    expect(result.current.updateWatched).toBe(mockUpdateWatched);
  });

  it("should return deleteWatched function from the store", () => {
    const { result } = renderHook(() => useWatched());

    expect(result.current.deleteWatched).toBe(mockDeleteWatched);
  });

  it("should call the store hook with correct parameters", () => {
    renderHook(() => useWatched());

    expect(mockUseMovieAppStore).toHaveBeenCalledWith();
  });

  it("should return consistent data on re-renders", () => {
    const { result, rerender } = renderHook(() => useWatched());

    const firstResult = result.current;
    rerender();

    expect(result.current).toStrictEqual(firstResult);
  });
});
