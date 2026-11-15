"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

// Tab order — used to determine slide direction
const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/write": 1,
  "/insights": 2,
  "/profile": 3,
};

function getTabIndex(pathname: string): number {
  // Exact match first
  if (TAB_ORDER[pathname] !== undefined) return TAB_ORDER[pathname];
  // Prefix match (e.g. /insight, /write?mood=...)
  const base = "/" + pathname.split("/")[1];
  return TAB_ORDER[base] ?? 1;
}

interface Props {
  children: React.ReactNode;
}

export default function PageTransitionWrapper({ children }: Props) {
  const pathname = usePathname();
  const prevIndexRef = useRef(getTabIndex(pathname));
  const currentIndex = getTabIndex(pathname);
  const direction = currentIndex >= prevIndexRef.current ? 1 : -1;
  prevIndexRef.current = currentIndex;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction * 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction * -40, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
