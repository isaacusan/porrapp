# ⚽ PORRAPP

**La porra del Mundial entre amigos.** Torneos privados, predicciones de marcador
ocultas hasta el pitido inicial, powerups estilo Mario Kart, cofres, ranking y
logros. Sin dinero, solo por el honor.

Construida con **Next.js + TypeScript + Tailwind + Supabase (PostgreSQL)**, lista
para desplegar en **Vercel**. No necesitas saber programar para ponerla en marcha:
sigue los pasos tal cual.

> **Estado:** ✅ **App completa (Fases 1–10).** Todo construido y probado: base
> de datos + seguridad, acceso, identidad visual, torneos e invitaciones,
> partidos + predicciones, puntuación + clasificación, preguntas generales,
> powerups + cofres, panel de administración, datos automáticos de fútbol, y
> logros + resumen de jornada + normas/privacidad + pulido. **Lista para
> desplegar** siguiendo los pasos de abajo.

---

## ✅ Lo que ya funciona

- Registro con **nombre de usuario único + email + contraseña**. Las contraseñas
  las gestiona y cifra Supabase Auth: nadie (ni el admin) las ve.
- Login con **usuario _o_ email**, indistintamente.
- **Recuperar y restablecer** la contraseña por email.
- **Crear torneos** privados (te conviertes en admin) y **unirse** al de un amigo
  con un código, un enlace, WhatsApp o email.
- **Identidad por torneo**: nombre visible y avatar elegibles en cada porra.
- **Partidos y predicciones**: marcador exacto editable hasta el inicio del
  partido; después se bloquea y se revela la porra de todos. El admin puede
  cargar un Mundial de prueba con un clic mientras se conecta la API real.
- **Puntuación y clasificación**: el admin mete los resultados y la app calcula
  los puntos (resultado exacto, signo, diferencia, goles de cada equipo, quién
  pasa en eliminatorias) con multiplicadores por fase. Clasificación general,
  por jornada y por fase, con tu posición destacada.
- **Preguntas generales**: las grandes apuestas del torneo (campeón, goleador,
  total de goles…). Se responden hasta el cierre; luego se revelan todas, el
  admin marca la correcta y los puntos se suman a la clasificación.
- **Powerups y cofres**: el admin reparte un cofre por jornada a cada jugador
  (los que van por detrás tienen mejores probabilidades de powerups raros).
  Abres el cofre con animación, guardas el powerup y lo usas sobre un partido
  antes de que empiece. Hay 13 powerups activos (doblar puntos, escudo anti-cero,
  gol fantasma, maldición a un rival, candado protector…); el catálogo muestra
  los 22, y el resto se activarán en una actualización.
- **Panel de administración**: introducir resultados, resolver preguntas y
  repartir cofres desde un solo sitio; gestionar y banear jugadores; traspasar
  la administración a otra persona; cambiar ajustes del torneo; exportar la
  clasificación a CSV; y un registro de actividad con todo lo que hace el admin.
- **Datos automáticos de fútbol**: en el panel de admin eliges un proveedor y la
  app trae el calendario y los resultados sola. **openfootball** es gratis y no
  necesita clave; **football-data.org** da resultados más en vivo con una clave
  gratuita; o puedes seguir en modo manual. La sincronización automática corre
  cada hora (Vercel Cron) y el admin puede pulsar “Sincronizar ahora” cuando
  quiera. También puede enviar invitaciones por email (con Resend).
- **Logros y resumen de jornada**: medallas que se desbloquean solas según tus
  aciertos (primer marcador exacto, racha de tres, invicto de la jornada…) y un
  resumen con el MVP de la última jornada. Más páginas de normas, privacidad y
  condiciones.
- **Rutas protegidas**: sin sesión no se entra a ninguna pantalla privada.
- Seguridad real en la base de datos (RLS): las predicciones de los demás están
  ocultas hasta que empieza el partido; un usuario bloqueado no puede volver a
  entrar; un extraño no puede ni ver tus torneos.
- Unicidad de usuario garantizada por la propia base de datos, sin distinguir
  mayúsculas (`Pepe` y `pepe` son el mismo).

---

## 🚀 Puesta en marcha

Necesitas dos cuentas gratuitas: **Supabase** (base de datos) y **Vercel**
(hosting). Y una de **GitHub** para guardar el código.

### Paso 1 · Crear el proyecto en Supabase

1. Entra en <https://supabase.com> → **New project**.
2. Nombre `porrapp`, elige y **guarda** la contraseña de la base de datos, y una
   región cercana (p. ej. *Europe West*). Espera ~2 minutos.

### Paso 2 · Crear las tablas (migraciones)

En Supabase: menú izquierdo → **SQL Editor** → **New query**. Pega y ejecuta
(**Run**) estos archivos **en este orden exacto**:

