import { Volume2, VolumeX } from "lucide-react";
import { play, toggleMuted, useMuted } from "../lib/audio";
import { cn } from "../lib/utils";

export function SoundToggle({ className }: { className?: string }) {
  const muted = useMuted();

  function handleClick() {
    const nextMuted = toggleMuted();
    if (!nextMuted) play("click");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-[#fffdf7] transition-colors hover:bg-mist",
        className
      )}
      aria-pressed={!muted}
      aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
      title={muted ? "Activar sonido" : "Silenciar sonido"}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
