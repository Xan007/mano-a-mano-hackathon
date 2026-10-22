// Contactos cotejados con fuentes oficiales el 22 de octubre de 2026.
export const SUPPORT_CHANNELS = [
  {
    id: "local",
    name: "Yo Te Escucho",
    description:
      "Orientación en salud mental de Villavicencio, por llamada gratuita o WhatsApp.",
    contact: "01 8000 931 089",
    methods: "Línea gratuita y WhatsApp",
    hours: "24/7",
    cost: "Gratis",
    source: "Alcaldía de Villavicencio · Secretaría de Salud",
    sourceUrl:
      "https://villavicencio.gov.co/linea-emocional-yo-te-escucho-atendio-441-casos-en-salud-mental-durante-el-ultimo-trimestre/",
    hoursSource: "Ministerio de Salud · Directorio nacional",
    hoursSourceUrl:
      "https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/PP/ET/directorio-salud-mental-prevencion-suicidio-minsalud.pdf",
    checkedAt: "2026-10-22",
    verification:
      "Números y horario cotejados con fuentes oficiales; no se hicieron llamadas de prueba.",
    phone: "018000931089",
    whatsapp: "573163907010",
    offers:
      "Un canal para solicitar orientación y apoyo. Tú decides si quieres llamar o escribir.",
  },
  {
    id: "national",
    name: "Línea 106",
    description:
      "Servicio de orientación en salud mental: escucha, apoyo inicial e información.",
    contact: "106",
    methods: "Llamada",
    hours: "24/7",
    cost: "Gratis",
    source: "Ministerio de Salud y Protección Social",
    sourceUrl:
      "https://www.minsalud.gov.co/salud/publica/salud-mental/Paginas/linea-106.aspx",
    checkedAt: "2026-10-22",
    verification:
      "Información documental; no se realizaron llamadas de prueba.",
    phone: "106",
    whatsapp: null,
    offers:
      "Un profesional ofrece escucha, apoyo inicial y orientación. El Ministerio la describe como confidencial.",
  },
] as const;

export type Perspective = "self" | "others";

// Ideas opcionales; el jugador puede escribir su propia nota, moderada antes de publicar.
export const POSITIVE_NOTES = [
  "Te dejo un poquito de compañía para tu camino.",
  "No tienes que encontrar todas las respuestas hoy.",
  "Este peluche lleva un saludo amable para ti.",
  "Tu voz merece ser escuchada con respeto.",
  "Puedes ir a tu ritmo. Aquí va un abrazo de papel.",
  "Pedir orientación también es una opción para ti.",
] as const;

