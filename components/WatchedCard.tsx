import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditIcon, TrashIcon } from "lucide-react";
import { WatchedItem } from "@/state/store";
import { format } from "date-fns";

interface WatchedCardProps {
  item: WatchedItem;
  onEdit?: (item: WatchedItem) => void;
  onDelete?: (id: number) => void;
}

export function WatchedCard({ item, onEdit, onDelete }: WatchedCardProps) {
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
        <CardTitle className="text-lg font-bold line-clamp-2">{item.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{mediaType}</p>
        {item.rating && <p className="text-sm">Rating: {item.rating}/10</p>}
        {item.notes && <p className="text-sm line-clamp-2">Notes: {item.notes}</p>}
        <p className="text-xs text-muted-foreground">Watched: {format(item.watchedAt, "PPP")}</p>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            <EditIcon className="h-4 w-4 mr-2" /> Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
            <TrashIcon className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
