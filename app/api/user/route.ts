import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/user — get or create a user by id
// Used for dev: stores userId in localStorage, sent on every request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (userId) {
      // Return existing user or create if not found (e.g. DB was reset)
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
      });
      return NextResponse.json(user);
    }

    // No userId yet — create a fresh user
    const user = await prisma.user.create({ data: {} });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/user]", error);
    return NextResponse.json({ error: "Failed to get/create user" }, { status: 500 });
  }
}

// DELETE /api/user — "Clear All Data" in the You tab.
// Deletes the user row; entries and AI insights cascade (onDelete: Cascade).
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : null;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await prisma.user.deleteMany({ where: { id: userId } }); // no-op if already gone
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/user]", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
