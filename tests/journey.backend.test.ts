// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";
import { COMPANIONS } from "../config/catalog";
import { RESCUE_STAGES } from "../config/rescueStages";
import { journeyScene } from "../config/journey";
import { POSITIVE_NOTES } from "../config/support";
import { PLACE_CAPSULE_MIN_READ_MS } from "../config/places";

const modules = import.meta.glob("../convex/**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const { token } = await t.mutation(api.auth.createDemo, {});
  await t.action(api.players.setCompanion, {
    token,
    companion: COMPANIONS[0].id,
    alias: `Nube ${crypto
      .randomUUID()
      .replace(/[0-9-]/g, "")
      .slice(0, 8)}`,
  });
  await t.run(async (ctx) => {
    for (const rarity of ["comun", "raro", "epico", "legendario"] as const) {
      await ctx.db.insert("plushCatalog", {
        slug: `fixture_${rarity}`,
        species: "Charapa ficticia",
        outfit: "Llano",
        rarity,
        imagePath: "/plush/charapa.webp",
      });
    }
    await ctx.db.insert("players", {
      companion: COMPANIONS[0].id,
      alias: "Personaje de prueba",
      isNpc: true,
      tokens: 0,
    });
  });
  return { t, token };
}

async function rescue(
  t: ReturnType<typeof convexTest<typeof schema>>,
  token: string,
  perspective: "self" | "others" = "self",
) {
  const places = await t.query(api.places.list, { token });
  if (places?.places.find((place) => place.id === "clinica")?.rescued) {
    vi.advanceTimersByTime(31 * 60 * 1000);
  }
  const visit = await t.mutation(api.places.startVisit, {
    token,
    placeId: "clinica",
    perspective,
  });
  await t.run((ctx) =>
    ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 11_000 }),
  );
  await t.mutation(api.places.answer, {
    token,
    sessionId: visit.sessionId,
    option: journeyScene("clinica", perspective)!.answer,
  });
  return (await t.query(api.plush.getMyPlushes, { token }))[0];
}

