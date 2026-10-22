import { useSyncExternalStore } from "react";

export type SoundName =
  | "click" | "coin" | "openBox" | "search" | "page" | "message"
  | "rarity.comun" | "rarity.raro" | "rarity.epico" | "rarity.legendario"
  | "pass" | "success" | "error";

const FILES: Record<SoundName, string> = {
  click: "click.mp3",
  coin: "coin.mp3",
  openBox: "search.mp3",
  search: "search.mp3",
  page: "page.mp3",
  message: "message.mp3",
  "rarity.comun": "common.mp3",
  "rarity.raro": "rare.mp3",
  "rarity.epico": "epic.mp3",
  "rarity.legendario": "legendary.mp3",
  pass: "departure.mp3",
  success: "success.mp3",
  error: "error.mp3",
};
const STORAGE_KEY = "manoamano.sound";
const VOLUME = 0.22;
const MAX_ACTIVE = 4;
let context: AudioContext | null = null;
let master: GainNode | null = null;
let muted = true;
let initialized = false;
let generation = 0;
const listeners = new Set<() => void>();
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();
const failedAt = new Map<string, number>();
const lastPlayed = new Map<SoundName, number>();
const active = new Set<AudioBufferSourceNode>();

function readPreference() {
  if (initialized) return;
  initialized = true;
  try { muted = localStorage.getItem(STORAGE_KEY) !== "on"; } catch { muted = true; }
}

export function isMuted(): boolean {
  readPreference();
  return muted;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context || context.state === "closed") {
      const Ctor = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(context.destination);
    }
    if (context.state !== "running") void context.resume().catch(() => undefined);
    return context;
  } catch {
    // Audio is optional; an unavailable output must never interrupt a journey.
    return null;
  }
}

function load(file: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  const cached = buffers.get(file);
  if (cached) return Promise.resolve(cached);
  const loading = pending.get(file);
  if (loading) return loading;
  const failure = failedAt.get(file);
  if (failure !== undefined && performance.now() - failure < 10_000) return Promise.resolve(null);
  const request = fetch(`/audio/${file}`, { cache: "force-cache" })
    .then(response => {
      if (!response.ok) throw new Error("Sound unavailable");
      return response.arrayBuffer();
    })
    .then(data => ctx.decodeAudioData(data))
    .then(buffer => { buffers.set(file, buffer); failedAt.delete(file); return buffer; })
    .catch(() => { failedAt.set(file, performance.now()); return null; })
    .finally(() => pending.delete(file));
  pending.set(file, request);
  return request;
}

function preload(ctx: AudioContext) {
  // All twelve effects together weigh about 80 KB; fetch only after opting in.
  for (const file of new Set(Object.values(FILES))) void load(file, ctx);
}

function unlock() {
  if (isMuted() || document.visibilityState === "hidden") return;
  const ctx = ensureContext();
  if (ctx) preload(ctx);
}

export function setMuted(value: boolean) {
  readPreference();
  muted = value;
  generation++;
  try { localStorage.setItem(STORAGE_KEY, value ? "off" : "on"); } catch { /* Keep this visit's preference. */ }
  if (master && context) master.gain.setValueAtTime(value ? 0 : VOLUME, context.currentTime);
  if (value) {
    for (const source of active) { try { source.stop(); } catch { /* Already ended. */ } }
    active.clear();
  } else unlock();
  for (const listener of listeners) listener();
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

export function subscribeMuted(listener: () => void) {
  if (!listeners.size && typeof document !== "undefined") {
    // Unlock on a real gesture, including when sound was enabled last visit.
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof document !== "undefined") {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    }
  };
}

export function useMuted(): boolean {
  return useSyncExternalStore(subscribeMuted, isMuted, () => true);
}

function start(buffer: AudioBuffer, ctx: AudioContext, playbackRate = 1) {
  if (active.size >= MAX_ACTIVE) {
    const oldest = active.values().next().value;
    if (oldest) { try { oldest.stop(); } catch { /* Already ended. */ } active.delete(oldest); }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  source.connect(master ?? ctx.destination);
  active.add(source);
  source.onended = () => { active.delete(source); source.disconnect(); };
  source.start();
}

export function play(name: SoundName, options?: { playbackRate?: number }) {
  if (isMuted() || typeof document === "undefined" || document.visibilityState === "hidden") return;
  const now = performance.now();
  const cooldown = name === "click" ? 40 : 60;
  if (now - (lastPlayed.get(name) ?? -Infinity) < cooldown) return;
  const playbackRate = Math.max(0.75, Math.min(1.25, options?.playbackRate ?? 1));
  const ctx = ensureContext();
  if (!ctx) return;
  lastPlayed.set(name, now);
  const file = FILES[name];
  const cached = buffers.get(file);
  if (cached) { start(cached, ctx, playbackRate); return; }
  const requestedGeneration = generation;
  void load(file, ctx).then(buffer => {
    // Do not play an old cue after muting, changing tab or a slow download.
    if (!buffer || muted || generation !== requestedGeneration || document.visibilityState === "hidden" || performance.now() - now > 300) return;
    start(buffer, ctx, playbackRate);
  });
}
