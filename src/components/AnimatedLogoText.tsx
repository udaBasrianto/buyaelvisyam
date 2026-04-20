import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedLogoTextProps {
  texts: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  delay?: number;
}

export function AnimatedLogoText({
  texts,
  className,
  speed = 100,
  deleteSpeed = 50,
  delay = 3000,
}: AnimatedLogoTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    let timer: NodeJS.Timeout;
    const currentFullText = texts[loopIndex % texts.length];

    if (isDeleting) {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setLoopIndex((prev) => prev + 1);
      }
    } else {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, speed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopIndex, texts, speed, deleteSpeed, delay]);

  if (!texts || texts.length === 0) {
    return null; // Return nothing if no texts provided
  }

  // Find the longest text to serve as the "ghost" and prevent layout shifts
  const longestText = [...texts].sort((a, b) => b.length - a.length)[0];

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Ghost text to preserve width based on the longest phrase */}
      <span className="invisible pointer-events-none select-none" aria-hidden="true">
        {longestText}
        <span className="inline-block w-[2px] h-[1.2em] ml-0.5" />
      </span>

      {/* Actual animated text */}
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] font-bold tracking-tight animate-logo-color whitespace-nowrap"
        )}
      >
        {displayText}
        <span
          className={cn(
            "inline-block w-[2px] h-[1.2em] bg-primary align-middle ml-0.5",
            !isDeleting && displayText.length === texts[loopIndex % texts.length].length
              ? "animate-pulse"
              : "opacity-100"
          )}
        />
      </span>
    </span>
  );
}
