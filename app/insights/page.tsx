"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import InsightsView from "@/components/views/InsightsView";

// Legacy direct route — the SPA shell (app/page.tsx) renders the same view in the "Insights" tab
export default function InsightsPage() {
  const router = useRouter();
  return (
    <>
      <InsightsView onOpenEntry={(id) => router.push(`/insight?entryId=${encodeURIComponent(id)}`)} />
      <BottomNav />
    </>
  );
}
