"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Lang } from "./content";

/** iPhone-style frame around a real recording of the Scanything app. */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone__screen">
        <div className="phone__status" aria-hidden>
          <span>9:41</span>
          <span className="phone__bars">
            <i style={{ height: 4 }} />
            <i style={{ height: 6 }} />
            <i style={{ height: 8 }} />
            <i style={{ height: 10 }} />
          </span>
        </div>
        {children}
        <span className="phone__island" aria-hidden />
      </div>
    </div>
  );
}

export type Clip = "today" | "scan" | "skin" | "meal" | "plan" | "progress";

/**
 * Plays a screen recording of app.scanything.online (captured from the real app with demo data).
 * Videos load and play only while on screen, and restart from the beginning each time they appear.
 */
export function AppClip({ clip, lang, eager = false, still = false, label }: { clip: Clip; lang: Lang; eager?: boolean; still?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const base = `/sites/scanything/media/${lang}/${clip}`;

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          v.currentTime = 0;
          v.play().catch(() => undefined);
        } else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [clip, lang, still]);

  if (still) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`${base}-end.jpg`} alt={label} className="phone__media" loading="lazy" />;
  }
  return (
    <video
      key={`${lang}-${clip}`}
      ref={ref}
      className="phone__media"
      poster={`${base}.jpg`}
      muted
      loop
      playsInline
      autoPlay={eager}
      preload={eager ? "auto" : "none"}
      aria-label={label}
    >
      <source src={`${base}.webm`} type="video/webm" />
      <source src={`${base}.mp4`} type="video/mp4" />
    </video>
  );
}
