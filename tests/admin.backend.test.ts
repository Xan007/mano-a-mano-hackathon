// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { OWNER_EMAIL, DEMO_MESSAGES, NOTE_MAX_CHARS, LIVE_HOLD_MS } from "../config/operations";
import { scaled } from "../convex/lib/time";
const modules = import.meta.glob("../convex/**/*.ts");
async function setup() {
  const t=convexTest(schema,modules);
  const owner=await t.mutation(api.auth.createDemo,{});
  const me=await t.query(api.auth.me,owner);
  await t.run(ctx=>ctx.db.patch(me!._id,{verifiedEmail:OWNER_EMAIL,identityVerifiedAt:Date.now(),clerkUserId:"synthetic-owner",companion:"chiguiro",firstJourneyAt:Date.now()}));
  return {t,owner,ownerId:me!._id};
}
describe("Administración, separación de entornos y moderación",()=>{
  beforeEach(()=>vi.useFakeTimers());
  afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllEnvs();});
  it("deniega todas las operaciones del equipo a invitados y a un apodo que imita el correo administrador",async()=>{
    const {t}=await setup();const guest=await t.mutation(api.auth.createDemo,{});const me=await t.query(api.auth.me,guest);
    await t.run(ctx=>ctx.db.patch(me!._id,{alias:OWNER_EMAIL,username:OWNER_EMAIL}));
    expect(await t.query(api.admin.access,guest)).toBeNull();
    await expect(t.query(api.admin.overview,guest)).rejects.toThrow(/permisos/);
    await expect(t.mutation(api.admin.setDemo,{...guest,enabled:true})).rejects.toThrow(/permisos/);
    await expect(t.mutation(api.admin.setModerator,{...guest,email:"equipo@example.com",active:true})).rejects.toThrow(/permisos/);
  });
  it("concede y revoca moderación inmediatamente en una sesión existente, sin permitir que el moderador delegue ni active demo",async()=>{
    const {t,owner}=await setup();const mod=await t.mutation(api.auth.createDemo,{});const me=await t.query(api.auth.me,mod);
    await t.run(ctx=>ctx.db.patch(me!._id,{verifiedEmail:"equipo@example.com",clerkUserId:"synthetic-mod"}));
    await t.mutation(api.admin.setModerator,{...owner,email:" Equipo@Example.com ",active:true});
    expect((await t.query(api.admin.access,mod))?.role).toBe("moderator");
    await expect(t.mutation(api.admin.setModerator,{...mod,email:"otro@example.com",active:true})).rejects.toThrow(/permisos/);
    await expect(t.mutation(api.admin.setDemo,{...mod,enabled:true})).rejects.toThrow(/permisos/);
    await t.mutation(api.admin.setModerator,{...owner,email:"equipo@example.com",active:false});
    expect(await t.query(api.admin.access,mod)).toBeNull();
    await expect(t.query(api.admin.overview,mod)).rejects.toThrow(/permisos/);
  });
  it("crea una presentación decorada independiente y regresa a la misma cuenta y progreso reales",async()=>{
    const {t,owner,ownerId}=await setup();
    await t.mutation(api.admin.setDemo,{...owner,enabled:true});
    const demo=await t.query(api.auth.me,owner);
    expect(demo?._id).not.toBe(ownerId);expect(demo?.isDemo).toBe(true);expect(demo?.staffRole).toBe("admin");
    const inbox=await t.query(api.mailbox.list,owner);expect(inbox).toHaveLength(2);expect(inbox.every(x=>x.allNotes.length===4)).toBe(true);
    const collection=await t.query(api.plush.getMyPlushes,owner);expect(collection.filter(p=>p.status==="returned")).toHaveLength(3);expect(collection.filter(p=>p.status==="traveling")).toHaveLength(3);
    const book=await t.query(api.notes.byPlush,{...owner,plushId:collection.find(p=>p.status==="returned")!._id});
    expect(book.length).toBeGreaterThanOrEqual(7);expect(book.every(n=>n.body.length>140&&n.body.length<=NOTE_MAX_CHARS&&n.cover&&n.effect)).toBe(true);
    await t.mutation(api.admin.setDemo,{...owner,enabled:false});
    expect((await t.query(api.auth.me,owner))?._id).toBe(ownerId);expect(await t.query(api.plush.getMyPlushes,owner)).toHaveLength(0);
    await t.mutation(api.admin.setDemo,{...owner,enabled:true});expect((await t.query(api.auth.me,owner))?._id).toBe(demo?._id);
    expect(DEMO_MESSAGES.every(m=>m.length>140&&m.length<=NOTE_MAX_CHARS)).toBe(true);
  });
  it("no crea NPC ni buzones ficticios en producción, aunque exista DEMO_TIME_SCALE",async()=>{
    vi.stubEnv("DEMO_TIME_SCALE","999999");
    const {t,owner}=await setup();expect(scaled(LIVE_HOLD_MS)).toBe(LIVE_HOLD_MS);
    expect(await t.mutation(api.mailbox.ensureDaily,owner)).toEqual({created:false});
    expect(await t.query(api.mailbox.list,owner)).toEqual([]);
    expect(await t.run(ctx=>ctx.db.query("players").filter(q=>q.eq(q.field("isNpc"),true)).collect())).toHaveLength(0);
  });
  it("pone el envío en espera sin destinatario real y nunca lo entrega a los personajes de la demo",async()=>{
    const {t,owner}=await setup();await t.mutation(api.admin.setDemo,{...owner,enabled:true});await t.mutation(api.admin.setDemo,{...owner,enabled:false});
    const me=await t.query(api.auth.me,owner);
    const item=await t.run(async ctx=>{const catalog=await ctx.db.query("plushCatalog").first();return await ctx.db.insert("plushItems",{originId:me!._id,catalogId:catalog!._id,status:"collection",hopCount:0,hopsTarget:7,createdAt:Date.now()});});
    await t.mutation(internal.plush.commitSend,{...owner,plushId:item,note:"Que hoy encuentres un momento amable."});
    const stored=await t.run(ctx=>ctx.db.get(item));expect(stored?.status).toBe("traveling");expect(stored?.waitingSince).toBeTypeOf("number");
    expect(await t.run(ctx=>ctx.db.query("transits").withIndex("by_plush",q=>q.eq("plushId",item)).collect())).toHaveLength(0);
  });
  it("suspende una sesión ya abierta, impide acciones y restaura el acceso sin borrar el progreso",async()=>{
    const {t,owner,ownerId}=await setup();const guest=await t.mutation(api.auth.createDemo,{});const person=await t.query(api.auth.me,guest);
    await t.mutation(api.admin.banUser,{...owner,playerId:person!._id,banned:true,reason:"Incumplimiento revisado en un escenario ficticio"});
    expect((await t.query(api.auth.me,guest))?.bannedAt).toBeTypeOf("number");
    await expect(t.mutation(api.players.touch,guest)).rejects.toThrow();
    expect(await t.query(api.plush.getMyPlushes,guest)).toEqual([]);
    await t.mutation(api.admin.banUser,{...owner,playerId:person!._id,banned:false,reason:"Revisión finalizada"});
    expect((await t.query(api.auth.me,guest))?.bannedAt).toBeNull();await t.mutation(api.players.touch,guest);
    await expect(t.mutation(api.admin.banUser,{...owner,playerId:ownerId,banned:true,reason:"Prueba ficticia"})).rejects.toThrow(/protegida/);
  });
  it("retira y restaura una nota con efectos reales sobre la libreta e historial auditable",async()=>{
    const {t,owner}=await setup();await t.mutation(api.admin.setDemo,{...owner,enabled:true});
    const item=(await t.query(api.plush.getMyPlushes,owner)).find(p=>p.status==="returned")!;
    const before=await t.query(api.notes.byPlush,{...owner,plushId:item._id});const note=before[0];
    await t.mutation(api.admin.moderateNote,{...owner,noteId:note._id,status:"pending",reason:"Revisión ficticia de privacidad"});
    expect((await t.query(api.notes.byPlush,{...owner,plushId:item._id})).some(n=>n._id===note._id)).toBe(false);
    await t.mutation(api.admin.moderateNote,{...owner,noteId:note._id,status:"removed",reason:"Contenido retirado en prueba controlada"});
    await t.mutation(api.admin.moderateNote,{...owner,noteId:note._id,status:"published",reason:"Contenido editorial revisado"});
    expect((await t.query(api.notes.byPlush,{...owner,plushId:item._id})).some(n=>n._id===note._id)).toBe(true);
    const history=await t.query(api.admin.activity,{...owner,paginationOpts:{numItems:20,cursor:null}});expect(history.page.filter(r=>r.target===note._id)).toHaveLength(3);
  });
  it("resuelve reportes de contacto sin modificar el número automáticamente",async()=>{
    const {t,owner}=await setup();await t.mutation(api.places.reportChannel,{channelId:"national",reason:"contact"});
    const reports=await t.query(api.admin.channelReports,{...owner,paginationOpts:{numItems:10,cursor:null}});expect(reports.page).toHaveLength(1);
    await t.mutation(api.admin.resolveChannelReport,{...owner,reportId:reports.page[0]._id,status:"resolved",reason:"Fuente documental verificada, caso sintético"});
    const after=await t.query(api.admin.channelReports,{...owner,paginationOpts:{numItems:10,cursor:null}});expect(after.page[0].status).toBe("resolved");
    expect((await t.query(api.channels.list,{})).find(c=>c.id==="national")?.phone).toBe("106");
  });
  it("el panel nunca devuelve hashes, sales ni sesiones de los usuarios",async()=>{
    const {t,owner,ownerId}=await setup();await t.run(ctx=>ctx.db.patch(ownerId,{passwordHash:"synthetic-hash",passwordSalt:"synthetic-salt"}));
    const detail=await t.query(api.admin.userDetail,{...owner,playerId:ownerId});
    expect(detail?.player).not.toHaveProperty("passwordHash");expect(detail?.player).not.toHaveProperty("passwordSalt");
    const own=await t.query(api.players.getMe,owner);expect(own).not.toHaveProperty("passwordHash");expect(own).not.toHaveProperty("passwordSalt");
  });
  it("reinicia solamente la presentación y deja intactos los registros de personas reales",async()=>{
    const {t,owner,ownerId}=await setup();const other=await t.mutation(api.auth.createDemo,{});const real=await t.query(api.auth.me,other);
    await t.mutation(api.admin.setDemo,{...owner,enabled:true});const before=await t.query(api.auth.me,owner);
    await t.mutation(api.admin.resetDemo,owner);const after=await t.query(api.auth.me,owner);
    expect(after?._id).not.toBe(before?._id);expect(await t.query(api.mailbox.list,owner)).toHaveLength(2);
    expect(await t.run(ctx=>ctx.db.get(ownerId))).not.toBeNull();expect(await t.run(ctx=>ctx.db.get(real!._id))).not.toBeNull();
    await t.mutation(api.admin.setDemo,{...owner,enabled:false});expect((await t.query(api.auth.me,owner))?._id).toBe(ownerId);
  });
  it("usa 48 horas reales para visitas y no entrega a personas suspendidas",async()=>{
    const {t,owner,ownerId}=await setup();await t.mutation(api.admin.setDemo,{...owner,enabled:true});await t.mutation(api.admin.setDemo,{...owner,enabled:false});
    const recipient=await t.mutation(api.auth.createDemo,{});const me=await t.query(api.auth.me,recipient);
    await t.run(ctx=>ctx.db.patch(me!._id,{companion:"garza",firstJourneyAt:Date.now(),lastSeenAt:Date.now()}));
    const plushId=await t.run(async ctx=>{const catalog=await ctx.db.query("plushCatalog").first();return await ctx.db.insert("plushItems",{originId:ownerId,catalogId:catalog!._id,status:"collection",hopCount:0,hopsTarget:7,createdAt:Date.now()});});
    await t.mutation(internal.plush.commitSend,{...owner,plushId,note:"Un saludo amable para tu camino."});
    const inbox=await t.query(api.mailbox.list,recipient);expect(inbox).toHaveLength(1);
    const transit=await t.run(ctx=>ctx.db.get(inbox[0].transitId));expect(transit!.dueAt-transit!.receivedAt).toBe(LIVE_HOLD_MS);
    await t.mutation(api.admin.banUser,{...owner,playerId:me!._id,banned:true,reason:"Prueba de exclusión de destinatarios"});
    expect(await t.query(api.mailbox.list,recipient)).toEqual([]);
  });
  it("las tareas antiguas no adelantan una visita cuyo plazo todavía no venció",async()=>{
    const {t,owner,ownerId}=await setup();await t.mutation(api.admin.setDemo,{...owner,enabled:true});await t.mutation(api.admin.setDemo,{...owner,enabled:false});
    const recipient=await t.mutation(api.auth.createDemo,{});const me=await t.query(api.auth.me,recipient);
    await t.run(ctx=>ctx.db.patch(me!._id,{companion:"garza",firstJourneyAt:Date.now(),lastSeenAt:Date.now()}));
    const plushId=await t.run(async ctx=>{const catalog=await ctx.db.query("plushCatalog").first();return await ctx.db.insert("plushItems",{originId:ownerId,catalogId:catalog!._id,status:"collection",hopCount:0,hopsTarget:7,createdAt:Date.now()});});
    await t.mutation(internal.plush.commitSend,{...owner,plushId,note:"Que hoy encuentres una sonrisa."});
    const transit=(await t.query(api.mailbox.list,recipient))[0];
    await t.mutation(internal.plush.autoPass,{transitId:transit.transitId});
    expect((await t.run(ctx=>ctx.db.get(transit.transitId)))?.state).toBe("holding");
    await t.run(ctx=>ctx.db.patch(transit.transitId,{dueAt:Date.now()-1}));
    await t.mutation(internal.plush.autoPass,{transitId:transit.transitId});
    expect((await t.run(ctx=>ctx.db.get(transit.transitId)))?.state).toBe("auto_passed");
  });
  it("solo administración edita contactos, guarda fuente y fecha, y bloquea cambios reales desde demo",async()=>{
    const {t,owner}=await setup();
    const fields={channelId:"national" as const,phone:"106",whatsapp:"",hours:"24/7",cost:"Gratis",paused:true,sourceUrl:"https://www.minsalud.gov.co/",verifiedAt:"2026-10-21",reason:"Caso sintético de mantenimiento"};
    await t.mutation(api.admin.updateChannel,{...owner,...fields});
    const current=(await t.query(api.channels.list,{})).find(c=>c.id==="national");expect(current?.paused).toBe(true);expect(current?.sourceUrl).toBe(fields.sourceUrl);expect(current?.checkedAt).toBe(fields.verifiedAt);
    const mod=await t.mutation(api.auth.createDemo,{});const person=await t.query(api.auth.me,mod);await t.run(ctx=>ctx.db.patch(person!._id,{verifiedEmail:"editor@example.com"}));
    await t.mutation(api.admin.setModerator,{...owner,email:"editor@example.com",active:true});
    await expect(t.mutation(api.admin.updateChannel,{...mod,...fields})).rejects.toThrow(/permisos/);
    await t.mutation(api.admin.setDemo,{...owner,enabled:true});
    await expect(t.mutation(api.admin.updateChannel,{...owner,...fields})).rejects.toThrow(/producción/);
  });
});
