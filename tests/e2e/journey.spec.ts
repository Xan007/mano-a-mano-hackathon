import { test, expect } from "@playwright/test";

test("apoyo directo y breve, sin bibliografía ni contacto automático", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/apoyo");
  await expect(
    page.getByRole("heading", { name: "Opciones de apoyo" }),
  ).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(2);
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(1);
  await expect(page.locator('a[href*=".pdf"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /kickoff|consulta documental|bibliografía/i,
  );
  await page
    .getByRole("button", { name: "¿El contacto no funciona?" })
    .first()
    .click();
  await expect(
    page.getByText("Gracias. Revisaremos el contacto."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-apoyo.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("apodo propio, historia animada, viaje, apoyo sin salir de Casa y mapa sencillo", async ({
  page, browser,
}, info) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.getByRole("link", { name: "Ver opciones de apoyo sin cuenta" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Empezar mi recorrido" }).click();
  await page.getByRole("button", { name: /Chigüiro/ }).click();
  const alias = `Chiguiro_${crypto
    .randomUUID()
    .replace(/[0-9-]/g, "")
    .slice(0, 8)}`;
  await page
    .getByRole("textbox", { name: "¿Cómo quieres que te llamen?" })
    .fill("h1jueputa");
  await page.getByRole("button", { name: "Adoptar a Chigüiro" }).click();
  await expect(page.getByText("Elige un apodo sin insultos.")).toBeVisible();
  await page
    .getByRole("textbox", { name: "¿Cómo quieres que te llamen?" })
    .fill(alias);
  await page.getByRole("button", { name: "Adoptar a Chigüiro" }).click();
  await expect(
    page.getByRole("heading", { name: "Vamos por tu primer peluche" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rescatar mi primer peluche" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Buscando al peluche perdido..." })).toBeVisible();
  const reveal = page.getByTestId("rescue-reveal");
  await expect(reveal).toHaveAttribute("data-phase", "intro");
  await expect(page.getByLabel("Escena 1 de 2")).toHaveCount(0);
  await expect(reveal).toHaveAttribute("data-phase", "search");
  await expect(reveal).toHaveAttribute("data-phase", "locked");
  const revealedImage = await reveal.locator("svg image").first().getAttribute("href");
  await expect(reveal).toHaveAttribute("data-phase", "color");
  await expect(page.getByTestId("rescue-color-image")).toHaveAttribute("href", revealedImage!);
  await expect(page.getByTestId("rescue-particle")).toHaveCount(20);
  await page.waitForTimeout(350);
  await page.screenshot({path: `docs/hackathon/${info.project.name}-busqueda-color.png`});
  await expect(page.getByLabel("Escena 1 de 2")).toBeVisible();
  await expect(page.locator("dialog")).toHaveCount(0);
  const reward = page.getByTestId("story-reward");
  await expect(reward).toHaveAttribute("src", /plush/);
  const rewardImage = await reward.getAttribute("src");
  expect(rewardImage).toBe(revealedImage);
  await expect(page.locator('a[href*=".pdf"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Seguir la historia", exact: true })
    .click();
  await expect(page.getByLabel("Escena 2 de 2")).toBeVisible();

  await page.getByRole("button", { name: "Ayudar y rescatar" }).click();
  await page
    .getByRole("button", {
      name: "Consultar el WhatsApp de Yo Te Escucho",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Un nuevo compañero de viaje" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").locator(`img[src="${rewardImage}"]`),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar mi recorrido" }).click();
  await page
    .getByRole("textbox", { name: "Escribe tu nota" })
    .fill("Que hoy encuentres una sonrisa en tu camino.");
  await page
    .getByRole("button", { name: "Enviar mi peluche", exact: true })
    .click();
  const privacyCheck = page.getByRole("dialog", { name: "Revisa tu nota" });
  await expect(privacyCheck).toContainText(
    "Evita tu dirección, teléfono u otros datos que te identifiquen.",
  );
  await expect(privacyCheck).toContainText(
    "Que hoy encuentres una sonrisa en tu camino.",
  );
  await expect(page.getByTestId("travel-plush")).toHaveCount(0);
  await privacyCheck.getByRole("button", { name: "Volver a editar" }).click();
  await expect(privacyCheck).not.toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Escribe tu nota" }),
  ).toHaveValue("Que hoy encuentres una sonrisa en tu camino.");
  await page
    .getByRole("button", { name: "Enviar mi peluche", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(privacyCheck).not.toBeVisible();
  await page
    .getByRole("button", { name: "Enviar mi peluche", exact: true })
    .click();
  await privacyCheck.getByRole("button", { name: "Sí, enviar" }).click();
  const confirmed = page.getByText("Envío confirmado", { exact: true });
  const failedReview = page
    .getByRole("alert")
    .filter({ hasText: "No pudimos revisar tu nota ahora" });
  await expect(confirmed.or(failedReview)).toBeVisible({ timeout: 20_000 });
  if (await failedReview.isVisible()) {
    await expect(
      page.getByRole("textbox", { name: "Escribe tu nota" }),
    ).toHaveValue("Que hoy encuentres una sonrisa en tu camino.");
    await page
      .getByRole("button", { name: "Enviar mi peluche", exact: true })
      .click();
    await privacyCheck.getByRole("button", { name: "Sí, enviar" }).click();
  }
  await expect(confirmed).toBeVisible({ timeout: 20_000 });
  const samples = await page.getByTestId("travel-plush").evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const xs: number[] = [];
        const start = performance.now();
        let last = -100;
        function sample(now: number) {
          if (now - last >= 90) {
            const bounds = element.getBoundingClientRect();
            xs.push(bounds.x + bounds.width / 2);
            last = now;
          }
          if (now - start < 1100) requestAnimationFrame(sample);
          else resolve(xs);
        }
        requestAnimationFrame(sample);
      }),
  );
  expect(samples.length).toBeGreaterThan(5);
  expect(samples.at(-1)! - samples[0]).toBeGreaterThan(35);
  const jumps = samples
    .slice(1)
    .map((x, index) => Math.abs(x - samples[index]));
  expect(Math.max(...jumps)).toBeLessThan(
    info.project.name === "mobile" ? 80 : 130,
  );
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-viaje.png`,
  });
  const home = page.getByRole("heading", {
    name: "Un lugar para ti. Un gesto para alguien.",
  });
  const unavailable = page
    .getByRole("alert")
    .filter({ hasText: "No pudimos revisar tu nota ahora" });
  const saveStep = page.getByRole("heading", { name: "Guarda tu recorrido", exact: true });
  await expect(saveStep.or(unavailable)).toBeVisible({ timeout: 35_000 });
  const providerFailed = await unavailable.isVisible();
  if (providerFailed) {
    info.annotations.push({
      type: "provider-unavailable",
      description:
        "Groq no disponible: se verificó conservación del texto y continuación sin publicar.",
    });
    await expect(
      page.getByRole("textbox", { name: "Escribe tu nota" }),
    ).toHaveValue("Que hoy encuentres una sonrisa en tu camino.");
    await page
      .getByRole("button", { name: "Enviar después", exact: true })
      .click();
  }
  await expect(saveStep).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar mi cuenta", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ahora no, entrar a Casa", exact: true }).click();
  await expect(home).toBeVisible();
  await page.getByRole("button", { name: "Saltar guía", exact: true }).click();
  await expect(page.locator(".quick-tour")).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-casa.png`,
    fullPage: true,
  });
  if (!providerFailed) {
    const world = page.getByRole("region", { name: "Tus peluches en camino" });
    await expect(world).toBeVisible();
    await expect(world.getByRole("progressbar").first()).toHaveAttribute("aria-valuemax", "7");
    await expect(world.locator(".travel-orbit-photo")).toHaveCount(1);
    await world.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/peluche\//);
    await page.goto("/casa");
    await expect(home).toBeVisible();
  }
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await page
    .getByRole("button", { name: "¿Cómo viajan los peluches?", exact: true })
    .click();
  await expect(page.getByTestId("guide-reply").last()).toContainText(
    /colecci[oó]n|peluche/i,
  );
  await page
    .getByRole("textbox", { name: "Tu pregunta para la guía" })
    .fill("¿Qué medicamento debo tomar?");
  await page.getByRole("button", { name: "Enviar pregunta" }).click();
  await expect(page.getByRole("log")).toContainText(
    "No puedo evaluar cómo estás",
  );
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-guia.png`,
  });
  await page.getByRole("button", { name: "Cerrar guía" }).click();
  await page.getByRole("button", { name: "¿Buscas apoyo?" }).click();
  await expect(
    page.getByRole("dialog", { name: "Opciones de apoyo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Opciones de apoyo" }),
  ).toHaveCSS("opacity", "1");
  await expect(page).toHaveURL(/\/casa$/);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(2);
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-apoyo-casa.png`,
  });
  await page.getByRole("button", { name: "Cerrar apoyo" }).click();
  await expect(home).toBeVisible();
  await page.getByRole("link", { name: /Para mí Conoce tus opciones/ }).click();
  await expect(
    page.getByRole("button", { name: "Rescatar un peluche", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Para mí", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Para acompañar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Para acompañar", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-mapa.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Rescatar un peluche", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Historia ficticia · Para acompañar"),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-historia.png`,
  });
  await page.getByRole("button", { name: "Cerrar historia" }).click();
  await page.goto("/taller");
  await expect(
    page.getByRole("heading", { name: "Tu estudio de notas" }),
  ).toBeVisible();
  for (const effect of ["Fuego", "Hielo", "Deseo"]) {
    await page.getByRole("button", { name: new RegExp(`^${effect} `) }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(`^${effect} `) }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".note-decor")).toBeVisible();
  }
  await page.screenshot({
    path: `docs/hackathon/${info.project.name}-taller.png`,
    fullPage: true,
  });
  await page.evaluate(()=>window.scrollTo(0,700));
  await expect.poll(async()=>{
    const preview=await page.getByTestId("note-sticky-preview").boundingBox();
    const header=await page.getByTestId("app-topbar").boundingBox();
    return preview && header ? Math.abs(preview.y-(header.y+header.height+8)) : 999;
  }).toBeLessThan(5);
  await page.screenshot({path:`docs/hackathon/${info.project.name}-taller-sticky.png`});
  await page.goto("/apoyo");
  await expect(page.getByTestId("app-topbar")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Opciones de apoyo"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Volver",exact:true})).toHaveCount(0);
  const dock=page.getByTestId("app-bottom-dock");
  if(info.project.name==="mobile") {
    await expect(dock).toBeHidden();
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await expect(dock).toBeVisible();
    await page.screenshot({path:`docs/hackathon/${info.project.name}-apoyo-navegacion.png`});
    await page.evaluate(()=>window.scrollTo(0,0));
    await expect(dock).toBeHidden();
  } else await expect(page.getByRole("navigation",{name:"Secciones"})).toBeVisible();
  await page.goto("/taller");

  await page.reload();
  await expect(page.getByRole("button", { name: /^Deseo / })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/perfil");
  await expect(
    page.getByRole("textbox", { name: "Tu apodo", exact: true }),
  ).toHaveValue(alias);
  const updatedAlias = alias.replace("Chiguiro", "Charapa");
  await page
    .getByRole("textbox", { name: "Tu apodo", exact: true })
    .fill(updatedAlias);
  await page.getByRole("button", { name: "Guardar apodo" }).click();
  await expect(page.getByText("Apodo guardado.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Tu apodo", exact: true }),
  ).toHaveValue(updatedAlias);
  await page.goto("/coleccion");
  await expect(
    page.getByRole("heading", { name: "Mi colección" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mi colección" }),
  ).toBeVisible();
  const ownedIds = await page.locator('a[href^="/peluche/"]').evaluateAll(links=>links.map(link=>link.getAttribute("href")).sort());
  await page.goto("/perfil");
  const guestSession = await page.evaluate(()=>localStorage.getItem("manoamano.session"));
  await page.getByRole("button",{name:"Guardar mi cuenta · opcional"}).click();
  await expect(page.getByRole("dialog",{name:"Guarda tu recorrido"})).toBeVisible();
  await page.getByRole("button",{name:"Usar apodo y contraseña",exact:true}).click();
  await page.getByRole("textbox",{name:"Apodo para entrar"}).fill(updatedAlias);
  const secret = `Prueba-${crypto.randomUUID()}`;
  await page.getByLabel("Contraseña",{exact:true}).fill(secret);
  await page.getByRole("button",{name:"Guardar cuenta",exact:true}).click();
  await expect(page.getByText(/Cuenta guardada/)).toBeVisible({timeout:20000});
  expect(await page.evaluate(()=>localStorage.getItem("manoamano.session"))).toBe(guestSession);
  await page.getByRole("button",{name:"Salir de mi sesión"}).click();
  await expect(page.getByRole("button",{name:"Ya tengo una cuenta"})).toBeVisible();
  const otherContext=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL??"http://127.0.0.1:5173",viewport:page.viewportSize()!,reducedMotion:"reduce"});
  try {
    const other=await otherContext.newPage();await other.goto("/");
    await other.getByRole("button",{name:"Ya tengo una cuenta"}).click();
    await other.getByRole("button",{name:"Usar apodo y contraseña",exact:true}).click();
    await other.getByRole("textbox",{name:"Apodo para entrar"}).fill(updatedAlias);
    await other.getByLabel("Contraseña",{exact:true}).fill("Una contraseña incorrecta");
    await other.getByRole("button",{name:"Entrar a mi cuenta"}).click();
    await expect(other.getByRole("alert")).toContainText("Apodo o contraseña incorrectos.");
    await other.getByLabel("Contraseña",{exact:true}).fill(secret);
    await other.getByRole("button",{name:"Entrar a mi cuenta"}).click();
    await expect(other.getByRole("heading",{name:"Un lugar para ti. Un gesto para alguien."})).toBeVisible();
    await other.goto("/perfil");
    await expect(other.getByRole("textbox",{name:"Tu apodo",exact:true})).toHaveValue(updatedAlias);
    await other.goto("/coleccion");await expect(other.getByRole("heading",{name:"Mi colección"})).toBeVisible();
    await expect.poll(async()=>await other.locator('a[href^="/peluche/"]').evaluateAll(links=>links.map(link=>link.getAttribute("href")).sort())).toEqual(ownedIds);
  } finally {await otherContext.close();}
  expect(errors).toEqual([]);
});
