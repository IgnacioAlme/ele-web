# ele-web

Sitio web para el restablecimiento de contraseñas de la plataforma **ELE Chaco**
escalable y _self-service_: el usuario ingresa su DNI (usuario) y el correo con
el que se registró, y el sitio resetea su contraseña a su DNI.

Es la contraparte web de `ele-cli` (el comando `user reset-pass`), pero con un
mecanismo de verificación extra: el correo debe coincidir con el registrado en
Moodle.

## Stack

- Next.js 16 (App Router + Route Handlers) sobre Node.js
- Tailwind CSS 4
- Desplegado en Vercel (serverless)

## Cómo funciona

1. El usuario envía `DNI` + `email` desde el formulario.
2. El navegador hace `POST /api/reset` — NUNCA habla directo con Moodle.
3. El Route Handler (corre en el servidor de Vercel, no en el navegador):
   - valida el formato del DNI y del correo;
   - consulta `core_user_get_users_by_field` con el token;
   - si el correo coincide (case-insensitive) con el registrado, resetea la
     contraseña a su DNI mediante `core_user_update_users`;
   - devuelve mensajes genéricos para no revelar si un DNI está registrado.
4. Si coincide, la contraseña queda igual al DNI (usuario), igual que `ele-cli`.

## Requisitos

- Node.js 20.9+ (Next.js 16)
- Un token de Web Services del Moodle con permiso sobre:
  - `core_user_get_users_by_field`
  - `core_user_update_users`

## Configuración local

```sh
npm install
cp .env.example .env.local   # en Windows: Copy-Item .env.example .env.local
```

Completar `.env.local`:

```dotenv
MOODLE_URL=https://ele.chaco.gob.ar
MOODLE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ `.env.local` está en `.gitignore`: nunca se commitea. Solo se commitea
> `.env.example` (sin valores reales).

## Desarrollo

```sh
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Verificación antes de desplegar

```sh
npm run lint    # ESLint
npx tsc --noEmit   # typecheck
npm run build   # build de producción
```

## Despliegue en Vercel

1. Subir el repo a GitHub (o importar el directorio con Vercel CLI).
2. En Vercel: **Add New → Project**, importar el repo.
   Framework detectado: Next.js — no requiere configuración extra.
3. En **Settings → Environment Variables**, agregar:
   | Nombre         | Valor                        |
   |----------------|------------------------------|
   | `MOODLE_URL`   | `https://ele.chaco.gob.ar`   |
   | `MOODLE_TOKEN` | el token de Web Services     |
4. **Deploy**. Los cambios posteriores se despliegan solos por cada push a la
   rama de producción.

### Vercel CLI (alternativa)

```sh
npm i -g vercel
vercel login
vercel env add MOODLE_TOKEN   # respuesta en producción
vercel env add MOODLE_URL
vercel --prod
```

## Seguridad del token

El token **jamás llega al navegador**:

- Se lee solo dentro del Route Handler (`app/api/reset/route.ts`) y del módulo
  `lib/moodle.ts`, que corren en el servidor.
- `lib/moodle.ts` importa `server-only`: si alguien lo importara desde un
  componente cliente, el build **falla** (garantía en tiempo de compilación).
- No se usa el prefijo `NEXT_PUBLIC_` (ese estaría inlined en el JS del cliente
  y sería visible en DevTools).
- El navegador solo recibe el resultado de `/api/reset` con mensajes genéricos.

Limitaciones a tener en cuenta:

- El rate limiting es en memoria (`lib` de los route handlers de `app/api/reset`),
  válido por instancia serverless. Para un volumen alto y protección distribuida,
  migrarlo a Upstash Redis (`@upstash/ratelimit`).
- Al ser público, el "factor de autorización" es el correo registrado: quien
  conozca un DNI y su correo puede resetear esa contraseña.

## Estructura

```
ele-web/
├── app/
│   ├── components/reset-password-form.tsx   → formulario (client component)
│   ├── api/reset/route.ts                   → Route Handler (server)
│   ├── layout.tsx
│   └── page.tsx                             → landing page
├── lib/moodle.ts                            → cliente Moodle (server-only)
├── .env.example                             → plantilla de variables (commitear)
└── .env.local                               → variables reales (NO commitear)
```