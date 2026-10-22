import { useState } from "react";
import { Gift } from "lucide-react";
import { cn } from "../lib/utils";

const sizes = {
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-44 w-44",
  xl: "h-60 w-60",
} as const;

export function PlushArt({
  imagePath,
  alt,
  size = "md",
  className,
  blend = true,
}: {
  imagePath?: string;
  alt: string;
  size?: keyof typeof sizes;
  className?: string;
  blend?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-paper",
        sizes[size],
        className
      )}
    >
      {!imagePath || failed ? (
        <Gift className="h-1/3 w-1/3 opacity-40" aria-hidden="true" />
      ) : (
        <img
          src={imagePath}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn("block h-full w-full rounded-full object-cover", blend && "plush-img")}
        />
      )}
    </div>
  );
}
