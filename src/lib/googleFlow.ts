// Google verifies identity; the app's own alias remains the visible name.
// A required provider username is only an opaque internal identifier.
type GoogleSignUp = {
  status: string | null;
  missingFields: readonly string[];
  unverifiedFields: readonly string[];
  createdSessionId: string | null;
  verifications: { externalAccount: { status: string | null; strategy: string | null } };
  update: (params: { username: string }) => Promise<GoogleSignUp>;
};

export async function completeGoogleSignUp(signUp: GoogleSignUp): Promise<string> {
  let current = signUp;
  if (current.status === "complete" && current.createdSessionId) return current.createdSessionId;
  if (
    current.status !== "missing_requirements" ||
    current.verifications.externalAccount.status !== "verified" ||
    current.verifications.externalAccount.strategy !== "oauth_google"
  ) throw new Error("El acceso con Google no se completó. Vuelve a intentarlo.");

  if (current.missingFields.length === 1 && current.missingFields[0] === "username") {
    current = await current.update({ username: `m_${crypto.randomUUID().replaceAll("-", "")}` });
  }
  if (current.status !== "complete" || !current.createdSessionId) {
    throw new Error("No pudimos completar el acceso con Google. Puedes volver o usar tu apodo y contraseña.");
  }
  return current.createdSessionId;
}
