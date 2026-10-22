import type { Doc } from "../_generated/dataModel";

export function noteIsFresh(note: Doc<"notes">, now: number) {
  if (note.hidden) return false;
  if (note.permanent) return true;
  if (!note.expiresAt) return true;
  return note.expiresAt > now;
}
