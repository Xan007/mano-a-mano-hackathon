export const NOTE_EFFECTS = [
  {
    id: "petalos",
    name: "Florecer",
    description: "Pétalos que bailan con el viento",
    color: "#e88da7",
  },
  {
    id: "confeti",
    name: "Celebración",
    description: "Una lluvia de papel de colores",
    color: "#eab54c",
  },
  {
    id: "burbujas",
    name: "Burbujas",
    description: "Pequeñas esferas tornasol",
    color: "#76c9cb",
  },
  {
    id: "orbita",
    name: "Tu universo",
    description: "Planetas y estrellas en órbita",
    color: "#a290dc",
  },
  {
    id: "ninguno",
    name: "En calma",
    description: "Solo tus palabras",
    color: "#c8bda6",
  },
  {
    id: "fuego",
    name: "Fuego",
    description: "Llamas suaves y brasas",
    color: "#ff793f",
  },
  {
    id: "hielo",
    name: "Hielo",
    description: "Cristales y copos flotantes",
    color: "#75d8f1",
  },
  {
    id: "estrellas",
    name: "Deseo",
    description: "Estrellas fugaces",
    color: "#b6a1ff",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Cintas de luz que fluyen",
    color: "#66dcb5",
  },
  {
    id: "corazones",
    name: "Cariño",
    description: "Corazones que suben",
    color: "#f197b3",
  },
  {
    id: "lluvia",
    name: "Lluvia",
    description: "Gotas sobre tu ventana",
    color: "#9cc4f8",
  },
  {
    id: "brillos",
    name: "Lucero",
    description: "Destellos lentos, sin flashes",
    color: "#e7bf64",
  },
] as const;
export type NoteEffectId = (typeof NOTE_EFFECTS)[number]["id"];
export function effectById(id?: string | null) {
  return NOTE_EFFECTS.find((effect) => effect.id === id) ?? NOTE_EFFECTS.find((effect) => effect.id === "ninguno")!;
}
