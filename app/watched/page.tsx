"use client";

import { useEffect } from "react";
import { useMovieAppStore, WatchedItem } from "@/state/store";
import { WatchedCard } from "@/components/WatchedCard";

export default function WatchedPage() {
  const { watched, fetchWatched, deleteWatched } = useMovieAppStore();

  useEffect(() => {
    fetchWatched();
  }, [fetchWatched]);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this watched item?")) {
      deleteWatched(id);
      // TODO: Call API to delete from DB
    }
  };

  const handleEdit = (item: WatchedItem) => {
    // TODO: Implement edit functionality, maybe open a dialog
    console.log("Edit item:", item);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Watched Content</h1>
      {watched.length === 0 ? (
        <p>No watched content yet. Start tracking your movies and TV shows!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {watched.map((item) => (
            <WatchedCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
