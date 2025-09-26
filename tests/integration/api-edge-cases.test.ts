import { testDb, setupTestDb, teardownTestDb, clearTestDb } from "./test-db";
import { hash } from "bcryptjs";
import { NextRequest } from "next/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => {
      const response = new Response(JSON.stringify(data), {
        status: options?.status || 200,
        headers: { "Content-Type": "application/json" },
      });
      return response;
    }),
  },
  NextRequest: jest.fn(),
}));

// Mock the searchTmdb function
jest.mock("@/lib/tmdb", () => ({
  searchTmdb: jest.fn(),
}));

// Mock the db import to use testDb
jest.mock("@/lib/db", () => ({
  db: testDb,
}));

import { GET as tmdbSearchGet } from "@/app/api/tmdb/search";
import { POST as registerPost } from "@/app/api/register/route";
import { searchTmdb, TmdbSearchResponse } from "@/lib/tmdb";

const mockSearchTmdb = searchTmdb as jest.MockedFunction<typeof searchTmdb>;

// Mock NextRequest for TMDB
const createMockNextRequest = (url: string) => {
  const request = new Request(url);
  const mockRequest = Object.assign(request, {
    cookies: {
      get: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    nextUrl: new URL(url),
    page: {},
    ua: {},
  });
  return mockRequest as unknown as NextRequest; // NextRequest
};

// Mock NextRequest for Register
const createMockNextRequestWithJson = (
  url: string,
  options: RequestInit & { jsonBody?: unknown }
) => {
  const request = new Request(url, {
    ...options,
    body: options.jsonBody ? JSON.stringify(options.jsonBody) : options.body,
  });
  const mockRequest = Object.assign(request, {
    cookies: {
      get: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    nextUrl: new URL(url),
    page: {},
    ua: {},
    json: () => Promise.resolve(options.jsonBody || {}),
  });
  return mockRequest as unknown as NextRequest; // NextRequest
};

describe("API Edge Cases and Error Handling", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
  });

  describe("TMDB Search API - Extreme and Malformed Requests", () => {
    it("handles extremely long query strings", async () => {
      const longQuery = "A".repeat(10000); // Very long query
      const mockResults = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url = `http://localhost:3000/api/tmdb/search?query=${encodeURIComponent(
        longQuery
      )}`;
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(mockSearchTmdb).toHaveBeenCalledWith(longQuery);
    });

    it("handles query strings with special characters and XSS attempts", async () => {
      const maliciousQuery =
        "<script>alert('xss')</script> & <img src=x onerror=alert(1)> ' OR 1=1 --";
      const mockResults = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url = `http://localhost:3000/api/tmdb/search?query=${encodeURIComponent(
        maliciousQuery
      )}`;
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchTmdb).toHaveBeenCalledWith(maliciousQuery);
    });

    it("handles multiple query parameters", async () => {
      const mockResults = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url =
        "http://localhost:3000/api/tmdb/search?query=test&extra=param&another=value";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchTmdb).toHaveBeenCalledWith("test");
    });

    it("handles query parameters with array values", async () => {
      const url =
        "http://localhost:3000/api/tmdb/search?query[]=test1&query[]=test2";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      const data = await response.json();

      // API expects 'query' parameter, not 'query[]', so returns 400
      expect(response.status).toBe(400);
      expect(data.error).toBe("Query parameter is required");
    });

    it("handles malformed URLs and encoding", async () => {
      const mockResults = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      // Malformed URL with invalid encoding
      const url =
        "http://localhost:3000/api/tmdb/search?query=%E0%A4%8B%E0%A4%8D%E0%A4%8D%E0%A4%8D";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      await response.json();

      expect(response.status).toBe(200);
      // Should handle malformed encoding gracefully
    });

    it("handles concurrent requests without interference", async () => {
      const mockResults1 = {
        page: 1,
        results: [
          {
            id: 1,
            title: "Movie 1",
            poster_path: "/poster1.jpg",
            release_date: "2023-01-01",
            overview: "Overview 1",
            media_type: "movie" as const,
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      const mockResults2 = {
        page: 1,
        results: [
          {
            id: 2,
            title: "Movie 2",
            poster_path: "/poster2.jpg",
            release_date: "2023-01-01",
            overview: "Overview 2",
            media_type: "movie" as const,
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      mockSearchTmdb
        .mockResolvedValueOnce(mockResults1)
        .mockResolvedValueOnce(mockResults2);

      const url1 = "http://localhost:3000/api/tmdb/search?query=movie1";
      const url2 = "http://localhost:3000/api/tmdb/search?query=movie2";

      const [response1, response2] = await Promise.all([
        tmdbSearchGet(createMockNextRequest(url1)),
        tmdbSearchGet(createMockNextRequest(url2)),
      ]);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.results[0].title).toBe("Movie 1");
      expect(data2.results[0].title).toBe("Movie 2");
    });

    it("handles TMDB API timeout gracefully", async () => {
      // Mock a timeout error
      const timeoutError = new Error("Timeout");
      timeoutError.name = "TimeoutError";
      mockSearchTmdb.mockRejectedValue(timeoutError);

      const url = "http://localhost:3000/api/tmdb/search?query=test";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch from TMDB");
    });

    it("handles TMDB API rate limiting", async () => {
      const rateLimitError = new Error("Too Many Requests");
      (rateLimitError as Error & { status: number }).status = 429;
      mockSearchTmdb.mockRejectedValue(rateLimitError);

      const url = "http://localhost:3000/api/tmdb/search?query=test";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch from TMDB");
    });

    it("handles malformed TMDB API responses", async () => {
      // Return completely malformed data
      mockSearchTmdb.mockResolvedValue({
        invalidField: "not a proper response",
        anotherField: 123,
      } as unknown as TmdbSearchResponse);

      const url = "http://localhost:3000/api/tmdb/search?query=test";
      const request = createMockNextRequest(url);

      const response = await tmdbSearchGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        invalidField: "not a proper response",
        anotherField: 123,
      });
    });
  });

  describe("Register API - Extreme and Malformed Requests", () => {
    it("handles extremely long email addresses", async () => {
      const longEmail = "a".repeat(1000) + "@example.com";

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: longEmail,
            password: "password123",
          },
        }
      );

      const response = await registerPost(request);
      const data = await response.json();

      // Should either succeed or fail gracefully with proper error
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(data.message).toBe("User created successfully");
      }
    });

    it("handles extremely long passwords", async () => {
      const longPassword = "A".repeat(10000);

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: "test@example.com",
            password: longPassword,
          },
        }
      );

      const response = await registerPost(request);
      await response.json();

      expect([200, 400, 500]).toContain(response.status);
    });

    it("handles malformed JSON in request body", async () => {
      // Create a request with invalid JSON
      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email": "test@example.com", "password": "pass", invalid}', // Invalid JSON
      });

      const mockRequest = Object.assign(request, {
        cookies: {
          get: jest.fn(),
          getAll: jest.fn(),
          set: jest.fn(),
          delete: jest.fn(),
        },
        nextUrl: new URL("http://localhost:3000/api/register"),
        page: {},
        ua: {},
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const response = await registerPost(
        mockRequest as unknown as NextRequest
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("handles missing Content-Type header", async () => {
      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          // No Content-Type header
          jsonBody: {
            email: "test@example.com",
            password: "password123",
          },
        }
      );

      const response = await registerPost(request);
      await response.json();

      // Should handle gracefully
      expect([200, 500]).toContain(response.status);
    });

    it("handles extremely large request bodies", async () => {
      const largeData = {
        email: "test@example.com",
        password: "password123",
        name: "A".repeat(100000), // Very large name
      };

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: largeData,
        }
      );

      const response = await registerPost(request);
      await response.json();

      expect([200, 400, 500]).toContain(response.status);
    });

    it("handles concurrent registration attempts", async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        createMockNextRequestWithJson("http://localhost:3000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: `user${i}@example.com`,
            password: "password123",
          },
        })
      );

      const responses = await Promise.all(
        requests.map((req) => registerPost(req))
      );

      // All should succeed since emails are unique
      const successCount = responses.filter((r) => r.status === 200).length;

      expect(successCount).toBe(10);
    });

    it("handles SQL injection attempts in email", async () => {
      const maliciousEmail = "test@example.com'; DROP TABLE users; --";

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: maliciousEmail,
            password: "password123",
          },
        }
      );

      const response = await registerPost(request);
      const data = await response.json();

      // API accepts any email format, so it should succeed
      expect(response.status).toBe(200);
      expect(data.message).toBe("User created successfully");
    });

    it("handles special characters in email and name", async () => {
      const specialEmail = "test+tag@example.com";
      const specialName = "Test User 🎭 ñame with spëcial chärs";

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: specialEmail,
            password: "password123",
            name: specialName,
          },
        }
      );

      const response = await registerPost(request);
      const data = await response.json();

      // API accepts special characters
      expect(response.status).toBe(200);
      expect(data.user.email).toBe(specialEmail);
      expect(data.user.name).toBe(specialName);
    });

    it("handles database connection failures during registration", async () => {
      // Mock database to throw connection error
      const originalDb = testDb;
      testDb.select = jest.fn().mockImplementation(() => {
        throw new Error("Connection lost");
      });

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: "test@example.com",
            password: "password123",
          },
        }
      );

      const response = await registerPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");

      // Restore
      testDb.select = originalDb.select;
    });

    it("handles bcrypt hashing failures", async () => {
      // Mock bcrypt to fail
      const originalHash = hash;
      // @ts-expect-error Mocking imported function for testing
      hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      const request = createMockNextRequestWithJson(
        "http://localhost:3000/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          jsonBody: {
            email: "test@example.com",
            password: "password123",
          },
        }
      );

      const response = await registerPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");

      // Restore
      // @ts-expect-error Restoring mocked function
      hash = originalHash;
    });
  });
});
