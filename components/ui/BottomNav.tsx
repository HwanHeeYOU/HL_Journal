"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/write",
    label: "Journal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" strokeLinecap="round" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 18l5-5 4 4 4-4 5 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12l5-5 4 4 4-4 5-3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "You",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4" strokeLinecap="round" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-cream border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around px-4 pt-2 pb-3">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive ? "text-green-deep" : "text-gray-400"
              )}
            >
              {icon}
              <span>{label}</span>
              {isActive && (
                <span className="w-5 h-0.5 rounded-full bg-green-deep mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
