# Configuración de Cookie JWT (access_token) en Producción

Este documento explica cómo configurar la cookie `access_token` (HTTPOnly) para que la autenticación funcione correctamente con cookies en navegadores modernos.

En el backend, el JWT se guarda en una cookie mediante `AuthController` y se lee desde `JwtStrategy` usando `req.cookies[access_token]`.

## Por qué suele fallar

Los navegadores aplican reglas estrictas sobre cookies:

1. Si `SameSite=None`, el atributo `Secure` debe estar en `true` o el navegador bloquea la cookie.
2. Si frontend y backend están en dominios diferentes, se necesita `SameSite=None; Secure` y una configuración de CORS que permita credenciales.
3. Si `COOKIE_DOMAIN` no coincide exactamente con el dominio/host al que el navegador aplica la cookie, el navegador puede no enviarla.

## Variables de entorno (backend)

Estas variables controlan cómo se setea la cookie en `POST /auth/login`:

- `JWT_COOKIE_NAME` (default: `access_token`)
- `COOKIE_DOMAIN` (opcional)
  - Si está vacío, la cookie queda como *host-only* (recomendado para la mayoría de casos).
  - Si se define, debe coincidir con el dominio que quieres cubrir.
- `COOKIE_SAMESITE` (`lax` | `strict` | `none`)
  - Reglas del navegador:
    - `none` requiere `secure=true`
    - `lax` suele funcionar bien en despliegues típicos (mismo dominio o subdominios)
- `COOKIE_SECURE` (opcional: `true` | `false`)
  - Si no se define, el backend utiliza `req.secure` (útil detrás de proxies como Nginx).

Otras variables del backend que pueden ser relevantes para CORS:

- `CORS_ORIGIN` (origen exacto del frontend, idealmente con `https://...`)

## Frontend (obligatorio)

El frontend debe enviar credenciales en cada request:

- Usar `credentials: 'include'` en `fetch`

En tu proyecto ya se hace dentro de `apiRequest`, por lo que si el backend configura CORS y la cookie correctamente, debería funcionar.

## Regla base del backend

En `POST /auth/login` el backend calcula:

- `sameSite` = `COOKIE_SAMESITE`
- `secure`:
  - si `COOKIE_SAMESITE=none` => fuerza `secure=true`
  - si no, usa `COOKIE_SECURE` si está definido; si no, usa `req.secure`

## Escenarios recomendados

### Caso 1. Frontend en `subdominio.dominio.com` y backend en `subdominio.dominio.com/api` (Nginx proxy_pass)

Objetivo: cookie válida para el host en el que está corriendo el frontend (y que el navegador puede asociar).

Recomendación:

- `COOKIE_SAMESITE=lax`
- `COOKIE_SECURE=` (vacío; que use `req.secure`)
- `COOKIE_DOMAIN=` (vacío, recomendado)
- `CORS_ORIGIN=https://subdominio.dominio.com`

Notas:

- Tu Nginx debe servir por HTTPS real (para que `req.secure` sea `true`).
- Mantén `VITE_API_BASE=https://subdominio.dominio.com/api`.

Ejemplo:

- Frontend: `https://subdominio.dominio.com`
- Login: el frontend hace `POST https://subdominio.dominio.com/api/auth/login`
- Nginx reenvía a `backend` interno sin afectar el dominio de la cookie.

### Caso 2. Frontend en `subdominio.dominio.com` y backend en `subdominio2.dominio.com` (otro subdominio)

En muchos casos comparten la misma raíz (`dominio.com`), y `SameSite=Lax` suele funcionar.

Recomendación:

- `COOKIE_SAMESITE=lax`
- `COOKIE_SECURE=` (vacío)
- `COOKIE_DOMAIN=` (vacío, recomendado)
- `CORS_ORIGIN=https://subdominio.dominio.com`

Opcional (si necesitas cubrir subdominios explícitamente):

- `COOKIE_DOMAIN=.dominio.com`

Advertencia:

- Si `COOKIE_DOMAIN` se define mal, el navegador puede dejar la cookie en un dominio que no coincide con el host del backend.

### Caso 3. Frontend en dominio (Vercel) y backend en otro dominio (Render)

Aquí es cross-site: frontend y backend están en dominios distintos.

Recomendación:

- `COOKIE_SAMESITE=none`
- `COOKIE_SECURE=true`
- `COOKIE_DOMAIN=` (vacío, recomendado)
- `CORS_ORIGIN=<TU_FRONTEND_EXACTO_CON_HTTPS>`
  - Ej: `CORS_ORIGIN=https://tu-app.vercel.app`

Notas:

- Con `SameSite=None`, el navegador exige `Secure=true`.
- Confirma que las requests desde el frontend incluyen `credentials: 'include'`.

## Debug rápido en producción (si falla)

1. Abre DevTools → Network → revisa `POST .../auth/login`.
2. Confirma que el response incluye `Set-Cookie: access_token=...; HttpOnly; ...`.
3. Ve a DevTools → Application → Cookies:
   - debe existir la cookie `access_token`
   - debe tener los atributos esperados (`SameSite` y `Secure`)
4. Luego intenta un endpoint protegido:
   - si sigue dando `401`, revisa si `req.cookies` trae `access_token` (log en backend temporalmente).

## Resumen de configuración

- Mismo host / proxy Nginx: `SameSite=lax`, `COOKIE_SECURE` vacío, `COOKIE_DOMAIN` vacío.
- Otro subdominio: `SameSite=lax` (y `COOKIE_DOMAIN` vacío).
- Dominios distintos (Vercel/Render): `SameSite=None`, `Secure=true`, `COOKIE_DOMAIN` vacío.

