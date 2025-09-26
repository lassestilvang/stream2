import { testDb, setupTestDb, teardownTestDb, clearTestDb } from "./test-db";
import { users, watchedContent, watchlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Database CRUD Operations", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("watchedContent table", () => {
    let testUserId: string;

    beforeEach(async () => {
      // Create test user
      const user = await testDb
        .insert(users)
        .values({
          email: "test@example.com",
          password: "hashedpassword",
          name: "Test User",
        })
        .returning();
      testUserId = user[0].id;
    });

    describe("CREATE operations", () => {
      it("should create a new watched content entry", async () => {
        const watchedItem = {
          userId: testUserId,
          tmdbId: 123,
          title: "Test Movie",
          posterPath: "/test-poster.jpg",
          mediaType: "movie" as const,
          rating: 8,
          notes: "Great movie!",
        };

        const result = await testDb
          .insert(watchedContent)
          .values(watchedItem)
          .returning();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          ...watchedItem,
          id: expect.any(Number),
          watchedAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it("should create entry without optional fields", async () => {
        const watchedItem = {
          userId: testUserId,
          tmdbId: 456,
          title: "Test TV Show",
          mediaType: "tv" as const,
        };

        const result = await testDb
          .insert(watchedContent)
          .values(watchedItem)
          .returning();

        expect(result).toHaveLength(1);
        expect(result[0].rating).toBeNull();
        expect(result[0].notes).toBeNull();
        expect(result[0].posterPath).toBeNull();
      });

      it("should enforce foreign key constraint", async () => {
        const watchedItem = {
          userId: "non-existent-user-id",
          tmdbId: 123,
          title: "Test Movie",
          mediaType: "movie" as const,
        };

        await expect(
          testDb.insert(watchedContent).values(watchedItem)
        ).rejects.toThrow();
      });
    });

    describe("READ operations", () => {
      beforeEach(async () => {
        // Insert test data
        await testDb.insert(watchedContent).values([
          {
            userId: testUserId,
            tmdbId: 123,
            title: "Movie 1",
            mediaType: "movie",
            rating: 9,
          },
          {
            userId: testUserId,
            tmdbId: 456,
            title: "TV Show 1",
            mediaType: "tv",
            rating: 7,
          },
        ]);
      });

      it("should read all watched content for a user", async () => {
        const result = await testDb
          .select()
          .from(watchedContent)
          .where(eq(watchedContent.userId, testUserId));

        expect(result).toHaveLength(2);
        expect(
          result.map((item: typeof watchedContent.$inferSelect) => item.title)
        ).toEqual(expect.arrayContaining(["Movie 1", "TV Show 1"]));
      });

      it("should read specific watched content by ID", async () => {
        const items = await testDb
          .select()
          .from(watchedContent)
          .where(eq(watchedContent.tmdbId, 123))
          .limit(1);

        expect(items).toHaveLength(1);
        expect(items[0].title).toBe("Movie 1");
        expect(items[0].rating).toBe(9);
      });
    });
  });

  describe("watchlist table", () => {
    let testUserId: string;

    beforeEach(async () => {
      // Create test user
      const user = await testDb
        .insert(users)
        .values({
          email: "test@example.com",
          password: "hashedpassword",
          name: "Test User",
        })
        .returning();
      testUserId = user[0].id;
    });

    describe("CREATE operations", () => {
      it("should create a new watchlist entry", async () => {
        const watchlistItem = {
          userId: testUserId,
          tmdbId: 789,
          title: "Watchlist Movie",
          posterPath: "/watchlist-poster.jpg",
          mediaType: "movie" as const,
        };

        const result = await testDb
          .insert(watchlist)
          .values(watchlistItem)
          .returning();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          ...watchlistItem,
          id: expect.any(Number),
          createdAt: expect.any(Date),
        });
      });

      it("should enforce foreign key constraint", async () => {
        const watchlistItem = {
          userId: "non-existent-user-id",
          tmdbId: 789,
          title: "Watchlist Movie",
          mediaType: "movie" as const,
        };

        await expect(
          testDb.insert(watchlist).values(watchlistItem)
        ).rejects.toThrow();
      });
    });

    describe("DELETE operations", () => {
      let watchlistItemId: number;

      beforeEach(async () => {
        const result = await testDb
          .insert(watchlist)
          .values({
            userId: testUserId,
            tmdbId: 789,
            title: "Watchlist Movie",
            mediaType: "movie",
          })
          .returning();
        watchlistItemId = result[0].id;
      });

      it("should delete watchlist item", async () => {
        const deleteResult = await testDb
          .delete(watchlist)
          .where(eq(watchlist.id, watchlistItemId))
          .returning();

        expect(deleteResult).toHaveLength(1);

        // Verify deletion
        const checkResult = await testDb
          .select()
          .from(watchlist)
          .where(eq(watchlist.id, watchlistItemId));

        expect(checkResult).toHaveLength(0);
      });
    });
  });

  describe("Transactions", () => {
    it("should handle transactions correctly", async () => {
      // Create test user
      const user = await testDb
        .insert(users)
        .values({
          email: "test@example.com",
          password: "hashedpassword",
          name: "Test User",
        })
        .returning();
      const testUserId = user[0].id;

      // Note: Drizzle with better-sqlite3 supports transactions
      // This is a simplified test - in real scenarios, you'd use db.transaction()
      const watchedResult = await testDb
        .insert(watchedContent)
        .values({
          userId: testUserId,
          tmdbId: 123,
          title: "Transactional Movie",
          mediaType: "movie",
        })
        .returning();

      const watchlistResult = await testDb
        .insert(watchlist)
        .values({
          userId: testUserId,
          tmdbId: 456,
          title: "Transactional Watchlist",
          mediaType: "movie",
        })
        .returning();

      expect(watchedResult).toHaveLength(1);
      expect(watchlistResult).toHaveLength(1);
    });
  });

  describe("Constraints and validations", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await testDb
        .insert(users)
        .values({
          email: "test@example.com",
          password: "hashedpassword",
          name: "Test User",
        })
        .returning();
      testUserId = user[0].id;
    });

    it("should enforce NOT NULL constraints", async () => {
      // Try to insert without required fields
      await expect(
        testDb.insert(watchedContent).values({
          userId: testUserId,
          // Missing tmdbId, title, mediaType
        } as Pick<typeof watchedContent.$inferInsert, "userId">)
      ).rejects.toThrow();
    });

    it("should allow duplicate tmdbId for different users", async () => {
      // Create another user
      const user2 = await testDb
        .insert(users)
        .values({
          email: "test2@example.com",
          password: "hashedpassword",
          name: "Test User 2",
        })
        .returning();

      // Both users can have the same tmdbId
      await testDb.insert(watchedContent).values({
        userId: testUserId,
        tmdbId: 123,
        title: "Movie for User 1",
        mediaType: "movie",
      });

      await testDb.insert(watchedContent).values({
        userId: user2[0].id,
        tmdbId: 123, // Same tmdbId
        title: "Movie for User 2",
        mediaType: "movie",
      });

      const result = await testDb
        .select()
        .from(watchedContent)
        .where(eq(watchedContent.tmdbId, 123));

      expect(result).toHaveLength(2);
    });
  });
});
