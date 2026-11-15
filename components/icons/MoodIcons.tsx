/**
 * MoodIcons.tsx
 * SVG recreation of the hand-drawn emotion icons from the Figma design.
 * Using SVG avoids background-removal issues and supports inline gradient animation.
 * Stroke color is inherited via `currentColor` so parent can control it.
 */

interface IconProps {
  className?: string;
  strokeColor?: string;
}

const STROKE = "#3D6B35"; // green-deep tone matching Figma icons
const SW = 2.2;           // stroke-width

// ─── Anxious (furrowed brows, frown) ─────────────────────────────────────────
export function IconAnxious({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left brow — angled down inward */}
      <path d="M28 34 L40 39" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* right brow — angled down inward */}
      <path d="M60 39 L72 34" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* left eye dot */}
      <circle cx="36" cy="48" r="2.5" fill={STROKE} />
      {/* right eye dot */}
      <circle cx="64" cy="48" r="2.5" fill={STROKE} />
      {/* frown */}
      <path d="M34 67 Q50 57 66 67" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Overwhelmed (X eyes, flat mouth) ────────────────────────────────────────
export function IconOverwhelmed({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left X eye */}
      <path d="M29 39 L39 49M39 39 L29 49" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* right X eye */}
      <path d="M61 39 L71 49M71 39 L61 49" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* flat mouth */}
      <path d="M35 65 L65 65" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </svg>
  );
}

// ─── Calm (closed curved eyes, gentle smile) ─────────────────────────────────
export function IconCalm({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left closed eye — curved downward arc */}
      <path d="M28 46 Q36 40 44 46" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* right closed eye */}
      <path d="M56 46 Q64 40 72 46" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* gentle smile */}
      <path d="M34 63 Q50 75 66 63" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Sad (dot eyes, deep frown) ───────────────────────────────────────────────
export function IconSad({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left eye dot */}
      <circle cx="36" cy="46" r="3" fill={STROKE} />
      {/* right eye dot */}
      <circle cx="64" cy="46" r="3" fill={STROKE} />
      {/* deep frown */}
      <path d="M32 68 Q50 55 68 68" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Energetic (big open grin, teeth lines) ───────────────────────────────────
export function IconEnergetic({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left eye — vertical line */}
      <path d="M36 38 L36 48" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* right eye — vertical line */}
      <path d="M64 38 L64 48" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* big open mouth — D shape */}
      <path d="M32 60 Q50 80 68 60" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      <path d="M32 60 L68 60" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* teeth dividers */}
      <path d="M44 60 L44 70" stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" opacity="0.6" />
      <path d="M56 60 L56 70" stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// ─── Hopeful (smiling eyes with curve, warm smile) ────────────────────────────
export function IconHopeful({ className = "w-14 h-14" }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={STROKE} strokeWidth={SW} />
      {/* left smiling eye — arc curving upward */}
      <path d="M28 48 Q36 42 44 48" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* right smiling eye */}
      <path d="M56 48 Q64 42 72 48" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
      {/* warm smile */}
      <path d="M32 63 Q50 77 68 63" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" fill="none" />
    </svg>
  );
}
