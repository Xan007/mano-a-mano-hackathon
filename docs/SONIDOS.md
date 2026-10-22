# Audio integrado

La app reproduce doce archivos MP3 CC0 alojados en `public/audio`, con un peso conjunto de 80.770 bytes. Las grabaciones proceden de Kenney y jsbarrett. Se descargaron también los UI Sounds de OpenGameArt para revisión; no forman parte de la selección publicada.

| Evento | Archivo publicado | Original |
|---|---|---|
| Botón | `click.mp3` | Kenney Interface Sounds, `click_001.ogg` |
| Pasar fragmento | `page.mp3` | Kenney RPG Audio, `bookFlip3.ogg` |
| Buscar peluche | `search.mp3` | Kenney Interface Sounds, `question_001.ogg` |
| Respuesta del chat | `message.mp3` | Kenney Interface Sounds, `pluck_001.ogg` |
| Rescate completado | `success.mp3` | Kenney Interface Sounds, `confirmation_002.ogg` |
| Corrección | `error.mp3` | Kenney Interface Sounds, `error_001.ogg` |
| Selección especial del taller | `coin.mp3` | Kenney Music Jingles, `jingles_PIZZI05.ogg` |
| Peluche común | `common.mp3` | Kenney Music Jingles, `jingles_PIZZI00.ogg` |
| Peluche raro | `rare.mp3` | Kenney Music Jingles, `jingles_PIZZI01.ogg` |
| Peluche épico | `epic.mp3` | Kenney Music Jingles, `jingles_PIZZI02.ogg` |
| Peluche legendario | `legendary.mp3` | Kenney Music Jingles, `jingles_PIZZI03.ogg` |
| Despegue confirmado | `departure.mp3` | «Whoosh» de jsbarrett, una toma recortada de la preescucha pública de alta calidad |

Fuentes y licencias:

- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), CC0.
- [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio), CC0.
- [Kenney Music Jingles](https://kenney.nl/assets/music-jingles), CC0.
- [Whoosh de jsbarrett](https://freesound.org/people/jsbarrett/sounds/393943/), CC0.

Los textos de licencia están en `public/audio/licenses`. `public/audio/manifest.json` identifica para cada archivo su autor, fuente, nombre original, tamaño, duración, pico y SHA-256.

## Preparación y reproducción

`py scripts/prepare-audio.py` reproduce la preparación; requiere numpy y ffmpeg. Descarga los packs originales en el directorio privado de validación, conserva sus licencias, convierte a mono MP3 de 96 kbps, recorta silencios y ajusta niveles con margen de pico. Añade fundidos de entrada y salida para evitar cortes bruscos. Los efectos publicados duran entre 60 ms y 1,15 s.

El sonido empieza apagado y se activa desde el icono superior o Perfil. Tras activarlo se precargan y decodifican los archivos, una sola vez por visita. La preferencia persiste en el navegador. El canal principal usa volumen 0,22 y admite hasta cuatro sonidos simultáneos; se evitan repeticiones demasiado rápidas.

Silenciar detiene los efectos activos e invalida los que siguen descargándose. No se reproducen nuevas señales en una pestaña oculta ni señales antiguas tras una descarga lenta. Si falla un archivo o no está disponible la salida de audio, la app sigue funcionando.

## Lectura y comprobación

Cada fragmento de historia tiene tres segundos mínimos desde que se muestra. La búsqueda no consume ese plazo. El siguiente fragmento reinicia su cuenta y el texto permanece hasta avanzar. No se sonoriza el contador.

`npx playwright test tests/e2e/story-audio.spec.ts --workers=1` verifica PC y celular: reproducción de archivos mediante AudioBufferSourceNode, espera por fragmento, activación, silencio y persistencia. La preparación valida que todos los MP3 se decodifican sin muestras inválidas ni saturación.
