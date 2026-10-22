# Manual de operación y moderación

Versión: 22 de octubre de 2026. Aplicación: https://mano-a-mano.pages.dev.

## Acceso y permisos

Entrar con Google, usando el correo principal verificado. La cuenta administradora es sierrasander29@gmail.com. El servidor valida el JWT y obtiene el correo verificado desde Clerk; el apodo, el correo escrito por el cliente y la interfaz no conceden privilegios.

El enlace está en Perfil → Administración y moderación. También se puede abrir /admin, incluso antes de completar el primer recorrido cuando el usuario ya tiene permiso.

| Acción | Administración principal | Moderación |
|---|---|---|
| Consultar usuarios, mascotas, peluches y notas | Sí | Sí |
| Publicar, poner en revisión o retirar una nota | Sí | Sí |
| Suspender y restablecer participantes | Sí | Sí |
| Resolver o descartar reportes de contactos | Sí | Sí |
| Editar y pausar contactos reales | Sí, fuera de demo | No |
| Consultar historial de decisiones | Sí | Sí |
| Añadir y revocar moderadores | Sí | No |
| Activar y desactivar la demo compartida para todas las cuentas | Sí | No |
| Activar y reiniciar la presentación privada | Sí | No |

Equipo permite registrar un correo antes de que esa persona cree cuenta. El permiso solo se utiliza al entrar con ese mismo correo verificado de Google. No se envía invitación por correo. La revocación invalida las consultas y acciones del panel de inmediato; conserva la cuenta del juego. La cuenta principal está protegida contra suspensión y retiro de su propio permiso.

## Preparar una presentación

1. Entrar como administración y abrir /admin.
2. «Demo compartida» controla a todas las cuentas. Está activa por defecto; las personas usan sus perfiles reales y pueden recibir o visitar personajes ficticios.
3. Apagarla deja únicamente los viajes entre personas. Las visitas que aún estén con personajes se adelantan para no dejarlas atrapadas.
4. «Demo privada del pitch» cambia solo la sesión de administración a un perfil separado. «Reiniciar presentación» repone sus libretas, viajes y buzón sintéticos sin cambiar el modo compartido.
5. Mostrar las notas ficticias con longitud variada, fondos y efectos; los autores automáticos aparecen identificados. La demo no sustituye el juicio de moderación.
6. «Volver a mi cuenta» recupera el perfil y el progreso reales de administración.

Hay seis personajes ficticios con notas editoriales de longitud mediana y medio-larga, fondos variados y efectos independientes. En viajes que reciben los personajes, avanzan automáticamente después de 18 segundos. En la presentación privada, cada visita tiene un plazo de tres minutos. La pantalla identifica la demo; los autores automáticos se distinguen de participantes reales.

Reiniciar elimina únicamente los datos del escenario personal de presentación. No elimina cuentas reales. Sus trabajos programados antiguos dejan de actuar al no existir sus registros. El historial administrativo permanece.

**Los permisos de Equipo son reales también durante la demo.** No añadir correos de terceros como ensayo sin intención de concederles acceso. Las ediciones de contactos reales están bloqueadas en demo.

## Operación de producción

La demo compartida está activa por defecto. Cuando hay personas activas y personajes ficticios disponibles, el selector reparte los viajes entre ambos grupos para que la actividad de cuentas conectadas no deje sin uso a los personajes; si solo hay un grupo disponible, usa ese grupo. Puede entregar a cada cuenta un peluche ficticio como máximo una vez al día y respeta el límite de dos visitas simultáneas. La cuenta principal puede apagarla desde /admin; al hacerlo no se asignan personajes ni se crean más mensajes automáticos. Una visita real dura una hora para responder o pasar el peluche sin nota. Al vencer, avanza automáticamente y conserva las notas recibidas. La selección excluye cuentas suspendidas.

Si al iniciar no hay destinatario disponible, el envío espera. El sistema revisa disponibilidad con intervalos progresivos de 5 a 60 minutos hasta 48 horas y luego lo devuelve. Si ya hubo visitas y se agotaron los destinatarios disponibles, vuelve con sus notas reales aunque no alcance siete paradas.

El fin de un plazo se comprueba en el servidor. Una tarea antigua que llegue antes del vencimiento actualizado no adelanta el viaje. La configuración histórica DEMO_TIME_SCALE no cambia plazos reales.

«Producción» describe estas reglas de funcionamiento. La web continúa en Cloudflare Pages con el deployment Convex y la instancia Clerk existentes, identificados por esos proveedores como desarrollo. No se creó un segundo proyecto cloud ni se migró facturación, dominios, claves de producción o políticas institucionales.

