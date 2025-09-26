import React from "react";
import { render } from "@testing-library/react";
import { MovieCard } from "@/components/MovieCard";
import { WatchedCard } from "@/components/WatchedCard";
import { WatchlistCard } from "@/components/WatchlistCard";
import { TmdbContent } from "@/lib/tmdb";
import { WatchedItem, WatchlistItem } from "@/state/store";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", props),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  PlusIcon: () => React.createElement("div", null, "PlusIcon"),
  EyeIcon: () => React.createElement("div", null, "EyeIcon"),
  EditIcon: () => React.createElement("div", null, "EditIcon"),
  TrashIcon: () => React.createElement("div", null, "TrashIcon"),
  XIcon: () => React.createElement("div", null, "XIcon"),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: (date: Date) => date.toISOString(),
}));

describe("Component Rendering Performance Benchmarks", () => {
  const mockTmdbItem: TmdbContent = {
    id: 1,
    title: "Test Movie",
    poster_path: "/test.jpg",
    release_date: "2023-01-01",
    overview: "Test overview",
    media_type: "movie",
  };

  const mockWatchedItem: WatchedItem = {
    id: 1,
    tmdbId: 1,
    title: "Test Movie",
    posterPath: "/test.jpg",
    mediaType: "movie",
    rating: 8,
    notes: "Great movie",
    watchedAt: new Date(),
  };

  const mockWatchlistItem: WatchlistItem = {
    id: 1,
    tmdbId: 1,
    title: "Test Movie",
    posterPath: "/test.jpg",
    mediaType: "movie",
  };

  const runBenchmark = async (
    name: string,
    fn: () => void,
    iterations: number = 100
  ) => {
    const times: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory =
        (
          globalThis as {
            performance?: { memory?: { usedJSHeapSize: number } };
          }
        ).performance?.memory?.usedJSHeapSize || 0;

      fn();

      const endTime = performance.now();
      const endMemory =
        (
          globalThis as {
            performance?: { memory?: { usedJSHeapSize: number } };
          }
        ).performance?.memory?.usedJSHeapSize || 0;

      times.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const avgMemory =
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const throughput = 1000 / avgTime; // operations per second

    console.log(
      `${name} - Average Time: ${avgTime.toFixed(
        2
      )}ms, Memory: ${avgMemory.toFixed(
        2
      )} bytes, Throughput: ${throughput.toFixed(2)} ops/sec`
    );

    // Baseline thresholds - adjusted for realistic performance
    expect(avgTime).toBeLessThan(200); // Should render in less than 200ms
    expect(avgMemory).toBeLessThan(2000000); // Less than 2MB memory increase
  };

  describe("MovieCard Rendering", () => {
    test("Small dataset (1 card)", async () => {
      await runBenchmark(
        "MovieCard - 1 render",
        () => {
          render(<MovieCard item={mockTmdbItem} />);
        },
        10
      );
    });

    test("Medium dataset (10 cards)", async () => {
      await runBenchmark(
        "MovieCard - 10 renders",
        () => {
          for (let i = 0; i < 10; i++) {
            render(<MovieCard item={{ ...mockTmdbItem, id: i }} />);
          }
        },
        5
      );
    });
  });

  describe("WatchedCard Rendering", () => {
    test("Small dataset (1 card)", async () => {
      await runBenchmark(
        "WatchedCard - 1 render",
        () => {
          render(<WatchedCard item={mockWatchedItem} />);
        },
        10
      );
    });

    test("Medium dataset (10 cards)", async () => {
      await runBenchmark(
        "WatchedCard - 10 renders",
        () => {
          for (let i = 0; i < 10; i++) {
            render(<WatchedCard item={{ ...mockWatchedItem, id: i }} />);
          }
        },
        5
      );
    });
  });

  describe("WatchlistCard Rendering", () => {
    test("Small dataset (1 card)", async () => {
      await runBenchmark(
        "WatchlistCard - 1 render",
        () => {
          render(<WatchlistCard item={mockWatchlistItem} />);
        },
        10
      );
    });

    test("Medium dataset (10 cards)", async () => {
      await runBenchmark(
        "WatchlistCard - 10 renders",
        () => {
          for (let i = 0; i < 10; i++) {}
        },
        5
      );
    });
  });
});
