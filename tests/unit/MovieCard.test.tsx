import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "@/components/MovieCard";
import { TmdbContent } from "@/lib/tmdb";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  PlusIcon: () => <div data-testid="plus-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
}));

// Mock TMDB getImageUrl
jest.mock("@/lib/tmdb", () => ({
  getImageUrl: jest.fn((path) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder-image.png"
  ),
}));

const mockMovie: TmdbContent = {
  id: 1,
  title: "Test Movie",
  poster_path: "/test-poster.jpg",
  release_date: "2023-01-01",
  overview: "A test movie",
  media_type: "movie",
};

describe("MovieCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders movie card with correct content", () => {
    render(<MovieCard item={mockMovie} />);

    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByText("Movie")).toBeInTheDocument();
    expect(screen.getByAltText("Test Movie")).toBeInTheDocument();
  });
});

it("renders TV show card with correct content", () => {
  const mockTvShow: TmdbContent = {
    id: 2,
    name: "Test TV Show",
    poster_path: "/test-tv-poster.jpg",
    first_air_date: "2023-01-01",
    overview: "A test TV show",
    media_type: "tv",
  };

  render(<MovieCard item={mockTvShow} />);

  expect(screen.getByText("Test TV Show")).toBeInTheDocument();
  expect(screen.getByText("TV Show")).toBeInTheDocument();
  expect(screen.getByAltText("Test TV Show")).toBeInTheDocument();
});

it("renders add to watchlist button when onAddToWatchlist is provided", () => {
  const mockOnAddToWatchlist = jest.fn();

  render(
    <MovieCard item={mockMovie} onAddToWatchlist={mockOnAddToWatchlist} />
  );

  const button = screen.getByRole("button", { name: /watchlist/i });
  expect(button).toBeInTheDocument();
  expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
});

it("renders mark as watched button when onMarkAsWatched is provided", () => {
  const mockOnMarkAsWatched = jest.fn();

  render(<MovieCard item={mockMovie} onMarkAsWatched={mockOnMarkAsWatched} />);

  const button = screen.getByRole("button", { name: /watched/i });
  expect(button).toBeInTheDocument();
  expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
});

it("does not render buttons when callbacks are not provided", () => {
  render(<MovieCard item={mockMovie} />);

  expect(
    screen.queryByRole("button", { name: /watchlist/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /watched/i })
  ).not.toBeInTheDocument();
});

it("calls onAddToWatchlist when add to watchlist button is clicked", () => {
  const mockOnAddToWatchlist = jest.fn();

  render(
    <MovieCard item={mockMovie} onAddToWatchlist={mockOnAddToWatchlist} />
  );

  const button = screen.getByRole("button", { name: /watchlist/i });
  fireEvent.click(button);

  expect(mockOnAddToWatchlist).toHaveBeenCalledWith(mockMovie);
  expect(mockOnAddToWatchlist).toHaveBeenCalledTimes(1);
});

it("calls onMarkAsWatched when mark as watched button is clicked", () => {
  const mockOnMarkAsWatched = jest.fn();

  render(<MovieCard item={mockMovie} onMarkAsWatched={mockOnMarkAsWatched} />);

  const button = screen.getByRole("button", { name: /watched/i });
  fireEvent.click(button);

  expect(mockOnMarkAsWatched).toHaveBeenCalledWith(mockMovie);
  expect(mockOnMarkAsWatched).toHaveBeenCalledTimes(1);
});

it("renders both buttons when both callbacks are provided", () => {
  const mockOnAddToWatchlist = jest.fn();
  const mockOnMarkAsWatched = jest.fn();

  render(
    <MovieCard
      item={mockMovie}
      onAddToWatchlist={mockOnAddToWatchlist}
      onMarkAsWatched={mockOnMarkAsWatched}
    />
  );

  expect(
    screen.getByRole("button", { name: /watchlist/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /watched/i })).toBeInTheDocument();
});

it("handles null poster_path correctly", () => {
  const movieWithoutPoster = { ...mockMovie, poster_path: null };
  render(<MovieCard item={movieWithoutPoster} />);

  expect(screen.getByAltText("Test Movie")).toBeInTheDocument();
});
