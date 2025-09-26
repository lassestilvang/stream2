import { render, screen, fireEvent } from "@testing-library/react";
import { WatchedCard } from "@/components/WatchedCard";
import { WatchedItem } from "@/state/store";

// Mock Next.js Image component removed to use actual Image

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  EditIcon: () => <div data-testid="edit-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
}));

// Mock date-fns format
jest.mock("date-fns", () => ({
  format: jest.fn((date) => `formatted-${date.toISOString()}`),
}));

// Mock TMDB getImageUrl
jest.mock("@/lib/tmdb", () => ({
  getImageUrl: jest.fn((path) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder-image.png"
  ),
}));

describe("WatchedCard", () => {
  const mockWatchedItem: WatchedItem = {
    id: 1,
    tmdbId: 123,
    title: "Test Watched Movie",
    posterPath: "/test-poster.jpg",
    mediaType: "movie",
    rating: 8,
    notes: "Great movie!",
    watchedAt: new Date("2023-01-01"),
  };

  const mockWatchedItemWithoutRating: WatchedItem = {
    id: 2,
    tmdbId: 456,
    title: "Test Watched TV Show",
    posterPath: "/test-tv-poster.jpg",
    mediaType: "tv",
    watchedAt: new Date("2023-02-01"),
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders watched movie card with all details", () => {
    render(<WatchedCard item={mockWatchedItem} />);

    expect(screen.getByText("Test Watched Movie")).toBeInTheDocument();
    expect(screen.getByText("Movie")).toBeInTheDocument();
    expect(screen.getByText("Rating: 8/10")).toBeInTheDocument();
    expect(screen.getByText("Notes: Great movie!")).toBeInTheDocument();
    expect(
      screen.getByText("Watched: formatted-2023-01-01T00:00:00.000Z")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Test Watched Movie")).toBeInTheDocument();
  });

  it("renders watched TV show card without rating and notes", () => {
    render(<WatchedCard item={mockWatchedItemWithoutRating} />);

    expect(screen.getByText("Test Watched TV Show")).toBeInTheDocument();
    expect(screen.getByText("TV Show")).toBeInTheDocument();
    expect(screen.queryByText(/Rating:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Watched: formatted-2023-02-01T00:00:00.000Z")
    ).toBeInTheDocument();
  });

  it("renders edit button when onEdit is provided", () => {
    render(<WatchedCard item={mockWatchedItem} onEdit={mockOnEdit} />);

    const button = screen.getByRole("button", { name: /edit/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
  });

  it("renders delete button when onDelete is provided", () => {
    render(<WatchedCard item={mockWatchedItem} onDelete={mockOnDelete} />);

    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });

  it("does not render buttons when callbacks are not provided", () => {
    render(<WatchedCard item={mockWatchedItem} />);

    expect(
      screen.queryByRole("button", { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(<WatchedCard item={mockWatchedItem} onEdit={mockOnEdit} />);

    const button = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(button);

    expect(mockOnEdit).toHaveBeenCalledWith(mockWatchedItem);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete with correct id when delete button is clicked", () => {
    render(<WatchedCard item={mockWatchedItem} onDelete={mockOnDelete} />);

    const button = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(button);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("renders both buttons when both callbacks are provided", () => {
    render(
      <WatchedCard
        item={mockWatchedItem}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("handles null posterPath correctly", () => {
    const itemWithoutPoster = { ...mockWatchedItem, posterPath: null };
    render(<WatchedCard item={itemWithoutPoster} />);

    expect(screen.getByAltText("Test Watched Movie")).toBeInTheDocument();
  });

  it("truncates long notes with line-clamp class", () => {
    const itemWithLongNotes = {
      ...mockWatchedItem,
      notes: "This is a very long note that should be truncated in the UI",
    };
    render(<WatchedCard item={itemWithLongNotes} />);

    const notesElement = screen.getByText(/Notes:/);
    expect(notesElement).toHaveClass("line-clamp-2");
  });
});
