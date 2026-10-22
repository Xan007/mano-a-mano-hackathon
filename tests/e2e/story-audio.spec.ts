import { test, expect } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { COMPANIONS } from "../../config/catalog";

const client = new ConvexHttpClient("http://127.0.0.1:3210");

test("cada fragmento espera tres segundos visibles y el audio respeta el silencio", async ({ page }) => {
  const { token } = await client.mutation(api.auth.createGuest, {});
  await client.action(api.players.setCompanion, {
    token, companion: COMPANIONS[0].id,
    alias: `Estrella ${crypto.randomUUID().replace(/[^a-z]/g, "").slice(0, 8)}`,
  });
  await page.addInitScript(value => {
    localStorage.setItem("manoamano.session", value);
    const original = AudioBufferSourceNode.prototype.start;
    Object.assign(window, { soundNodes: 0 });
    AudioBufferSourceNode.prototype.start = function (when?: number, offset?: number, duration?: number) {
      const state = window as typeof window & { soundNodes: number };
      state.soundNodes++;
      return original.call(this, when, offset, duration);
    };
  }, token);
  const soundCount = () => page.evaluate(() => (window as typeof window & { soundNodes: number }).soundNodes);
  await page.goto("/casa");
  await expect(page.getByRole("heading", { name: "Vamos por tu primer peluche" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar sonido", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await soundCount()).toBe(0);
  await page.getByRole("button", { name: "Activar sonido", exact: true }).click();
  await expect.poll(soundCount).toBeGreaterThan(0);
  const before = await soundCount();
  await page.getByRole("button", { name: "Rescatar mi primer peluche" }).click();
  await expect(page.getByLabel("Escena 1 de 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sigue en 3 s", exact: true })).toBeDisabled();
  await expect.poll(soundCount).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Seguir la historia", exact: true }).click();
  await expect(page.getByLabel("Escena 2 de 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Opciones en 3 s", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Ayudar y rescatar", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Cerrar historia", exact: true }).click();
  await page.getByRole("button", { name: "Silenciar sonido", exact: true }).click();
  const mutedCount = await soundCount();
  await page.getByRole("button", { name: "Rescatar mi primer peluche" }).click();
  await expect(page.getByLabel("Escena 1 de 2")).toBeVisible();
  expect(await soundCount()).toBe(mutedCount);
  await page.getByRole("button", { name: "Cerrar historia", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Activar sonido", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await soundCount()).toBe(0);
});
