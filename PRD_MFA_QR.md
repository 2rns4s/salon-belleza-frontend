# PRD: Activacion de MFA con QR para Panel Interno

## 1. Problema
Actualmente, el acceso con solo usuario/contrasena incrementa el riesgo de acceso no autorizado en cuentas internas del sistema.
Se requiere un flujo estandar para que cada usuario autenticado pueda activar MFA (TOTP) escaneando un codigo QR y confirmando con un codigo de 6 digitos desde su app autenticadora.

## 2. Objetivos
- Habilitar un flujo de enrolamiento MFA simple y seguro en maximo 2 pasos (`setup` + `enable`).
- Reducir el riesgo de acceso por compromiso de contrasena con un segundo factor TOTP.
- Proveer una integracion frontend clara basada en respuestas HTTP y payloads estables.

## 3. Alcance (Scope)
- **EN ALCANCE:**
  - Generacion de `secret` y `qrCodeUrl` para enrolamiento MFA del usuario autenticado.
  - Confirmacion y activacion de MFA mediante codigo TOTP valido.
  - Persistencia de estado MFA en usuario (`mfaEnabled`, `mfaSecret`).
  - Manejo de errores HTTP para UX guiada en frontend.
- **FUERA DE ALCANCE:**
  - Desactivacion de MFA.
  - Codigos de recuperacion (backup codes) en interfaz de usuario.
  - MFA por SMS, email o push notifications.

## 4. Casos de Uso y Experiencia de Usuario (UX)
1. **Usuario autenticado abre "Seguridad / MFA" en el panel:**
   - La UI muestra boton: **"Activar MFA"**.
2. **Paso 1 - Setup QR:**
   - Al hacer clic, frontend llama `GET /api/v1/usuarios/me/mfa/setup`.
   - Si exito (`200`), UI muestra:
     - imagen QR con `qrCodeUrl`
     - campo para ingresar codigo TOTP de 6 digitos
3. **Paso 2 - Confirmar activacion:**
   - Frontend envia `POST /api/v1/usuarios/me/mfa/enable` con `secret` y `code`.
   - Si exito (`204`), UI muestra estado "MFA activado" y deshabilita boton de activacion.
4. **Errores de sesion/permisos:**
   - Si `403`, redirigir a login o solicitar reautenticacion.
5. **Errores de validacion/codigo:**
   - Si `400`, mostrar mensaje amigable ("Codigo invalido o expirado", etc.) y permitir reintento.

## 5. Requerimientos Funcionales y Endpoints
El frontend consumira los siguientes endpoints (`/api/v1`):

### 5.1 Generar setup MFA (QR)
- **Endpoint:** `GET /usuarios/me/mfa/setup`
- **Auth:** Requiere `Authorization: Bearer {ACCESS_TOKEN}`
- **Response 200 (`MfaSetupResponse`):**
```json
{
  "secret": "BASE32_SECRET",
  "qrCodeUrl": "data:image/png;base64,...."
}
```
- **Errores esperados:**
  - `403`: token ausente/invalido/sin acceso
  - `500`: error interno al generar QR

### 5.2 Habilitar MFA
- **Endpoint:** `POST /usuarios/me/mfa/enable`
- **Auth:** Requiere `Authorization: Bearer {ACCESS_TOKEN}`
- **Request (`MfaSetupRequest`):**
```json
{
  "secret": "BASE32_SECRET",
  "code": "123456"
}
```
- **Response exito:** `204 No Content`
- **Errores esperados:**
  - `400`: request invalido o TOTP incorrecto/expirado
  - `403`: token ausente/invalido/sin acceso
  - `404`: usuario autenticado no encontrado
  - `500`: error interno inesperado

### 5.3 Regla de seguridad (segun configuracion actual)
- Solo rutas `/api/v1/auth/**` son publicas.
- MFA setup/enable requiere usuario autenticado (token ACCESS valido).

## 6. Requerimientos No Funcionales
- **Seguridad:** Nunca loggear ni mostrar `secret` en consola de produccion.
- **Usabilidad:** Flujo de activacion completo en una sola pantalla del panel.
- **Manejo de errores:** Mostrar mensajes diferenciados para `400`, `403`, `404`, `500`.
- **Compatibilidad:** QR legible por Google Authenticator, Microsoft Authenticator y apps TOTP compatibles.
- **Observabilidad:** Registrar errores internos de activacion MFA en backend con logging estructurado.

## 7. Criterios de Aceptacion
- [ ] Dado un usuario autenticado, al llamar `GET /usuarios/me/mfa/setup` se recibe `200` con `secret` y `qrCodeUrl`.
- [ ] Dado el QR mostrado, al enviar un `code` TOTP correcto con `POST /usuarios/me/mfa/enable`, la API responde `204`.
- [ ] Dado un `code` invalido o expirado, la API responde `400` y la UI permite reintento sin recargar sesion.
- [ ] Dado un token invalido/ausente, ambos endpoints responden `403` y el frontend redirige a login.
- [ ] Tras activacion exitosa, el usuario queda con MFA habilitado y en login posterior se exige verificacion MFA cuando corresponda.

## 8. Notas de Implementacion Frontend
- Guardar temporalmente `secret` en estado de vista durante el flujo (no persistir en localStorage).
- Validar `code` en cliente como `^\\d{6}$` antes de enviar.
- Tratar `204` como exito sin body.
- Si `403`, limpiar sesion y redirigir.
- Si `500`, mostrar error generico y opcion "Intentar de nuevo".

