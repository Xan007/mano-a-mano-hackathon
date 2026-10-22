"use node";
import { v, ConvexError } from "convex/values";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { reviewAlias } from "./lib/aliasReview";
import { aliasProblem } from "./lib/alias";
import { ACCOUNT_ISSUER, ACCOUNT_ORIGINS } from "../config/auth";

function normalize(name: string) { return name.trim().normalize("NFKC").toLocaleLowerCase("es"); }
function hash(password: string, salt: string, cost = 131072) { return `scrypt$${cost}$${scryptSync(password, salt, 64, { N: cost, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }).toString("hex")}`; }
function equal(a: string, b: string) { const first = Buffer.from(a), second = Buffer.from(b); return first.length === second.length && timingSafeEqual(first, second); }
function attemptKey(kind: string, name: string) { return `${kind}:${createHash("sha256").update(name).digest("hex")}`; }
const JWKS = createRemoteJWKSet(new URL(`${ACCOUNT_ISSUER}/.well-known/jwks.json`));

async function verifiedGoogle(credential: string) {
  let subject: string;
  try {
    const { payload } = await jwtVerify(credential, JWKS, { issuer: ACCOUNT_ISSUER, algorithms: ["RS256"], requiredClaims: ["exp", "sub", "iat", "azp"] });
    if (!payload.sub || !ACCOUNT_ORIGINS.includes(String(payload.azp))) throw Error("Invalid identity");
    subject = payload.sub;
  } catch { throw new ConvexError("No pudimos verificar Google. Vuelve a intentarlo."); }
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return { subject, verifiedEmail: undefined };
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`, {
    headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new ConvexError("No pudimos comprobar tu cuenta. Intenta de nuevo.");
  const user = await response.json() as { id: string; primary_email_address_id: string | null; email_addresses: Array<{ id: string; email_address: string; verification: { status: string } | null }> };
  if (user.id !== subject || !Array.isArray(user.email_addresses)) throw new ConvexError("No pudimos comprobar tu cuenta.");
  const email = user.email_addresses.find(entry => entry.id === user.primary_email_address_id && entry.verification?.status === "verified");
  return { subject, verifiedEmail: email?.email_address.trim().toLowerCase() };
}

export const signUp = action({
  args: { username: v.string(), password: v.string(), guestToken: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ token: string; linked: boolean }> => {
    const alias = args.username.trim().normalize("NFKC");
    const problem = aliasProblem(alias);
    if (problem) throw new ConvexError(problem);
    if (args.password.length < 10 || args.password.length > 128) throw new ConvexError("Usa una contraseña de 10 a 128 caracteres.");
    const username = normalize(alias);
    if (!await ctx.runMutation(internal.accounts.reserveAttempt, { key: attemptKey("register", username) })) throw new ConvexError("Demasiados intentos. Espera unos minutos.");
    await reviewAlias(alias);
    const salt = randomBytes(16).toString("hex");
    return await ctx.runMutation(internal.accounts.register, { username, alias, hash: hash(args.password, salt), salt, guestToken: args.guestToken, sessionToken: randomBytes(32).toString("hex") });
  },
});

export const signIn = action({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username: raw, password }): Promise<{ token: string }> => {
    if (!raw.trim() || raw.length > 24 || password.length > 128) throw new ConvexError("Apodo o contraseña incorrectos.");
    const username = normalize(raw);
    if (!await ctx.runMutation(internal.accounts.reserveAttempt, { key: attemptKey("login", username) })) throw new ConvexError("Demasiados intentos. Espera unos minutos.");
    const credential = await ctx.runQuery(internal.accounts.findCredential, { username });
    const salt = credential?.salt ?? "00000000000000000000000000000000";
    const modern = credential?.hash.startsWith("scrypt$") ?? true;
    const cost = modern && credential ? Number(credential.hash.split("$")[1]) : 131072;
    if (modern && ![32768,131072].includes(cost)) throw new ConvexError("Apodo o contraseña incorrectos.");
    const expected = modern ? hash(password, salt, cost) : createHash("sha256").update(`${salt}:${password}`).digest("hex");
    if (!credential || !equal(expected, credential.hash)) throw new ConvexError("Apodo o contraseña incorrectos.");
    const upgradedSalt = modern && cost === 131072 ? undefined : randomBytes(16).toString("hex");
    return await ctx.runMutation(internal.accounts.finishLogin, { playerId: credential.id, expectedHash: credential.hash, sessionToken: randomBytes(32).toString("hex"), upgradedSalt, upgradedHash: upgradedSalt ? hash(password, upgradedSalt) : undefined });
  },
});

export const google = action({
  args: { credential: v.string(), guestToken: v.optional(v.string()) },
  handler: async (ctx, { credential, guestToken }): Promise<{ token: string; linked: boolean }> => {
    const { subject, verifiedEmail } = await verifiedGoogle(credential);
    if (!await ctx.runMutation(internal.accounts.reserveAttempt, { key: attemptKey("google", subject) })) throw new ConvexError("Espera unos minutos antes de entrar otra vez.");
    return await ctx.runMutation(internal.accounts.google, { subject, verifiedEmail, guestToken, sessionToken: randomBytes(32).toString("hex") });
  },
});

export const refreshIdentity = action({
  args: { token: v.string(), credential: v.string() },
  handler: async (ctx, { token, credential }): Promise<{ ok: boolean }> => {
    const identity = await verifiedGoogle(credential);
    return await ctx.runMutation(internal.accounts.refreshIdentity, { token, ...identity });
  },
});
