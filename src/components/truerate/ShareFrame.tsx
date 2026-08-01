import { forwardRef, type ReactNode } from "react";
import type { Band } from "@/lib/truerate";

const PAGE_BG = "#FCFBF8";

const BAND_VAR: Record<Band, string> = {
  red: "var(--band-red)",
  amber: "var(--band-amber)",
  green: "var(--band-green)",
};

interface ShareFrameProps {
  /** "feed" = 1080x1350 (4:5), "story" = 1080x1920 (9:16) */
  variant: "feed" | "story";
  band: Band;
  children: ReactNode;
}

/**
 * Fixed-size export frame. The card is centred on the page background so the
 * exported image is always exactly 1080x1350 or 1080x1920, whatever the
 * verdict text length.
 */
export const ShareFrame = forwardRef<HTMLDivElement, ShareFrameProps>(
  ({ variant, band, children }, ref) => {
    const isStory = variant === "story";
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: isStory ? 1920 : 1350,
          background: isStory
            ? `color-mix(in oklab, ${BAND_VAR[band]} 15%, ${PAGE_BG})`
            : PAGE_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Instagram Stories UI needs clear space top and bottom.
          padding: isStory ? "250px 80px" : "80px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: 920 }}>{children}</div>
      </div>
    );
  },
);

ShareFrame.displayName = "ShareFrame";
