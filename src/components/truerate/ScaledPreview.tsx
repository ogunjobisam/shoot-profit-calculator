import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScaledPreviewProps {
  width: number;
  height: number;
  children: ReactNode;
}

/** Scales a fixed-size export canvas down to the available content width. */
export function ScaledPreview({ width, height, children }: ScaledPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={wrapRef}
      style={{ width: "100%", height: height * scale, overflow: "hidden" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width, height }}>
        {children}
      </div>
    </div>
  );
}
