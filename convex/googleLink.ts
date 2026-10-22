import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { randomHex } from "./lib/hash";
import { TOKENS } from "../config/game";
import { DEFAULT_LAYOUT, DEFAULT_THEME, STARTING_KEYS } from "../config/progression";
import { DEFAULT_COVER, STARTER_COVERS } from "../config/covers";

export const link = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const existing = await ctx.db
      .query("players")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    const playerId =
      existing?._id ??
      (await ctx.db.insert("players", {
        companion: "",
        tokens: TOKENS.WELCOME,
        isNpc: false,
        clerkUserId,
        xp: 0,
        keys: STARTING_KEYS,
        noteTheme: DEFAULT_THEME,
        noteLayout: DEFAULT_LAYOUT,
        noteCover: DEFAULT_COVER,
        ownedThemes: [DEFAULT_THEME],
        ownedLayouts: [DEFAULT_LAYOUT],
        ownedCovers: STARTER_COVERS,
        clearedStages: [],
      }));

    const token = randomHex(24);
    await ctx.db.insert("sessions", { token, playerId, createdAt: Date.now() });

    return { token };
  },
});
