import { GET } from "@/app/api/tmdb/search";
import { NextRequest } from "next/server";
import { TmdbSearchResponse } from "@/lib/tmdb";

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

import { searchTmdb } from "@/lib/tmdb";

const mockSearchTmdb = searchTmdb as jest.MockedFunction<typeof searchTmdb>;

// Mock NextRequest
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

describe("GET /api/tmdb/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful search", () => {
    it("should return TMDB search results for valid query", async () => {
      const mockResults = {
        page: 1,
        results: [
          {
            id: 123,
            title: "Test Movie",
            poster_path: "/test-poster.jpg",
            release_date: "2023-01-01",
            overview: "A test movie",
            media_type: "movie" as const,
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url = "http://localhost:3000/api/tmdb/search?query=test%20movie";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(mockSearchTmdb).toHaveBeenCalledWith("test movie");
      expect(mockSearchTmdb).toHaveBeenCalledTimes(1);
    });

    it("should handle empty search results", async () => {
      const mockResults = {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url =
        "http://localhost:3000/api/tmdb/search?query=nonexistent%20movie";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(mockSearchTmdb).toHaveBeenCalledWith("nonexistent movie");
    });
  });

  describe("query validation", () => {
    it("should return 400 when query parameter is missing", async () => {
      const url = "http://localhost:3000/api/tmdb/search";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Query parameter is required");
      expect(mockSearchTmdb).not.toHaveBeenCalled();
    });

    it("should return 400 when query parameter is empty", async () => {
      const url = "http://localhost:3000/api/tmdb/search?query=";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Query parameter is required");
      expect(mockSearchTmdb).not.toHaveBeenCalled();
    });

    it("should handle query with special characters", async () => {
      const mockResults = {
        page: 1,
        results: [
          {
            id: 456,
            title: "Movie: The Sequel!",
            poster_path: "/special-poster.jpg",
            release_date: "2023-02-01",
            overview: "A sequel movie",
            media_type: "movie" as const,
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      mockSearchTmdb.mockResolvedValue(mockResults);

      const url =
        "http://localhost:3000/api/tmdb/search?query=Movie%3A%20The%20Sequel%21";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(mockSearchTmdb).toHaveBeenCalledWith("Movie: The Sequel!");
    });
  });

  describe("API response handling", () => {
    it("should return 500 when TMDB API fails", async () => {
      mockSearchTmdb.mockRejectedValue(new Error("TMDB API error"));

      const url = "http://localhost:3000/api/tmdb/search?query=test%20movie";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch from TMDB");
      expect(mockSearchTmdb).toHaveBeenCalledWith("test movie");
    });

    it("should handle network timeout", async () => {
      mockSearchTmdb.mockRejectedValue(new Error("Network timeout"));

      const url = "http://localhost:3000/api/tmdb/search?query=test%20movie";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch from TMDB");
    });

    it("should handle malformed TMDB response", async () => {
      mockSearchTmdb.mockResolvedValue(null as unknown as TmdbSearchResponse);

      const url = "http://localhost:3000/api/tmdb/search?query=test%20movie";

      const request = createMockNextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeNull();
    });
  });
});
