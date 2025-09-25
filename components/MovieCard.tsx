import Image from "next/image";
import { getImageUrl, TmdbContent } from "@/lib/tmdb";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, EyeIcon } from "lucide-react";

interface MovieCardProps {
  item: TmdbContent;
  onAddToWatchlist?: (item: TmdbContent) => void;
  onMarkAsWatched?: (item: TmdbContent) => void;
}

export function MovieCard({ item, onAddToWatchlist, onMarkAsWatched }: MovieCardProps) {
  const title = "title" in item ? item.title : item.name;
  const mediaType = item.media_type === "movie" ? "Movie" : "TV Show";

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        <Image
          src={getImageUrl(item.poster_path)}
          alt={title}
          width={200}
          height={300}
          className="rounded-t-lg object-cover w-full"
        />
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-bold line-clamp-2">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{mediaType}</p>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        {onAddToWatchlist && (
          <Button variant="outline" size="sm" onClick={() => onAddToWatchlist(item)}>
            <PlusIcon className="h-4 w-4 mr-2" /> Watchlist
          </Button>
        )}
        {onMarkAsWatched && (
          <Button size="sm" onClick={() => onMarkAsWatched(item)}>
            <EyeIcon className="h-4 w-4 mr-2" /> Watched
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
