"use client";

import ScreenHeader from "@/components/ui/ScreenHeader";
import InsightPanel from "@/components/insight/InsightPanel";

interface Props {
  entryId: string;
  entryText?: string;
  mood?: string;
  contexts?: string[];
  onBack: () => void;
}

/** Shown right after "Reflect" — generates the AI feedback immediately */
export default function InsightView({ entryId, entryText, mood, contexts, onBack }: Props) {
  const subtitle = [mood && mood !== "NotSure" ? mood : null, ...(contexts ?? []).map((c) => `#${c}`)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-10 safe-top">
      <ScreenHeader title="Reflection" onBack={onBack} />

      <main className="flex-1 px-5 pt-2 space-y-5">
        <div>
          <h2 className="text-[28px] font-semibold text-gray-900 leading-tight mb-1">Review Your Thoughts</h2>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>

        <InsightPanel
          entryId={entryId}
          entryText={entryText}
          mood={mood}
          contexts={contexts}
          onWriteNewPerspective={onBack}
        />
      </main>
    </div>
  );
}
