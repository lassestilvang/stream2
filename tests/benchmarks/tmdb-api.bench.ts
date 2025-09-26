import { searchTmdb } from "@/lib/tmdb";

// Mock fetch for TMDB API calls
global.fetch = jest.fn();

describe("TMDB API Performance Benchmarks", () => {
  const mockSmallResponse = {
    page: 1,
    results: [
      {
        id: 1,
        title: "Test Movie 1",
        poster_path: "/test1.jpg",
        release_date: "2023-01-01",
        overview: "Overview 1",
        media_type: "movie" as const,
      },
      {
        id: 2,
        title: "Test Movie 2",
        poster_path: "/test2.jpg",
        release_date: "2023-01-02",
        overview: "Overview 2",
        media_type: "movie" as const,
      },
    ],
    total_pages: 1,
    total_results: 2,
  };

  const mockLargeResponse = {
    page: 1,
    results: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Test Movie ${i + 1}`,
      poster_path: `/test${i + 1}.jpg`,
      release_date: `2023-01-${String(i + 1).padStart(2, "0")}`,
      overview: `Overview ${i + 1}`,
      media_type: "movie" as const,
    })),
    total_pages: 5,
    total_results: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const runBenchmark = async (
    name: string,
    setup: () => void,
    iterations: number = 10
  ) => {
    const times: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      setup();

      const startTime = performance.now();
      const startMemory = process.memoryUsage
        ? process.memoryUsage().heapUsed
        : 0;

      await searchTmdb("test query");

      const endTime = performance.now();
      const endMemory = process.memoryUsage
        ? process.memoryUsage().heapUsed
        : 0;

      times.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const avgMemory =
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const throughput = 1000 / avgTime; // requests per second

    console.log(
      `${name} - Average Time: ${avgTime.toFixed(
        2
      )}ms, Memory: ${avgMemory.toFixed(
        2
      )} bytes, Throughput: ${throughput.toFixed(2)} req/sec`
    );

    // Baseline thresholds
    expect(avgTime).toBeLessThan(500); // Should respond in less than 500ms
    expect(avgMemory).toBeLessThan(5000000); // Less than 5MB memory increase
  };

  describe("TMDB Search API Response Times", () => {
    test("Small dataset (2 results)", async () => {
      await runBenchmark(
        "TMDB Search - Small Response",
        () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockSmallResponse,
          });
        },
        10
      );
    });

    test("Large dataset (20 results)", async () => {
      await runBenchmark(
        "TMDB Search - Large Response",
        () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockLargeResponse,
          });
        },
        10
      );
    });

    test("Cached vs Uncached (simulated)", async () => {
      // Simulate cached response (immediate)
      await runBenchmark(
        "TMDB Search - Cached",
        () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockSmallResponse, fromCache: true }),
          });
        },
        10
      );

      // Simulate uncached response (with delay)
      await runBenchmark(
        "TMDB Search - Uncached",
        () => {
          (global.fetch as jest.Mock).mockImplementationOnce(
            () =>
              new Promise((resolve) =>
                setTimeout(
                  () =>
                    resolve({
                      ok: true,
                      json: async () => mockSmallResponse,
                    }),
                  100
                )
              )
          );
        },
        5
      );
    });

    test("Error handling performance", async () => {
      const runErrorBenchmark = async (
        name: string,
        setup: () => void,
        iterations: number = 10
      ) => {
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          setup();

          const startTime = performance.now();

          try {
            await searchTmdb("test query");
          } catch {
            // Expected error for benchmark
          }

          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const throughput = 1000 / avgTime;

        console.log(
          `${name} - Average Time: ${avgTime.toFixed(
            2
          )}ms, Throughput: ${throughput.toFixed(2)} req/sec`
        );

        expect(avgTime).toBeLessThan(500);
      };

      await runErrorBenchmark(
        "TMDB Search - Error Response",
        () => {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: "Not Found",
          });
        },
        10
      );
    });
  });
});
