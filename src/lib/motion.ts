import { useReducedMotion } from "motion/react";

export function useCalmMotion() {
  return Boolean(useReducedMotion());
}
