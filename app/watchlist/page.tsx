"use client";

import { useEffect } from "react";
import { useMovieAppStore, WatchlistItem } from "@/state/store";
import { WatchlistCard } from "@/components/WatchlistCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WatchlistPage() {
  const { watchlist, fetchWatchlist, removeWatchlistItem, addWatched, watchlistLoading, watchlistError, removeWatchlistError } = useMovieAppStore();
  const router = useRouter();

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    if (watchlistError) {
      toast.error(`Failed to load watchlist: ${watchlistError}`);
    }
  }, [watchlistError]);

  useEffect(() => {
    if (removeWatchlistError) {
      toast.error(`Failed to remove from watchlist: ${removeWatchlistError}`);
    }
  }, [removeWatchlistError]);

  const handleRemove = async (id: number) => {
    if (confirm("Are you sure you want to remove this item from your watchlist?")) {
      try {
        await removeWatchlistItem(id);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleMarkAsWatched = async (item: WatchlistItem) => {
    try {
      addWatched({
        id: Date.now(),
        tmdbId: item.tmdbId,
        title: item.title,
        posterPath: item.posterPath,
        mediaType: item.mediaType,
        watchedAt: new Date(),
      });
      await removeWatchlistItem(item.id);
      router.push("/watched");
    } catch (error) {
      // Error handled by store
    }
  };

  if (watchlistLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
        <p>Loading watchlist...</p>
      </div>
    );
  }

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