# Mano a Mano

Juego educativo de historias urbanas y peluches viajeros. Ayuda a conocer opciones de apoyo para uno mismo y a acompañar a otras personas. No diagnostica, prescribe ni ofrece terapia.

Aplicación: https://mano-a-mano.pages.dev

## Recorrido

Elegir mascota y apodo propio → rescatar peluches en historias ficticias → escribir una nota positiva → revisar privacidad y confirmar → viajar entre participantes → conservar su libreta. Apoyo se consulta sin jugar ni crear una cuenta.

La cuenta puede guardarse con Google o apodo y contraseña al terminar el primer recorrido. El asistente explica la app, conversa sobre asuntos generales y muestra canales editoriales ante solicitudes clínicas; no toma acciones ni guarda el chat en el servidor.

Al entrar a Casa por primera vez, una guía de tres pasos resalta el acceso al mapa, el botón de rescate y el acceso para enviar peluches. Se puede saltar, retroceder o seguir los botones reales. Completarla o saltarla se recuerda en la cuenta; Perfil → Repetir guía rápida permite verla de nuevo. No interrumpe entradas directas a Apoyo. El último mensaje cambia si no quedan peluches listos para enviar.

Durante el primer paso se precargan las páginas y se mantiene la consulta del mapa para reutilizar sus datos al avanzar. La guía reacciona a la aparición del botón en la nueva pantalla, sin esperas de sondeo. En una descarga lenta muestra «Abriendo mapa…» inmediatamente y permite cerrarla.

Cada fragmento de historia espera tres segundos desde que aparece y permanece hasta avanzar. El control de sonido está en la barra superior y en el onboarding; empieza apagado. La app incluye doce efectos CC0 de Kenney y jsbarrett para búsqueda, aparición por rareza, pasar página, resultado, despegue y respuesta del asistente. Los archivos suman unos 80 KB y se precargan al activar el sonido. Fuentes, licencias y preparación: [docs/SONIDOS.md](docs/SONIDOS.md).

## Producción y presentación

**Producción es el comportamiento predeterminado para todos los participantes.** No crea NPC, buzones ficticios ni mensajes automáticos. Hay hasta dos visitas simultáneas por persona y cada persona tiene una hora para escribir una nota y pasar el peluche. Al vencer, avanza automáticamente y conserva las notas recibidas. Si no hay nadie disponible para iniciar el viaje, reintenta con espera progresiva hasta 48 horas; después el peluche regresa. Si el recorrido ya tuvo visitas y no quedan destinatarios disponibles, regresa con las notas reales que recibió.

El coste está acotado por viaje: hasta 7 paradas y un pase automático programado por parada, equivalente a unas 7 ejecuciones programadas si nadie responde a tiempo. La búsqueda de destinatarios inspecciona una muestra máxima de 256 perfiles activos recientes; cada buzón candidato consulta como máximo las 2 visitas permitidas. Esto mantiene cada transacción muy por debajo de los límites de 32.000 documentos leídos, 4.096 rangos de índice y 16.000 documentos escritos de Convex. Cuando falta destinatario, los reintentos empiezan cada 5 minutos y crecen hasta una vez por hora: menos de 60 ejecuciones durante la ventana máxima de 48 horas, en vez de 2.880 reintentos cada minuto.


La **demo privada** se activa desde /admin únicamente por la cuenta principal verificada de Google. Usa otro perfil y datos separados, conservando el token de acceso y el progreso real. Incluye seis personajes ficticios con nuevos apodos, doce mensajes editoriales largos, fondos y efectos, tres libretas completas, tres viajes, tres peluches disponibles y dos visitas en el buzón. Los personajes avanzan cada 18 segundos y cada visita permite tres minutos.

«Reiniciar presentación» recupera ese escenario. «Volver a producción» recupera exactamente el perfil real. Otros participantes continúan en producción. DEMO_TIME_SCALE dejó de controlar tiempos del sistema.

## Administración y moderación

Entrada: Perfil → Administración y moderación, o /admin. Se exige correo verificado por el servidor; conocer un correo o escribirlo como apodo no concede permisos.

- Administración principal: sierrasander29@gmail.com.
- Moderadores: se añaden y revocan por correo desde Equipo. Deben entrar con el mismo correo verificado de Google.
- Notas: publicar, poner en revisión, retirar y consultar reportes.
- Usuarios: consultar mascota, colección, notas, actividad y acceso; suspender o restablecer cuentas.
- Contactos: cola de reportes con resolución; solo administración puede editar contactos o pausar sus botones.
- Historial: registra actor, acción, fecha, destino y motivo. Las credenciales y tokens no se muestran.

