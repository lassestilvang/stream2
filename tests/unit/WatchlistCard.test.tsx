import { render, screen, fireEvent } from "@testing-library/react";
import { WatchlistCard } from "@/components/WatchlistCard";
import { WatchlistItem } from "@/state/store";

// Mock Next.js Image component removed to use actual Image

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  EyeIcon: () => <div data-testid="eye-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
}));

// Mock TMDB getImageUrl
jest.mock("@/lib/tmdb", () => ({
  getImageUrl: jest.fn((path) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder-image.png"
  ),
}));

describe("WatchlistCard", () => {
  const mockWatchlistItem: WatchlistItem = {
    id: 1,
    tmdbId: 123,
    title: "Test Watchlist Movie",
    posterPath: "/test-poster.jpg",
    mediaType: "movie",
  };

  const mockWatchlistTvItem: WatchlistItem = {
    id: 2,
    tmdbId: 456,
    title: "Test Watchlist TV Show",
    posterPath: "/test-tv-poster.jpg",
    mediaType: "tv",
  };

  const mockOnMarkAsWatched = jest.fn();
  const mockOnRemoveFromWatchlist = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders watchlist movie card with correct content", () => {
    render(<WatchlistCard item={mockWatchlistItem} />);

    expect(screen.getByText("Test Watchlist Movie")).toBeInTheDocument();
    expect(screen.getByText("Movie")).toBeInTheDocument();
    expect(screen.getByAltText("Test Watchlist Movie")).toBeInTheDocument();
  });

  it("renders watchlist TV show card with correct content", () => {
    render(<WatchlistCard item={mockWatchlistTvItem} />);

    expect(screen.getByText("Test Watchlist TV Show")).toBeInTheDocument();
    expect(screen.getByText("TV Show")).toBeInTheDocument();
    expect(screen.getByAltText("Test Watchlist TV Show")).toBeInTheDocument();
  });

  it("renders mark as watched button when onMarkAsWatched is provided", () => {
    render(
      <WatchlistCard
        item={mockWatchlistItem}
        onMarkAsWatched={mockOnMarkAsWatched}
      />
    );

    const button = screen.getByRole("button", { name: /watched/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
  });

  it("renders remove button when onRemoveFromWatchlist is provided", () => {
    render(
      <WatchlistCard
        item={mockWatchlistItem}
        onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
      />
    );

    const button = screen.getByRole("button", { name: /remove/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("x-icon")).toBeInTheDocument();
  });

  it("does not render buttons when callbacks are not provided", () => {
    render(<WatchlistCard item={mockWatchlistItem} />);

    expect(
      screen.queryByRole("button", { name: /watched/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  it("calls onMarkAsWatched when mark as watched button is clicked", () => {
    render(
      <WatchlistCard
        item={mockWatchlistItem}
        onMarkAsWatched={mockOnMarkAsWatched}
      />
    );

    const button = screen.getByRole("button", { name: /watched/i });
    fireEvent.click(button);

    expect(mockOnMarkAsWatched).toHaveBeenCalledWith(mockWatchlistItem);
    expect(mockOnMarkAsWatched).toHaveBeenCalledTimes(1);
  });

  it("calls onRemoveFromWatchlist with correct id when remove button is clicked", () => {
    render(
      <WatchlistCard
        item={mockWatchlistItem}
        onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
      />
    );

    const button = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(button);

    expect(mockOnRemoveFromWatchlist).toHaveBeenCalledWith(1);
    expect(mockOnRemoveFromWatchlist).toHaveBeenCalledTimes(1);
  });

  it("renders both buttons when both callbacks are provided", () => {
    render(
      <WatchlistCard
        item={mockWatchlistItem}
        onMarkAsWatched={mockOnMarkAsWatched}
        onRemoveFromWatchlist={mockOnRemoveFromWatchlist}
      />
    );

    expect(
      screen.getByRole("button", { name: /watched/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("handles null posterPath correctly", () => {
    const itemWithoutPoster = { ...mockWatchlistItem, posterPath: null };
    render(<WatchlistCard item={itemWithoutPoster} />);

    expect(screen.getByAltText("Test Watchlist Movie")).toBeInTheDocument();
  });
});
