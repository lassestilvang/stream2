import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EyeIcon, XIcon, Loader2 } from "lucide-react";
import { WatchlistItem, useMovieAppStore } from "@/state/store";
import { useEffect } from "react";
import { toast } from "sonner";

interface WatchlistCardProps {
  item: WatchlistItem;
  onMarkAsWatched?: (item: WatchlistItem) => void;
  onRemoveFromWatchlist?: (id: number) => void;
}

export function WatchlistCard({
  item,
  onMarkAsWatched,
  onRemoveFromWatchlist,
}: WatchlistCardProps) {
  const { removeWatchlistItem, addWatched, removeWatchlistLoading, removeWatchlistError } = useMovieAppStore();
  const mediaType = item.mediaType === "movie" ? "Movie" : "TV Show";

  const handleRemove = async () => {
    if (onRemoveFromWatchlist) {
      onRemoveFromWatchlist(item.id);
    } else {
      try {
        await removeWatchlistItem(item.id);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleMarkAsWatched = async () => {
    if (onMarkAsWatched) {
      onMarkAsWatched(item);
    } else {
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
      } catch (error) {
        // Error handled by store
      }
    }
  };

  useEffect(() => {
    if (removeWatchlistError) {
      toast.error(`Failed to remove from watchlist: ${removeWatchlistError}`);
    }
  }, [removeWatchlistError]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        <Image
          src={getImageUrl(item.posterPath)}
          alt={item.title}
          width={200}
          height={300}
          className="rounded-t-lg object-cover w-full"
        />
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-bold line-clamp-2">
          {item.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{mediaType}</p>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        {onMarkAsWatched && (
          <Button
            size="sm"
            onClick={handleMarkAsWatched}
            disabled={removeWatchlistLoading}
          >
            <EyeIcon className="h-4 w-4 mr-2" /> Watched
          </Button>
        )}
        {onRemoveFromWatchlist && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={removeWatchlistLoading}
          >
            {removeWatchlistLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XIcon className="h-4 w-4 mr-2" />
            )}
            {removeWatchlistLoading ? "Removing..." : "Remove"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}