import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Mood } from "@prisma/client";

export interface InsightStats {
  dateRange: { from: string; to: string };
  totalCheckIns: number;
  emotionDistribution: { mood: Mood; count: number }[];
  recurringTags: { tag: string; count: number }[];
  reframingProgress: { completed: number; total: number };
  // For dot chart: each entry's date (day of month) and mood
  dotChartData: { day: number; date: string; mood: Mood }[];
  entries: {
    id: string;
    title: string;
    content: string;
    mood: Mood;
    tags: string[];
    status: string;
    createdAt: string;
    hasInsight: boolean;
  }[];
}

/**
 * GET /api/insights?userId=xxx&period=week|month&date=2026-11-04
 * Returns aggregated stats + entries for the given period or specific date.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") ?? "week"; // "week" | "month" | "all"
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD" for calendar picker

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let from: Date;
    let to: Date;

    if (dateParam) {
      // Calendar picker: show entries for that specific day
      from = new Date(dateParam);
      from.setHours(0, 0, 0, 0);
      to = new Date(dateParam);
      to.setHours(23, 59, 59, 999);
    } else {
      to = new Date();
      if (period === "all") {
        // Profile stats + data backup: every entry
        from = new Date(0);
      } else {
        from = new Date();
        from.setDate(from.getDate() - (period === "month" ? 30 : 7));
        from.setHours(0, 0, 0, 0);
      }
    }

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: to },
      },
      include: { insight: true },
      orderBy: { createdAt: "desc" },
    });

    // Emotion distribution
    const emotionMap = new Map<Mood, number>();
    for (const e of entries) {
      emotionMap.set(e.mood, (emotionMap.get(e.mood) ?? 0) + 1);
    }
    const emotionDistribution = Array.from(emotionMap.entries())
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);

    // Recurring tags
    const tagMap = new Map<string, number>();
    for (const e of entries) {
      for (const tag of e.tags) {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
      }
    }
    const recurringTags = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // Reframing progress
    const total = entries.length;
    const completed = entries.filter((e) => e.insight !== null).length;

    // Dot chart data
    const dotChartData = entries.map((e) => ({
      day: new Date(e.createdAt).getDate(),
      date: e.createdAt.toISOString().split("T")[0],
      mood: e.mood,
    }));

    const stats: InsightStats = {
      dateRange: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totalCheckIns: entries.length,
      emotionDistribution,
      recurringTags,
      reframingProgress: { completed, total },
      dotChartData,
      entries: entries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        mood: e.mood,
        tags: e.tags,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
        hasInsight: e.insight !== null,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[GET /api/insights]", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
