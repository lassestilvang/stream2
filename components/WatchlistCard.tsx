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
import { EyeIcon, XIcon } from "lucide-react";
import { WatchlistItem } from "@/state/store";

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
  const mediaType = item.mediaType === "movie" ? "Movie" : "TV Show";

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
            onClick={() => {
              try {
                onMarkAsWatched(item);
              } catch (error) {
                console.error("Error marking as watched:", error);
              }
            }}
          >
            <EyeIcon className="h-4 w-4 mr-2" /> Watched
          </Button>
        )}
        {onRemoveFromWatchlist && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              try {
                onRemoveFromWatchlist(item.id);
              } catch (error) {
                console.error("Error removing from watchlist:", error);
              }
            }}
          >
            <XIcon className="h-4 w-4 mr-2" /> Remove
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
