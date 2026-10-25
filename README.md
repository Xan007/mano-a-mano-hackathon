# Mano a Mano

Mano a Mano es una experiencia web interactiva que usa historias urbanas, peluches viajeros y mensajes positivos para acercar a los jóvenes a la conversación sobre salud mental y a los canales de apoyo disponibles.

La aplicación no diagnostica, prescribe ni reemplaza la atención profesional. Su propósito es educativo: facilitar una primera exploración, promover la empatía y mostrar dónde pedir ayuda.

**Aplicación:** [mano-a-mano.pages.dev](https://mano-a-mano.pages.dev)

## La experiencia

El recorrido está diseñado para entenderse rápido y sentirse cercano:

1. La persona elige una mascota y crea su apodo.
2. Explora un mapa ilustrado de Villavicencio y rescata peluches.
3. Conoce historias ficticias ambientadas en lugares urbanos de la ciudad.
4. Escribe mensajes positivos y los envía de viaje a otra persona.
5. Guarda las notas recibidas en la libreta de cada peluche.
6. Consulta los canales de apoyo desde la aplicación o con el asistente.

Las historias muestran situaciones cotidianas y cómo se siente cada personaje. Las notas pasan por una revisión automática, incluyen una confirmación de privacidad y pueden ser reportadas para revisión humana.

## Decisiones de UX/UI

- Onboarding breve, progresivo y con una guía visual sobre el mapa y los controles principales.
- Jerarquía clara: una acción principal por pantalla y textos cortos antes de revelar información detallada.
- Mapa con territorios que recuperan el color al desbloquearse y un contador para volver a explorar una zona.
- Animaciones suaves, sonido opcional y soporte para movimiento reducido.
- Diseño responsive para móvil y escritorio, con navegación persistente y controles accesibles.
- Notas personalizables con fondos, decoraciones y efectos, manteniendo la lectura como prioridad.
- Estados visibles para viajes, buzón, colección, moderación y disponibilidad de apoyo.

## Funcionalidades principales

- Viajes de peluches entre participantes, con reintentos cuando no hay destinatarios disponibles.
- Demo compartida con personajes ficticios identificados y una demo privada para presentación.
- Chatbot que explica cómo usar la app y muestra información de apoyo cuando se solicita; no ofrece consejos clínicos.
- Reputación de notas, reportes y panel de moderación con revisión, retiro, suspensión y auditoría.
- Acceso con Google o cuenta local, con permisos administrativos validados en el servidor.
- Evolución de peluches repetidos mediante copias de la misma especie, sin fichas ni monedas.

## Tecnología

React 19 · TypeScript · Vite · Tailwind CSS · Motion · React Router · Convex · Clerk · Groq · Vitest · Playwright

Convex gestiona la persistencia, los viajes, las notas, la moderación y las tareas programadas. Clerk gestiona la autenticación. Groq se utiliza para la clasificación y el asistente bajo reglas editoriales del producto.

## Desarrollo local

```powershell
npm install
npm run dev
```

Para ejecutar el backend local de Convex y el frontend aislado:

```powershell
.\scripts\start-local-validation.ps1
$env:VITE_CONVEX_URL = 'http://127.0.0.1:3210'
npm run dev -- --host 127.0.0.1 --port 5173
```

Las variables públicas del frontend son `VITE_CONVEX_URL` y `VITE_CLERK_PUBLISHABLE_KEY`. Los secretos (`GROQ_API_KEY` y `CLERK_SECRET_KEY`) deben permanecer únicamente en Convex.

## Verificación y despliegue

```powershell
npm test
npm run build
npm run lint
npx wrangler pages deploy dist --project-name mano-a-mano --branch main --commit-dirty=true
```

## Documentación

- [Operación y moderación](docs/OPERACION.md)
- [Evidencias y límites del prototipo](docs/EVIDENCIAS_TRL4.md)
- [Guion del pitch](docs/PITCH.md)
- [Declaración del equipo](docs/DECLARACION_EQUIPO.md)
- [Licencias y terceros](LICENSES.md)
- [Fuentes y preparación del audio](docs/SONIDOS.md)

## Trabajo del equipo

El producto se diseñó, implementó y validó durante los días **20, 21 y 22 de octubre de 2026**. El repositorio reúne el resultado de ese sprint: una experiencia funcional, una interfaz cuidada y las herramientas necesarias para operar y moderar el sistema.

