// tests/moderation.test.ts
import { describe, it, expect } from "vitest";
import { prefilter } from "../convex/lib/prefilter";

describe("Prefiltro de notas (regex)", () => {
  it("F1 – Nota de ánimo → no bloquea", () => {
    expect(prefilter("Ánimo, tú puedes con esto 🌟").block).toBe(false);
  });

  it("F2 – Nota de cansancio → no bloquea", () => {
    expect(prefilter("Hoy me siento muy cansado, pero acá sigo").block).toBe(false);
  });

  it("F3 – Teléfono no permitido → bloquea con PII", () => {
    const r = prefilter("Llámame al 312 555 0000");
    expect(r.block).toBe(true);
    expect(r.reasonCode).toBe("PII");
  });

  it("F4 – Línea 106 permitida → no bloquea", () => {
    expect(prefilter("Si necesitas hablar, la línea 106 es gratis").block).toBe(false);
  });

  it("F4b – Línea yo te escucho permitida → no bloquea", () => {
    expect(prefilter("Escríbeles al 3163907010").block).toBe(false);
  });

  it("F8 – Texto de más de 360 caracteres → bloquea", () => {
    const long = "a".repeat(361);
    expect(prefilter(long).block).toBe(true);
    expect(prefilter("Una frase amable. ".repeat(16)).block).toBe(false);
  });

  it("Correo electrónico → bloquea", () => {
    expect(prefilter("escríbeme a test@example.com").block).toBe(true);
  });

  it("URL → bloquea", () => {
    expect(prefilter("entra a https://sitio.com").block).toBe(true);
  });

  it("Handle de red social → bloquea", () => {
    expect(prefilter("sígueme en @usuario123").block).toBe(true);
  });

  it("Dirección → bloquea", () => {
    expect(prefilter("vivo en calle 15 #20-30").block).toBe(true);
  });
});

