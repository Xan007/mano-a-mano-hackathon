import { internalMutation } from "./_generated/server";
import { PLUSH_CATALOG } from "../config/catalog";
import { NOTE_LIFETIME_MS } from "../config/care";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    let catalog = 0;
    for (const entry of PLUSH_CATALOG) {
      const record = {
        slug: entry.slug,
        species: entry.species,
        rarity: entry.rarity,
        outfit: entry.outfit,
        imagePath: entry.imagePath,
      };
      const existing = await ctx.db
        .query("plushCatalog")
        .withIndex("by_slug", (q) => q.eq("slug", entry.slug))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, record);
      } else {
        await ctx.db.insert("plushCatalog", record);
      }
      catalog += 1;
    }

    let expiringNotes = 0;
    const notes = await ctx.db.query("notes").collect();
    const now = Date.now();

    for (const note of notes) {
      if (note.permanent || note.expiresAt) continue;
      const plush = await ctx.db.get(note.plushId);
      if (!plush || plush.status === "traveling") continue;
      await ctx.db.patch(note._id, { expiresAt: now + NOTE_LIFETIME_MS });
      expiringNotes += 1;
    }

    return { catalog, expiringNotes };
  },
});

// Catalogue-only synchronization: no player progress or notes are changed.
export const syncCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const entry of PLUSH_CATALOG) {
      const existing = await ctx.db
        .query("plushCatalog")
        .withIndex("by_slug", (q) => q.eq("slug", entry.slug))
        .first();
      if (existing) await ctx.db.patch(existing._id, entry);
      else await ctx.db.insert("plushCatalog", entry);
    }
    return { updated: PLUSH_CATALOG.length };
  },
});
