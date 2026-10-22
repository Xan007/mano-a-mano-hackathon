export type CoverMotion = "petals" | "embers" | "fireflies" | "rain" | "sun" | "none";

export type CoverDef = {
  id: string;
  name: string;
  description: string;
  image: string;
  motion: CoverMotion;
  cost: number;
};

export const DEFAULT_COVER = "ninguno";
export const STARTER_COVERS = ["ninguno", "cerezo", "flores", "fogata", "noche", "llano", "lluvia", "mar", "bosque", "nubes", "dunas"];

export const NOTE_COVERS: CoverDef[] = [
  { id: "mar", name: "Mar", description: "Olas y agua turquesa.", image: "/covers/mar.webp", motion: "none", cost: 0 },
  { id: "bosque", name: "Bosque", description: "Verde entre la neblina.", image: "/covers/bosque.webp", motion: "fireflies", cost: 0 },
  { id: "nubes", name: "Nubes", description: "Un cielo en tonos rosados.", image: "/covers/nubes.webp", motion: "none", cost: 0 },
  { id: "dunas", name: "Dunas", description: "Arena y luz cálida.", image: "/covers/dunas.webp", motion: "sun", cost: 0 },
  {
    id: "ninguno",
    name: "Sin fondo",
    description: "Sin imagen de fondo.",
    image: "",
    motion: "none",
    cost: 0,
  },
  {
    id: "cerezo",
    name: "Cerezo",
    description: "Pétalos que caen despacio.",
    image: "/covers/cerezo.jpg",
    motion: "petals",
    cost: 0,
  },
  {
    id: "flores",
    name: "Jardín",
    description: "Flores que se mueven con el viento.",
    image: "/covers/flores.jpg",
    motion: "petals",
    cost: 0,
  },
  {
    id: "fogata",
    name: "Fogata",
    description: "Fuego y chispas que suben.",
    image: "/covers/fogata.jpg",
    motion: "embers",
    cost: 0,
  },
  {
    id: "noche",
    name: "Noche",
    description: "Estrellas y luciérnagas.",
    image: "/covers/noche.jpg",
    motion: "fireflies",
    cost: 0,
  },
  {
    id: "llano",
    name: "Atardecer",
    description: "El sol del Llano al fondo.",
    image: "/covers/llano.jpg",
    motion: "sun",
    cost: 0,
  },
  {
    id: "lluvia",
    name: "Lluvia",
    description: "Gotas y aire fresco.",
    image: "/covers/lluvia.jpg",
    motion: "rain",
    cost: 0,
  },
];

export function coverById(id: string | null | undefined): CoverDef {
  return NOTE_COVERS.find((cover) => cover.id === id) ?? NOTE_COVERS.find((cover) => cover.id === DEFAULT_COVER)!;
}
