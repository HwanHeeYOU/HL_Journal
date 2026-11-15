"use client";

import { Children, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  /** Active panel index — the single source of truth (shared with the tab bar) */
  index: number;
  onIndexChange: (index: number) => void;
  /** Turn gestures off, e.g. while an overlay screen is open */
  disabled?: boolean;
  children: React.ReactNode;
}

// A swipe commits if it travels this share of the width, or is flicked fast enough
const DISTANCE_RATIO = 0.08;
const VELOCITY = 200; // px/s
const NO_SWIPE = "textarea, input, select, [contenteditable='true'], [data-no-swipe]";
const SPRING = { type: "spring" as const, stiffness: 360, damping: 38, mass: 0.9 };

/**
 * Native-app style horizontal pager.
 * All panels stay mounted (state + scroll position survive), each panel scrolls
 * vertically on its own, and horizontal drags move the track.
 */
export default function SwipeTabs({ index, onIndexChange, disabled = false, children }: Props) {
  const panels = Children.toArray(children);
  const count = panels.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggedRef = useRef(false);

  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  const indexRef = useRef(index);
  indexRef.current = index;

  // Measure the viewport width; snap (no animation) on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setWidth(w);
      x.jump(-indexRef.current * w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [x]);

  // Slide to the active panel whenever it changes (tab tap or swipe)
  useEffect(() => {
    if (!width) return;
    const controls = animate(x, -index * width, reduceMotion ? { duration: 0 } : SPRING);
    return () => controls.stop();
  }, [index, width, x, reduceMotion]);

  // Keep focus / screen readers on the visible panel only
  useEffect(() => {
    panelRefs.current.forEach((el, i) => {
      if (!el) return;
      el.inert = i !== index;
      el.setAttribute("aria-hidden", String(i !== index));
    });
  }, [index, count]);

  function handlePointerDown(e: React.PointerEvent) {
    draggedRef.current = false;
    // textarea나 input 영역을 누른 경우 드래그 이벤트가 시작되지 않도록 차단
    if ((e.target as HTMLElement).closest(NO_SWIPE)) {
      e.stopPropagation();
    }
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    const { offset, velocity } = info;

    const fast = Math.abs(velocity.x) > VELOCITY;
    const far = Math.abs(offset.x) > width * DISTANCE_RATIO;
    const direction = fast ? -Math.sign(velocity.x) : far ? -Math.sign(offset.x) : 0;
    const next = Math.min(count - 1, Math.max(0, index + direction));

    if (next !== index) onIndexChange(next);
    else animate(x, -index * width, reduceMotion ? { duration: 0 } : SPRING); // spring back
  }

  return (
    <div ref={containerRef} className="relative w-full h-dvh overflow-hidden">
      <motion.div
        className={cn("flex h-full", dragging && "select-none cursor-grabbing")}
        style={{ x, width: `${count * 100}%`, touchAction: "pan-y" }}
        drag={disabled ? false : "x"}
        dragListener={true}
        dragDirectionLock
        dragMomentum={false}
        dragElastic={0.08}
        dragSnapToOrigin={false}
        dragTransition={{ power: 0.2, timeConstant: 200 }}
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        onPointerDown={handlePointerDown}
        onDragStart={() => {
          draggedRef.current = true;
          setDragging(true);
        }}
        onDragEnd={handleDragEnd}
        // A drag that ends over a button/link must not also "click" it
        onClickCapture={(e) => {
          if (draggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            draggedRef.current = false;
          }
        }}
      >
        {panels.map((panel, i) => (
          <section
            key={i}
            ref={(el) => { panelRefs.current[i] = el; }}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain"
            style={{ width: `${100 / count}%` }}
            // Stop the browser's native link/image drag from hijacking a mouse swipe
            onDragStart={(e) => e.preventDefault()}
          >
            {panel}
          </section>
        ))}
      </motion.div>
    </div>
  );
}