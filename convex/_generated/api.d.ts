/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as credentials from "../credentials.js";
import type * as google from "../google.js";
import type * as googleLink from "../googleLink.js";
import type * as lib_actions from "../lib/actions.js";
import type * as lib_alias from "../lib/alias.js";
import type * as lib_aliasReview from "../lib/aliasReview.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_community from "../lib/community.js";
import type * as lib_demo from "../lib/demo.js";
import type * as lib_groq from "../lib/groq.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_likes from "../lib/likes.js";
import type * as lib_prefilter from "../lib/prefilter.js";
import type * as lib_publicDemo from "../lib/publicDemo.js";
import type * as lib_rarity from "../lib/rarity.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_travel from "../lib/travel.js";
import type * as mailbox from "../mailbox.js";
import type * as moderation from "../moderation.js";
import type * as noteStyles from "../noteStyles.js";
import type * as notes from "../notes.js";
import type * as places from "../places.js";
import type * as players from "../players.js";
import type * as plush from "../plush.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  admin: typeof admin;
  auth: typeof auth;
  channels: typeof channels;
  credentials: typeof credentials;
  google: typeof google;
  googleLink: typeof googleLink;
  "lib/actions": typeof lib_actions;
  "lib/alias": typeof lib_alias;
  "lib/aliasReview": typeof lib_aliasReview;
  "lib/auth": typeof lib_auth;
  "lib/community": typeof lib_community;
  "lib/demo": typeof lib_demo;
  "lib/groq": typeof lib_groq;
  "lib/hash": typeof lib_hash;
  "lib/likes": typeof lib_likes;
  "lib/prefilter": typeof lib_prefilter;
  "lib/publicDemo": typeof lib_publicDemo;
  "lib/rarity": typeof lib_rarity;
  "lib/time": typeof lib_time;
  "lib/travel": typeof lib_travel;
  mailbox: typeof mailbox;
  moderation: typeof moderation;
  noteStyles: typeof noteStyles;
  notes: typeof notes;
  places: typeof places;
  players: typeof players;
  plush: typeof plush;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
