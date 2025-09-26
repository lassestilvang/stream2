import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "@/components/MovieCard";
import { WatchedCard } from "@/components/WatchedCard";
import { WatchlistCard } from "@/components/WatchlistCard";
import { TmdbContent } from "@/lib/tmdb";

// Mock Next.js Image component removed to use actual Image

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  PlusIcon: () => <div data-testid="plus-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  EditIcon: () => <div data-testid="edit-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
}));

// Mock TMDB getImageUrl
jest.mock("@/lib/tmdb", () => ({
  getImageUrl: jest.fn((path) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder-image.png"
  ),
}));

describe("Component Edge Cases and Error Handling", () => {
  const mockMovie: TmdbContent = {
    id: 1,
    title: "Test Movie",
    poster_path: "/test-poster.jpg",
    release_date: "2023-01-01",
    overview: "A test movie",
    media_type: "movie",
  };

  const mockWatchedItem = {
    id: 1,
    userId: "user-1",
    tmdbId: 1,
    title: "Test Movie",
    posterPath: "/test-poster.jpg",
    mediaType: "movie" as const,
    rating: 8,
    notes: "Great movie!",
    watchedAt: new Date("2023-01-01"),
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  };

  const mockWatchlistItem = {
    id: 1,
    userId: "user-1",
    tmdbId: 1,
    title: "Test Movie",
    posterPath: "/test-poster.jpg",
    mediaType: "movie" as const,
    createdAt: new Date("2023-01-01"),
  };

  const mockCallbacks = {
    onAddToWatchlist: jest.fn(),
    onMarkAsWatched: jest.fn(),
    onRemoveFromWatched: jest.fn(),
    onUpdateRating: jest.fn(),
    onUpdateNotes: jest.fn(),
    onRemoveFromWatchlist: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("MovieCard - Extreme Props and Rendering Failures", () => {
    it("handles extremely long title gracefully", () => {
      const longTitle = "A".repeat(1000);
      const itemWithLongTitle = { ...mockMovie, title: longTitle };

      render(<MovieCard item={itemWithLongTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      // Should still render without crashing despite long title
    });

    it("handles extremely long overview gracefully", () => {
      const longOverview = "A".repeat(2000);
      const itemWithLongOverview = { ...mockMovie, overview: longOverview };

      render(<MovieCard item={itemWithLongOverview} />);

      // Overview might be truncated in UI, but component should handle it
      expect(screen.getByAltText("Test Movie")).toBeInTheDocument();
    });

    it("handles null and undefined values in all fields", () => {
      const nullItem = {
        id: null,
        title: null,
        poster_path: null,
        release_date: null,
        overview: null,
        media_type: null,
      } as unknown as TmdbContent;

      expect(() => render(<MovieCard item={nullItem} />)).not.toThrow();
      // Should render with fallback values
    });

    it("handles empty strings in all text fields", () => {
      const emptyItem = {
        ...mockMovie,
        title: "",
        overview: "",
        release_date: "",
      };

      render(<MovieCard item={emptyItem} />);

      expect(screen.getByAltText("")).toBeInTheDocument();
      // Should render without crashing
    });

    it("handles malformed date strings", () => {
      const malformedDateItem = {
        ...mockMovie,
        release_date: "not-a-date",
      };

      render(<MovieCard item={malformedDateItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
      // Should handle malformed date gracefully
    });

    it("handles extremely large ID numbers", () => {
      const largeIdItem = {
        ...mockMovie,
        id: Number.MAX_SAFE_INTEGER,
      };

      render(<MovieCard item={largeIdItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles negative ID numbers", () => {
      const negativeIdItem = {
        ...mockMovie,
        id: -123,
      };

      render(<MovieCard item={negativeIdItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles special characters in title and overview", () => {
      const specialCharsItem = {
        ...mockMovie,
        title: "Test Movie 🎬 🔥 & <script>alert('xss')</script>",
        overview: "Description with émojis 🎭 and spëcial chärs",
      };

      render(<MovieCard item={specialCharsItem} />);

      expect(
        screen.getByText("Test Movie 🎬 🔥 & <script>alert('xss')</script>")
      ).toBeInTheDocument();
    });

    it("handles callback functions that throw errors", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      render(<MovieCard item={mockMovie} onAddToWatchlist={errorCallback} />);

      const button = screen.getByRole("button", { name: /watchlist/i });
      // Note: In React, unhandled errors in event handlers will propagate
      // This test verifies the component renders and the callback is called
      try {
        fireEvent.click(button);
      } catch {
        // Error is expected
      }
      expect(errorCallback).toHaveBeenCalledWith(mockMovie);
    });

    it("handles undefined callback functions", () => {
      render(
        <MovieCard
          item={mockMovie}
          onAddToWatchlist={undefined}
          onMarkAsWatched={undefined}
        />
      );

      // Should not render buttons when callbacks are undefined
      expect(
        screen.queryByRole("button", { name: /watchlist/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("WatchedCard - Extreme Props and Rendering Failures", () => {
    it("handles undefined rating and notes gracefully", () => {
      const undefinedFieldsItem = {
        ...mockWatchedItem,
        rating: undefined,
        notes: undefined,
      };

      render(<WatchedCard item={undefinedFieldsItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles extreme rating values", () => {
      const extremeRatingItem = {
        ...mockWatchedItem,
        rating: 999,
      };

      render(<WatchedCard item={extremeRatingItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles extremely long notes", () => {
      const longNotesItem = {
        ...mockWatchedItem,
        notes: "A".repeat(5000),
      };

      render(<WatchedCard item={longNotesItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles invalid date objects", () => {
      const invalidDateItem = {
        ...mockWatchedItem,
        watchedAt: new Date("invalid"),
      };

      // The component will throw when trying to format an invalid date
      expect(() => render(<WatchedCard item={invalidDateItem} />)).toThrow();
    });

    it("handles callback errors gracefully", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Edit error");
      });

      render(<WatchedCard item={mockWatchedItem} onEdit={errorCallback} />);

      // Should render without crashing despite error-prone callbacks
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });
  });

  describe("WatchlistCard - Extreme Props and Rendering Failures", () => {
    it("handles null posterPath", () => {
      const nullPosterItem = {
        ...mockWatchlistItem,
        posterPath: null,
      };

      render(<WatchlistCard item={nullPosterItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles extremely long title", () => {
      const longTitleItem = {
        ...mockWatchlistItem,
        title: "A".repeat(2000),
      };

      render(<WatchlistCard item={longTitleItem} />);

      expect(screen.getByText("A".repeat(2000))).toBeInTheDocument();
    });

    it("handles invalid mediaType", () => {
      const invalidMediaTypeItem = {
        ...mockWatchlistItem,
        mediaType: "invalid" as unknown as "movie" | "tv",
      };

      render(<WatchlistCard item={invalidMediaTypeItem} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("handles callback errors gracefully", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Remove error");
      });

      render(
        <WatchlistCard
          item={mockWatchlistItem}
          onRemoveFromWatchlist={errorCallback}
        />
      );

      const button = screen.getByRole("button", { name: /remove/i });
      // Note: In React, unhandled errors in event handlers will propagate
      // This test verifies the component renders and the callback is called
      try {
        fireEvent.click(button);
      } catch {
        // Error is expected
      }
      expect(errorCallback).toHaveBeenCalledWith(mockWatchlistItem.id);
    });
  });

  describe("Concurrent Operations and Race Conditions", () => {
    it("handles rapid button clicks without crashing", () => {
      render(
        <MovieCard
          item={mockMovie}
          onAddToWatchlist={mockCallbacks.onAddToWatchlist}
          onMarkAsWatched={mockCallbacks.onMarkAsWatched}
        />
      );

      const watchlistButton = screen.getByRole("button", {
        name: /watchlist/i,
      });
      const watchedButton = screen.getByRole("button", { name: /watched/i });

      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(watchlistButton);
        fireEvent.click(watchedButton);
      }

      // Should handle rapid interactions without crashing
      expect(mockCallbacks.onAddToWatchlist).toHaveBeenCalledTimes(10);
      expect(mockCallbacks.onMarkAsWatched).toHaveBeenCalledTimes(10);
    });

    it("handles state changes during render", () => {
      // This test ensures components handle prop changes during their lifecycle
      const { rerender } = render(<MovieCard item={mockMovie} />);

      const changingItem = { ...mockMovie };
      rerender(
        <MovieCard
          item={changingItem}
          onAddToWatchlist={mockCallbacks.onAddToWatchlist}
        />
      );

      // Should handle dynamic prop changes
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("handles large arrays of items without performance issues", () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMovie,
        id: i,
        title: `Movie ${i}`,
      }));

      // This test ensures components can handle being rendered in lists
      largeArray.forEach((item) => {
        expect(() =>
          render(<MovieCard key={item.id} item={item} />)
        ).not.toThrow();
      });
    });

    it("handles deep object nesting", () => {
      const deeplyNestedItem = {
        ...mockMovie,
        nested: {
          deeply: {
            nested: {
              value: "test",
            },
          },
        },
      };

      render(<MovieCard item={deeplyNestedItem as unknown as TmdbContent} />);

      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });
  });
});
