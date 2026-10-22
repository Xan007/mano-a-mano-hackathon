import { test, expect, type Page } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { COMPANIONS } from "../../config/catalog";
import { journeyScene } from "../../config/journey";

// Browser tests use the isolated local backend, never the shared deployment.
const client = new ConvexHttpClient("http://127.0.0.1:3210");
async function account(page: Page) {
  const { token } = await client.mutation(api.auth.createGuest, {});
  await client.action(api.players.setCompanion, {
    token, companion: COMPANIONS[0].id,
    alias: `Guia ${crypto.randomUUID().replace(/[^a-z]/g, "").slice(0, 9)}`,
  });
  const visit = await client.mutation(api.places.startVisit, { token, placeId: "clinica", perspective: "self" });
  await new Promise(resolve => setTimeout(resolve, 3_100));
  await client.mutation(api.places.answer, { token, sessionId: visit.sessionId, option: journeyScene("clinica")!.answer });
  await client.mutation(api.players.finishJourney, { token, perspective: "self" });
  await page.addInitScript(value => localStorage.setItem("manoamano.session", value), token);
  return token;
}

async function spotlightFits(page: Page) {
  const box = await page.locator(".quick-tour").boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  const target = await page.locator(".driver-active-element").boundingBox();
  const topbar = await page.getByTestId("app-topbar").boundingBox();
  expect(target!.y).toBeGreaterThanOrEqual(topbar!.y + topbar!.height);
}

test("guía breve entre Casa, Mapa y envío, con regreso y repetición", async ({ page, browser }, info) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("dialog", () => { throw new Error("No deben aparecer confirmaciones nativas"); });
  const token = await account(page);
  await page.goto("/casa");
  const popover = page.locator(".quick-tour");
  await expect(popover).toContainText("1 de 3");
  await spotlightFits(page);
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(page).toHaveURL(/\/mapa$/);
  await expect(popover).toContainText("2 de 3");
  await spotlightFits(page);
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(page).toHaveURL(/\/casa$/);
  await expect(popover).toContainText("1 de 3");
  // The actual highlighted link works as well as the guide's button.
  await page.locator('[data-tour="map"]').click();
  await expect(popover).toContainText("2 de 3");
  await page.getByRole("button", { name: "¿Y cómo lo envío?", exact: true }).click();
  await expect(page).toHaveURL(/\/casa$/);
  await expect(popover).toContainText("3 de 3");
  await expect(page.locator(".driver-active-element")).toHaveAttribute("data-tour", "send");
  await spotlightFits(page);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/mapa$/);
  await expect(popover).toContainText("2 de 3");
  await expect(page.locator(".driver-active-element")).toHaveAttribute("data-tour", "rescue");
  await page.keyboard.press("ArrowRight");
  await expect(popover).toContainText("3 de 3");
  await expect(page.locator(".driver-active-element")).toHaveAttribute("data-tour", "send");
  await page.screenshot({ path: `docs/hackathon/${info.project.name}-guia-rapida.png` });
  await page.getByRole("button", { name: "¡Listo!", exact: true }).click();
  await expect(popover).toHaveCount(0);
  await expect.poll(async () => (await client.query(api.auth.me, { token }))?.quickTourCompletedAt).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Un lugar para ti. Un gesto para alguien." })).toBeVisible();
  await expect(popover).toHaveCount(0);

  const otherDevice = await browser.newContext({ viewport: page.viewportSize()! });
  await otherDevice.addInitScript(value => localStorage.setItem("manoamano.session", value), token);
  const other = await otherDevice.newPage();
  await other.goto("http://127.0.0.1:5173/casa");
  await expect(other.locator('[data-tour="send"]')).toBeVisible();
  await expect(other.locator(".quick-tour")).toHaveCount(0);
  await otherDevice.close();

  await page.goto("/perfil");
  await page.getByRole("link", { name: "Repetir guía rápida" }).click();
  await expect(popover).toContainText("1 de 3");
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await page.getByRole("button", { name: "¿Y cómo lo envío?", exact: true }).click();
  await page.locator('[data-tour="send"]').click();
  await expect(page).toHaveURL(/\/enviar$/);
  await expect(popover).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Escribe tu nota" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("no interrumpe accesos directos y permite saltar con teclado", async ({ page }) => {
  const token = await account(page);
  await page.goto("/apoyo");
  await expect(page.getByRole("heading", { name: "Opciones de apoyo" })).toBeVisible();
  await expect(page.locator(".quick-tour")).toHaveCount(0);
  await page.goto("/casa");
  await expect(page.locator(".quick-tour")).toContainText("1 de 3");
  await page.keyboard.press("Escape");
  await expect(page.locator(".quick-tour")).toHaveCount(0);
  await expect.poll(async () => (await client.query(api.auth.me, { token }))?.quickTourCompletedAt).toBeTruthy();
  await page.reload();
  await expect(page.locator('[data-tour="send"]')).toBeVisible();
  await expect(page.locator(".quick-tour")).toHaveCount(0);
  await page.goto("/perfil");
  await page.getByRole("link", { name: "Repetir guía rápida" }).click();
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await page.locator('[data-tour="rescue"]').click();
  await expect(page.locator(".quick-tour")).toHaveCount(0);
  await expect(page.getByTestId("rescue-reveal")).toBeVisible();
});

test("precarga el mapa y confirma el toque mientras una conexión lenta termina de cargar", async ({ page }, info) => {
  await account(page);
  let requested = false;
  let release: () => void = () => undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(?:src\/routes\/mapa\.tsx|assets\/mapa-[^/]+\.js)(?:\?.*)?$/, async route => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto("/casa", { waitUntil: "domcontentloaded" });
  const popover = page.locator(".quick-tour");
  await expect(popover).toContainText("1 de 3");
  // The download starts during step 1, before the user requests step 2.
  await expect.poll(() => requested).toBe(true);
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(page.getByRole("button", { name: "Abriendo mapa…", exact: true })).toBeDisabled();
  await expect(popover).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: "Saltar guía", exact: true })).toBeEnabled();
  release();
  await expect(popover).toContainText("2 de 3");
  await expect(page.locator(".driver-active-element")).toHaveAttribute("data-tour", "rescue");
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(popover).toContainText("1 de 3");
  const before = performance.now();
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(popover).toContainText("2 de 3");
  const elapsed = performance.now() - before;
  expect(elapsed).toBeLessThan(750);
  info.annotations.push({ type: "warm-transition-ms", description: `${Math.round(elapsed)}` });
  await page.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
});
