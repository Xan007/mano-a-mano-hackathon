export const ALIAS_FIRST = [
  "Luna",
  "Sara",
  "Camilo",
  "Manuel",
  "Valentina",
  "Andrés",
  "Mariana",
  "Nicolás",
  "Salomé",
  "Tomás",
  "Isabela",
  "Emilio",
  "Lucía",
  "Mateo",
  "Antonia",
  "Simón",
  "Brisa",
  "Rocío",
  "Caney",
  "Guayabo",
  "Joropo",
  "Amanecer",
];

export const ALIAS_LAST = [
  "del Llano",
  "de la Vega",
  "del Güejar",
  "de la Selva",
  "del Amanecer",
  "de los Llanos",
  "de la Sierra",
  "del Caney",
  "del Meta",
  "de Arauca",
  "de Agua Verde",
  "del Río",
];

export function randomAliasCandidate(random: () => number = Math.random): string {
  const first = ALIAS_FIRST[Math.floor(random() * ALIAS_FIRST.length)];
  const last = ALIAS_LAST[Math.floor(random() * ALIAS_LAST.length)];
  return `${first} ${last}`;
}
