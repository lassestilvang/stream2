import { useMovieAppStore } from "@/state/store";

export function useWatched() {
  const { watched, addWatched, updateWatched, deleteWatched } = useMovieAppStore();

  return {
    watched,
    addWatched,
    updateWatched,
    deleteWatched,
  };
}
