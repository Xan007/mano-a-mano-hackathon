import { ConvexError } from "convex/values";

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    if (typeof error.data === "string" && error.data.trim()) return error.data;
    if (error.data && typeof error.data === "object" && "message" in error.data) {
      const message = (error.data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }

  if (error instanceof Error && error.message) {
    const cleaned = error.message
      .replace(/^\[CONVEX[\s\S]*?(?:Uncaught )?Error:\s*/, "")
      .split("\n")[0]
      .trim();
    if (cleaned) return cleaned;
  }

  return fallback;
}
