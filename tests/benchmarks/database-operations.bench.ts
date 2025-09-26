import {
  testDb,
  setupTestDb,
  teardownTestDb,
  clearTestDb,
} from "../integration/test-db";
import { users, watchedContent, watchlist } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

describe("Database Operations Performance Benchmarks", () => {
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDb();
    // Create test user
    const user = await testDb
      .insert(users)
      .values({
        email: "bench@example.com",
        password: "hashedpassword",
        name: "Benchmark User",
      })
      .returning();
    testUserId = user[0].id;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    // Recreate test user since clearTestDb removes it
    const user = await testDb
      .insert(users)
      .values({
        email: "bench@example.com",
        password: "hashedpassword",
        name: "Benchmark User",
      })
      .returning();
    testUserId = user[0].id;
  });

  const runBenchmark = async (
    name: string,
    fn: () => Promise<void>,
    iterations: number = 10
  ) => {
    const times: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage
        ? process.memoryUsage().heapUsed
        : 0;

      await fn();

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
    const throughput = 1000 / avgTime; // operations per second

    console.log(
      `${name} - Average Time: ${avgTime.toFixed(
        2
      )}ms, Memory: ${avgMemory.toFixed(
        2
      )} bytes, Throughput: ${throughput.toFixed(2)} ops/sec`
    );

    // Baseline thresholds
    expect(avgTime).toBeLessThan(100); // Should complete in less than 100ms
    expect(avgMemory).toBeLessThan(10000000); // Less than 10MB memory increase
  };

  describe("WatchedContent CRUD Operations", () => {
    describe("CREATE Operations", () => {
      test("Small dataset (10 inserts)", async () => {
        await runBenchmark(
          "WatchedContent CREATE - 10 records",
          async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({
              userId: testUserId,
              tmdbId: i + 1,
              title: `Movie ${i + 1}`,
              posterPath: `/poster${i + 1}.jpg`,
              mediaType: "movie" as const,
              rating: Math.floor(Math.random() * 10) + 1,
              notes: `Notes for movie ${i + 1}`,
            }));

            await testDb.insert(watchedContent).values(items);
          },
          5
        );
      });

      test("Large dataset (100 inserts)", async () => {
        await runBenchmark(
          "WatchedContent CREATE - 100 records",
          async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({
              userId: testUserId,
              tmdbId: i + 1,
              title: `Movie ${i + 1}`,
              posterPath: `/poster${i + 1}.jpg`,
              mediaType: "movie" as const,
              rating: Math.floor(Math.random() * 10) + 1,
              notes: `Notes for movie ${i + 1}`,
            }));

            await testDb.insert(watchedContent).values(items);
          },
          3
        );
      });
    });

    describe("READ Operations", () => {
      beforeEach(async () => {
        // Setup test data
        const items = Array.from({ length: 100 }, (_, i) => ({
          userId: testUserId,
          tmdbId: i + 1,
          title: `Movie ${i + 1}`,
          posterPath: `/poster${i + 1}.jpg`,
          mediaType: "movie" as const,
          rating: Math.floor(Math.random() * 10) + 1,
          notes: `Notes for movie ${i + 1}`,
        }));
        await testDb.insert(watchedContent).values(items);
      });

      test("Small dataset read (10 records)", async () => {
        await runBenchmark(
          "WatchedContent READ - 10 records",
          async () => {
            await testDb
              .select()
              .from(watchedContent)
              .where(eq(watchedContent.userId, testUserId))
              .limit(10);
          },
          10
        );
      });

      test("Large dataset read (100 records)", async () => {
        await runBenchmark(
          "WatchedContent READ - 100 records",
          async () => {
            await testDb
              .select()
              .from(watchedContent)
              .where(eq(watchedContent.userId, testUserId));
          },
          10
        );
      });

      test("Indexed read (by tmdbId)", async () => {
        await runBenchmark(
          "WatchedContent READ - by tmdbId",
          async () => {
            await testDb
              .select()
              .from(watchedContent)
              .where(eq(watchedContent.tmdbId, 50));
          },
          10
        );
      });
    });

    describe("UPDATE Operations", () => {
      let itemIds: number[];

      beforeEach(async () => {
        const items = Array.from({ length: 50 }, (_, i) => ({
          userId: testUserId,
          tmdbId: i + 1,
          title: `Movie ${i + 1}`,
          mediaType: "movie" as const,
          rating: 5,
        }));
        const inserted = await testDb
          .insert(watchedContent)
          .values(items)
          .returning();
        itemIds = inserted.map((item: { id: number }) => item.id);
      });

      test("Small dataset update (10 records)", async () => {
        await runBenchmark(
          "WatchedContent UPDATE - 10 records",
          async () => {
            await testDb
              .update(watchedContent)
              .set({ rating: 10, notes: "Updated notes" })
              .where(inArray(watchedContent.id, itemIds.slice(0, 10)));
          },
          5
        );
      });

      test("Large dataset update (50 records)", async () => {
        await runBenchmark(
          "WatchedContent UPDATE - 50 records",
          async () => {
            await testDb
              .update(watchedContent)
              .set({ rating: 10, notes: "Updated notes" })
              .where(inArray(watchedContent.id, itemIds));
          },
          3
        );
      });
    });

    describe("DELETE Operations", () => {
      let itemIds: number[];

      beforeEach(async () => {
        const items = Array.from({ length: 50 }, (_, i) => ({
          userId: testUserId,
          tmdbId: i + 1,
          title: `Movie ${i + 1}`,
          mediaType: "movie" as const,
        }));
        const inserted = await testDb
          .insert(watchedContent)
          .values(items)
          .returning();
        itemIds = inserted.map((item: { id: number }) => item.id);
      });

      test("Small dataset delete (10 records)", async () => {
        await runBenchmark(
          "WatchedContent DELETE - 10 records",
          async () => {
            await testDb
              .delete(watchedContent)
              .where(inArray(watchedContent.id, itemIds.slice(0, 10)));
          },
          5
        );
      });

      test("Large dataset delete (50 records)", async () => {
        await runBenchmark(
          "WatchedContent DELETE - 50 records",
          async () => {
            await testDb
              .delete(watchedContent)
              .where(inArray(watchedContent.id, itemIds));
          },
          3
        );
      });
    });
  });

  describe("Watchlist CRUD Operations", () => {
    describe("CREATE Operations", () => {
      test("Small dataset (10 inserts)", async () => {
        await runBenchmark(
          "Watchlist CREATE - 10 records",
          async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({
              userId: testUserId,
              tmdbId: i + 1,
              title: `Watchlist Movie ${i + 1}`,
              posterPath: `/poster${i + 1}.jpg`,
              mediaType: "movie" as const,
            }));

            await testDb.insert(watchlist).values(items);
          },
          5
        );
      });

      test("Large dataset (100 inserts)", async () => {
        await runBenchmark(
          "Watchlist CREATE - 100 records",
          async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({
              userId: testUserId,
              tmdbId: i + 1,
              title: `Watchlist Movie ${i + 1}`,
              posterPath: `/poster${i + 1}.jpg`,
              mediaType: "movie" as const,
            }));

            await testDb.insert(watchlist).values(items);
          },
          3
        );
      });
    });

    describe("READ Operations", () => {
      beforeEach(async () => {
        const items = Array.from({ length: 100 }, (_, i) => ({
          userId: testUserId,
          tmdbId: i + 1,
          title: `Watchlist Movie ${i + 1}`,
          posterPath: `/poster${i + 1}.jpg`,
          mediaType: "movie" as const,
        }));
        await testDb.insert(watchlist).values(items);
      });

      test("Small dataset read (10 records)", async () => {
        await runBenchmark(
          "Watchlist READ - 10 records",
          async () => {
            await testDb
              .select()
              .from(watchlist)
              .where(eq(watchlist.userId, testUserId))
              .limit(10);
          },
          10
        );
      });

      test("Large dataset read (100 records)", async () => {
        await runBenchmark(
          "Watchlist READ - 100 records",
          async () => {
            await testDb
              .select()
              .from(watchlist)
              .where(eq(watchlist.userId, testUserId));
          },
          10
        );
      });
    });

    describe("DELETE Operations", () => {
      let itemIds: number[];

      beforeEach(async () => {
        const items = Array.from({ length: 50 }, (_, i) => ({
          userId: testUserId,
          tmdbId: i + 1,
          title: `Watchlist Movie ${i + 1}`,
          mediaType: "movie" as const,
        }));
        const inserted = await testDb
          .insert(watchlist)
          .values(items)
          .returning();
        itemIds = inserted.map((item: { id: number }) => item.id);
      });

      test("Small dataset delete (10 records)", async () => {
        await runBenchmark(
          "Watchlist DELETE - 10 records",
          async () => {
            await testDb
              .delete(watchlist)
              .where(inArray(watchlist.id, itemIds.slice(0, 10)));
          },
          5
        );
      });

      test("Large dataset delete (50 records)", async () => {
        await runBenchmark(
          "Watchlist DELETE - 50 records",
          async () => {
            await testDb
              .delete(watchlist)
              .where(inArray(watchlist.id, itemIds));
          },
          3
        );
      });
    });
  });
});
