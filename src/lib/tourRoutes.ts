// Share the same import promises between preloading and React.lazy.
let casa: Promise<typeof import("../routes/casa")> | undefined;
let mapa: Promise<typeof import("../routes/mapa")> | undefined;

export const loadCasa = () => casa ??= import("../routes/casa");
export const loadMapa = () => mapa ??= import("../routes/mapa");

export function preloadTourRoutes() {
  return Promise.all([loadCasa(), loadMapa()]);
}
