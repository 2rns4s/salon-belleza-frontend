# Requerimiento: Feature de Autenticacion (Login + MFA)

Usa este prompt en el chat de `@workspace` para pedir la implementacion completa del frontend de autenticacion siguiendo la arquitectura del proyecto.

## Prompt listo para usar

> @workspace Lee este requerimiento y construye el feature completo:
>
> **Objetivo:** Pantalla de autenticacion con soporte para MFA en 2 pasos.
>
> **Endpoints disponibles (Backend Java):**
> - `POST /api/v1/auth/login`
>   - Request: `{ "nombreUsuario": "string", "contrasena": "string" }`
>   - Response: `{ "token": "string", "mfaRequired": boolean, "mensaje": "string" }`
> - `POST /api/v1/auth/verify-mfa`
>   - Request: `{ "nombreUsuario": "string", "totpCode": "123456", "preAuthToken": "string" }`
>   - Response: `{ "token": "string", "mfaRequired": false, "mensaje": "string" }`
>
> **Flujos funcionales requeridos:**
> 1. Login sin MFA:
>    - Si `mfaRequired = false`, guardar `token` como sesion autenticada y redirigir al dashboard.
> 2. Login con MFA:
>    - Si `mfaRequired = true`, mostrar vista de verificacion MFA.
>    - Pedir codigo TOTP de 6 digitos.
>    - Enviar `POST /auth/verify-mfa` con `nombreUsuario`, `totpCode` y `preAuthToken` (el token devuelto por login).
>    - Si es correcto, reemplazar token temporal por token final y redirigir al dashboard.
>
> **Validaciones de UI:**
> - `nombreUsuario` obligatorio.
> - `contrasena` obligatoria.
> - `totpCode` obligatorio y exactamente 6 digitos numericos.
>
> **Manejo de errores esperado:**
> - `400`: mostrar errores de validacion por campo.
> - `401`: mostrar mensaje de credenciales invalidas, token MFA invalido/expirado o codigo TOTP incorrecto.
> - `500`: mostrar mensaje generico y opcion de reintentar.
>
> **Arquitectura solicitada:**
> - Crear `service` de autenticacion (llamadas HTTP, mapeo DTO).
> - Crear `view`(s) para:
>   - Login.
>   - Verificacion MFA.
> - Crear `controller`/`state manager` para coordinar flujos, estados de carga, errores y navegacion.
> - Mantener separacion de responsabilidades segun la arquitectura actual del proyecto.
>
> **Criterios de aceptacion:**
> - El flujo sin MFA funciona de extremo a extremo.
> - El flujo con MFA funciona de extremo a extremo.
> - Se persiste solo el token final para sesion autenticada (no el token temporal para uso general).
> - Hay mensajes de error claros para 400/401/500.
> - Se agregan pruebas minimas (unitarias o de integracion de UI) para ambos flujos.

---

## Notas tecnicas para el equipo

- El endpoint `login` puede devolver token final o token temporal segun `mfaRequired`.
- El campo `preAuthToken` en `verify-mfa` corresponde al `token` recibido en el paso de login cuando `mfaRequired = true`.
- Actualmente, en `AuthController` solo se observan endpoints de login y verificacion MFA. Si se desea onboarding MFA (generar `mfaSecret`, QR, codigos de recuperacion), se recomienda crear endpoints adicionales de enrollment/backup-codes.

