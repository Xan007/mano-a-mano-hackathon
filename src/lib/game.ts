import type { Rarity } from "../../config/game";
import { catalogBySlug } from "../../config/catalog";

export const rarityBorder: Record<Rarity, string> = {
  comun: "border-lagoon",
  raro: "border-plum",
  epico: "border-[#b764d5]",
  legendario: "border-mango",
};

export const rarityChip: Record<Rarity, string> = {
  comun: "bg-mist",
  raro: "bg-[#E7DDFB]",
  epico: "bg-[#f0d5fa]",
  legendario: "bg-[#FFE7AF]",
};

export const rarityText: Record<Rarity, string> = {
  comun: "text-lagoon",
  raro: "text-plum",
  epico: "text-[#79349b]",
  legendario: "text-[#7a4a00]",
};

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "listo";
  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min ${seconds} s`;
  return `${seconds} s`;
}

export function formatDue(ts: number): string {
  return new Date(ts).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function imageForSlug(slug: string | undefined): string | undefined {
  return catalogBySlug(slug)?.imagePath;
}
