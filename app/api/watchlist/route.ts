import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/watchlist - Fetch all watchlist items for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const watchlistItems = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, session.user.id));

    return NextResponse.json(watchlistItems);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/watchlist - Add a new item to the watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tmdbId, title, posterPath, mediaType } = await request.json();

    if (!tmdbId || !title || !mediaType) {
      return NextResponse.json(
        { error: "tmdbId, title, and mediaType are required" },
        { status: 400 }
      );
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return NextResponse.json(
        { error: "mediaType must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const existingItem = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.tmdbId, tmdbId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      return NextResponse.json(
        { error: "Item already exists in watchlist" },
        { status: 409 }
      );
    }

    const newItem = await db
      .insert(watchlist)
      .values({
        userId: session.user.id,
        tmdbId,
        title,
        posterPath: posterPath || null,
        mediaType,
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist - Remove an item from the watchlist by ID
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      );
    }

    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "Invalid id parameter" },
        { status: 400 }
      );
    }

    // Check if the item exists and belongs to the user
    const existingItem = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.id, itemId),
          eq(watchlist.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: "Watchlist item not found" },
        { status: 404 }
      );
    }

    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.id, itemId),
          eq(watchlist.userId, session.user.id)
        )
      );

    return NextResponse.json({ message: "Item removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}