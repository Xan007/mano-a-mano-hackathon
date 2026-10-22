import { DEMO_HOLD_MS, LIVE_HOLD_MS } from "../../config/operations";

// A deployment environment variable must never accelerate real participants.
export const scaled = (ms: number, demo = false): number =>
  demo ? Math.max(1000, Math.round(ms * DEMO_HOLD_MS / LIVE_HOLD_MS)) : ms;
