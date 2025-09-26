import { searchTmdb, getImageUrl } from "@/lib/tmdb";

// Mock the env module
jest.mock("@/lib/env", () => ({
  env: {
    TMDB_API_KEY: "test-api-key",
  },
}));

describe("TMDB utilities", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe("searchTmdb", () => {
    it("returns empty result when query is empty", async () => {
      const result = await searchTmdb("");

      expect(result).toEqual({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("fetches and returns filtered TMDB search results", async () => {
      const mockResponse = {
        page: 1,
        results: [
          {
            id: 1,
            title: "Test Movie",
            poster_path: "/movie-poster.jpg",
            release_date: "2023-01-01",
            overview: "A test movie",
            media_type: "movie",
          },
          {
            id: 2,
            name: "Test TV Show",
            poster_path: "/tv-poster.jpg",
            first_air_date: "2023-01-01",
            overview: "A test TV show",
            media_type: "tv",
          },
          {
            id: 3,
            title: "Test Person",
            poster_path: "/person-poster.jpg",
            media_type: "person",
          },
        ],
        total_pages: 1,
        total_results: 2,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await searchTmdb("test query");

      expect(fetch).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/search/multi?query=test%20query&api_key=test-api-key"
      );
      expect(result).toEqual({
        ...mockResponse,
        results: [mockResponse.results[0], mockResponse.results[1]], // Filtered out person
      });
    });

    it("filters out non-movie and non-tv results", async () => {
      const mockResponse = {
        page: 1,
        results: [
          {
            id: 1,
            title: "Test Movie",
            poster_path: null,
            release_date: "2023-01-01",
            overview: "A test movie",
            media_type: "movie",
          },
          {
            id: 2,
            title: "Test Person",
            poster_path: null,
            media_type: "person",
          },
          {
            id: 3,
            name: "Test TV Show",
            poster_path: null,
            first_air_date: "2023-01-01",
            overview: "A test TV show",
            media_type: "tv",
          },
        ],
        total_pages: 1,
        total_results: 3,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await searchTmdb("test");

      expect(result.results).toHaveLength(2);
      expect(result.results[0].media_type).toBe("movie");
      expect(result.results[1].media_type).toBe("tv");
    });

    it("throws error on API failure", async () => {
      fetchMock.mockRejectOnce(new Error("Network error"));

      await expect(searchTmdb("test")).rejects.toThrow("Network error");
    });

    it("throws error on non-ok response", async () => {
      fetchMock.mockResponseOnce("", { status: 404, statusText: "Not Found" });

      await expect(searchTmdb("test")).rejects.toThrow(
        "TMDB API error: Not Found"
      );
    });
  });

  describe("getImageUrl", () => {
    it("returns full TMDB image URL when path is provided", () => {
      const result = getImageUrl("/test-path.jpg");
      expect(result).toBe("https://image.tmdb.org/t/p/w500/test-path.jpg");
    });

    it("returns placeholder image when path is null", () => {
      const result = getImageUrl(null);
      expect(result).toBe("/placeholder-image.png");
    });


    it("returns full URL for various path formats", () => {
      expect(getImageUrl("/path/with/slashes.jpg")).toBe(
        "https://image.tmdb.org/t/p/w500/path/with/slashes.jpg"
      );
      expect(getImageUrl("relative-path.png")).toBe(
        "https://image.tmdb.org/t/p/w500relative-path.png"
      );
    });
  });
});