1. `supabase/migrations/0001_init.sql` — las tablas
2. `supabase/migrations/0002_functions_triggers.sql` — lógica y automatismos
3. `supabase/migrations/0003_rls.sql` — reglas de privacidad
4. `supabase/migrations/0004_auth_helpers.sql` — ayudas para registro y login
5. `supabase/migrations/0005_tournament_helpers.sql` — ayudas para torneos
6. `supabase/migrations/0006_ranking.sql` — clasificación
7. `supabase/migrations/0007_football_sync.sql` — datos automáticos de fútbol
8. `supabase/seed.sql` — los 22 powerups, 12 logros y un Mundial de prueba

Cada uno debe terminar con *"Success"*. Comprueba que todo está:

```sql
select count(*) from powerups;     -- 22
select count(*) from achievements; -- 12
select count(*) from teams;        -- 8
```

### Paso 3 · Configurar las URLs de Auth en Supabase

Para que los emails de confirmación y de recuperación lleven a tu app:

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: en local `http://localhost:3000`; en producción tu URL de Vercel
   (p. ej. `https://porrapp.vercel.app`).
3. En **Redirect URLs** añade ambas terminadas en `/auth/callback`:
   - `http://localhost:3000/auth/callback`
   - `https://TU-APP.vercel.app/auth/callback`

> ¿Quieres que la gente pueda entrar sin confirmar el email mientras pruebas?
> En **Authentication → Providers → Email**, desactiva *"Confirm email"*.
> Para uso real, déjalo activado.

### Paso 4 · Tus claves

En Supabase → **Project Settings → API**, copia:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** (¡secreta, solo backend!) → `SUPABASE_SERVICE_ROLE_KEY`

En **Project Settings → Database** copia la cadena de conexión → `DATABASE_URL`.

### Paso 5 · Probar en tu ordenador (opcional pero recomendado)

Necesitas [Node.js](https://nodejs.org) (versión 18 o superior). Luego, en una
terminal dentro de la carpeta del proyecto:

```bash
cp .env.example .env.local   # crea tu archivo de variables
# abre .env.local y pega las claves del Paso 4
npm install                  # instala todo (una vez)
npm run dev                  # arranca en http://localhost:3000
```

Abre <http://localhost:3000>, regístrate y entra. 🎉

### Paso 6 · Desplegar en Vercel

1. Sube esta carpeta a un repositorio de **GitHub** (privado).
2. En <https://vercel.com> → **Add New → Project** → importa ese repositorio.
3. En **Environment Variables** pega las mismas del `.env.local`
   (incluye `NEXT_PUBLIC_APP_URL` con tu URL final de Vercel).
4. **Deploy**. Cuando termine, vuelve al **Paso 3** y añade la URL de Vercel a
   las Redirect URLs de Supabase.

---

## 🗂️ Cómo está organizado el proyecto

```
porrapp/
├─ app/                  Pantallas y rutas (Next.js App Router)
│  ├─ (auth)/            Login, registro, recuperar/restablecer contraseña
│  ├─ (app)/             Zona privada (dashboard) — protegida
│  ├─ api/               Endpoints internos (p. ej. comprobar usuario libre)
│  └─ auth/callback/     Aterrizaje de los enlaces de email
├─ components/
│  ├─ ui/                Botones, inputs, tarjetas… (piezas reutilizables)
│  ├─ auth/              Formularios de acceso
│  └─ brand/             Logo PORRAPP y balón
├─ lib/
│  ├─ supabase/          Conexión a la base de datos (cliente/servidor/admin)
│  ├─ auth/              Validaciones y acciones de registro/login
│  └─ scoring/           Motor de puntuación (funciones puras, ya probado)
├─ supabase/
│  ├─ migrations/        Las 7 migraciones SQL (ejecútalas en orden)
│  └─ seed.sql           Datos iniciales + Mundial de prueba
├─ middleware.ts         Protege las rutas privadas
└─ .env.example          Plantilla de variables (cópiala como .env.local)
```

---

## 🔒 Sobre seguridad y privacidad

- Las **contraseñas** nunca tocan nuestra base de datos: las cifra y custodia
  Supabase Auth. El admin solo podrá **forzar un reset**, jamás verlas.
- Las **predicciones** están protegidas por reglas (RLS) dentro de PostgreSQL:
  aunque alguien manipulara el navegador, la base de datos no entrega la
  predicción de otra persona hasta que el partido ha empezado.
- La clave `service_role` es de superusuario: va **solo** en variables de entorno
  del servidor, nunca en el navegador ni en GitHub (`.env.local` está ignorado).

---

## 🛠️ Comandos útiles

```bash
npm run dev        # desarrollo local
npm run build      # compilar para producción (lo hace Vercel solo)
npm run typecheck  # comprobar tipos de TypeScript
```
