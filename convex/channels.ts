import { query } from "./_generated/server";
import { SUPPORT_CHANNELS } from "../config/support";

export const list = query({ args: {}, handler: async ctx => {
  const overrides = await ctx.db.query("supportOverrides").collect();
  return SUPPORT_CHANNELS.map(channel => {
    const edit = overrides.find(row => row.channelId === channel.id);
    return { ...channel, ...(edit ? { phone: edit.phone, contact: edit.phone, whatsapp: edit.whatsapp ?? null, hours: edit.hours, cost: edit.cost, sourceUrl: edit.sourceUrl, checkedAt: edit.verifiedAt } : {}), paused: edit?.paused ?? false };
  });
} });