describe("recorrido controlado de Mano a Mano", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("GROQ_API_KEY", "synthetic-test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      decision: "publish",
                      reason_code: "OK",
                    }),
                  },
                },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("crea un perfil sintético sin contraseña, correo ni Google", async () => {
    const { t, token } = await setup();
    const me = await t.query(api.auth.me, { token });
    expect(me?.username).toMatch(/^guest_/);
    expect(me?.alias).toBeTruthy();
    expect(me?.firstJourneyAt).toBeNull();
    const player = await t.run((ctx) => ctx.db.get(me!._id));
    expect(player?.passwordHash).toBeUndefined();
    expect(player?.clerkUserId).toBeUndefined();
  });

  it("habilita decisiones a los tres segundos, con control del servidor", async () => {
    expect(PLACE_CAPSULE_MIN_READ_MS).toBe(3000);
    const { t, token } = await setup();
    const visit = await t.mutation(api.places.startVisit, {
      token,
      placeId: "clinica",
      perspective: "self",
    });
    expect(visit.minReadMs).toBe(3000);
    await t.run((ctx) =>
      ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 2000 }),
    );
    await expect(
      t.mutation(api.places.answer, {
        token,
        sessionId: visit.sessionId,
        option: journeyScene("clinica")!.answer,
      }),
    ).rejects.toThrow();
    await t.run((ctx) =>
      ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 3100 }),
    );
    expect(
      (
        await t.mutation(api.places.answer, {
          token,
          sessionId: visit.sessionId,
          option: journeyScene("clinica")!.answer,
        })
      ).correct,
    ).toBe(true);
  });

  it("guarda el apodo elegido tras revisarlo y evita duplicados", async () => {
    const { t, token } = await setup();
    await t.action(api.players.updateAlias, { token, alias: "Luna de Papel" });
    expect((await t.query(api.auth.me, { token }))?.alias).toBe(
      "Luna de Papel",
    );
    const second = await t.mutation(api.auth.createDemo, {});
    await expect(
      t.action(api.players.setCompanion, {
        token: second.token,
        companion: COMPANIONS[0].id,
        alias: "Luna de Papel",
      }),
    ).rejects.toThrow(/ya está en uso/);
    expect(
      (await t.query(api.auth.me, { token: second.token }))?.companion,
    ).toBe("");
  });

  it("rechaza insultos y contacto sin llamar al proveedor ni cambiar el apodo", async () => {
    const { t, token } = await setup();
    const original = (await t.query(api.auth.me, { token }))?.alias;
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    for (const alias of [
      "h1jueputa",
      "p.u.t.a",
      "Nube 3001234567",
      "hola@example.com",
    ])
      await expect(
        t.action(api.players.updateAlias, { token, alias }),
      ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
    expect((await t.query(api.auth.me, { token }))?.alias).toBe(original);
  });

  it("no guarda un apodo si el filtro bloquea, falla o devuelve JSON inválido", async () => {
    const { t, token } = await setup();
    const original = (await t.query(api.auth.me, { token }))?.alias;
    for (const output of [
      null,
      { decision: "block", reason_code: "INSULT" },
      { decision: "publish" },
      { decision: "publish", reason_code: "OTHER" },
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                choices: [{ message: { content: JSON.stringify(output) } }],
              }),
              { status: 200 },
            ),
        ),
      );
      await expect(
        t.action(api.players.updateAlias, {
          token,
          alias: "Prueba del filtro",
        }),
      ).rejects.toThrow();
      expect((await t.query(api.auth.me, { token }))?.alias).toBe(original);
    }
  });

  it("requiere sesión y revisión para adoptar; no adopta si falla el filtro", async () => {
    const t = convexTest(schema, modules);
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await expect(
      t.action(api.players.setCompanion, {
        token: "invalid",
        companion: COMPANIONS[0].id,
        alias: "Nube de Papel",
      }),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
    const { token } = await t.mutation(api.auth.createDemo, {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    await expect(
      t.action(api.players.setCompanion, {
        token,
        companion: COMPANIONS[0].id,
        alias: "Nube de Papel",
      }),
    ).rejects.toThrow(/No pudimos revisar/);
    expect((await t.query(api.auth.me, { token }))?.companion).toBe("");
  });

  it("impide saltarse etapas y limita la rareza a la probabilidad de cada zona", async () => {
    const { t, token } = await setup();
    await expect(t.mutation(api.places.startVisit, { token, placeId: "muelle" })).rejects.toThrow(/Primero completa/);
    const actual = [];
    for (const stage of RESCUE_STAGES) {
      const visit = await t.mutation(api.places.startVisit, { token, placeId: stage.placeId });
      expect(stage.weights[visit.reward.rarity]).toBeGreaterThan(0);
      await t.run(ctx => ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 4000 }));
      const result = await t.mutation(api.places.answer, { token, sessionId: visit.sessionId, option: journeyScene(stage.placeId)!.answer });
      actual.push(result.plush?.rarity);
    }
    expect(actual).toHaveLength(RESCUE_STAGES.length);
    actual.forEach((rarity, index) => {
      expect(RESCUE_STAGES[index].weights[rarity!]).toBeGreaterThan(0);
    });
    vi.advanceTimersByTime(31 * 60 * 1000);
    const retry = await t.mutation(api.places.startVisit, { token, placeId: "clinica" });
    expect(retry.reward.rarity).toBe("comun");
    expect((await t.query(api.places.list, { token }))?.rescuedCount).toBe(8);
  });

  it("entrega exactamente el peluche reservado al abrir la historia", async () => {
    const { t, token } = await setup();
    const visit = await t.mutation(api.places.startVisit, {
      token,
      placeId: "clinica",
    });
    await t.run((ctx) =>
      ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 4000 }),
    );
    const result = await t.mutation(api.places.answer, {
      token,
      sessionId: visit.sessionId,
      option: journeyScene("clinica")!.answer,
    });
    expect(result.plush?.imagePath).toBe(visit.reward.imagePath);
    const session = await t.run((ctx) => ctx.db.get(visit.sessionId));
    const item = (await t.query(api.plush.getMyPlushes, { token }))[0];
    expect(item.catalogId).toBe(session?.rewardCatalogId);
  });

  it("guarda el efecto con la nota y cambiar el taller no altera notas previas", async () => {
    const { t, token } = await setup();
    const plush = await rescue(t, token);
    await t.mutation(api.noteStyles.selectEffect, { token, effectId: "hielo" });
    await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: "Un saludo amable para tu camino.",
    });
    await t.mutation(api.noteStyles.selectEffect, { token, effectId: "fuego" });
    const notes = await t.run((ctx) => ctx.db.query("notes").collect());
    expect(notes[0].effect).toBe("hielo");
    expect((await t.query(api.noteStyles.list, { token }))?.effect).toBe(
      "fuego",
    );
    await expect(
      t.mutation(api.noteStyles.selectEffect, {
        token,
        effectId: "inexistente",
      }),
    ).rejects.toThrow();
  });

  it("conversa normalmente sin imponer canales y conserva contexto limitado", async () => {
    const { t, token } = await setup();
    const outputs = [
      { topic: "conversation" },
      {
        text: "¡Hola! Me alegra conversar sobre el día y el juego.",
        link: "",
        label: "",
      },
      { safe: true },
    ];
    const request = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify(outputs.shift()) } },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", request);
    const reply = await t.action(api.moderation.guide, {
      token,
      question: "Hola, ¿cómo estás?",
      history: [{ role: "user", content: "Me gustan los peluches." }],
    });
    expect(reply.topic).toBe("conversation");
    expect(reply.text).toContain("¡Hola!");
    expect(reply.link).toBe("");
    expect(reply.sources).toHaveLength(0);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("explica una función concreta con texto revisado y solo enlaces de la app", async () => {
    const { t, token } = await setup();
    const outputs = [
      { topic: "notes" },
      {
        text: "Dentro de la libreta del peluche está la papelera de cada nota.",
        link: "/coleccion",
        label: "Mi colección",
      },
      { safe: true },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                { message: { content: JSON.stringify(outputs.shift()) } },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    const reply = await t.action(api.moderation.guide, {
      token,
      question: "¿Dónde está el botón de borrar?",
    });
    expect(reply.text).toContain("papelera");
    expect(reply.link).toBe("/coleccion");
  });

  it("descarta un consejo generado antes de mostrarlo y devuelve canales", async () => {
    const { t, token } = await setup();
    const outputs = [
      { topic: "conversation" },
      {
        text: "Debes tomar una pastilla y salir a caminar.",
        link: "",
        label: "",
      },
      { safe: false },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                { message: { content: JSON.stringify(outputs.shift()) } },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    const reply = await t.action(api.moderation.guide, {
      token,
      question: "Tengo una duda personal.",
    });
    expect(reply.topic).toBe("boundary");
    expect(reply.text).not.toContain("pastilla");
    expect(reply.link).toBe("/apoyo");
  });

  it("la guía solo devuelve respuestas revisadas y conserva el límite clínico", async () => {
    const { t, token } = await setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      topic: "boundary",
                      text: "Contenido inventado que nunca debe mostrarse",
                    }),
                  },
                },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    const reply = await t.action(api.moderation.guide, {
      token,
      question: "¿Qué tratamiento debo seguir?",
    });
    expect(reply.topic).toBe("boundary");
    expect(reply.text).toContain("No puedo evaluar");
    expect(reply.text).not.toContain("inventado");
    expect(reply.sources.length).toBe(2);
  });

  it("la guía detiene datos de contacto antes de consultar al proveedor", async () => {
    const { t, token } = await setup();
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    const reply = await t.action(api.moderation.guide, {
      token,
      question: "Mi teléfono de prueba es 3001234567",
    });
    expect(reply.topic).toBe("privacy");
    expect(request).not.toHaveBeenCalled();
  });

  it("limita las consultas de la guía y exige sesión", async () => {
    const { t, token } = await setup();
    await expect(
      t.action(api.moderation.guide, {
        token: "invalid",
        question: "¿Cómo juego?",
      }),
    ).rejects.toThrow();
    for (let index = 0; index < 8; index++)
      await t.mutation(internal.players.reserveGuide, { token });
    await expect(
      t.action(api.moderation.guide, { token, question: "¿Cómo juego?" }),
    ).rejects.toThrow(/Espera un momento/);
  });

  it("registra un reporte estructurado sin cuenta ni texto personal", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.places.reportChannel, {
      channelId: "local",
      reason: "source",
    });
    const reports = await t.query(internal.places.pendingChannelReports, {});
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      channelId: "local",
      reason: "source",
      synthetic: false,
      status: "pending",
    });
  });

  it("exige el primer rescate y no permite saltarse el onboarding desde el backend", async () => {
    const { t, token } = await setup();
    await expect(
      t.mutation(api.players.finishJourney, { token, perspective: "self" }),
    ).rejects.toThrow();
    await rescue(t, token);
    await t.mutation(api.players.finishJourney, { token, perspective: "self" });
    expect((await t.query(api.auth.me, { token }))?.firstJourneyAt).toBeTypeOf(
      "number",
    );
  });

  it.each(["self", "others"] as const)(
    "evalúa la perspectiva %s sin duplicar el primer rescate",
    async (perspective) => {
      const { t, token } = await setup();
      const visit = await t.mutation(api.places.startVisit, {
        token,
        placeId: "clinica",
        perspective,
      });
      expect(visit.capsule.prompt).toBe(
        journeyScene("clinica", perspective)!.prompt,
      );
      await expect(
        t.mutation(api.places.answer, {
          token,
          sessionId: visit.sessionId,
          option: journeyScene("clinica", perspective)!.answer,
        }),
      ).rejects.toThrow();
      await t.run((ctx) =>
        ctx.db.patch(visit.sessionId, { startedAt: Date.now() - 11_000 }),
      );
      const wrong = await t.mutation(api.places.answer, {
        token,
        sessionId: visit.sessionId,
        option: "Opción incorrecta",
      });
      expect(wrong.correct).toBe(false);
      expect(await t.query(api.plush.getMyPlushes, { token })).toHaveLength(0);
      await t.mutation(api.places.answer, {
        token,
        sessionId: visit.sessionId,
        option: journeyScene("clinica", perspective)!.answer,
      });
      await rescue(t, token, perspective);
      expect(await t.query(api.plush.getMyPlushes, { token })).toHaveLength(2);
    },
  );

  it("rechaza datos personales, permite notas propias y conserva gratis", async () => {
    const { t, token } = await setup();
    const another = await t.mutation(api.auth.createDemo, {});
    await t.action(api.players.setCompanion, {
      token: another.token,
      companion: COMPANIONS[0].id,
      alias: `Nube ${crypto
        .randomUUID()
        .replace(/[0-9-]/g, "")
        .slice(0, 8)}`,
    });
    const recipient = await t.query(api.auth.me, {token:another.token});
    await t.run(ctx=>ctx.db.patch(recipient!._id,{firstJourneyAt:Date.now(),lastSeenAt:Date.now()}));
    const plush = await rescue(t, token);
    await expect(
      t.action(api.plush.send, {
        token,
        plushId: plush._id,
        note: "Mi teléfono es 3001234567",
      }),
    ).rejects.toThrow();
    vi.spyOn(Math, "random").mockReturnValue(0);
    await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: "Que tu camino tenga espacio para cosas bonitas.",
    });
    await t.run(ctx => ctx.db.patch(plush._id, { hopsTarget: 1 }));
    const transit = await t.run(async (ctx) => {
      const result = await ctx.db.query("transits").first();
      const holder = await ctx.db.get(result!.holderId);
      const note = await ctx.db.query("notes").first();
      return { result, holder, note };
    });
    expect(transit.holder?.isNpc).toBe(false);
    expect(transit.note?.permanent).toBe(true);
    await t.action(api.plush.pass, {token:another.token,transitId:transit.result!._id,note:"Tu historia también merece un lugar amable."});
    const notes = await t.query(api.notes.byPlush, {
      token,
      plushId: plush._id,
    });
    expect(notes.length).toBeGreaterThan(1);
    expect(notes.every((note) => note.permanent)).toBe(true);
  });

  it("si es la única persona, deja el peluche en espera y lo devuelve con la nota tras 48 horas", async () => {
    const { t, token } = await setup();
    await t.run(ctx => ctx.db.insert("appSettings", { key: "public_demo", enabled: false, updatedAt: Date.now() }));
    const plush = await rescue(t, token);

    const result = await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: "Que encuentres un momento tranquilo hoy.",
    });
    expect(result.returned).toBe(false);

    let current = (await t.query(api.plush.getMyPlushes, { token }))[0];
    expect(current.status).toBe("traveling");
    expect(current.waitingSince).toBeTypeOf("number");
    expect(await t.run((ctx) => ctx.db.query("transits").collect())).toHaveLength(0);
    expect(await t.run((ctx) => ctx.db.query("notes").withIndex("by_plush", (q) => q.eq("plushId", plush._id)).collect())).toHaveLength(1);

    await t.run((ctx) => ctx.db.patch(plush._id, {
      waitingSince: Date.now() - 48 * 60 * 60 * 1000,
    }));
    await t.mutation(internal.plush.retryDelivery, { plushId: plush._id });

    current = (await t.query(api.plush.getMyPlushes, { token }))[0];
    expect(current.status).toBe("returned");
    expect(current.waitingSince).toBeUndefined();
    expect(await t.run((ctx) => ctx.db.query("notes").withIndex("by_plush", (q) => q.eq("plushId", plush._id)).collect())).toHaveLength(1);
  });

  it("impide que otra cuenta lea, reporte o marque notas ajenas", async () => {
    const { t, token } = await setup();
    const plush = await rescue(t, token);
    await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: POSITIVE_NOTES[0],
    });
    const note = await t.run((ctx) => ctx.db.query("notes").first());
    const outsider = await t.mutation(api.auth.createDemo, {});
    expect(
      await t.query(api.notes.byPlush, {
        token: outsider.token,
        plushId: plush._id,
      }),
    ).toEqual([]);
    await expect(
      t.mutation(api.notes.report, {
        token: outsider.token,
        noteId: note!._id,
      }),
    ).rejects.toThrow();
    await expect(
      t.mutation(api.notes.toggleLike, {
        token: outsider.token,
        noteId: note!._id,
      }),
    ).rejects.toThrow();
  });
  it("no publica ni termina el recorrido si Groq falla", async () => {
    const { t, token } = await setup();
    const plush = await rescue(t, token);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    await expect(
      t.action(api.plush.send, {
        token,
        plushId: plush._id,
        note: "Que hoy encuentres una sonrisa.",
        finishJourneyPerspective: "self",
      }),
    ).rejects.toThrow(/No pudimos revisar/);
    expect((await t.query(api.plush.getMyPlushes, { token }))[0].status).toBe(
      "collection",
    );
    expect((await t.query(api.auth.me, { token }))?.firstJourneyAt).toBeNull();
    expect(await t.run((ctx) => ctx.db.query("notes").collect())).toHaveLength(
      0,
    );
  });

  it("respeta el bloqueo de la IA sin publicar la nota", async () => {
    const { t, token } = await setup();
    const plush = await rescue(t, token);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      decision: "block",
                      reason_code: "INSULT",
                    }),
                  },
                },
              ],
            }),
            { status: 200 },
          ),
      ),
    );
    await expect(
      t.action(api.plush.send, {
        token,
        plushId: plush._id,
        note: "Mensaje sintético para probar el bloqueo",
      }),
    ).rejects.toThrow(/Revisa tu nota/);
    expect(await t.run((ctx) => ctx.db.query("notes").collect())).toHaveLength(
      0,
    );
  });

  it("envía a una persona activa antes que un NPC y termina el onboarding en la misma transacción", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { t, token } = await setup();
    const recipient = await t.mutation(api.auth.createDemo, {});
    await t.action(api.players.setCompanion, {
      token: recipient.token,
      companion: COMPANIONS[0].id,
      alias: `Nube ${crypto
        .randomUUID()
        .replace(/[0-9-]/g, "")
        .slice(0, 8)}`,
    });
    const receiver = await t.query(api.auth.me, { token: recipient.token });
    await t.run((ctx) =>
      ctx.db.patch(receiver!._id, {
        firstJourneyAt: Date.now(),
        lastSeenAt: Date.now(),
      }),
    );
    const plush = await rescue(t, token);
    await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: "Que hoy encuentres un momento bonito.",
      finishJourneyPerspective: "others",
    });
    const mailbox = await t.query(api.mailbox.today, {
      token: recipient.token,
    });
    expect(mailbox?.plush._id).toBe(plush._id);
    expect(mailbox?.firstNote?.body).toBe(
      "Que hoy encuentres un momento bonito.",
    );
    expect(mailbox?.firstNote?.isNpc).toBe(false);
    const me = await t.query(api.auth.me, { token });
    expect(me?.firstJourneyAt).toBeTypeOf("number");
    expect(me?.journeyPerspective).toBe("others");
  });

  it("mantiene los NPC disponibles aunque haya personas activas en la demo compartida", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const { t, token } = await setup();
    const recipient = await t.mutation(api.auth.createDemo, {});
    const receiver = await t.query(api.auth.me, { token: recipient.token });
    await t.run((ctx) => ctx.db.patch(receiver!._id, {
      companion: COMPANIONS[0].id,
      firstJourneyAt: Date.now(),
      lastSeenAt: Date.now(),
    }));
    const plush = await rescue(t, token);
    await t.action(api.plush.send, {
      token,
      plushId: plush._id,
      note: "Que encuentres una pausa amable en este camino.",
      finishJourneyPerspective: "others",
    });
    const transit = await t.run((ctx) => ctx.db
      .query("transits")
      .withIndex("by_plush", (q) => q.eq("plushId", plush._id))
      .filter((q) => q.eq(q.field("state"), "holding"))
      .first());
    const holder = await t.run((ctx) => transit ? ctx.db.get(transit.holderId) : null);
    expect(holder?.isPublicNpc).toBe(true);
    expect(transit?.dueAt).toBeGreaterThan(Date.now());
    await t.mutation(internal.plush.npcPass, { transitId: transit!._id });
    const npcNote = await t.run(async (ctx) => {
      const note = await ctx.db.query("notes")
        .withIndex("by_plush", (q) => q.eq("plushId", plush._id))
        .filter((q) => q.gt(q.field("hopIndex"), 0))
        .first();
      const author = note ? await ctx.db.get(note.authorId) : null;
      return { note, author };
    });
    expect(npcNote.note?.isPublicDemo).toBe(true);
    expect(npcNote.author?.isPublicNpc).toBe(true);
  });

  it("recuerda la guía por cuenta sin completarla antes del primer rescate", async () => {
    const { t, token } = await setup();
    await expect(t.mutation(api.players.finishQuickTour, { token })).rejects.toThrow("Completa tu primera historia.");
    await rescue(t, token);
    await t.mutation(api.players.finishJourney, { token, perspective: "self" });
    await t.mutation(api.players.finishQuickTour, { token });
    const completed = (await t.query(api.auth.me, { token }))!.quickTourCompletedAt;
    expect(completed).toBeTypeOf("number");
    vi.advanceTimersByTime(1_000);
    await t.mutation(api.players.finishQuickTour, { token });
    expect((await t.query(api.auth.me, { token }))!.quickTourCompletedAt).toBe(completed);
    const other = await t.mutation(api.auth.createGuest, {});
    expect((await t.query(api.auth.me, { token: other.token }))!.quickTourCompletedAt).toBeNull();
    await expect(t.mutation(api.players.finishQuickTour, { token: "invalid" })).rejects.toThrow();
  });

  it("muestra todo el historial y limita el buzón a dos peluches", async () => {
    const { t, token } = await setup();
    const me = await t.query(api.auth.me, { token });
    await t.run(async ctx=>{
      await ctx.db.patch(me!._id,{isDemo:true,demoOwnerId:me!._id});
      const npc=await ctx.db.query("players").filter(q=>q.eq(q.field("isNpc"),true)).first();
      await ctx.db.patch(npc!._id,{isDemo:true,demoOwnerId:me!._id});
    });

    expect((await t.mutation(api.mailbox.ensureDaily, { token })).created).toBe(
      true,
    );
    const legacyStop = await t.run((ctx) =>
      ctx.db
        .query("notes")
        .filter((q) => q.eq(q.field("hopIndex"), 1))
        .first(),
    );
    await t.run((ctx) => ctx.db.delete(legacyStop!._id));
    expect((await t.mutation(api.mailbox.ensureDaily, { token })).created).toBe(
      false,
    );
    expect((await t.query(api.mailbox.list, { token }))[0].allNotes).toHaveLength(
      2,
    );
    await t.run((ctx) => ctx.db.patch(me!._id, { lastMailboxAt: 0 }));
    expect((await t.mutation(api.mailbox.ensureDaily, { token })).created).toBe(
      true,
    );
    await t.run((ctx) => ctx.db.patch(me!._id, { lastMailboxAt: 0 }));
    expect((await t.mutation(api.mailbox.ensureDaily, { token })).created).toBe(
      false,
    );

    const inbox = await t.query(api.mailbox.list, { token });
    expect(inbox).toHaveLength(2);
    expect(inbox.every((visit) => visit.allNotes.length === 2)).toBe(true);
    expect(
      inbox.every(
        (visit) =>
          visit.allNotes.map((note) => note.hopIndex).join(",") === "0,1",
      ),
    ).toBe(true);
  });
});
