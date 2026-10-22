import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { createHash } from "node:crypto";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { ACCOUNT_ISSUER } from "../config/auth";
const modules = import.meta.glob("../convex/**/*.ts");
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let jwk: Awaited<ReturnType<typeof exportJWK>>;
beforeAll(async()=>{ pair=await generateKeyPair("RS256");jwk=await exportJWK(pair.publicKey);jwk.kid="account-test-key"; });
beforeEach(()=>{
 vi.stubEnv("GROQ_API_KEY","synthetic-test-key");
 vi.stubEnv("CLERK_SECRET_KEY", "");
 vi.stubGlobal("fetch",vi.fn(async(input: RequestInfo | URL)=>String(input).startsWith(ACCOUNT_ISSUER) ? new Response(JSON.stringify({keys:[jwk]}),{status:200}) : new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({decision:"publish",reason_code:"OK"})}}]}),{status:200})));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
const password="Clave ficticia 2026!";
async function jwt(overrides: {origin?: string; issuer?: string; expiry?: string}={}) {
 return await new SignJWT({azp:overrides.origin??"https://mano-a-mano.pages.dev"}).setProtectedHeader({alg:"RS256",kid:"account-test-key"}).setSubject("google-test-user").setIssuer(overrides.issuer??ACCOUNT_ISSUER).setIssuedAt().setExpirationTime(overrides.expiry??"5m").sign(pair.privateKey);
}
describe("Cuentas recuperables",()=>{
 it("vincula al invitado sin cambiar mascota, progreso ni sesión y permite entrar desde otra sesión",async()=>{
  const t=convexTest(schema,modules);const guest=await t.mutation(api.auth.createDemo,{});const before=await t.query(api.auth.me,guest);
  await t.run(ctx=>ctx.db.patch(before!._id,{companion:"chiguiro",firstJourneyAt:1234,xp:12}));
  const saved=await t.action(api.credentials.signUp,{username:"Nube Azul",password,guestToken:guest.token});expect(saved.token).toBe(guest.token);
  const stored=await t.run(ctx=>ctx.db.get(before!._id));expect(stored?.passwordHash).toMatch(/^scrypt\$/);expect(stored?.passwordHash).not.toContain(password);expect(stored?.passwordSalt).toHaveLength(32);
  await t.mutation(api.auth.signOut,guest);expect(await t.query(api.auth.me,guest)).toBeNull();
  const recovered=await t.action(api.credentials.signIn,{username:"  NUBE AZUL ",password});const me=await t.query(api.auth.me,{token:recovered.token});
  expect(me?._id).toBe(before!._id);expect(me?.companion).toBe("chiguiro");expect(me?.firstJourneyAt).toBe(1234);expect(me?.xp).toBe(12);expect(me?.hasPassword).toBe(true);expect(me).not.toHaveProperty("passwordHash");
 });
 it("rechaza contraseña incorrecta y no permite reemplazar credenciales ya guardadas",async()=>{
  const t=convexTest(schema,modules);const saved=await t.action(api.credentials.signUp,{username:"Charapa Azul",password});
  await expect(t.action(api.credentials.signIn,{username:"Charapa Azul",password:"incorrecta"})).rejects.toThrow(/incorrectos/);
  await expect(t.action(api.credentials.signUp,{username:"Otro Nombre",password,guestToken:saved.token})).rejects.toThrow(/ya tiene contraseña/);
 });
 it("valida longitud, apodo y unicidad normalizada incluso con registros simultáneos",async()=>{
  const t=convexTest(schema,modules);
  await expect(t.action(api.credentials.signUp,{username:"Luna",password:"corta"})).rejects.toThrow(/10 a 128/);
  await expect(t.action(api.credentials.signUp,{username:"h1jueputa",password})).rejects.toThrow(/insultos/);
  const results=await Promise.allSettled([t.action(api.credentials.signUp,{username:"Estrella Clara",password}),t.action(api.credentials.signUp,{username:"estrella clara",password})]);expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
 });
 it("bloquea el noveno intento fallido y no filtra si existe el apodo",async()=>{
  const t=convexTest(schema,modules);
  for(let i=0;i<8;i++)await expect(t.action(api.credentials.signIn,{username:"Nadie",password:"falsa"})).rejects.toThrow(/incorrectos/);
  await expect(t.action(api.credentials.signIn,{username:"Nadie",password:"falsa"})).rejects.toThrow(/Demasiados/);
 },15_000);
 it("migra el hash antiguo después de verificar la contraseña",async()=>{
  const t=convexTest(schema,modules);const salt="legacy-test-salt";const old=createHash("sha256").update(`${salt}:${password}`).digest("hex");
  const id=await t.run(ctx=>ctx.db.insert("players",{username:"anterior",alias:"Anterior",passwordHash:old,passwordSalt:salt,isNpc:false,companion:"garza",tokens:0}));
  const result=await t.action(api.credentials.signIn,{username:"Anterior",password});expect((await t.query(api.auth.me,result))?._id).toBe(id);expect((await t.run(ctx=>ctx.db.get(id)))?.passwordHash).toMatch(/^scrypt\$/);
 });
 it("verifica Google y conserva el recorrido; otro navegador recupera la misma identidad",async()=>{
  const t=convexTest(schema,modules);const guest=await t.mutation(api.auth.createDemo,{});const before=await t.query(api.auth.me,guest);
  const credential=await jwt();const saved=await t.action(api.credentials.google,{credential,guestToken:guest.token});expect(saved.token).toBe(guest.token);expect((await t.query(api.auth.me,{token:saved.token}))?.hasGoogle).toBe(true);
  const recovered=await t.action(api.credentials.google,{credential});expect((await t.query(api.auth.me,{token:recovered.token}))?._id).toBe(before?._id);
 });
 it("no fusiona ni sobrescribe el invitado cuando Google ya tiene otro recorrido",async()=>{
  const t=convexTest(schema,modules);const credential=await jwt();const original=await t.action(api.credentials.google,{credential});const guest=await t.mutation(api.auth.createDemo,{});const before=await t.query(api.auth.me,guest);
  const other=await t.action(api.credentials.google,{credential,guestToken:guest.token});expect(other.linked).toBe(false);expect((await t.query(api.auth.me,{token:other.token}))?._id).toBe((await t.query(api.auth.me,{token:original.token}))?._id);expect((await t.query(api.auth.me,guest))?._id).toBe(before?._id);expect((await t.query(api.auth.me,guest))?.hasGoogle).toBe(false);
 });
 it("rechaza Google falsificado, caducado, de otro emisor o de otro sitio",async()=>{
  const t=convexTest(schema,modules);
  for(const credential of ["falso",await jwt({expiry:"-1s"}),await jwt({issuer:"https://otro.invalid"}),await jwt({origin:"https://otro.invalid"})])await expect(t.action(api.credentials.google,{credential})).rejects.toThrow(/verificar Google/);
 });
 it("obtiene el correo administrador del usuario verificado en Clerk y no de un campo enviado por el navegador",async()=>{
  vi.stubEnv("CLERK_SECRET_KEY","synthetic-backend-secret");
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL)=>String(input).startsWith(ACCOUNT_ISSUER) ? new Response(JSON.stringify({keys:[jwk]})) : new Response(JSON.stringify({id:"google-test-user",primary_email_address_id:"primary",email_addresses:[{id:"primary",email_address:"sierrasander29@gmail.com",verification:{status:"verified"}}]}))));
  const t=convexTest(schema,modules);const result=await t.action(api.credentials.google,{credential:await jwt()});
  expect((await t.query(api.auth.me,{token:result.token}))?.staffRole).toBe("admin");
  expect((await t.query(api.admin.access,{token:result.token}))?.email).toBe("sierrasander29@gmail.com");
 });
 it("un correo no verificado no da permisos administrativos",async()=>{
  vi.stubEnv("CLERK_SECRET_KEY","synthetic-backend-secret");
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL)=>String(input).startsWith(ACCOUNT_ISSUER) ? new Response(JSON.stringify({keys:[jwk]})) : new Response(JSON.stringify({id:"google-test-user",primary_email_address_id:"primary",email_addresses:[{id:"primary",email_address:"sierrasander29@gmail.com",verification:{status:"unverified"}}]}))));
  const t=convexTest(schema,modules);const result=await t.action(api.credentials.google,{credential:await jwt()});
  expect((await t.query(api.auth.me,{token:result.token}))?.staffRole).toBeNull();
  expect(await t.query(api.admin.access,{token:result.token})).toBeNull();
 });
});
