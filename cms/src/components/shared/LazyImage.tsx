import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  loadDelay?: number; // ms to wait before loading (skips fast scrolling)
}

export default function LazyImage({
  src,
  alt,
  className = "",
  loadDelay = 150,
}: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Start a timer - only load if still visible after delay
          timerRef.current = window.setTimeout(() => {
            setShouldLoad(true);
          }, loadDelay);
        } else {
          // Scrolled away - cancel pending load
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      {
        rootMargin: "100px", // Start observing slightly before visible
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loadDelay]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-zinc-200 animate-pulse" />
      )}
    </div>
  );
}
