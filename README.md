# Cicla

App web instalable para seguir el ciclo menstrual, anticipar sintomas por fase y generar un resumen para compartir con la pareja.

## Que hace

- Guarda los datos solo en el navegador del dispositivo.
- Permite dejar la fecha del ultimo periodo en blanco si no la recordas.
- Calcula una prediccion simple del ciclo cuando ya existe al menos un inicio registrado.
- Muestra un tablero del dia, un calendario mensual, una linea de tiempo de 14 dias y una bitacora diaria.
- Genera un briefing diario para la pareja con que ayuda, que evitar y como aprovechar la energia del dia.
- Permite personalizar por fase sintomas, cuidados, alertas y energia ideal.
- Puede disparar un recordatorio local para revisar o compartir el briefing.

## Como usarla

1. Abri `index.html` para usarla de inmediato.
2. Si queres instalarla como PWA, conviene servirla con un servidor local o subirla a un hosting estatico.
3. Carga tu ciclo promedio, los dias de menstruacion y, cuando lo recuerdes, el ultimo inicio.
4. Completa el mapa personal por fase con sintomas, cuidados, cosas a evitar y energia ideal.
5. Si queres avisos, activa el recordatorio diario y luego concede permiso de notificaciones.

## Instalar como app en Windows

1. Haz doble clic en `Abrir-Cicla.cmd`.
2. Se abrira `http://localhost:4173` en tu navegador.
3. Dentro de Cicla usa el boton `Descargar`.
4. Si Chrome no muestra el cuadro enseguida, usa `Chrome > Enviar, guardar y compartir > Instalar pagina como aplicacion`.
5. Una vez instalada, podras abrir Cicla como una app separada.

## Vista mujer / pareja

- La app puede abrir con selector inicial de vista.
- Si la URL incluye `?role=partner`, entra directo a la vista de pareja.
- La vista de pareja muestra el briefing, calendario y acompanamiento, mientras que la vista mujer conserva la edicion completa.

## Link para otra persona

- Para que otra persona la instale desde su celular, la app tiene que estar publicada en una URL real.
- Publicarla como sitio estatico alcanza para instalarla como app.
- Si ademas quieres que la otra persona vea tus datos reales desde otro dispositivo, hace falta sumar sincronizacion o algun sistema de compartido de datos; el guardado local del navegador no se comparte solo.

## Compartir con tu pareja y sincronizar

- Cicla ya puede generar un link de pareja que entra bloqueado en modo `partner`.
- Tus cambios se siguen guardando en tu navegador y, si activas Supabase, tambien se empujan a la nube para que el vea lo mismo.
- La pareja no ve la vista mujer ni los formularios de edicion cuando entra por su link.
- Si actualizas la app, la data local sigue migrando con normalizacion y la data compartida queda aparte en Supabase.

### Setup rapido de Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el SQL de `supabase/cicla_shares.sql`.
3. Copia `sync-config.example.js` sobre `sync-config.js`.
4. Completa `url` y `anonKey`.
5. Publica la app en una URL real para que el link funcione en el celular de tu pareja.

## Branding y accesos directos

- Hay logo vectorial en `assets/logo-mark.svg` y `assets/logo-lockup.svg`.
- El preview social esta en `assets/og-image.svg` y `assets/og-image.png`.
- El pack para acceso directo y PWA queda en `assets/icon-192.png`, `assets/icon-512.png`, `assets/apple-touch-icon.png`, `assets/favicon-32.png` y `assets/favicon.ico`.
- Si queres regenerar todo el pack, corre `powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand-assets.ps1`.

## Recordatorios

- Los avisos diarios funcionan mejor si la app corre como PWA o desde `localhost`.
- El acceso directo de escritorio creado apunta a `index.html`, asi que sirve para abrir rapido la app, pero algunas funciones del navegador como service worker o notificaciones pueden depender del contexto donde se abra.

## Nota importante

La app no intenta adivinar fechas cuando falta una base confiable. Hasta que registres un inicio de periodo, muestra el seguimiento listo pero sin inventar precision.