Los permisos del equipo son reales incluso durante una presentación. Los cambios a contactos reales están bloqueados mientras está activa la demo. Suspender una cuenta bloquea sus sesiones abiertas y evita nuevas entregas; no borra su progreso. Retirar un permiso invalida el acceso administrativo de inmediato.

## Notas y privacidad

Hasta 360 caracteres. El servidor valida acceso, límites y formato; aplica prefiltro y Groq openai/gpt-oss-safeguard-20b antes de publicar. Si el proveedor falla o bloquea, no se publica ni avanza el peluche. Los borradores se conservan. La moderación puede equivocarse: los reportes ocultan las notas y abren revisión humana.

La app almacena apodo, mascota, progreso y mensajes. Las cuentas de Google conservan su correo verificado para identidad y permisos. Las contraseñas usan scrypt con sal; no se exponen a la interfaz. El asistente usa openai/gpt-oss-20b y envía como contexto hasta seis mensajes previos. No solicitar ni introducir datos personales o de salud en notas o conversaciones.

Los fondos y efectos se guardan con cada nota. Se respeta movimiento reducido y se pausa decoración fuera de pantalla. El mapa de ciudad usa una ilustración optimizada y una capa de territorios en color o escala de grises. La app conserva además recursos SVG del mapa anterior. Las confirmaciones son ventanas propias.

## Desarrollo

React, Vite, TypeScript, Tailwind, Motion, Clerk y Convex.

```powershell
npm install
# Terminal 1: backend local aislado
.\scripts\start-local-validation.ps1
# Terminal 2
$env:VITE_CONVEX_URL = 'http://127.0.0.1:3210'
npm run dev -- --host 127.0.0.1 --port 5173
```

Variables públicas del frontend: VITE_CONVEX_URL y VITE_CLERK_PUBLISHABLE_KEY. Secretos exclusivamente en Convex: GROQ_API_KEY y CLERK_SECRET_KEY. El backend local necesita su propia configuración; el script no copia secretos del entorno compartido. No publicar archivos .env.local ni usar el prefijo VITE_ para secretos.

La cuenta Google se valida por firma JWT, emisor, expiración y origen. Su correo se obtiene del Backend API de Clerk y debe estar verificado. Los permisos se consultan en el servidor en cada operación.

## Verificación y despliegue

```powershell
npm test
npm run build
npm run lint
npx playwright test
npx convex dev --once
npm run build
npx wrangler pages deploy dist --project-name mano-a-mano --branch main --commit-dirty=true
```

Primera actualización a esta versión: ejecutar internamente admin:archiveLegacySynthetic después de desplegar el backend. Archiva la actividad antigua de NPC sin borrar participantes ni su progreso y reprograma las visitas reales con plazos completos. La función es idempotente para los datos ya archivados. seed:run actualiza el catálogo; los lugares se leen desde config/places.ts y no se duplican en la base de datos. No crea NPC.

El esquema conserva 17 tablas para cuentas, sesiones, peluches, viajes, notas, rescates, moderación y administración. Se retiraron las tablas y funciones antiguas de cajas, cápsulas independientes, expediciones, misiones, mazmorras, intercambios, regalos, retos y recompensas comunitarias.

La web pública usa el deployment Convex existente savory-kudu-764 y una instancia de desarrollo de Clerk. **El modo funcional producción no crea infraestructura cloud separada ni cambia esas instancias a sus modalidades comerciales de producción.**

## Documentación del evento y operación

- [Expediente y requisitos TRL 4](docs/HACKATHON.md)
- [Manual de operación y moderación](docs/OPERACION.md)
- [Casos, resultados y límites](docs/EVIDENCIAS_TRL4.md)
- [Guion de pitch de cinco minutos](docs/PITCH.md)
- [Declaración del equipo](docs/DECLARACION_EQUIPO.md)
- [Licencias y terceros](LICENSES.md)

Las capturas de trabajo y de ensayos locales se excluyeron para mantener el repositorio ligero. Se incluyen los recursos visuales optimizados que usa la aplicación (marca, mapa, peluches, escenas y fondos); sus fuentes se documentan en LICENSES.md. Los originales de alta resolución y archivos de trabajo locales no se versionan.

El evento exige validación controlada con datos sintéticos y escenarios ficticios, sin pruebas con público ni datos reales de salud mental. El despliegue permite ejecutar la evaluación con el equipo y jurados; no demuestra eficacia sanitaria, adopción institucional ni cumplimiento de TRL 4 por sí mismo.
