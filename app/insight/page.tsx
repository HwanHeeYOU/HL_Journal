"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EntryDetailView from "@/components/views/EntryDetailView";

/**
 * /insight?entryId=xxx — direct link to an entry (entry first, AI insight below).
 * In-app, entries open as an overlay instead; this route is the deep-link fallback.
 */
function EntryPageContent() {
  const router = useRouter();
  const entryId = useSearchParams().get("entryId");

  // Go back to wherever the user came from. If this page was opened directly
  // (no in-app history), fall back to the app — it restores the last tab.
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  if (!entryId) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm text-gray-500">No entry selected.</p>
        <button onClick={() => router.push("/")} className="text-sm text-green-deep underline">
          Back to the app
        </button>
      </div>
    );
  }

  return <EntryDetailView entryId={entryId} onBack={goBack} />;
}

export default function EntryPage() {
  return (
    <Suspense>
      <EntryPageContent />
    </Suspense>
  );
}
