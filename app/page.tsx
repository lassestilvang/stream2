import { SearchBar } from "@/components/SearchBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/register");
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Movie/TV Tracker</h1>
      <SearchBar />
      {/* Display search results here */}
    </main>
  );
}
