import { describe, it, expect } from "vitest";
import { sha256Hex, randomHex } from "../convex/lib/hash";

describe("Hash de contraseñas", () => {
  it("coincide con los vectores conocidos de SHA-256", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("llanera2026")).toBe(
      "0da07a40471416ff3d2abb1bf763ae8c0dd0a0e70f7cef5d641016aee705c445"
    );
  });

  it("con sal distinta produce hashes distintos", () => {
    expect(sha256Hex(`salt-a:llanera2026`)).not.toBe(sha256Hex(`salt-b:llanera2026`));
  });

  it("genera tokens hexadecimales distintos", () => {
    const first = randomHex(24);
    const second = randomHex(24);
    expect(first).toMatch(/^[0-9a-f]{48}$/);
    expect(first).not.toBe(second);
  });
});
