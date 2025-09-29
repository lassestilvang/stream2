"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TmdbContent, getImageUrl } from "@/lib/tmdb";
import Image from "next/image";
import { useMovieAppStore } from "@/state/store";
import { PlusIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { searchResults, setSearchResults, addWatchlistItem, addWatchlistLoading, addWatchlistError } =
    useMovieAppStore();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error("Error searching TMDB:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (item: TmdbContent) => {
    try {
      await addWatchlistItem({
        tmdbId: item.id,
        title: "title" in item ? item.title : item.name,
        posterPath: item.poster_path,
        mediaType: item.media_type,
      });
    } catch (error) {
      // Error is handled by the store and displayed via toast below
    }
  };

  useEffect(() => {
    if (addWatchlistError) {
      toast.error(`Failed to add to watchlist: ${addWatchlistError}`);
    }
  }, [addWatchlistError]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search for movies or TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 flex flex-col">
            <Image
              src={getImageUrl(item.poster_path)}
              alt={"title" in item ? item.title : item.name}
              width={200}
              height={300}
              className="rounded-md mb-2 object-cover"
            />
            <h3 className="font-bold text-lg">
              {"title" in item ? item.title : item.name}
            </h3>
            <p className="text-sm text-gray-500">
              {item.media_type === "movie" ? "Movie" : "TV Show"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto"
              onClick={() => handleAddToWatchlist(item)}
              disabled={addWatchlistLoading}
            >
              {addWatchlistLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4 mr-2" />
              )}
              {addWatchlistLoading ? "Adding..." : "Add to Watchlist"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}