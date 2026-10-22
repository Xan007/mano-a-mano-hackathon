import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { randomAliasCandidate } from "../../config/aliases";

export const ALIAS_MIN = 3;
export const ALIAS_MAX = 24;

export function cleanAlias(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/www\.\S+/gi, "")
    .replace(/@\w+/g, "")
    .replace(/\d{6,}/g, "")
    .replace(/[^\p{L}\p{N} ._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ALIAS_MAX);
}

export function aliasProblem(alias: string): string | null {
  if (alias.length > ALIAS_MAX) return `Usa hasta ${ALIAS_MAX} caracteres.`;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(alias))
    return "Usa letras, números, espacios, puntos o guiones.";
  const words = alias
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(
      /[013457]/g,
      (c) =>
        ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" })[c]!,
    );
  const forbidden = new Set([
    "puta",
    "puto",
    "mierda",
    "hijueputa",
    "gonorrea",
    "marica",
    "pendejo",
    "pendeja",
    "imbecil",
    "idiota",
    "fuck",
    "shit",
    "nazi",
  ]);
  if (
    words.split(/[ ._-]+/).some((word) => forbidden.has(word)) ||
    forbidden.has(words.replace(/[ ._-]/g, ""))
  )
    return "Elige un apodo sin insultos.";
  if (alias.length < ALIAS_MIN)
    return `Tu apodo necesita al menos ${ALIAS_MIN} letras.`;
  if (!/\p{L}/u.test(alias)) return "Tu apodo necesita al menos una letra.";
  return null;
}

export async function generateAlias(
  ctx: MutationCtx,
  skipId?: Id<"players">,
): Promise<string> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = randomAliasCandidate();
    const existing = await ctx.db
      .query("players")
      .withIndex("by_alias", (q) => q.eq("alias", candidate))
      .first();

    if (!existing || existing._id === skipId) return candidate;
  }

  return `Llanero ${Math.floor(100 + Math.random() * 900)}`;
}

export async function aliasTaken(
  ctx: MutationCtx,
  alias: string,
  playerId: Id<"players">,
): Promise<boolean> {
  const existing = await ctx.db
    .query("players")
    .withIndex("by_alias", (q) => q.eq("alias", alias))
    .first();

  return Boolean(existing && existing._id !== playerId);
}
