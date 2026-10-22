import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const REPUTATION_MIN_VOTES = 3;

export function reputationFromVotes(votes: Array<{ vote?: "up" | "down" }>, hidden = false) {
  const upvotes = votes.filter((vote) => vote.vote !== "down").length;
  const downvotes = votes.filter((vote) => vote.vote === "down").length;
  const reputation = upvotes - downvotes;
  return { upvotes, downvotes, reputation, autoHidden: hidden || (votes.length >= REPUTATION_MIN_VOTES && reputation <= -2) };
}

export async function likeState(
  ctx: QueryCtx | MutationCtx,
  noteId: Id<"notes">,
  playerId: Id<"players"> | null
) {
  const likes = await ctx.db
    .query("noteLikes")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .collect();

  const current = playerId ? likes.find((like) => like.playerId === playerId) : undefined;
  return {
    likes: likes.filter((like) => like.vote !== "down").length,
    liked: current ? current.vote !== "down" : false,
    vote: current?.vote === "down" ? "down" as const : current ? "up" as const : null,
    ...reputationFromVotes(likes),
  };
}
