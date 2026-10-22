import { describe, expect, it, vi } from "vitest";
import { completeGoogleSignUp } from "../src/lib/googleFlow";

function pending() {
  const complete = {
    status: "complete", missingFields: [] as string[], unverifiedFields: [] as string[],
    createdSessionId: "synthetic-google-session",
    verifications: { externalAccount: { status: "verified", strategy: "oauth_google" } },
    update: vi.fn(),
  };
  return {
    ...complete, status: "missing_requirements", missingFields: ["username"],
    createdSessionId: null as string | null,
    update: vi.fn().mockResolvedValue(complete),
  };
}

describe("continuación de Google sin formularios adicionales", () => {
  it("resuelve el identificador interno tras verificar Google y conserva el apodo de la app", async () => {
    const signUp = pending();
    expect(await completeGoogleSignUp(signUp)).toBe("synthetic-google-session");
    expect(signUp.update).toHaveBeenCalledOnce();
    expect(signUp.update).toHaveBeenCalledWith({ username: expect.stringMatching(/^m_[a-f0-9]{32}$/) });
  });

  it("reutiliza una inscripción completada sin repetir actualizaciones", async () => {
    const signUp = { ...pending(), status: "complete", createdSessionId: "existing-session" };
    expect(await completeGoogleSignUp(signUp)).toBe("existing-session");
    expect(signUp.update).not.toHaveBeenCalled();
  });

  it.each([
    { status: "unverified", strategy: "oauth_google" },
    { status: "verified", strategy: "oauth_other" },
  ])("no completa una identidad sin Google verificado: %j", async (externalAccount) => {
    const signUp = { ...pending(), verifications: { externalAccount } };
    await expect(completeGoogleSignUp(signUp)).rejects.toThrow(/no se completó/);
    expect(signUp.update).not.toHaveBeenCalled();
  });

  it("no inventa datos ni omite requisitos de contraseña, verificaciones o consentimiento", async () => {
    const signUp = { ...pending(), missingFields: ["username", "legal_accepted"] };
    await expect(completeGoogleSignUp(signUp)).rejects.toThrow(/No pudimos completar/);
    expect(signUp.update).not.toHaveBeenCalled();
  });

  it("no da acceso si la actualización no termina la verificación", async () => {
    const signUp = pending();
    signUp.update.mockResolvedValue({ ...signUp, missingFields: [], unverifiedFields: ["email_address"] });
    await expect(completeGoogleSignUp(signUp)).rejects.toThrow(/No pudimos completar/);
  });
});
