import { env } from "@/lib/env";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  media_type: "movie";
}

interface TmdbTvShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  media_type: "tv";
}

export type TmdbContent = TmdbMovie | TmdbTvShow;

interface TmdbSearchResponse {
  page: number;
  results: TmdbContent[];
  total_pages: number;
  total_results: number;
}

export const searchTmdb = async (
  query: string
): Promise<TmdbSearchResponse> => {
  if (!query) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  const response = await fetch(
    `${TMDB_API_BASE_URL}/search/multi?query=${encodeURIComponent(
      query
    )}&api_key=${env.TMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data: TmdbSearchResponse = await response.json();
  return {
    ...data,
    results: data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    ),
  };
};

export const getImageUrl = (path: string | null) => {
  if (!path) {
    return "/placeholder-image.png"; // Provide a placeholder image
  }
  return `${TMDB_IMAGE_BASE_URL}${path}`;
};
