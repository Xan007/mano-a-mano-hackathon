# Evidencias de validación controlada

Actualizado: 22 de octubre de 2026. Los resultados fechados abajo corresponden a sus ensayos originales. Alcance: funcionamiento de software con datos sintéticos. No son pruebas con público ni evidencias de beneficio clínico. Los resultados deben acompañarse de los archivos de prueba y del ensayo del equipo.

## Casos y resultados de backend

Comando reproducible: npm test. La suite actual contiene 101 pruebas en 12 archivos; usa Convex en memoria y respuestas simuladas del proveedor cuando corresponde.

| Caso | Entrada/escenario | Resultado comprobado |
|---|---|---|
| Identidad administrativa | JWT válido y correo verificado obtenido de Clerk | Acceso de administración |
| Suplantación por apodo | Invitado con apodo igual al correo principal | Acceso denegado |
| Correo no verificado | Respuesta de Clerk sin verificación | Sin permisos administrativos |
| Delegación | Moderador intenta crear otro moderador o activar demo | Operación denegada |
| Revocación | Retiro de permiso con sesión existente | Consultas administrativas denegadas |
| Separación de demo | Activar, usar y desactivar presentación | Misma cuenta y progreso reales al salir |
| Reinicio | Regenerar escenario sintético | Participantes reales conservados |
| Plazos reales | DEMO_TIME_SCALE elevado y visita real | 1 hora; variable antigua ignorada |
| Sin participantes disponibles | Enviar teniendo solo personajes de demo disponibles | En espera, sin tránsito a NPC |
| Buzón real | Entrar sin envíos de otra persona | No genera mensajes sintéticos |
| Suspensión | Suspender cuenta con sesión abierta | Bloqueo de acciones; recuperación al restablecer |
| Moderación humana | Revisar, retirar y volver a publicar nota | Cambia visibilidad y queda historial |
| Contacto reportado | Resolver reporte con motivo | Estado actualizado sin cambiar teléfono automáticamente |
| Datos sensibles técnicos | Consultar ficha administrativa y perfil | Sin hashes, sales ni sesiones |
| Notas | Texto propio, PII, bloqueo y fallo de Groq | Publicación controlada y borrador conservado |
| Historial | Hasta dos visitas y varias notas por libreta | Orden completo y capacidad respetada |
| Rescates | Historias, perspectiva, rareza, lectura y duplicación | Recompensa reservada y controles del servidor |

Las pruebas de cuentas verifican JWT, emisor, origen y caducidad con claves sintéticas. Las consultas a Clerk se simulan: no prueban el consentimiento de una persona real. Las pruebas de moderación no miden precisión semántica de la IA.

## Pruebas de navegador

El recorrido existente está en tests/e2e/journey.spec.ts y se ejecuta con npx playwright test. No contacta líneas de apoyo. Verifica apoyo público, reporte, onboarding, historia, nota, confirmación, viaje y persistencia en móvil y escritorio.

Se añadió una comprobación del panel contra el backend local aislado, con roles y perfiles ficticios. Casos: activar y reiniciar demo; tres viajeros en Casa; dos libretas en Buzón; revisar nota; suspender y restablecer usuario; resolver reporte; conceder y revocar moderación en sesión abierta; comprobar ausencia de desbordamiento horizontal.

Se retiraron las capturas de pantalla del repositorio para mantenerlo ligero. Los escenarios descritos son reproducibles con los comandos y datos sintéticos indicados; el equipo debe registrar el ensayo final antes de presentar.

Resultado del 21 de octubre: **100/100 pruebas de lógica/backend, 6/6 pruebas de navegador del recorrido y comprobación del panel completa en escritorio y celular**. El recorrido de navegador tardó 2,2 minutos; no es una medida de latencia de la app. Las pruebas del panel cubrieron activación y reinicio de demo, colección y buzón, revisión de nota, suspensión/restablecimiento, reportes y revocación inmediata.

Ampliación con guía rápida: **101/101 pruebas de lógica/backend y 4/4 pruebas de navegador de la guía**, con `npx playwright test tests/e2e/quick-tour.spec.ts --workers=1`. Cubren PC y celular, navegación entre Casa y Mapa, avance con los botones reales, regreso con teclado, cierre, repetición desde Perfil y persistencia entre navegadores. La guía espera los datos y el botón visible de la nueva pantalla; tocar Rescatar o Enviar permite continuar incluso durante su animación. La compilación pasa y React Doctor conserva su puntuación anterior de 73.

Optimización del 22 de octubre: **6/6 pruebas de navegador de la guía**. Se añadió una descarga del mapa retenida deliberadamente para comprobar la precarga antes del toque, la respuesta inmediata del botón y la posibilidad de cerrar mientras carga. Con el mapa precargado, la transición se comprueba por debajo de 750 ms en ambos tamaños de pantalla; no representa una garantía para cualquier conexión. Se mantienen las comprobaciones de navegación, teclado y persistencia. Compilación correcta y React Doctor: 73.

Verificación del repositorio el 22 de octubre: **106/106 pruebas automatizadas** (`npm test`) y compilación de producción correcta (`npm run build`). La suite también valida que la rareza obtenida esté permitida por las probabilidades de cada zona; no espera una secuencia aleatoria fija.

Migración del deployment compartido: se archivaron 10 perfiles automáticos y 563 notas sintéticas antiguas; no se eliminaron cuentas ni colecciones reales. No había visitas activas que necesitaran reprogramación en ese momento. La variable histórica DEMO_TIME_SCALE se retiró del deployment.

## Comprobaciones de construcción

npm run build comprueba TypeScript y genera la aplicación. npm run lint debe terminar sin errores; existen avisos anteriores de Fast Refresh y un efecto de Colección. React Doctor mantiene la referencia de 73/100; no equivale a auditoría de seguridad o accesibilidad.

## Evidencia que debe completar el equipo antes del pitch

1. Entrar con Google de la cuenta principal real y comprobar el enlace Administración. Registrar resultado sin capturar tokens, claves ni datos de salud.
2. Añadir un correo autorizado del equipo como moderador; pedirle entrar con su propia cuenta y comprobar permisos. Retirar el permiso al terminar si solo era necesario para el evento.
3. Ensayar el pitch con la demo reiniciada y registrar fecha, participantes del equipo, resultados y fallos observados.
4. Completar nombres, responsabilidades, fecha de trabajo previo y licencias en DECLARACION_EQUIPO.md.

## Límites identificados

No se ha hecho validación con público, auditoría externa de seguridad, estudio de comprensión con jóvenes, ensayo clínico ni verificación de operación de los contactos mediante llamada. La URL pública no demuestra estos puntos. La decisión sobre acreditación de TRL 4 es del jurado.

La moderación puede cometer falsos positivos o negativos. Groq, Google, Clerk, Convex y el alojamiento pueden fallar. No hay garantía de tiempos de respuesta. Sin otro participante real un viaje no produce nuevas notas. No hay operador institucional ni políticas de retención y apelación acordadas.
