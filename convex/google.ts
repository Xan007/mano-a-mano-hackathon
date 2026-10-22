"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { createPublicKey, verify as verifySignature } from "node:crypto";

const ISSUER = (process.env.CLERK_JWT_ISSUER_DOMAIN ?? "").replace(/\/+$/, "");

type Jwk = {
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
};

type ClerkClaims = {
  sub?: string;
  iss?: string;
  exp?: number;
  nbf?: number;
};

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

async function fetchKeys(): Promise<Jwk[]> {
  const response = await fetch(`${ISSUER}/.well-known/jwks.json`);
  if (!response.ok) throw new ConvexError("No pudimos validar tu cuenta de Google.");
  const body = (await response.json()) as { keys?: Jwk[] };
  return body.keys ?? [];
}

async function verifyClerkToken(token: string): Promise<string> {
  if (!ISSUER) throw new ConvexError("Falta configurar el inicio de sesión con Google.");

  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) throw new ConvexError("Token inválido.");

  const header = decodePart(headerPart) as { kid?: string; alg?: string };
  const payload = decodePart(payloadPart) as ClerkClaims;

  if (payload.iss !== ISSUER) throw new ConvexError("Emisor inválido.");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    throw new ConvexError("Tu sesión de Google expiró. Inténtalo de nuevo.");
  }
  if (typeof payload.sub !== "string" || !payload.sub.startsWith("user_")) {
    throw new ConvexError("Cuenta de Google inválida.");
  }

  const keys = await fetchKeys();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new ConvexError("No encontramos la llave de tu sesión.");

  const publicKey = createPublicKey({ key: jwk as never, format: "jwk" });
  const valid = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${headerPart}.${payloadPart}`),
    publicKey,
    Buffer.from(signaturePart, "base64url")
  );

  if (!valid) throw new ConvexError("Firma inválida.");

  return payload.sub;
}

export const signIn = action({
  args: { clerkToken: v.string() },
  handler: async (ctx, { clerkToken }): Promise<{ token: string }> => {
    const clerkUserId = await verifyClerkToken(clerkToken);
    const result: { token: string } = await ctx.runMutation(internal.googleLink.link, {
      clerkUserId,
    });
    return result;
  },
});


