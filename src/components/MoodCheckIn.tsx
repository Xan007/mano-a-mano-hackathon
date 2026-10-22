import { useNavigate } from "react-router";
import { Annoyed, Frown, Meh, Smile } from "lucide-react";
import { Modal } from "./Modal";

type Mood = "happy" | "sad" | "anxious" | "neutral";

export function MoodCheckIn({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  function choose(mood: Mood) {
    onClose();
    if (mood === "sad" || mood === "anxious") navigate("/apoyo");
  }
  const moods: Array<{ id: Mood; label: string; Icon: typeof Smile; color: string }> = [
    { id: "happy", label: "Feliz", Icon: Smile, color: "text-teal" },
    { id: "sad", label: "Triste", Icon: Frown, color: "text-guava" },
    { id: "anxious", label: "Con ansiedad", Icon: Annoyed, color: "text-lavender" },
    { id: "neutral", label: "Neutral", Icon: Meh, color: "text-ink/65" },
  ];
  return (
    <Modal labelledBy="mood-checkin-title" onClose={onClose} className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper p-5 text-ink shadow-[6px_6px_0_var(--color-ink)] sm:p-6">
      <p className="label">Un momento para ti</p>
      <h2 id="mood-checkin-title" className="mt-1 text-2xl sm:text-3xl">¿Cómo te sientes hoy?</h2>
      <p className="mt-2 text-sm text-ink/65">No guardamos tu respuesta.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {moods.map(({ id, label, Icon, color }) => (
          <button key={id} type="button" onClick={() => choose(id)} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink/15 bg-sand p-3 font-extrabold transition-[transform,border-color,background-color] hover:-translate-y-1 hover:border-ink hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <Icon className={"h-9 w-9 " + color + " transition-transform group-hover:scale-110"} aria-hidden="true" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-4 min-h-11 w-full text-sm font-bold text-ink/60 underline decoration-dotted underline-offset-4">Ahora no</button>
    </Modal>
  );
}