## Revisar una nota

Antes de publicar: permisos sobre el peluche → longitud y prefiltro → revisión de Groq → escritura interna. Un fallo o rechazo conserva el borrador y no envía el peluche. Los mensajes editoriales precargados de demo están identificados como sintéticos.

Al reportar una nota, deja de verse y queda en revisión. El panel permite:

- **Publicar:** la nota vuelve a su libreta; los reportes asociados se resuelven.
- **Revisar:** continúa oculta mientras se evalúa.
- **Retirar:** permanece fuera de circulación; el equipo conserva el registro para revisar la decisión.

Cada cambio exige motivo y guarda persona responsable y fecha. Revisar datos personales, contenido sexual, discriminación, amenazas, spam e instrucciones de tratamiento. No hacer diagnóstico ni evaluar clínicamente al autor. Ante un falso positivo, publicar solo tras revisar el contenido. La IA no reemplaza esta revisión.

Suspender una cuenta bloquea sus acciones y lectura autenticada en sesiones abiertas, la excluye de entregas y libera los peluches que retenía sin escribir mensajes en su nombre. No oculta automáticamente todo su historial: las notas se revisan por separado para evitar retirar contenido legítimo indiscriminadamente. Restablecer conserva el progreso.

## Reportes de contactos

«¿El contacto no funciona?» crea un registro en channelReports. Se guarda canal, motivo, fecha, estado y, al resolver, responsable y explicación. No se envía automáticamente un aviso a la institución.

Flujo: abrir Contactos → revisar reporte → contrastar fuente oficial → si procede, editar o pausar el contacto como administración → registrar resolución o descarte con motivo. Una resolución por sí sola no cambia números. Los contactos pausados no muestran botones para llamar o abrir WhatsApp ni permiten copiarlos.

Editar exige teléfono, horario, costo, URL https de la fuente, fecha de verificación y motivo. Las fichas visibles en Apoyo, Casa, asistente y resultado de historias consultan el catálogo actualizado; la interfaz no muestra bibliografía del evento.

## Frecuencia y responsables propuestos

| Tarea | Frecuencia propuesta | Responsable por asignar |
|---|---|---|
| Revisar cola de notas y reportes | Durante cada demostración y diariamente si se opera | Moderación de turno |
| Verificar enlaces, costo y horario | Semanalmente y antes del pitch | Responsable editorial |
| Resolver contacto reportado | Al detectar el reporte, tras contrastar evidencia | Moderación y administración |
| Revisar permisos | Antes del evento, al retirar a alguien del equipo y mensualmente | Administración principal |
| Revisar disponibilidad, errores y tareas programadas | Antes del pitch y durante operación | Responsable técnico |

El equipo debe escribir los nombres y sustitutos reales. No existe un acuerdo institucional de operación por el hecho de tener este panel. No se llaman las líneas de apoyo para probarlas.

## Datos, acceso y límites

Se almacenan identificadores, apodo, mascota, progreso, notas y, si hay Google, correo verificado. Las contraseñas usan scrypt con sal. El panel no devuelve hashes, sales, claves de proveedores ni tokens de sesión. Las conversaciones del asistente no se conservan en la base de datos.

Las notas retiradas conservan texto para revisión; no hay purga automática ni plazo de retención institucional acordado. Debe acordarse antes de una operación pública posterior. El borrado normal de una nota por su dueño sigue disponible. No existe canal de apelación, notificación automática por correo, recuperación de contraseña sin correo ni sistema para detectar personas que vuelvan con otra cuenta.

Los contadores generales tienen límites de lectura documentados; las listas del panel tienen paginación. La ficha individual muestra hasta 100 peluches y 100 notas, con aviso si se alcanza el límite.

## Configuración técnica

Guardar GROQ_API_KEY y CLERK_SECRET_KEY solo en variables del backend de Convex. Las variables con prefijo VITE_ son públicas. Para autenticar personal no se deben crear accesos mediante un apodo especial ni funciones públicas que acepten roles o correos de confianza.

Las decisiones administrativas usan sesiones de la app, comprobación del actor original y permisos consultados en el servidor. La demo no sustituye a ese actor. El historial no se puede editar ni eliminar mediante el panel.

Para la actualización inicial ejecutar internamente admin:archiveLegacySynthetic tras desplegar. Archiva NPC anteriores, retira sus visitas de buzones reales y restaura plazos de visitas reales que estaban acelerados. No elimina participantes ni sus colecciones. No ejecutar reinicios generales de datos en el proyecto público.
