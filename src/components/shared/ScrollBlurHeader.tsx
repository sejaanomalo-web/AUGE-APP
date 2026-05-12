"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ScrollBlurHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-200",
        scrolled
          ? "glass-subtle border-b border-border-subtle"
          : "bg-transparent border-b border-transparent",
        className,
      )}
    >
      {children}
    </header>
  );
}
