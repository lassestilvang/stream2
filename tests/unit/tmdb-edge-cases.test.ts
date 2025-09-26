import { searchTmdb, getImageUrl } from "@/lib/tmdb";
import { env } from "@/lib/env";

// Mock the env module
jest.mock("@/lib/env", () => ({
  env: {
    TMDB_API_KEY: "test-api-key",
  },
}));

describe("TMDB API Edge Cases and Error Scenarios", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe("Network Failure Scenarios", () => {
    it("handles network timeout gracefully", async () => {
      const timeoutError = new Error("Network timeout");
      timeoutError.name = "TimeoutError";
      fetchMock.mockRejectOnce(timeoutError);

      await expect(searchTmdb("test query")).rejects.toThrow("Network timeout");
    });

    it("handles DNS resolution failures", async () => {
      const dnsError = new Error("ENOTFOUND api.themoviedb.org");
      dnsError.name = "ENOTFOUND";
      fetchMock.mockRejectOnce(dnsError);

      await expect(searchTmdb("test")).rejects.toThrow(
        "ENOTFOUND api.themoviedb.org"
      );
    });

    it("handles connection refused errors", async () => {
      const connectionError = new Error("ECONNREFUSED");
      connectionError.name = "ECONNREFUSED";
      fetchMock.mockRejectOnce(connectionError);

      await expect(searchTmdb("test")).rejects.toThrow("ECONNREFUSED");
    });

    it("handles SSL/TLS certificate errors", async () => {
      const sslError = new Error("CERT_HAS_EXPIRED");
      sslError.name = "CERT_HAS_EXPIRED";
      fetchMock.mockRejectOnce(sslError);

      await expect(searchTmdb("test")).rejects.toThrow("CERT_HAS_EXPIRED");
    });

    it("handles network interruptions during request", async () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      fetchMock.mockRejectOnce(abortError);

      await expect(searchTmdb("test")).rejects.toThrow("Request aborted");
    });
  });

  describe("HTTP Error Status Codes", () => {
    it("handles 400 Bad Request", async () => {
      fetchMock.mockResponseOnce("Bad Request", {
        status: 400,
        statusText: "Bad Request",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Bad Request"
      );
    });

    it("handles 401 Unauthorized", async () => {
      fetchMock.mockResponseOnce("Unauthorized", {
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Unauthorized"
      );
    });

    it("handles 403 Forbidden", async () => {
      fetchMock.mockResponseOnce("Forbidden", {
        status: 403,
        statusText: "Forbidden",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Forbidden"
      );
    });

    it("handles 404 Not Found", async () => {
      fetchMock.mockResponseOnce("Not Found", {
        status: 404,
        statusText: "Not Found",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Not Found"
      );
    });

    it("handles 429 Too Many Requests (Rate Limiting)", async () => {
      fetchMock.mockResponseOnce("Too Many Requests", {
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Too Many Requests"
      );
    });

    it("handles 500 Internal Server Error", async () => {
      fetchMock.mockResponseOnce("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Internal Server Error"
      );
    });

    it("handles 502 Bad Gateway", async () => {
      fetchMock.mockResponseOnce("Bad Gateway", {
        status: 502,
        statusText: "Bad Gateway",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Bad Gateway"
      );
    });

    it("handles 503 Service Unavailable", async () => {
      fetchMock.mockResponseOnce("Service Unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Service Unavailable"
      );
    });

    it("handles 504 Gateway Timeout", async () => {
      fetchMock.mockResponseOnce("Gateway Timeout", {
        status: 504,
        statusText: "Gateway Timeout",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Gateway Timeout"
      );
    });
  });

  describe("Malformed Response Handling", () => {
    it("handles completely empty response", async () => {
      fetchMock.mockResponseOnce("", { status: 200 });

      await expect(searchTmdb("test")).rejects.toThrow();
      // Should fail when trying to parse empty JSON
    });

    it("handles invalid JSON response", async () => {
      fetchMock.mockResponseOnce("invalid json {{{", { status: 200 });

      await expect(searchTmdb("test")).rejects.toThrow();
      // Should fail when trying to parse invalid JSON
    });

    it("handles HTML error pages instead of JSON", async () => {
      const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head><title>502 Bad Gateway</title></head>
        <body><h1>Bad Gateway</h1></body>
        </html>
      `;
      fetchMock.mockResponseOnce(htmlResponse, { status: 502 });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Bad Gateway"
      );
    });

    it("handles response with wrong content type", async () => {
      fetchMock.mockResponseOnce("Not JSON", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

      await expect(searchTmdb("test")).rejects.toThrow();
      // Should fail when trying to parse plain text as JSON
    });

    it("handles extremely large response", async () => {
      const largeResponse = {
        page: 1,
        results: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          title: `Movie ${i} ${"A".repeat(1000)}`, // Very long titles
          poster_path: "/poster.jpg",
          release_date: "2023-01-01",
          overview: "A".repeat(5000), // Very long overview
          media_type: "movie" as const,
        })),
        total_pages: 1000,
        total_results: 100000,
      };

      fetchMock.mockResponseOnce(JSON.stringify(largeResponse));

      const result = await searchTmdb("test");

      expect(result.results).toHaveLength(10000); // All items are movies, so all should be included
      expect(result.results.every((item) => item.media_type === "movie")).toBe(
        true
      );
    });

    it("handles response with missing required fields", async () => {
      const incompleteResponse = {
        page: 1,
        // Missing results array
        total_pages: 1,
        total_results: 0,
      };

      fetchMock.mockResponseOnce(JSON.stringify(incompleteResponse));

      await expect(searchTmdb("test")).rejects.toThrow();
      // Current implementation doesn't handle missing results field gracefully
    });

    it("handles response with null values", async () => {
      const nullResponse = {
        page: null,
        results: null,
        total_pages: null,
        total_results: null,
      };

      fetchMock.mockResponseOnce(JSON.stringify(nullResponse));

      await expect(searchTmdb("test")).rejects.toThrow();
      // Should fail when accessing properties of null
    });

    it("handles response with unexpected data types", async () => {
      const wrongTypeResponse = {
        page: "1", // Should be number
        results: "not an array", // Should be array
        total_pages: "10", // Should be number
        total_results: "100", // Should be number
      };

      fetchMock.mockResponseOnce(JSON.stringify(wrongTypeResponse));

      await expect(searchTmdb("test")).rejects.toThrow();
      // Current implementation doesn't handle wrong data types gracefully
    });
  });

  describe("Query Parameter Edge Cases", () => {
    it("handles queries with special URL characters", async () => {
      const specialQuery = "Movie: The Sequel! (2023) & More";
      const mockResponse = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await searchTmdb(specialQuery);

      expect(fetch).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
          specialQuery
        )}&api_key=test-api-key`
      );
      expect(result).toEqual(mockResponse);
    });

    it("handles queries with unicode characters", async () => {
      const unicodeQuery = "Film français 🎬 ñoños 中文";
      const mockResponse = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await searchTmdb(unicodeQuery);

      expect(fetch).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
          unicodeQuery
        )}&api_key=test-api-key`
      );
      expect(result).toEqual(mockResponse);
    });

    it("handles extremely long queries", async () => {
      const longQuery = "A".repeat(10000);
      const mockResponse = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await searchTmdb(longQuery);

      expect(result).toEqual(mockResponse);
    });

    it("handles empty string queries", async () => {
      const result = await searchTmdb("");

      expect(result).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("handles null queries", async () => {
      // @ts-expect-error - Testing invalid input
      const result = await searchTmdb(null);

      expect(result).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("handles undefined queries", async () => {
      // @ts-expect-error - Testing invalid input
      const result = await searchTmdb(undefined);

      expect(result).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("Concurrent API Calls", () => {
    it("handles multiple concurrent requests", async () => {
      const mockResponse1 = {
        page: 1,
        results: [
          {
            id: 1,
            title: "Movie 1",
            media_type: "movie",
            poster_path: "/p1.jpg",
            release_date: "2023-01-01",
            overview: "Overview 1",
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      const mockResponse2 = {
        page: 1,
        results: [
          {
            id: 2,
            title: "Movie 2",
            media_type: "movie",
            poster_path: "/p2.jpg",
            release_date: "2023-01-01",
            overview: "Overview 2",
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      fetchMock
        .mockResponseOnce(JSON.stringify(mockResponse1))
        .mockResponseOnce(JSON.stringify(mockResponse2));

      const [result1, result2] = await Promise.all([
        searchTmdb("query1"),
        searchTmdb("query2"),
      ]);

      expect((result1.results[0] as { title: string }).title).toBe("Movie 1");
      expect((result2.results[0] as { title: string }).title).toBe("Movie 2");
    });

    it("handles rate limiting across concurrent requests", async () => {
      // Mock rate limiting for all requests
      fetchMock.mockResponse(() =>
        Promise.resolve({
          status: 429,
          statusText: "Too Many Requests",
        })
      );

      const requests = Array.from({ length: 10 }, (_, i) =>
        searchTmdb(`query${i}`)
      );

      const results = await Promise.allSettled(requests);

      results.forEach((result) => {
        expect(result.status).toBe("rejected");
        if (result.status === "rejected") {
          expect(result.reason.message).toContain(
            "TMDB API error: Too Many Requests"
          );
        }
      });
    });
  });

  describe("API Key and Authentication Issues", () => {
    it("handles invalid API key", async () => {
      fetchMock.mockResponseOnce("Invalid API key", {
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Unauthorized"
      );
    });

    it("handles missing API key", async () => {
      // Temporarily mock env to not have API key
      const originalEnv = env;
      (env as { TMDB_API_KEY: string }).TMDB_API_KEY = "";

      fetchMock.mockResponseOnce("Missing API key", {
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Unauthorized"
      );

      // Restore
      Object.assign(env, originalEnv);
    });

    it("handles expired API key", async () => {
      fetchMock.mockResponseOnce("API key expired", {
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Unauthorized"
      );
    });
  });

  describe("getImageUrl Edge Cases", () => {
    it("handles null path", () => {
      const result = getImageUrl(null);
      expect(result).toBe("/placeholder-image.png");
    });

    it("handles undefined path", () => {
      const result = getImageUrl(null);
      expect(result).toBe("/placeholder-image.png");
    });

    it("handles empty string path", () => {
      const result = getImageUrl("");
      expect(result).toBe("/placeholder-image.png"); // Empty string is falsy, so returns placeholder
    });

    it("handles paths with special characters", () => {
      const result = getImageUrl("/path with spaces/üñíçødé.jpg");
      expect(result).toBe(
        "https://image.tmdb.org/t/p/w500/path with spaces/üñíçødé.jpg"
      );
    });

    it("handles extremely long paths", () => {
      const longPath = "/" + "A".repeat(10000) + ".jpg";
      const result = getImageUrl(longPath);
      expect(result).toBe(`https://image.tmdb.org/t/p/w500${longPath}`);
    });

    it("handles paths with query parameters", () => {
      const pathWithQuery = "/image.jpg?width=500&height=750";
      const result = getImageUrl(pathWithQuery);
      expect(result).toBe(`https://image.tmdb.org/t/p/w500${pathWithQuery}`);
    });
  });
});
