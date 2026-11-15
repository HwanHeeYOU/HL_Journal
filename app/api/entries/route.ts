import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskPII } from "@/lib/utils";
import { Mood } from "@prisma/client";

// GET /api/entries — fetch all entries (newest first)
export async function GET() {
  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: { insight: true },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("[GET /api/entries]", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// POST /api/entries — create a new journal entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, mood, tags, userId } = body as {
      title: string;
      content: string;
      mood: string;
      tags: string[];
      userId: string;
    };

    if (!title || !content || !mood || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // PII masking before storing
    const safeContent = maskPII(content);
    const safeTitle = maskPII(title);

    const entry = await prisma.journalEntry.create({
      data: {
        title: safeTitle,
        content: safeContent,
        mood: mood as Mood,
        tags: tags ?? [],
        userId,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[POST /api/entries]", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
