"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMovieAppStore } from "@/state/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EditWatchedPage() {
  const params = useParams();
  const router = useRouter();
  const { watched, updateWatched } = useMovieAppStore();
  const watchedId = Number(params.id);
  const item = watched.find((w) => w.id === watchedId);

  const [title, setTitle] = useState(item?.title || "");
  const [rating, setRating] = useState(item?.rating?.toString() || "");
  const [notes, setNotes] = useState(item?.notes || "");
  const [watchedAt, setWatchedAt] = useState<Date | undefined>(item?.watchedAt);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setRating(item.rating?.toString() || "");
      setNotes(item.notes || "");
      setWatchedAt(item.watchedAt);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateWatched(item.id, {
        title,
        rating: rating ? Number(rating) : undefined,
        notes,
        watchedAt,
      });
      // TODO: Call API to update in DB
      router.push("/watched");
    }
  };

  if (!item) {
    return <div className="container mx-auto p-4">Item not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Watched Item: {item.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="rating">Rating (1-10)</Label>
          <Input
            id="rating"
            type="number"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
        </div>
        <div>
          <Label htmlFor="watchedAt">Watched At</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !watchedAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchedAt ? format(watchedAt, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={watchedAt}
                onSelect={setWatchedAt}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button type="submit">Save Changes</Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2">
          Cancel
        </Button>
      </form>
    </div>
  );
}
