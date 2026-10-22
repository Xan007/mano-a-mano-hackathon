import { useState } from "react";
import { m } from "motion/react";
import { AnimatedText } from "./AnimatedText";
import { useCalmMotion } from "../lib/motion";

export function StoryScene({
  text,
  imagePath,
  placeName,
  placeId,
}: {
  text: string;
  imagePath: string;
  placeName: string;
  placeId: string;
}) {
  const reduce = useCalmMotion();
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border-2 border-ink bg-mist">
      <div className="relative h-44 overflow-hidden sm:h-52" aria-hidden="true">
        <img
          src={`/story-scenes/${placeId}.webp`}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/35 via-ink/5 to-ink/15" />
        <m.img
          data-testid="story-reward"
          src={imagePath || undefined}
          onLoad={() => setLoaded(true)}
          alt=""
          className="absolute bottom-2 left-[18%] z-10 h-32 w-32 border-2 border-white/90 bg-paper object-contain shadow-[0_4px_12px_#17233b55] sm:h-40 sm:w-40"
          style={{ borderRadius: "50%" }}
          initial={
            reduce ? false : { opacity: 0, y: 10, scale: 0.96 }
          }
          animate={{
            opacity: loaded ? 1 : 0,
            y: reduce ? 0 : [0, -4, 0],
            rotate: reduce ? 0 : [-1, 1, -1],
          }}
          transition={{ duration: 0.65, ease: "easeInOut", y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        />
        <span className="absolute left-3 top-3 z-10 rounded-lg border border-white/80 bg-paper/95 px-3 py-1.5 text-xs font-bold shadow-sm">
          {placeName}
        </span>
      </div>
      <div
        className="min-h-28 border-t-2 border-ink bg-paper p-4 sm:p-5"
        aria-live="polite"
      >
        <p className="text-lg font-semibold leading-relaxed">
          <AnimatedText key={text} text={text} />
        </p>
      </div>
    </div>
  );
}
