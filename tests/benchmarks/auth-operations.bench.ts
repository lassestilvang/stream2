import bcrypt from "bcryptjs";
import {
  testDb,
  setupTestDb,
  teardownTestDb,
  clearTestDb,
} from "../integration/test-db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Authentication Operations Performance Benchmarks", () => {
  let hashedPassword: string;

  beforeAll(async () => {
    await setupTestDb();
    // Create test user
    hashedPassword = await bcrypt.hash("testpassword", 10);
    await testDb
      .insert(users)
      .values({
        email: "authbench@example.com",
        password: hashedPassword,
        name: "Auth Benchmark User",
      })
      .returning();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
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
    expect(avgTime).toBeLessThan(200); // Should complete in less than 200ms
    expect(avgMemory).toBeLessThan(5000000); // Less than 5MB memory increase
  };

  describe("Password Hashing Operations", () => {});

  describe("Database Authentication Queries", () => {
    test("User lookup by email", async () => {
      await runBenchmark(
        "User lookup by email",
        async () => {
          await testDb
            .select()
            .from(users)
            .where(eq(users.email, "authbench@example.com"))
            .limit(1);
        },
        10
      );
    });

    test("User lookup by non-existent email", async () => {
      await runBenchmark(
        "User lookup by non-existent email",
        async () => {
          await testDb
            .select()
            .from(users)
            .where(eq(users.email, "nonexistent@example.com"))
            .limit(1);
        },
        10
      );
    });
  });

  describe("Complete Authentication Flow Simulation", () => {
    test("Simulated login flow (lookup + compare)", async () => {
      await runBenchmark(
        "Complete login flow simulation",
        async () => {
          // Simulate the authorize function logic
          const user = await testDb
            .select()
            .from(users)
            .where(eq(users.email, "authbench@example.com"))
            .limit(1);

          if (user[0] && user[0].password) {
            await bcrypt.compare("testpassword", user[0].password);
          }
        },
        10
      );
    });

    test("Simulated failed login flow", async () => {
      await runBenchmark(
        "Failed login flow simulation",
        async () => {
          // Simulate failed login
          const user = await testDb
            .select()
            .from(users)
            .where(eq(users.email, "wrong@example.com"))
            .limit(1);

          if (user[0] && user[0].password) {
            await bcrypt.compare("testpassword", user[0].password);
          }
        },
        10
      );
    });
  });
});
