// Traced against the supplied 1774 x 887 illustration, in a 1000 x 500 plane.
// Shared edges follow the avenue, side streets and the bridge axis.
export const CITY_TERRITORIES = [
  { slug: "clinica", name: "VIVA", x: .13, y: .17, ax: .13, ay: .17,
    polygon: "0,0 258,0 262,60 258,135 258,176 0,176" },
  { slug: "torre", name: "Unicentro", x: .38, y: .17, ax: .38, ay: .17,
    polygon: "258,0 500,0 500,176 258,176 258,135 262,60" },
  { slug: "biblioteca", name: "Éxito", x: .62, y: .17, ax: .62, ay: .17,
    polygon: "500,0 740,0 734,70 740,176 500,176" },
  { slug: "iglesia", name: "Salida del cole", x: .87, y: .17, ax: .87, ay: .17,
    polygon: "740,0 1000,0 1000,176 740,176 734,70" },
  { slug: "plaza", name: "El centro", x: .63, y: .49, ax: .63, ay: .49,
    polygon: "500,176 740,176 754,270 775,360 850,500 500,500" },
  { slug: "parque", name: "Parque del barrio", x: .13, y: .65, ax: .13, ay: .65,
    polygon: "0,176 258,176 255,275 235,349 224,420 220,500 0,500" },
  { slug: "puente", name: "Parada del bus", x: .39, y: .65, ax: .39, ay: .65,
    polygon: "258,176 500,176 500,500 220,500 224,420 235,349 255,275" },
  { slug: "muelle", name: "De vuelta a casa", x: .88, y: .63, ax: .88, ay: .63,
    polygon: "740,176 1000,176 1000,500 850,500 775,360 754,270" },
] as const;

export function cityTerritory(id: string) {
  return CITY_TERRITORIES.find(territory => territory.slug === id);
}

