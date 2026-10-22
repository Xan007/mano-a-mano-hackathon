import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getPlayer, requirePlayer } from "./lib/auth";
import {
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  NOTE_LAYOUTS,
  NOTE_THEMES,
} from "../config/progression";
import { NOTE_EFFECTS } from "../config/noteEffects";
import { DEFAULT_COVER, NOTE_COVERS, STARTER_COVERS } from "../config/covers";

const themeValidator = v.string();
const layoutValidator = v.string();
const coverValidator = v.string();

function stylesOf(player: Doc<"players">) {
  const themes = player.ownedThemes ?? [];
  const layouts = player.ownedLayouts ?? [];
  const covers = Array.from(
    new Set([...STARTER_COVERS, ...(player.ownedCovers ?? [])]),
  );
  return {
    ownedThemes: themes.includes(DEFAULT_THEME)
      ? themes
      : [DEFAULT_THEME, ...themes],
    ownedLayouts: layouts.includes(DEFAULT_LAYOUT)
      ? layouts
      : [DEFAULT_LAYOUT, ...layouts],
    ownedCovers: covers,
    theme: player.noteTheme ?? DEFAULT_THEME,
    layout: player.noteLayout ?? DEFAULT_LAYOUT,
    cover: player.noteCover ?? DEFAULT_COVER,
    effect: player.noteEffect ?? "ninguno",
  };
}

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return null;

    const styles = stylesOf(me);
    return {
      tokens: me.tokens,
      ...styles,
      themes: NOTE_THEMES.map((theme) => ({
        ...theme,
        owned: styles.ownedThemes.includes(theme.id),
        selected: styles.theme === theme.id,
      })),
      layouts: NOTE_LAYOUTS.map((layout) => ({
        ...layout,
        owned: styles.ownedLayouts.includes(layout.id),
        selected: styles.layout === layout.id,
      })),
      effects: NOTE_EFFECTS.map((effect) => ({
        ...effect,
        selected: effect.id === styles.effect,
      })),
      covers: NOTE_COVERS.map((cover) => ({
        ...cover,
        owned: styles.ownedCovers.includes(cover.id),
        selected: styles.cover === cover.id,
      })),
    };
  },
});

export const buyTheme = mutation({
  args: { token: v.string(), themeId: themeValidator },
  handler: async (ctx, { token, themeId }) => {
    const me = await requirePlayer(ctx, token);
    const theme = NOTE_THEMES.find((entry) => entry.id === themeId);
    if (!theme) throw new ConvexError("Ese estilo no existe");

    const styles = stylesOf(me);
    if (styles.ownedThemes.includes(theme.id))
      return { ok: true, tokens: me.tokens };

    if (me.tokens < theme.cost)
      throw new ConvexError("No te alcanzan las fichas");

    const tokens = me.tokens - theme.cost;
    await ctx.db.patch(me._id, {
      tokens,
      ownedThemes: [...styles.ownedThemes, theme.id],
      noteTheme: theme.id,
    });

    return { ok: true, tokens, themeId: theme.id };
  },
});

export const buyLayout = mutation({
  args: { token: v.string(), layoutId: layoutValidator },
  handler: async (ctx, { token, layoutId }) => {
    const me = await requirePlayer(ctx, token);
    const layout = NOTE_LAYOUTS.find((entry) => entry.id === layoutId);
    if (!layout) throw new ConvexError("Ese estilo no existe");

    const styles = stylesOf(me);
    if (styles.ownedLayouts.includes(layout.id))
      return { ok: true, tokens: me.tokens };

    if (me.tokens < layout.cost)
      throw new ConvexError("No te alcanzan las fichas");

    const tokens = me.tokens - layout.cost;
    await ctx.db.patch(me._id, {
      tokens,
      ownedLayouts: [...styles.ownedLayouts, layout.id],
      noteLayout: layout.id,
    });

    return { ok: true, tokens, layoutId: layout.id };
  },
});

export const selectTheme = mutation({
  args: { token: v.string(), themeId: themeValidator },
  handler: async (ctx, { token, themeId }) => {
    const me = await requirePlayer(ctx, token);
    const styles = stylesOf(me);
    if (!styles.ownedThemes.includes(themeId))
      throw new ConvexError("Todavía no tienes ese estilo");

    await ctx.db.patch(me._id, { noteTheme: themeId });
    return { ok: true, themeId };
  },
});

export const selectLayout = mutation({
  args: { token: v.string(), layoutId: layoutValidator },
  handler: async (ctx, { token, layoutId }) => {
    const me = await requirePlayer(ctx, token);
    const styles = stylesOf(me);
    if (!styles.ownedLayouts.includes(layoutId))
      throw new ConvexError("Todavía no tienes ese estilo");

    await ctx.db.patch(me._id, { noteLayout: layoutId });
    return { ok: true, layoutId };
  },
});

export const buyCover = mutation({
  args: { token: v.string(), coverId: coverValidator },
  handler: async (ctx, { token, coverId }) => {
    const me = await requirePlayer(ctx, token);
    const cover = NOTE_COVERS.find((entry) => entry.id === coverId);
    if (!cover) throw new ConvexError("Ese fondo no existe");

    const styles = stylesOf(me);
    if (styles.ownedCovers.includes(cover.id))
      return { ok: true, tokens: me.tokens };

    if (me.tokens < cover.cost)
      throw new ConvexError("No te alcanzan las fichas");

    const tokens = me.tokens - cover.cost;
    await ctx.db.patch(me._id, {
      tokens,
      ownedCovers: [...styles.ownedCovers, cover.id],
      noteCover: cover.id,
    });

    return { ok: true, tokens, coverId: cover.id };
  },
});

export const selectCover = mutation({
  args: { token: v.string(), coverId: coverValidator },
  handler: async (ctx, { token, coverId }) => {
    const me = await requirePlayer(ctx, token);
    const styles = stylesOf(me);
    if (!styles.ownedCovers.includes(coverId))
      throw new ConvexError("Todavía no tienes ese fondo");

    await ctx.db.patch(me._id, { noteCover: coverId });
    return { ok: true, coverId };
  },
});

export const selectEffect = mutation({
  args: { token: v.string(), effectId: v.string() },
  handler: async (ctx, { token, effectId }) => {
    const me = await requirePlayer(ctx, token);
    if (!NOTE_EFFECTS.some((effect) => effect.id === effectId))
      throw new ConvexError("Ese efecto no existe.");
    await ctx.db.patch(me._id, { noteEffect: effectId });
    return { effectId };
  },
});
