"use client";

import { useEffect } from "react";
import { useMovieAppStore, WatchlistItem } from "@/state/store";
import { WatchlistCard } from "@/components/WatchlistCard";
import { useRouter } from "next/navigation";

export default function WatchlistPage() {
  const { watchlist, fetchWatchlist, removeWatchlistItem, addWatched } = useMovieAppStore();
  const router = useRouter();

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemove = (id: number) => {
    if (confirm("Are you sure you want to remove this item from your watchlist?")) {
      removeWatchlistItem(id);
      // TODO: Call API to remove from DB
    }
  };

  const handleMarkAsWatched = (item: WatchlistItem) => {
    addWatched({
      id: Date.now(), // Temporary ID, will be replaced by DB ID
      tmdbId: item.tmdbId,
      title: item.title,
      posterPath: item.posterPath,
      mediaType: item.mediaType,
      watchedAt: new Date(),
    });
    removeWatchlistItem(item.id);
    // TODO: Call API to add to watched and remove from watchlist
    router.push("/watched");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
      {watchlist.length === 0 ? (
        <p>Your watchlist is empty. Search for movies or TV shows to add them!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {watchlist.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemoveFromWatchlist={handleRemove}
              onMarkAsWatched={handleMarkAsWatched}
            />
          ))}
        </div>
      )}
    </div>
  );
}
