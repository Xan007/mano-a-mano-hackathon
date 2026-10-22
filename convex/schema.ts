import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const rarity = v.union(
  v.literal("comun"),
  v.literal("raro"),
  v.literal("epico"),
  v.literal("legendario")
);

const plushStatus = v.union(
  v.literal("collection"),
  v.literal("traveling"),
  v.literal("returned")
);

const transitState = v.union(
  v.literal("holding"),
  v.literal("passed"),
  v.literal("auto_passed")
);

export default defineSchema({
  appSettings: defineTable({ key: v.string(), enabled: v.boolean(), updatedAt: v.number(), updatedBy: v.optional(v.id("players")) }).index("by_key", ["key"]),
  staffMembers: defineTable({ email: v.string(), active: v.boolean(), grantedBy: v.id("players"), grantedAt: v.number(), revokedAt: v.optional(v.number()) }).index("by_email", ["email"]),
  adminAudit: defineTable({ actorId: v.id("players"), actorEmail: v.string(), action: v.string(), target: v.string(), reason: v.string(), createdAt: v.number(), demo: v.boolean() }).index("by_createdAt", ["createdAt"]),
  supportOverrides: defineTable({ channelId: v.union(v.literal("local"), v.literal("national")), phone: v.string(), whatsapp: v.optional(v.string()), hours: v.string(), cost: v.string(), paused: v.boolean(), sourceUrl: v.string(), verifiedAt: v.string(), updatedBy: v.id("players"), updatedAt: v.number() }).index("by_channel", ["channelId"]),
  authAttempts: defineTable({ key: v.string(), windowAt: v.number(), count: v.number() }).index("by_key", ["key"]),
  channelReports: defineTable({
    channelId: v.union(v.literal("local"), v.literal("national")),
    reason: v.union(v.literal("contact"), v.literal("hours"), v.literal("source")),
    createdAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("dismissed")),
    synthetic: v.boolean(),
    resolvedBy: v.optional(v.id("players")),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  }),
  players: defineTable({
    verifiedEmail: v.optional(v.string()),
    identityVerifiedAt: v.optional(v.number()),
    bannedAt: v.optional(v.number()),
    banReason: v.optional(v.string()),
    bannedBy: v.optional(v.id("players")),
    isDemo: v.optional(v.boolean()),
    demoOwnerId: v.optional(v.id("players")),
    isPublicNpc: v.optional(v.boolean()),
    username: v.optional(v.string()),
    alias: v.optional(v.string()),
    companion: v.string(),
    firstJourneyAt: v.optional(v.number()),
    quickTourCompletedAt: v.optional(v.number()),
    guideWindowAt: v.optional(v.number()),
    guideCount: v.optional(v.number()),
    aliasWindowAt: v.optional(v.number()),
    aliasReviewCount: v.optional(v.number()),
    journeyPerspective: v.optional(v.union(v.literal("self"), v.literal("others"))),
    tokens: v.number(),
    lastFreeTokenDay: v.optional(v.string()),
    lastMailboxDay: v.optional(v.string()),
    lastMailboxAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    isNpc: v.boolean(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    xp: v.optional(v.number()),
    keys: v.optional(v.number()),
    noteTheme: v.optional(v.string()),
    noteLayout: v.optional(v.string()),
    noteCover: v.optional(v.string()),
    noteEffect: v.optional(v.string()),
    ownedThemes: v.optional(v.array(v.string())),
    ownedLayouts: v.optional(v.array(v.string())),
    ownedCovers: v.optional(v.array(v.string())),
    clearedStages: v.optional(v.array(v.string())),
    unlockedStages: v.optional(v.array(v.string())),
    legendaryKeys: v.optional(v.number()),
    lastLegendaryDay: v.optional(v.string()),
    shinyPotions: v.optional(v.number()),
    secretPotions: v.optional(v.number()),
    shinyPity: v.optional(v.number()),
    secretPity: v.optional(v.number()),
    giftDay: v.optional(v.string()),
    giftCount: v.optional(v.number()),
    lastChallengeBonusDay: v.optional(v.string()),
  })
    .index("by_username", ["username"])
    .index("by_alias", ["alias"])
    .index("by_clerk", ["clerkUserId"])
    .index("by_email", ["verifiedEmail"])
    .index("by_demo_owner", ["demoOwnerId"])
    .index("by_public_npc", ["isPublicNpc"])
    .index("by_last_seen", ["lastSeenAt"]),

  sessions: defineTable({
    token: v.string(),
    playerId: v.id("players"),
    createdAt: v.number(),
    demoPlayerId: v.optional(v.id("players")),
  }).index("by_token", ["token"]),


  plushCatalog: defineTable({
    slug: v.string(),
    species: v.string(),
    rarity,
    outfit: v.string(),
    imagePath: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_rarity", ["rarity"]),

  plushItems: defineTable({
    catalogId: v.id("plushCatalog"),
    originId: v.id("players"),
    status: plushStatus,
    hopCount: v.number(),
    hopsTarget: v.number(),
    evolution: v.optional(v.number()),
    variant: v.optional(v.union(v.literal("shiny"), v.literal("secret"))),
    createdAt: v.number(),
    waitingSince: v.optional(v.number()),
    retryScheduledAt: v.optional(v.number()),
  }).index("by_origin", ["originId"]),

  transits: defineTable({
    plushId: v.id("plushItems"),
    holderId: v.id("players"),
    receivedAt: v.number(),
    dueAt: v.number(),
    hopIndex: v.number(),
    state: transitState,
  })
    .index("by_holder_state", ["holderId", "state"])
    .index("by_plush", ["plushId"]),

  notes: defineTable({
    isDemo: v.optional(v.boolean()),
    isPublicDemo: v.optional(v.boolean()),
    demoOwnerId: v.optional(v.id("players")),
    plushId: v.id("plushItems"),
    authorId: v.id("players"),
    body: v.string(),
    hopIndex: v.number(),
    hidden: v.boolean(),
    theme: v.optional(v.string()),
    cover: v.optional(v.string()),
    effect: v.optional(v.string()),
    permanent: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    moderationStatus: v.optional(v.union(v.literal("published"), v.literal("pending"), v.literal("removed"))),
    moderationReason: v.optional(v.string()),
    moderatedBy: v.optional(v.id("players")),
    moderatedAt: v.optional(v.number()),
      reputationHidden: v.optional(v.boolean()),
  })
    .index("by_plush", ["plushId", "hopIndex"])
    .index("by_author", ["authorId", "createdAt"])
    .index("by_moderation", ["moderationStatus", "createdAt"])
    .index("by_createdAt", ["createdAt"]),





  moderationLog: defineTable({
    decision: v.string(),
    reasonCode: v.string(),
    latencyMs: v.number(),
    createdAt: v.number(),
  }),

  reports: defineTable({
    noteId: v.id("notes"),
    reporterId: v.id("players"),
    createdAt: v.number(),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("players")),
  })
    .index("by_note", ["noteId"])
    .index("by_reporter", ["reporterId"]),



  placeRescues: defineTable({
    playerId: v.id("players"),
    placeId: v.string(),
    day: v.string(),
    plushId: v.id("plushItems"),
    createdAt: v.number(),
  })
    .index("by_player", ["playerId", "createdAt"])
    .index("by_player_place", ["playerId", "placeId"]),

  placeVisits: defineTable({
    playerId: v.id("players"),
    placeId: v.string(),
    day: v.string(),
    rewarded: v.boolean(),
    correct: v.boolean(),
    createdAt: v.number(),
  }).index("by_player_day", ["playerId", "day"]),

  placeSessions: defineTable({
    rewardCatalogId: v.optional(v.id("plushCatalog")),
    perspective: v.optional(v.union(v.literal("self"), v.literal("others"))),
    playerId: v.id("players"),
    placeId: v.string(),
    capsuleSlug: v.string(),
    capsuleKind: v.union(v.literal("place"), v.literal("general")),
    startedAt: v.number(),
    answeredAt: v.optional(v.number()),
    correct: v.optional(v.boolean()),
  }).index("by_player", ["playerId", "startedAt"]),

  noteLikes: defineTable({
    noteId: v.id("notes"),
    playerId: v.id("players"),
      vote: v.optional(v.union(v.literal("up"), v.literal("down"))),
    createdAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_note_player", ["noteId", "playerId"]),





});
