import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function likeState(
  ctx: QueryCtx,
  noteId: Id<"notes">,
  playerId: Id<"players"> | null
) {
  const likes = await ctx.db
    .query("noteLikes")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .collect();

  return {
    likes: likes.length,
    liked: playerId ? likes.some((like) => like.playerId === playerId) : false,
  };
}
